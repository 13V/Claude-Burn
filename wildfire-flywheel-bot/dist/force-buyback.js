import { swapSolToToken } from './swap.js';
import { notifyBuyback } from './bot.js';
import { saveStats } from './stats.js';
import { burnTokens } from './burn.js';
import { claimFees } from './pump.js';
async function forceBuyback() {
    // 1. Claim any pending fees first (try-catch in case 0)
    try {
        console.log("Checking/Claiming fees first...");
        await claimFees();
    }
    catch (e) {
        console.log("No fees to claim or claim skipped (acceptable):", e.message);
    }
    const amount = 0.235; // 0.240 avail - 0.005 buffer
    console.log(`Forcing a MANUAL buyback of ${amount} SOL...`);
    try {
        // 2. Buy
        const { signature, tokensBought } = await swapSolToToken(amount);
        console.log('Buyback successful! Signature:', signature);
        // 3. Wait for propagation
        console.log('Waiting 20s for balance propagation...');
        await new Promise(r => setTimeout(r, 20000));
        // 4. Burn
        let burnSignature = "BURN_FAILED_OR_SKIPPED";
        try {
            burnSignature = await burnTokens(tokensBought);
            console.log('Burn successful! Signature:', burnSignature);
        }
        catch (burnError) {
            console.error('Burn failed:', burnError.message);
        }
        // 5. Update stats
        saveStats(amount, tokensBought);
        // 6. Notify
        console.log("Sending Telegram Notification...");
        await notifyBuyback(amount, tokensBought.toLocaleString(), signature, burnSignature);
        console.log("Done.");
        process.exit(0);
    }
    catch (e) {
        console.error('Force buyback failed:', e.message);
        if (e.logs)
            console.error('Logs:', e.logs);
        process.exit(1);
    }
}
forceBuyback();
