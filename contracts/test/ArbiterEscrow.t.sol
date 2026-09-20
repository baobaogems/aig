// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ArbiterEscrow} from "../src/ArbiterEscrow.sol";

/// Minimal 6-decimal stand-in for Arc USDC.
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract ArbiterEscrowTest is Test {
    ArbiterEscrow internal escrow;
    MockUSDC internal usdc;

    address internal owner = makeAddr("owner");
    address internal arbiter = makeAddr("arbiter");
    address internal poster = makeAddr("poster");
    address internal worker = makeAddr("worker");
    address internal stranger = makeAddr("stranger");

    bytes32 internal constant ID = keccak256("bounty-1");
    bytes32 internal constant VERDICT = keccak256("verdict-json");
    uint256 internal constant AMOUNT = 10e6; // 10 USDC
    uint16 internal constant FULL = 10_000; // whole escrow to the worker
    uint64 internal constant SETTLE_WINDOW = 48 hours;
    uint64 internal constant CLAIM_WINDOW = 72 hours;
    uint64 internal deadline;

    function setUp() public {
        usdc = new MockUSDC();
        escrow = new ArbiterEscrow(address(usdc), arbiter, owner, SETTLE_WINDOW, CLAIM_WINDOW);
        deadline = uint64(block.timestamp + 3 days);

        usdc.mint(poster, 1_000e6);
        vm.prank(poster);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function _create() internal {
        vm.prank(poster);
        escrow.createBounty(ID, worker, AMOUNT, deadline);
    }

    /// Work has been handed in. Nothing settles in v3 until the arbiter records this.
    function _submit(bytes32 id) internal {
        vm.prank(arbiter);
        escrow.markSubmitted(id);
    }

    /// An OPEN bounty: locked, but nobody is on the hook to do it yet.
    function _createUnassigned() internal {
        vm.prank(poster);
        escrow.createBounty(ID, address(0), AMOUNT, deadline);
    }

    // ---------------------------------------------------------------- create

    function test_createBounty_locksUsdc() public {
        _create();

        assertEq(usdc.balanceOf(address(escrow)), AMOUNT, "escrow holds funds");
        ArbiterEscrow.Bounty memory b = escrow.getBounty(ID);
        assertEq(b.poster, poster);
        assertEq(b.worker, worker);
        assertEq(b.amount, AMOUNT);
        assertFalse(b.settled);
        assertFalse(b.refunded);
    }

    /// Contract-level half of the two-tier spend cap.
    function test_createBounty_revertsOverCap() public {
        uint256 over = escrow.MAX_BOUNTY() + 1;
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(ArbiterEscrow.AmountOverCap.selector, over, escrow.MAX_BOUNTY()));
        escrow.createBounty(ID, worker, over, deadline);
    }

    function test_createBounty_revertsOnDuplicateId() public {
        _create();
        vm.prank(poster);
        vm.expectRevert(ArbiterEscrow.BountyExists.selector);
        escrow.createBounty(ID, worker, AMOUNT, deadline);
    }

    function test_createBounty_revertsOnPastDeadline() public {
        vm.prank(poster);
        vm.expectRevert(ArbiterEscrow.DeadlineInPast.selector);
        escrow.createBounty(ID, worker, AMOUNT, uint64(block.timestamp));
    }

    // ---------------------------------------------------------------- settle

    function test_settle_paysWorkerInFullAndEmitsVerdictHash() public {
        _create();
        _submit(ID);

        vm.expectEmit(true, true, false, true, address(escrow));
        emit ArbiterEscrow.Settled(ID, VERDICT, worker, AMOUNT, 0);

        vm.prank(arbiter);
        escrow.settle(ID, VERDICT, FULL);

        assertEq(usdc.balanceOf(worker), AMOUNT, "worker paid");
        assertEq(usdc.balanceOf(address(escrow)), 0, "escrow drained");
        assertTrue(escrow.getBounty(ID).settled);
    }

    /// The money-critical invariant: nobody but the arbiter wallet moves escrowed funds.
    function test_settle_revertsForNonArbiter() public {
        _create();
        _submit(ID);

        vm.prank(stranger);
        vm.expectRevert(ArbiterEscrow.NotArbiter.selector);
        escrow.settle(ID, VERDICT, FULL);

        vm.prank(poster);
        vm.expectRevert(ArbiterEscrow.NotArbiter.selector);
        escrow.settle(ID, VERDICT, FULL);

        vm.prank(owner);
        vm.expectRevert(ArbiterEscrow.NotArbiter.selector);
        escrow.settle(ID, VERDICT, FULL);
    }

    function test_settle_revertsOnDoubleSettle() public {
        _create();
        _submit(ID);
        vm.startPrank(arbiter);
        escrow.settle(ID, VERDICT, FULL);
        vm.expectRevert(ArbiterEscrow.AlreadySettled.selector);
        escrow.settle(ID, VERDICT, FULL);
        vm.stopPrank();
    }

    /// A release must always carry an auditable verdict — an empty hash is not a verdict.
    function test_settle_revertsOnEmptyVerdictHash() public {
        _create();
        _submit(ID);
        vm.prank(arbiter);
        vm.expectRevert(ArbiterEscrow.VerdictHashEmpty.selector);
        escrow.settle(ID, bytes32(0), FULL);
    }

    function test_settle_revertsOnUnknownBounty() public {
        vm.prank(arbiter);
        vm.expectRevert(ArbiterEscrow.BountyUnknown.selector);
        escrow.settle(keccak256("nope"), VERDICT, FULL);
    }

    function test_settle_revertsAfterRefund() public {
        _create();
        vm.warp(deadline + 1);
        vm.prank(poster);
        escrow.refund(ID);

        vm.prank(arbiter);
        vm.expectRevert(ArbiterEscrow.AlreadySettled.selector);
        escrow.settle(ID, VERDICT, FULL);
    }

    // ---------------------------------------------------------------- refund

    function test_refund_afterDeadlineReturnsToPoster() public {
        _create();
        uint256 before = usdc.balanceOf(poster);

        vm.warp(deadline + 1);
        vm.prank(poster);
        escrow.refund(ID);

        assertEq(usdc.balanceOf(poster), before + AMOUNT, "poster made whole");
        assertTrue(escrow.getBounty(ID).refunded);
    }

    function test_refund_revertsBeforeDeadline() public {
        _create();
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(ArbiterEscrow.DeadlineNotReached.selector, deadline));
        escrow.refund(ID);
    }

    function test_refund_revertsForNonPoster() public {
        _create();
        vm.warp(deadline + 1);
        vm.prank(stranger);
        vm.expectRevert(ArbiterEscrow.NotPoster.selector);
        escrow.refund(ID);
    }

    function test_refund_revertsAfterSettle() public {
        _create();
        _submit(ID);
        vm.prank(arbiter);
        escrow.settle(ID, VERDICT, FULL);

        vm.warp(deadline + 1);
        vm.prank(poster);
        vm.expectRevert(ArbiterEscrow.AlreadySettled.selector);
        escrow.refund(ID);
    }

    // ----------------------------------------------------------------- pause

    function test_pause_blocksCreateAndSettle() public {
        _create();
        _submit(ID);
        vm.prank(owner);
        escrow.pause();

        vm.prank(arbiter);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        escrow.settle(ID, VERDICT, FULL);

        vm.prank(poster);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        escrow.createBounty(keccak256("bounty-2"), worker, AMOUNT, deadline);
    }

    /// An emergency pause must not trap poster funds past the deadline.
    function test_pause_stillAllowsRefund() public {
        _create();
        vm.prank(owner);
        escrow.pause();

        vm.warp(deadline + 1);
        vm.prank(poster);
        escrow.refund(ID);
        assertTrue(escrow.getBounty(ID).refunded);
    }

    function test_pause_revertsForNonOwner() public {
        vm.prank(arbiter);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, arbiter));
        escrow.pause();
    }

    function test_unpause_restoresSettle() public {
        _create();
        vm.startPrank(owner);
        escrow.pause();
        escrow.unpause();
        vm.stopPrank();

        _submit(ID);
        vm.prank(arbiter);
        escrow.settle(ID, VERDICT, FULL);
        assertEq(usdc.balanceOf(worker), AMOUNT);
    }

    // ------------------------------------------------------------ invariants

    /// Escrow accounting holds for any legal amount, and the worker cannot be redirected.
    function testFuzz_settleFullPaysExactlyTheLockedAmount(uint256 amount) public {
        amount = bound(amount, 1, escrow.MAX_BOUNTY());
        bytes32 id = keccak256(abi.encode("fuzz", amount));

        vm.prank(poster);
        escrow.createBounty(id, worker, amount, deadline);

        _submit(id);
        vm.prank(arbiter);
        escrow.settle(id, VERDICT, FULL);

        assertEq(usdc.balanceOf(worker), amount);
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    // ---------------------------------------------------------------- claim

    function test_createBounty_allowsUnassignedWorker() public {
        _createUnassigned();
        ArbiterEscrow.Bounty memory b = escrow.getBounty(ID);
        assertEq(b.worker, address(0), "open bounty starts with no worker");
        assertEq(b.amount, AMOUNT, "money is locked even before anyone claims");
        assertEq(usdc.balanceOf(address(escrow)), AMOUNT);
    }

    function test_claim_assignsCallerAndEmits() public {
        _createUnassigned();

        vm.expectEmit(true, true, false, false, address(escrow));
        emit ArbiterEscrow.Claimed(ID, worker);

        vm.prank(worker);
        escrow.claim(ID);

        assertEq(escrow.getBounty(ID).worker, worker, "claimer becomes the payee");
    }

    function test_claim_movesNoMoney() public {
        _createUnassigned();
        uint256 escrowBefore = usdc.balanceOf(address(escrow));
        uint256 workerBefore = usdc.balanceOf(worker);

        vm.prank(worker);
        escrow.claim(ID);

        assertEq(usdc.balanceOf(address(escrow)), escrowBefore, "claim must not move escrow");
        assertEq(usdc.balanceOf(worker), workerBefore, "claim is not a payout");
    }

    function test_claim_revertsOnSecondClaim() public {
        _createUnassigned();
        vm.prank(worker);
        escrow.claim(ID);

        // The payout address is permanent. This is the test that stops a late claimer from
        // stealing a bounty someone else is already working on.
        vm.expectRevert(abi.encodeWithSelector(ArbiterEscrow.AlreadyClaimed.selector, worker));
        vm.prank(stranger);
        escrow.claim(ID);
    }

    function test_claim_revertsOnPreAssignedBounty() public {
        _create(); // worker fixed at creation
        vm.expectRevert(abi.encodeWithSelector(ArbiterEscrow.AlreadyClaimed.selector, worker));
        vm.prank(stranger);
        escrow.claim(ID);
    }

    function test_claim_revertsAfterDeadline() public {
        _createUnassigned();
        vm.warp(deadline + 1);

        // Past the deadline the money is owed back to the poster; nobody may step in front of it.
        vm.expectRevert(abi.encodeWithSelector(ArbiterEscrow.DeadlinePassed.selector, deadline));
        vm.prank(worker);
        escrow.claim(ID);
    }

    function test_claim_revertsOnUnknownBounty() public {
        vm.expectRevert(ArbiterEscrow.BountyUnknown.selector);
        vm.prank(worker);
        escrow.claim(keccak256("nope"));
    }

    function test_claim_revertsAfterRefund() public {
        _createUnassigned();
        vm.warp(deadline + 1);
        vm.prank(poster);
        escrow.refund(ID);

        vm.expectRevert(ArbiterEscrow.AlreadySettled.selector);
        vm.prank(worker);
        escrow.claim(ID);
    }

    function test_claim_blockedWhilePaused() public {
        _createUnassigned();
        vm.prank(owner);
        escrow.pause();

        vm.expectRevert(Pausable.EnforcedPause.selector);
        vm.prank(worker);
        escrow.claim(ID);
    }

    function test_settle_revertsOnUnclaimedBounty() public {
        _createUnassigned();

        // Paying address(0) would burn the escrow. Refuse, and let refund return it instead.
        vm.expectRevert(ArbiterEscrow.WorkerUnassigned.selector);
        vm.prank(arbiter);
        escrow.settle(ID, VERDICT, FULL);
    }

    function test_claimThenSettle_paysTheClaimer() public {
        _createUnassigned();
        vm.prank(stranger); // whoever got there first, not whoever the poster had in mind
        escrow.claim(ID);

        _submit(ID);
        vm.prank(arbiter);
        escrow.settle(ID, VERDICT, FULL);

        assertEq(usdc.balanceOf(stranger), AMOUNT, "the claimer is paid");
        assertEq(usdc.balanceOf(address(escrow)), 0, "escrow drained");
        assertTrue(escrow.getBounty(ID).settled);
    }

    function test_refund_worksOnBountyNobodyClaimed() public {
        _createUnassigned();
        uint256 before = usdc.balanceOf(poster);
        vm.warp(deadline + 1);

        vm.prank(poster);
        escrow.refund(ID);

        assertEq(usdc.balanceOf(poster), before + AMOUNT, "an unwanted bounty is never stranded");
        assertTrue(escrow.getBounty(ID).refunded);
    }

    function testFuzz_claimAssignsAnyCaller(address who) public {
        vm.assume(who != address(0));
        _createUnassigned();

        vm.prank(who);
        escrow.claim(ID);

        assertEq(escrow.getBounty(ID).worker, who);
    }

    // ======================================================================
    //  v3 — the rules that exist because v2 let a poster keep both the work
    //  and the money. Each test below maps to a failure that actually shipped.
    // ======================================================================

    // ------------------------------------------------- the deadline race (L5)

    /// THE regression. v2: submit near the deadline, poster refunds first, worker loses
    /// everything despite the work being good. Whoever landed in a block first took it.
    function test_refund_revertsOnceWorkWasSubmitted() public {
        _create();
        _submit(ID);

        vm.warp(deadline + 1 days);
        vm.prank(poster);
        vm.expectRevert(ArbiterEscrow.WorkSubmitted.selector);
        escrow.refund(ID);

        assertEq(usdc.balanceOf(address(escrow)), AMOUNT, "escrow untouched");
    }

    /// The other half: with nothing handed in, the poster's refund is untouched.
    function test_refund_stillWorksWhenNothingWasSubmitted() public {
        _create();
        uint256 before = usdc.balanceOf(poster);

        vm.warp(deadline + 1);
        vm.prank(poster);
        escrow.refund(ID);

        assertEq(usdc.balanceOf(poster), before + AMOUNT);
    }

    // ------------------------------------------------------- partial payment

    function test_settle_splitsBetweenWorkerAndPoster() public {
        _create();
        _submit(ID);
        uint256 posterBefore = usdc.balanceOf(poster);

        vm.prank(arbiter);
        escrow.settle(ID, VERDICT, 3_000); // the T2 kill-fee ceiling

        assertEq(usdc.balanceOf(worker), 3e6, "worker gets 30%");
        assertEq(usdc.balanceOf(poster), posterBefore + 7e6, "poster gets the rest back");
        assertEq(usdc.balanceOf(address(escrow)), 0, "nothing stranded");
    }

    function test_settle_zeroBpsPaysPosterEverything() public {
        _create();
        _submit(ID);
        uint256 posterBefore = usdc.balanceOf(poster);

        vm.prank(arbiter);
        escrow.settle(ID, VERDICT, 0);

        assertEq(usdc.balanceOf(worker), 0);
        assertEq(usdc.balanceOf(poster), posterBefore + AMOUNT);
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    function test_settle_revertsAboveFullBps() public {
        _create();
        _submit(ID);
        vm.prank(arbiter);
        vm.expectRevert(abi.encodeWithSelector(ArbiterEscrow.BpsTooHigh.selector, uint16(10_001)));
        escrow.settle(ID, VERDICT, 10_001);
    }

    /// The authority this contract exists to withhold: paying for work nobody handed in.
    function test_settle_revertsBeforeAnySubmission() public {
        _create();
        vm.prank(arbiter);
        vm.expectRevert(ArbiterEscrow.NoSubmission.selector);
        escrow.settle(ID, VERDICT, FULL);
    }

    /// Rounding must never leave dust behind, at any split, for any legal amount.
    function testFuzz_settleAlwaysDrainsTheEscrow(uint256 amount, uint16 bps) public {
        amount = bound(amount, 1, escrow.MAX_BOUNTY());
        bps = uint16(bound(bps, 0, 10_000));
        bytes32 id = keccak256(abi.encode("split", amount, bps));

        vm.prank(poster);
        escrow.createBounty(id, worker, amount, deadline);
        _submit(id);

        uint256 workerBefore = usdc.balanceOf(worker);
        uint256 posterBefore = usdc.balanceOf(poster);

        vm.prank(arbiter);
        escrow.settle(id, VERDICT, bps);

        uint256 paidWorker = usdc.balanceOf(worker) - workerBefore;
        uint256 paidPoster = usdc.balanceOf(poster) - posterBefore;
        assertEq(paidWorker + paidPoster, amount, "every wei is accounted for");
        assertEq(usdc.balanceOf(address(escrow)), 0, "escrow fully drained");
    }

    // --------------------------------------------- markSubmitted (the hinge)

    function test_markSubmitted_revertsForNonArbiter() public {
        _create();
        vm.prank(stranger);
        vm.expectRevert(ArbiterEscrow.NotArbiter.selector);
        escrow.markSubmitted(ID);

        vm.prank(poster);
        vm.expectRevert(ArbiterEscrow.NotArbiter.selector);
        escrow.markSubmitted(ID);
    }

    function test_markSubmitted_revertsTwice() public {
        _create();
        _submit(ID);
        uint64 at = escrow.getBounty(ID).submittedAt;

        vm.prank(arbiter);
        vm.expectRevert(abi.encodeWithSelector(ArbiterEscrow.AlreadySubmitted.selector, at));
        escrow.markSubmitted(ID);
    }

    function test_markSubmitted_revertsOnUnclaimedBounty() public {
        _createUnassigned();
        vm.prank(arbiter);
        vm.expectRevert(ArbiterEscrow.WorkerUnassigned.selector);
        escrow.markSubmitted(ID);
    }

    // ---------------------------------------- timeoutRelease (worker's right)

    /// The worker's insurance: this platform going dark must not cost them the money.
    /// Deliberately called by a stranger — that is the point of it being permissionless.
    function test_timeoutRelease_paysWorkerAfterWindow_calledByAnyone() public {
        _create();
        _submit(ID);

        vm.warp(block.timestamp + SETTLE_WINDOW + 1);
        vm.prank(stranger);
        escrow.timeoutRelease(ID);

        assertEq(usdc.balanceOf(worker), AMOUNT, "worker paid without the arbiter");
        assertEq(usdc.balanceOf(address(escrow)), 0);
        assertTrue(escrow.getBounty(ID).settled);
    }

    function test_timeoutRelease_revertsInsideWindow() public {
        _create();
        _submit(ID);
        uint64 endsAt = escrow.getBounty(ID).submittedAt + SETTLE_WINDOW;

        vm.warp(uint256(endsAt)); // exactly on the boundary is still too early
        vm.prank(worker);
        vm.expectRevert(abi.encodeWithSelector(ArbiterEscrow.WindowNotElapsed.selector, endsAt));
        escrow.timeoutRelease(ID);
    }

    function test_timeoutRelease_revertsWithoutSubmission() public {
        _create();
        vm.warp(block.timestamp + SETTLE_WINDOW + 1);
        vm.prank(worker);
        vm.expectRevert(ArbiterEscrow.NoSubmission.selector);
        escrow.timeoutRelease(ID);
    }

    function test_timeoutRelease_revertsAfterSettle() public {
        _create();
        _submit(ID);
        vm.prank(arbiter);
        escrow.settle(ID, VERDICT, 5_000);

        vm.warp(block.timestamp + SETTLE_WINDOW + 1);
        vm.prank(worker);
        vm.expectRevert(ArbiterEscrow.AlreadySettled.selector);
        escrow.timeoutRelease(ID);
    }

    /// A pause is an emergency stop, not a way to sit on money that is already owed.
    function test_timeoutRelease_worksWhilePaused() public {
        _create();
        _submit(ID);
        vm.prank(owner);
        escrow.pause();

        vm.warp(block.timestamp + SETTLE_WINDOW + 1);
        vm.prank(worker);
        escrow.timeoutRelease(ID);
        assertEq(usdc.balanceOf(worker), AMOUNT);
    }

    // ------------------------------------------- expireClaim (unblock a job)

    function test_expireClaim_freesBountyAndLetsSomeoneElseClaim() public {
        // A deadline comfortably beyond CLAIM_WINDOW, because reopening only helps if there
        // is still time left to do the work — see the boundary test below.
        uint64 longDeadline = uint64(block.timestamp + 10 days);
        vm.prank(poster);
        escrow.createBounty(ID, address(0), AMOUNT, longDeadline);

        vm.prank(worker);
        escrow.claim(ID);

        vm.warp(block.timestamp + CLAIM_WINDOW + 1);
        vm.expectEmit(true, true, false, false, address(escrow));
        emit ArbiterEscrow.ClaimExpired(ID, worker);
        vm.prank(stranger);
        escrow.expireClaim(ID);

        assertEq(escrow.getBounty(ID).worker, address(0), "bounty is open again");

        vm.prank(stranger);
        escrow.claim(ID);
        assertEq(escrow.getBounty(ID).worker, stranger);
    }

    function test_expireClaim_movesNoMoney() public {
        _createUnassigned();
        vm.prank(worker);
        escrow.claim(ID);

        vm.warp(block.timestamp + CLAIM_WINDOW + 1);
        vm.prank(stranger);
        escrow.expireClaim(ID);

        assertEq(usdc.balanceOf(address(escrow)), AMOUNT, "escrow untouched");
        assertEq(usdc.balanceOf(worker), 0);
    }

    function test_expireClaim_revertsInsideWindow() public {
        _createUnassigned();
        vm.prank(worker);
        escrow.claim(ID);
        uint64 endsAt = escrow.getBounty(ID).claimedAt + CLAIM_WINDOW;

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(ArbiterEscrow.WindowNotElapsed.selector, endsAt));
        escrow.expireClaim(ID);
    }

    /// Work under judgement must not be stolen out from under the person who did it.
    function test_expireClaim_revertsOnceWorkWasSubmitted() public {
        _createUnassigned();
        vm.prank(worker);
        escrow.claim(ID);
        _submit(ID);

        vm.warp(block.timestamp + CLAIM_WINDOW + 1);
        vm.prank(stranger);
        vm.expectRevert(ArbiterEscrow.WorkSubmitted.selector);
        escrow.expireClaim(ID);
    }

    function test_expireClaim_revertsOnUnclaimedBounty() public {
        _createUnassigned();
        vm.warp(block.timestamp + CLAIM_WINDOW + 1);
        vm.prank(stranger);
        vm.expectRevert(ArbiterEscrow.NotClaimed.selector);
        escrow.expireClaim(ID);
    }

    /// A bounty created with a named worker still has a claim clock, or "assigned but idle"
    /// would sit outside this rule forever.
    function test_expireClaim_appliesToAPreAssignedBounty() public {
        _create();
        vm.warp(block.timestamp + CLAIM_WINDOW + 1);
        vm.prank(stranger);
        escrow.expireClaim(ID);
        assertEq(escrow.getBounty(ID).worker, address(0));
    }

    /// Known limit, recorded rather than hidden: reopening is pointless once the deadline has
    /// passed, because `claim` refuses that window. A bounty whose deadline is shorter than
    /// CLAIM_WINDOW therefore never benefits from `expireClaim` — the app should not offer a
    /// deadline that short, and this test is what will notice if the windows are retuned.
    function test_expireClaim_cannotRescueABountyPastItsDeadline() public {
        _createUnassigned();
        vm.prank(worker);
        escrow.claim(ID);

        vm.warp(deadline + 1); // deadline (3 days) <= CLAIM_WINDOW (72h)
        vm.prank(stranger);
        escrow.expireClaim(ID);
        assertEq(escrow.getBounty(ID).worker, address(0), "freed, but too late to matter");

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(ArbiterEscrow.DeadlinePassed.selector, deadline));
        escrow.claim(ID);
    }

    // ------------------------------------------------------------ deployment

    function test_constructor_rejectsZeroWindows() public {
        vm.expectRevert(ArbiterEscrow.WindowZero.selector);
        new ArbiterEscrow(address(usdc), arbiter, owner, 0, CLAIM_WINDOW);

        vm.expectRevert(ArbiterEscrow.WindowZero.selector);
        new ArbiterEscrow(address(usdc), arbiter, owner, SETTLE_WINDOW, 0);
    }
}
