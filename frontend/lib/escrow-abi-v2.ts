// =============================================================================
// escrow-abi-v2.ts — the FROZEN v2 ArbiterEscrow surface.
//
// v2 (0xD4f53A1bD89a05Ac568601b4c30655A678C5f9f1) still holds real escrow for bounties that
// were open when v3 shipped. Those finish where they started: this file exists so a v2 bounty
// can still be read, released and refunded, and for no other reason.
//
// Do not add to it. Do not "improve" it. It describes a contract that is already deployed and
// can never change; the only correct edit is deletion, once no v2 bounty is left open.
// =============================================================================

export const arbiterEscrowV2Abi = [
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
    name: "claim",
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
] as const;
