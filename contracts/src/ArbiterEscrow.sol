// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ArbiterEscrow (v3)
 * @notice Holds USDC for one bounty and settles it on an arbiter verdict.
 *         AIG v4 — Arc testnet.
 *
 * WHAT CHANGED IN v3, AND WHY
 * ---------------------------
 * v2 knew only "money locked" and "money released". It did not know a deliverable had ever
 * been handed in, and that one blind spot produced the two worst failures of the product:
 *
 *   1. FREE WORK. The poster received the deliverable, stayed silent until the deadline, and
 *      refunded. They kept the work AND the money, and it cost them nothing. Silence was the
 *      cheapest strategy and it won.
 *   2. THE DEADLINE RACE. `release` had no deadline bound and `refund` opened at the deadline,
 *      so a submission made near the deadline could be judged worthy while the poster's refund
 *      landed first. Whoever got into a block first took the money.
 *
 * v3 adds exactly one concept — `submittedAt` — and both failures close:
 *
 *   - Once work is submitted, the poster's unilateral `refund` is shut. The default after a
 *     submission is that the WORKER gets paid, because the worker is the party who has already
 *     handed over something they cannot take back.
 *   - `settle` pays a proportion, so "this is partly good" stops being unrepresentable. The
 *     arbiter can no longer only choose between paying everything and paying nothing.
 *   - `timeoutRelease` is permissionless: if this platform disappears, loses its key, or simply
 *     stops answering, the worker still gets paid without anyone's permission. It is the first
 *     on-chain right a worker has ever had here.
 *   - `expireClaim` is permissionless: claiming a bounty and sitting on it no longer blocks it
 *     until the deadline.
 *
 * Trust model — stated honestly, not as "trustless":
 *  - The arbiter key decides the SPLIT, within the rules below. It cannot pay anyone other than
 *    the recorded worker, cannot pay twice, cannot take more than the escrow holds, and cannot
 *    stop `timeoutRelease` once the settlement window has passed.
 *  - The poster is protected before a submission exists: `refund` after the deadline is theirs
 *    alone. After a submission exists, they are protected by the split, not by the refund.
 *  - MAX_BOUNTY bounds the blast radius of a compromised arbiter key to one bounty.
 */
