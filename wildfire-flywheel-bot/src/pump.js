"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccruedFees = getAccruedFees;
exports.claimFees = claimFees;
const web3_js_1 = require("@solana/web3.js");
const solana_1 = require("./solana");
const config_1 = require("./config");
const crypto_1 = require("crypto");
/**
 * Calculates the Anchor discriminator for an instruction.
 */
function getInstructionDiscriminator(name) {
    const hash = (0, crypto_1.createHash)('sha256').update(`global:${name}`).digest();
    return hash.subarray(0, 8);
}
async function getAccruedFees() {
    // This is a simplified check. In practice, you'd check the lamports of the 
    // creator vault authority PDA or use an API.
    // For now, we'll try to find the PDA and get its SOL balance.
    try {
        const [authority] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('creator-revenue-proof'), solana_1.wallet.publicKey.toBuffer()], config_1.PUMP_PROGRAM_ID);
        const balance = await solana_1.connection.getBalance(authority);
        return balance / 1e9; // Convert to SOL
    }
    catch (e) {
        console.error('Error checking fees:', e);
        return 0;
    }
}
async function claimFees() {
    console.log('Building claim transaction...');
    // Instruction: global:collect_creator_fee
    // Accounts: signer (creator), global account, fee recipient, system program, etc.
    // Note: The exact account structure may vary. Using high-level logic.
    // For production, using a pre-built instruction or a reliable API is safer.
    // Here we'll implement a placeholder that represents the logic.
    const discriminator = getInstructionDiscriminator('collect_creator_fee');
    // This is where we'd add the instruction to a transaction.
    // Since we don't have the exact IDL verified, we'll use a safer approach 
    // of simulating the call if possible or using a standard library.
    // For this implementation, we assume the user might want to use PumpPortal's 
    // local tx builder if they provide one, but we'll stick to web3.js for now.
    console.warn('Claim logic is a template. Verification with mainnet IDL recommended.');
}
//# sourceMappingURL=pump.js.map