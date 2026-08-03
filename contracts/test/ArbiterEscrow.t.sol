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
    uint64 internal deadline;

    function setUp() public {
        usdc = new MockUSDC();
        escrow = new ArbiterEscrow(address(usdc), arbiter, owner);
        deadline = uint64(block.timestamp + 3 days);

        usdc.mint(poster, 1_000e6);
        vm.prank(poster);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function _create() internal {
        vm.prank(poster);
        escrow.createBounty(ID, worker, AMOUNT, deadline);
    }

    // ---------------------------------------------------------------- create

    function test_createBounty_locksUsdc() public {
        _create();

        assertEq(usdc.balanceOf(address(escrow)), AMOUNT, "escrow holds funds");
        ArbiterEscrow.Bounty memory b = escrow.getBounty(ID);
        assertEq(b.poster, poster);
        assertEq(b.worker, worker);
        assertEq(b.amount, AMOUNT);
        assertFalse(b.released);
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

    // --------------------------------------------------------------- release

    function test_release_paysWorkerAndEmitsVerdictHash() public {
        _create();

        vm.expectEmit(true, true, false, true, address(escrow));
        emit ArbiterEscrow.Released(ID, VERDICT, worker, AMOUNT);

        vm.prank(arbiter);
        escrow.release(ID, VERDICT);

        assertEq(usdc.balanceOf(worker), AMOUNT, "worker paid");
        assertEq(usdc.balanceOf(address(escrow)), 0, "escrow drained");
        assertTrue(escrow.getBounty(ID).released);
    }

    /// The money-critical invariant: nobody but the arbiter wallet moves escrowed funds.
    function test_release_revertsForNonArbiter() public {
        _create();

        vm.prank(stranger);
        vm.expectRevert(ArbiterEscrow.NotArbiter.selector);
        escrow.release(ID, VERDICT);

        vm.prank(poster);
        vm.expectRevert(ArbiterEscrow.NotArbiter.selector);
        escrow.release(ID, VERDICT);

        vm.prank(owner);
        vm.expectRevert(ArbiterEscrow.NotArbiter.selector);
        escrow.release(ID, VERDICT);
    }

    function test_release_revertsOnDoubleRelease() public {
        _create();
        vm.startPrank(arbiter);
        escrow.release(ID, VERDICT);
        vm.expectRevert(ArbiterEscrow.AlreadySettled.selector);
        escrow.release(ID, VERDICT);
        vm.stopPrank();
    }

    /// A release must always carry an auditable verdict — an empty hash is not a verdict.
    function test_release_revertsOnEmptyVerdictHash() public {
        _create();
        vm.prank(arbiter);
        vm.expectRevert(ArbiterEscrow.VerdictHashEmpty.selector);
        escrow.release(ID, bytes32(0));
    }

    function test_release_revertsOnUnknownBounty() public {
        vm.prank(arbiter);
        vm.expectRevert(ArbiterEscrow.BountyUnknown.selector);
        escrow.release(keccak256("nope"), VERDICT);
    }

    function test_release_revertsAfterRefund() public {
        _create();
        vm.warp(deadline + 1);
        vm.prank(poster);
        escrow.refund(ID);

        vm.prank(arbiter);
        vm.expectRevert(ArbiterEscrow.AlreadySettled.selector);
        escrow.release(ID, VERDICT);
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

    function test_refund_revertsAfterRelease() public {
        _create();
        vm.prank(arbiter);
        escrow.release(ID, VERDICT);

        vm.warp(deadline + 1);
        vm.prank(poster);
        vm.expectRevert(ArbiterEscrow.AlreadySettled.selector);
        escrow.refund(ID);
    }

    // ----------------------------------------------------------------- pause

    function test_pause_blocksCreateAndRelease() public {
        _create();
        vm.prank(owner);
        escrow.pause();

        vm.prank(arbiter);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        escrow.release(ID, VERDICT);

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

    function test_unpause_restoresRelease() public {
        _create();
        vm.startPrank(owner);
        escrow.pause();
        escrow.unpause();
        vm.stopPrank();

        vm.prank(arbiter);
        escrow.release(ID, VERDICT);
        assertEq(usdc.balanceOf(worker), AMOUNT);
    }

    // ------------------------------------------------------------ invariants

    /// Escrow accounting holds for any legal amount, and the worker cannot be redirected.
    function testFuzz_releasePaysExactlyTheLockedAmount(uint256 amount) public {
        amount = bound(amount, 1, escrow.MAX_BOUNTY());
        bytes32 id = keccak256(abi.encode("fuzz", amount));

        vm.prank(poster);
        escrow.createBounty(id, worker, amount, deadline);

        vm.prank(arbiter);
        escrow.release(id, VERDICT);

        assertEq(usdc.balanceOf(worker), amount);
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }
}
