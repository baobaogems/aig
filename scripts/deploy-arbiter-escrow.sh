#!/usr/bin/env bash
# Deploy ArbiterEscrow to Arc testnet, using the same env file the app reads.
#
#   bash scripts/deploy-arbiter-escrow.sh            # simulate only (no broadcast)
#   bash scripts/deploy-arbiter-escrow.sh --broadcast
#
# After a broadcast, copy the printed address into ARBITER_ESCROW_ADDRESS in frontend/.env.local,
# then verify the wiring with:  cd frontend && npm run arbiter:gate2
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/frontend/.env.local"

[ -f "$ENV_FILE" ] || { echo "missing $ENV_FILE (copy .env.example and fill it in)"; exit 1; }

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

for var in ARC_TESTNET_RPC_URL USDC_ADDRESS_ARC_TESTNET AIG_ADMIN_WALLET_ADDRESS AIG_ADMIN_WALLET_PRIVATE_KEY; do
  [ -n "${!var:-}" ] || { echo "$var is empty in $ENV_FILE"; exit 1; }
done

cd "$ROOT/contracts"
forge script script/DeployArbiter.s.sol:DeployArbiter \
  --rpc-url "$ARC_TESTNET_RPC_URL" \
  "$@"