contract ArbiterEscrow is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Hard per-bounty cap: 50 USDC (6 decimals). Contract-level, cannot be raised.
    uint256 public constant MAX_BOUNTY = 50e6;

    /// @notice Basis-point denominator for a settlement split.
    uint16 public constant BPS_DENOMINATOR = 10_000;

    /// @notice The USDC token held in escrow.
    IERC20 public immutable usdc;

    /// @notice The only address allowed to mark submissions and settle.
    address public immutable arbiter;

    /**
     * @notice How long after a submission the arbiter has to settle before anyone may finish it.
     * @dev Immutable: the rules a bounty is created under must not be changeable underneath it.
     *      A different window means a new deployment, which is a visible, auditable act.
     */
    uint64 public immutable settleWindow;

    /// @notice How long a claimed-but-unsubmitted bounty stays locked to its claimant.
    uint64 public immutable claimWindow;

    struct Bounty {
        address poster;
        address worker;
        uint256 amount;
        uint64 deadline;
        /// @dev 0 = unclaimed. Set by `claim`, cleared by `expireClaim`.
        uint64 claimedAt;
        /// @dev 0 = nothing handed in. Once non-zero, the poster can no longer refund alone.
        uint64 submittedAt;
        bool settled;
        bool refunded;
    }

    /// @notice bountyId (keccak256 of the off-chain UUID) → escrow record.
    mapping(bytes32 => Bounty) public bounties;

    event BountyCreated(
        bytes32 indexed bountyId, address indexed poster, address indexed worker, uint256 amount, uint64 deadline
    );
    event Claimed(bytes32 indexed bountyId, address indexed worker);
    event ClaimExpired(bytes32 indexed bountyId, address indexed worker);
    event Submitted(bytes32 indexed bountyId, address indexed worker, uint64 at);
    event Settled(
        bytes32 indexed bountyId,
        bytes32 verdictHash,
        address indexed worker,
        uint256 workerAmount,
        uint256 posterAmount
    );
    event Refunded(bytes32 indexed bountyId, address indexed poster, uint256 amount);

    error BountyExists();
    error BountyUnknown();
    error AmountZero();
    error AmountOverCap(uint256 amount, uint256 cap);
    error DeadlineInPast();
    error ZeroAddress();
    error NotArbiter();
    error NotPoster();
    error AlreadySettled();
    error DeadlineNotReached(uint64 deadline);
    error VerdictHashEmpty();
    error AlreadyClaimed(address worker);
    error WorkerUnassigned();
    error DeadlinePassed(uint64 deadline);
    error WorkSubmitted();
    error NoSubmission();
    error AlreadySubmitted(uint64 at);
    error WindowNotElapsed(uint64 endsAt);
    error NotClaimed();
    error BpsTooHigh(uint16 bps);
    error WindowZero();

    modifier onlyArbiter() {
        if (msg.sender != arbiter) revert NotArbiter();
        _;
    }

    constructor(address usdc_, address arbiter_, address owner_, uint64 settleWindow_, uint64 claimWindow_)
        Ownable(owner_)
    {
        if (usdc_ == address(0) || arbiter_ == address(0) || owner_ == address(0)) revert ZeroAddress();
        // A zero window would make `timeoutRelease` callable in the same block as the submission,
        // erasing the arbiter's chance to judge at all.
        if (settleWindow_ == 0 || claimWindow_ == 0) revert WindowZero();
        usdc = IERC20(usdc_);
        arbiter = arbiter_;
        settleWindow = settleWindow_;
        claimWindow = claimWindow_;
    }

    /**
     * @notice Poster locks USDC for a bounty.
     * @param worker The assigned worker, or address(0) to open the bounty for anyone to `claim`.
     * @dev Requires prior `approve(address(this), amount)` by the poster.
     */
    function createBounty(bytes32 bountyId, address worker, uint256 amount, uint64 deadline)
        external
        whenNotPaused
        nonReentrant
    {
        if (bounties[bountyId].poster != address(0)) revert BountyExists();
        // worker == address(0) is legal here: it means "open to whoever claims it first".
        if (amount == 0) revert AmountZero();
        if (amount > MAX_BOUNTY) revert AmountOverCap(amount, MAX_BOUNTY);
        if (deadline <= block.timestamp) revert DeadlineInPast();

        bounties[bountyId] = Bounty({
            poster: msg.sender,
            worker: worker,
            amount: amount,
            deadline: deadline,
            // A bounty created with a named worker is treated as claimed at creation: the
            // claim clock has to start somewhere, and "assigned but never claimed" would
            // otherwise sit outside `expireClaim` forever.
            claimedAt: worker == address(0) ? 0 : uint64(block.timestamp),
            submittedAt: 0,
            settled: false,
            refunded: false
        });

        // State written before the transfer: reentrancy via a hostile token cannot re-enter into
        // a second createBounty for the same id (nonReentrant is belt-and-braces on top).
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit BountyCreated(bountyId, msg.sender, worker, amount, deadline);
    }

    /**
     * @notice Take an open bounty. First caller wins.
     * @dev This is how a worker proves the payout address is theirs — no server, no signature
     *      relay, just msg.sender. It moves no money.
     *
     *      Unlike v2 the assignment is no longer permanent: a claimant who hands nothing in
     *      within `claimWindow` can be cleared by `expireClaim`, because parking on a bounty
     *      used to cost nothing but gas while blocking everyone else.
     *
     *      Claiming after the deadline is refused: that window belongs to the poster's refund.
     */
    function claim(bytes32 bountyId) external whenNotPaused {
        Bounty storage b = bounties[bountyId];
        if (b.poster == address(0)) revert BountyUnknown();
        if (b.settled || b.refunded) revert AlreadySettled();
        if (b.worker != address(0)) revert AlreadyClaimed(b.worker);
        if (block.timestamp > b.deadline) revert DeadlinePassed(b.deadline);

        b.worker = msg.sender;
        b.claimedAt = uint64(block.timestamp);

        emit Claimed(bountyId, msg.sender);
    }

    /**
     * @notice Free a bounty whose claimant went quiet. Permissionless.
     * @dev Touches no money — the worst a wrong call can do is reopen a bounty for claiming.
     *      Refused once work exists: a submission under judgement must not be stolen out from
     *      under the person who made it.
     */
    function expireClaim(bytes32 bountyId) external {
        Bounty storage b = bounties[bountyId];
        if (b.poster == address(0)) revert BountyUnknown();
        if (b.settled || b.refunded) revert AlreadySettled();
        if (b.submittedAt != 0) revert WorkSubmitted();
        if (b.claimedAt == 0 || b.worker == address(0)) revert NotClaimed();

        uint64 endsAt = b.claimedAt + claimWindow;
        if (block.timestamp <= endsAt) revert WindowNotElapsed(endsAt);

        address previous = b.worker;
        b.worker = address(0);
        b.claimedAt = 0;

        emit ClaimExpired(bountyId, previous);
    }

    /**
     * @notice Arbiter records that a deliverable exists, which starts the settlement clock.
     * @dev This is the hinge of v3. From here the poster can no longer take the money back on
     *      their own, and `timeoutRelease` becomes reachable.
     *
     *      The arbiter is expected to call this ONLY for work its verdict found plausible.
     *      Work the verdict rejects outright is deliberately left unmarked, so the poster's
     *      refund path stays open and a spray of junk submissions cannot lock up an escrow.
     */
    function markSubmitted(bytes32 bountyId) external onlyArbiter whenNotPaused {
        Bounty storage b = bounties[bountyId];
        if (b.poster == address(0)) revert BountyUnknown();
        if (b.settled || b.refunded) revert AlreadySettled();
        if (b.worker == address(0)) revert WorkerUnassigned();
        if (b.submittedAt != 0) revert AlreadySubmitted(b.submittedAt);

        b.submittedAt = uint64(block.timestamp);

        emit Submitted(bountyId, b.worker, b.submittedAt);
    }

    /**
     * @notice Arbiter settles the escrow, splitting it between worker and poster.
     * @param verdictHash keccak256 of the canonical verdict JSON — the public audit artifact.
     * @param workerBps The worker's share in basis points. 10000 = paid in full, 0 = nothing.
     * @dev One settlement per bounty, ever. The worker address comes from storage, never from
     *      the caller. The poster's share is computed as `amount - workerAmount` rather than
     *      from the bps a second time, so rounding can never leave dust stranded in here.
     */
    function settle(bytes32 bountyId, bytes32 verdictHash, uint16 workerBps)
        external
        onlyArbiter
        whenNotPaused
        nonReentrant
    {
        Bounty storage b = bounties[bountyId];
        if (b.poster == address(0)) revert BountyUnknown();
        if (b.settled || b.refunded) revert AlreadySettled();
        if (b.worker == address(0)) revert WorkerUnassigned();
        // Nothing to settle before work exists. Without this the arbiter could pay out a bounty
        // nobody had done, which is precisely the authority this contract is meant to withhold.
        if (b.submittedAt == 0) revert NoSubmission();
        if (verdictHash == bytes32(0)) revert VerdictHashEmpty();
        if (workerBps > BPS_DENOMINATOR) revert BpsTooHigh(workerBps);

        uint256 workerAmount = (b.amount * workerBps) / BPS_DENOMINATOR;
        uint256 posterAmount = b.amount - workerAmount;

        b.settled = true;

        address worker = b.worker;
        address poster = b.poster;
        if (workerAmount > 0) usdc.safeTransfer(worker, workerAmount);
        if (posterAmount > 0) usdc.safeTransfer(poster, posterAmount);

        emit Settled(bountyId, verdictHash, worker, workerAmount, posterAmount);
    }

    /**
     * @notice Pay the worker in full once the settlement window has passed. Permissionless.
     * @dev The worker's insurance against this platform going dark. It takes no parameters and
     *      has exactly one outcome, so being open to anyone gives an attacker nothing: the only
     *      thing a stranger can do is pay the worker what the silence already entitled them to.
     *
     *      Callable while paused, for the same reason `refund` is: an emergency stop must not
     *      become a way to strand somebody else's money.
     */
    function timeoutRelease(bytes32 bountyId) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        if (b.poster == address(0)) revert BountyUnknown();
        if (b.settled || b.refunded) revert AlreadySettled();
        if (b.submittedAt == 0) revert NoSubmission();
        if (b.worker == address(0)) revert WorkerUnassigned();

        uint64 endsAt = b.submittedAt + settleWindow;
        if (block.timestamp <= endsAt) revert WindowNotElapsed(endsAt);

        b.settled = true;
        uint256 amount = b.amount;
        address worker = b.worker;
        usdc.safeTransfer(worker, amount);

        emit Settled(bountyId, bytes32(0), worker, amount, 0);
    }

    /**
     * @notice Poster reclaims the escrow after the deadline if no work was ever handed in.
     * @dev Deliberately callable while paused — an emergency pause must never trap poster funds.
     *
     *      The `submittedAt == 0` condition is the fix for v2's worst behaviour: a poster who
     *      has received a deliverable can no longer quietly wait out the clock and keep both.
     */
    function refund(bytes32 bountyId) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        if (b.poster == address(0)) revert BountyUnknown();
        if (msg.sender != b.poster) revert NotPoster();
        if (b.settled || b.refunded) revert AlreadySettled();
        if (b.submittedAt != 0) revert WorkSubmitted();
        if (block.timestamp <= b.deadline) revert DeadlineNotReached(b.deadline);

        b.refunded = true;
        usdc.safeTransfer(b.poster, b.amount);

        emit Refunded(bountyId, b.poster, b.amount);
    }

    /// @notice Emergency stop: blocks new escrows, claims and settlements.
    /// @dev Refunds and timeoutRelease stay open — pausing must not strand anyone's money.
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Full escrow record (structs are not returned by the auto-getter in a usable shape).
    function getBounty(bytes32 bountyId) external view returns (Bounty memory) {
        return bounties[bountyId];
    }
}
