// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ArbiterEscrow} from "../src/ArbiterEscrow.sol";

/**
 * Deploy ArbiterEscrow to Arc testnet.
 *
 *   forge script script/DeployArbiter.s.sol:DeployArbiter \
 *     --rpc-url $ARC_TESTNET_RPC_URL --broadcast
 *
 * Env (loaded from frontend/.env.local — see scripts/deploy-arbiter-escrow.sh):
 *   USDC_ADDRESS_ARC_TESTNET      token held in escrow
 *   AIG_ADMIN_WALLET_ADDRESS      arbiter — the ONLY address that can call release()
 *   AIG_ADMIN_WALLET_PRIVATE_KEY  deployer/broadcaster; becomes owner (pause switch)
 *   ARBITER_SETTLE_WINDOW_SECONDS optional, default 48h — arbiter's time to settle a submission
 *   ARBITER_CLAIM_WINDOW_SECONDS  optional, default 72h — claimant's time to hand something in
 *
 * The two windows are immutable in the contract: the rules a bounty was created under must not
 * change underneath it. Changing them means a new deployment, which is a visible act.
 */
contract DeployArbiter is Script {
    function run() external returns (ArbiterEscrow escrow) {
        address usdc = vm.envAddress("USDC_ADDRESS_ARC_TESTNET");
        address arbiter = vm.envAddress("AIG_ADMIN_WALLET_ADDRESS");
        uint256 pk = vm.envUint("AIG_ADMIN_WALLET_PRIVATE_KEY");
        address owner = vm.addr(pk);
        uint64 settleWindow = uint64(vm.envOr("ARBITER_SETTLE_WINDOW_SECONDS", uint256(48 hours)));
        uint64 claimWindow = uint64(vm.envOr("ARBITER_CLAIM_WINDOW_SECONDS", uint256(72 hours)));

        vm.startBroadcast(pk);
        escrow = new ArbiterEscrow(usdc, arbiter, owner, settleWindow, claimWindow);
        vm.stopBroadcast();

        console.log("ArbiterEscrow :", address(escrow));
        console.log("  usdc        :", usdc);
        console.log("  arbiter     :", arbiter);
        console.log("  owner       :", owner);
        console.log("  MAX_BOUNTY  :", escrow.MAX_BOUNTY());
        console.log("  settleWindow:", escrow.settleWindow());
        console.log("  claimWindow :", escrow.claimWindow());
        console.log("Set ARBITER_ESCROW_ADDRESS in frontend/.env.local to the address above.");
    }
}
