// =============================================================================
// escrow-abi.ts — ArbiterEscrow v3 ABI (contracts/src/ArbiterEscrow.sol)
// Shared by the server (markSubmitted/settle/read) and the client (poster signs
// createBounty; worker signs claim, timeoutRelease, expireClaim).
// Kept minimal + `as const` so viem/wagmi infer argument types.
//
// v2's surface lives in escrow-abi-v2.ts and is frozen — see phase 06 of the dispute-mechanism
// plan: bounties opened on v2 finish on v2, and no money moves between the two contracts.
// =============================================================================

export const arbiterEscrowAbi = [
  {
    name: "createBounty",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "bountyId", type: "bytes32" },
      { name: "worker", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "deadline", type: "uint64" },
    ],
    outputs: [],
  },
  {
    name: "settle",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "bountyId", type: "bytes32" },
      { name: "verdictHash", type: "bytes32" },
      { name: "workerBps", type: "uint16" },
    ],
    outputs: [],
  },
  {
    // v2: a worker takes an open bounty. First caller wins, permanently.
    name: "claim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "bountyId", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "refund",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "bountyId", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "markSubmitted",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "bountyId", type: "bytes32" }],
    outputs: [],
  },
  {
    // Permissionless on purpose: the worker's way out when this platform stops answering.
    name: "timeoutRelease",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "bountyId", type: "bytes32" }],
    outputs: [],
  },
  {
    // Permissionless on purpose: frees a bounty whose claimant went quiet. Moves no money.
    name: "expireClaim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "bountyId", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "getBounty",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "bountyId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "poster", type: "address" },
          { name: "worker", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "deadline", type: "uint64" },
          { name: "claimedAt", type: "uint64" },
          { name: "submittedAt", type: "uint64" },
          { name: "settled", type: "bool" },
          { name: "refunded", type: "bool" },
        ],
      },
    ],
  },
  { name: "MAX_BOUNTY", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "paused", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "bool" }] },
  { name: "arbiter", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  { name: "settleWindow", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint64" }] },
  { name: "claimWindow", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint64" }] },
  {
    name: "Settled",
    type: "event",
    inputs: [
      { name: "bountyId", type: "bytes32", indexed: true },
      { name: "verdictHash", type: "bytes32", indexed: false },
      { name: "worker", type: "address", indexed: true },
      { name: "workerAmount", type: "uint256", indexed: false },
      { name: "posterAmount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "Submitted",
    type: "event",
    inputs: [
      { name: "bountyId", type: "bytes32", indexed: true },
      { name: "worker", type: "address", indexed: true },
      { name: "at", type: "uint64", indexed: false },
    ],
  },
  {
    name: "ClaimExpired",
    type: "event",
    inputs: [
      { name: "bountyId", type: "bytes32", indexed: true },
      { name: "worker", type: "address", indexed: true },
    ],
  },
  {
    name: "Claimed",
    type: "event",
    inputs: [
      { name: "bountyId", type: "bytes32", indexed: true },
      { name: "worker", type: "address", indexed: true },
    ],
  },
  {
    name: "BountyCreated",
    type: "event",
    inputs: [
      { name: "bountyId", type: "bytes32", indexed: true },
      { name: "poster", type: "address", indexed: true },
      { name: "worker", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "deadline", type: "uint64", indexed: false },
    ],
  },
] as const;

/** Minimal ERC20 surface the poster needs to approve the escrow before createBounty. */
export const erc20ApproveAbi = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
