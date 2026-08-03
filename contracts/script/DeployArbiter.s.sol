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
 */
contract DeployArbiter is Script {
    function run() external returns (ArbiterEscrow escrow) {
        address usdc = vm.envAddress("USDC_ADDRESS_ARC_TESTNET");
        address arbiter = vm.envAddress("AIG_ADMIN_WALLET_ADDRESS");
        uint256 pk = vm.envUint("AIG_ADMIN_WALLET_PRIVATE_KEY");
        address owner = vm.addr(pk);

        vm.startBroadcast(pk);
        escrow = new ArbiterEscrow(usdc, arbiter, owner);
        vm.stopBroadcast();

        console.log("ArbiterEscrow :", address(escrow));
        console.log("  usdc        :", usdc);
        console.log("  arbiter     :", arbiter);
        console.log("  owner       :", owner);
        console.log("  MAX_BOUNTY  :", escrow.MAX_BOUNTY());
        console.log("Set ARBITER_ESCROW_ADDRESS in frontend/.env.local to the address above.");
    }
}
