// =============================================================================
// cctp-abi.ts — Minimal ABIs for client-side v2 CCTP burn flow.
//
// Phase 03 of AIG v2. Customer signs:
//   1. USDC.approve(TokenMessenger, amount)
//   2. TokenMessenger.depositForBurn(amount, destinationDomain, mintRecipient, burnToken)
//
// After step 2, the server polls Circle's attestation API and mints on Arc
// (reusing existing frontend/lib/cctp.ts pollAttestation + receiveMessage).
// =============================================================================

// Minimal ERC-20: approve only. allowance/balanceOf added if/when UI needs them.
export const ERC20_APPROVE_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
  // optional balance/allowance reads — useful for pre-flight checks
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "allowance", type: "uint256" }],
  },
] as const;

// Circle CCTP TokenMessenger v2 depositForBurn — initiates cross-chain burn.
// mintRecipient is bytes32 (left-pad EVM address with zeros).
// destinationDomain: Arc Testnet = 26 (NOT 7 — v1 SwapRouter constant was wrong).
export const CCTP_TOKEN_MESSENGER_ABI = [
  {
    name: "depositForBurn",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "destinationDomain", type: "uint32" },
      { name: "mintRecipient", type: "bytes32" },
      { name: "burnToken", type: "address" },
    ],
    outputs: [{ name: "nonce", type: "uint64" }],
  },
] as const;
