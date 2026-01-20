import { swapSolToToken } from './swap.js';
import { notifyBuyback } from './bot.js';
import { saveStats } from './stats.js';
import { burnTokens } from './burn.js';
async function testBuyback() {
    const amount = 0.005; // Safer test amount
    console.log(`Forcing a manual buyback of ${amount} SOL...`);
    try {
        // 1. Buy
        const { signature, tokensBought } = await swapSolToToken(amount);
        console.log('Buyback successful! Signature:', signature);
        // 2. Burn
        // 2. Burn
        console.log('Waiting 15s for balance propagation...');
        await new Promise(r => setTimeout(r, 15000));
        let burnSignature = "BURN_FAILED_OR_SKIPPED";
        try {
            burnSignature = await burnTokens(tokensBought);
            console.log('Burn successful! Signature:', burnSignature);
        }
        catch (burnError) {
            console.error('Burn failed in test:', burnError.message);
            console.error('Burn error details:', JSON.stringify(burnError, Object.getOwnPropertyNames(burnError)));
        }
        // 3. Update stats
        saveStats(amount, tokensBought);
        // 4. Notify
        try {
            await notifyBuyback(amount, tokensBought.toLocaleString(), signature, burnSignature);
        }
        catch (botErr) {
            console.warn('Telegram notification failed (check CHAT_ID):', botErr.message);
        }
        process.exit(0);
    }
    catch (e) {
        console.error('Manual buyback failed:', e instanceof Error ? e.message : e);
        if (e.response) {
            console.error('Response data:', JSON.stringify(e.response.data));
        }
        else {
            console.error('Full error:', JSON.stringify(e));
        }
        process.exit(1);
    }
}
testBuyback();
