// =============================================================================
// escrow-abi.ts — ArbiterEscrow ABI (contracts/src/ArbiterEscrow.sol)
// Shared by the server (release/refund/read) and the client (poster signs createBounty).
// Kept minimal + `as const` so viem/wagmi infer argument types.
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
    name: "release",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "bountyId", type: "bytes32" },
      { name: "verdictHash", type: "bytes32" },
    ],
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
          { name: "released", type: "bool" },
          { name: "refunded", type: "bool" },
        ],
      },
    ],
  },
  { name: "MAX_BOUNTY", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "paused", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "bool" }] },
  { name: "arbiter", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  {
    name: "Released",
    type: "event",
    inputs: [
      { name: "bountyId", type: "bytes32", indexed: true },
      { name: "verdictHash", type: "bytes32", indexed: false },
      { name: "worker", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
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
