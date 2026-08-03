// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ArbiterEscrow
 * @notice Holds USDC for one bounty at a time and releases it only on an arbiter verdict.
 *         AIG v4 — Arc testnet. PRD §7: exactly create / release / refund / pause. No wider logic.
 *
 * Trust model — stated honestly, not as "trustless":
 *  - The poster locks funds; only the arbiter wallet (an AIG server key) can release them to the
 *    pre-assigned worker, and only once, always carrying the verdict hash on-chain.
 *  - The arbiter can never redirect funds: `worker` is fixed at creation and never re-read from input.
 *  - The poster is protected by `deadline`: after it passes with no release, they can always refund.
 *  - MAX_BOUNTY is the contract-level half of the two-tier spend cap (the other half is server-side);
 *    it bounds the blast radius of a compromised arbiter key to one bounty's worth of testnet USDC.
 */
contract ArbiterEscrow is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Hard per-bounty cap: 50 USDC (6 decimals). Contract-level, cannot be raised.
    uint256 public constant MAX_BOUNTY = 50e6;

    /// @notice The USDC token held in escrow.
    IERC20 public immutable usdc;

    /// @notice The only address allowed to call `release`. Immutable by design (PRD §7 = 4 functions).
    address public immutable arbiter;

    struct Bounty {
        address poster;
        address worker;
        uint256 amount;
        uint64 deadline;
        bool released;
        bool refunded;
    }

    /// @notice bountyId (keccak256 of the off-chain UUID) → escrow record.
    mapping(bytes32 => Bounty) public bounties;

    event BountyCreated(
        bytes32 indexed bountyId, address indexed poster, address indexed worker, uint256 amount, uint64 deadline
    );
    event Released(bytes32 indexed bountyId, bytes32 verdictHash, address indexed worker, uint256 amount);
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

    modifier onlyArbiter() {
        if (msg.sender != arbiter) revert NotArbiter();
        _;
    }

    constructor(address usdc_, address arbiter_, address owner_) Ownable(owner_) {
        if (usdc_ == address(0) || arbiter_ == address(0) || owner_ == address(0)) revert ZeroAddress();
        usdc = IERC20(usdc_);
        arbiter = arbiter_;
    }

    /**
     * @notice Poster locks USDC for a bounty already assigned to one worker (MVP = 1 bounty, 1 worker).
     * @dev Requires prior `approve(address(this), amount)` by the poster.
     */
    function createBounty(bytes32 bountyId, address worker, uint256 amount, uint64 deadline)
        external
        whenNotPaused
        nonReentrant
    {
        if (bounties[bountyId].poster != address(0)) revert BountyExists();
        if (worker == address(0)) revert ZeroAddress();
        if (amount == 0) revert AmountZero();
        if (amount > MAX_BOUNTY) revert AmountOverCap(amount, MAX_BOUNTY);
        if (deadline <= block.timestamp) revert DeadlineInPast();

        bounties[bountyId] = Bounty({
            poster: msg.sender, worker: worker, amount: amount, deadline: deadline, released: false, refunded: false
        });

        // State written before the transfer: reentrancy via a hostile token cannot re-enter into
        // a second createBounty for the same id (nonReentrant is belt-and-braces on top).
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit BountyCreated(bountyId, msg.sender, worker, amount, deadline);
    }

    /**
     * @notice Arbiter releases the escrow to the worker, committing the verdict hash on-chain.
     * @param verdictHash keccak256 of the canonical verdict JSON — the public audit artifact.
     * @dev One release per bounty, ever. The worker address comes from storage, never from the caller.
     */
    function release(bytes32 bountyId, bytes32 verdictHash) external onlyArbiter whenNotPaused nonReentrant {
        Bounty storage b = bounties[bountyId];
        if (b.poster == address(0)) revert BountyUnknown();
        if (b.released || b.refunded) revert AlreadySettled();
        if (verdictHash == bytes32(0)) revert VerdictHashEmpty();

        b.released = true;
        usdc.safeTransfer(b.worker, b.amount);

        emit Released(bountyId, verdictHash, b.worker, b.amount);
    }

    /**
     * @notice Poster reclaims the escrow after the deadline if nothing was released.
     * @dev Deliberately callable while paused — an emergency pause must never trap poster funds.
     */
    function refund(bytes32 bountyId) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        if (b.poster == address(0)) revert BountyUnknown();
        if (msg.sender != b.poster) revert NotPoster();
        if (b.released || b.refunded) revert AlreadySettled();
        if (block.timestamp <= b.deadline) revert DeadlineNotReached(b.deadline);

        b.refunded = true;
        usdc.safeTransfer(b.poster, b.amount);

        emit Refunded(bountyId, b.poster, b.amount);
    }

    /// @notice Emergency stop: blocks new escrows and all releases. Refunds stay open.
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
