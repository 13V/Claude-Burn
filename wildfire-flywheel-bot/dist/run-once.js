import { notifyBuyback } from './bot.js';
import { getAccruedFees, claimFees } from './pump.js';
import { swapSolToToken } from './swap.js';
import { burnTokens } from './burn.js';
import { saveStats } from './stats.js';
import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import * as dotenv from 'dotenv';
dotenv.config();
// Helper to get balance safely
async function getWalletBalanceHelper() {
    const connection = new Connection(process.env.RPC_URL || '');
    const secret = bs58.decode(process.env.PRIVATE_KEY || '');
    const wallet = Keypair.fromSecretKey(secret);
    const balance = await connection.getBalance(wallet.publicKey);
    return { balanceSol: balance / 1e9, wallet };
}
async function runOnce() {
    console.log('Starting Single Run of The Vault Flywheel...');
    try {
        // 1. Claim Fees (if any)
        console.log('Checking accrued fees...');
        let fees = 0;
        try {
            fees = await getAccruedFees();
            console.log(`Accrued fees: ${fees} SOL`);
            if (fees > 0.001) { // claim if decent amount
                await claimFees();
                console.log("Fees claimed.");
                // Wait for confirmation/balance update
                console.log("Waiting 5s for fee claim propagation...");
                await new Promise(r => setTimeout(r, 5000));
            }
        }
        catch (e) {
            console.warn("Fee check/claim failed (ignoring):", e.message);
        }
        // 2. Check Wallet Balance
        const { balanceSol } = await getWalletBalanceHelper();
        console.log(`Current Wallet Balance: ${balanceSol.toFixed(4)} SOL`);
        // User asked to check for 0.1 SOL
        const TARGET_THRESHOLD = 0.1;
        if (balanceSol > TARGET_THRESHOLD) {
            console.log(`Balance > ${TARGET_THRESHOLD}. Executing buyback...`);
            // Leave buffer for gas
            const BUFFER = 0.01;
            const buyAmount = balanceSol - BUFFER;
            if (buyAmount <= 0) {
                console.log("Balance too low after buffer.");
                return;
            }
            console.log(`Buying with ${buyAmount.toFixed(4)} SOL...`);
            // 3. Buyback
            const { signature, tokensBought } = await swapSolToToken(buyAmount);
            console.log(`Buyback complete: ${signature}`);
            // Wait for RPC to update balance (crucial for burn)
            console.log("Waiting 20s for balance propagation...");
            await new Promise(r => setTimeout(r, 20000));
            // 4. Burn
            const burnSignature = await burnTokens(tokensBought);
            console.log(`Burn complete: ${burnSignature}`);
            // 5. Track Stats
            saveStats(buyAmount, tokensBought);
            // 6. Notify
            console.log("Sending Telegram Notification...");
            await notifyBuyback(buyAmount, tokensBought.toLocaleString(), signature, burnSignature);
            console.log("Flywheel cycle completed successfully.");
        }
        else {
            console.log(`Balance ${balanceSol} <= ${TARGET_THRESHOLD}. No action taken.`);
        }
    }
    catch (error) {
        console.error('Error in flywheel run:', error.message);
        if (error.logs)
            console.error(error.logs);
        process.exit(1);
    }
}
runOnce().then(() => process.exit(0));
