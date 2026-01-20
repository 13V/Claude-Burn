import { notifyBuyback } from './bot.js';
import * as dotenv from 'dotenv';
import { logActivity, logError } from './logger.js';
dotenv.config();
async function retryNotification() {
    const buyAmount = 0.017938863;
    const tokensBoughtStr = "16,397,701.06";
    const signature = "5djDkcv6YkcBRcdnydhUXS5G2aEb6uaUxR6CCQsZ9PCPUfAb9haCho1r4g6WsKcVfMcyRF9HzDPvNTjKrJYK8GW8";
    const burnSignature = "2Rv2SU4dgXj8H4ffhqQPfTuuffwD2qyNV3snmXs6jgzJ2SfMMHLt74AjnKpi18sCLCbeSzJR6ZyYMzfBrEgW3ENk";
    logActivity('📢 Re-sending Forced Buyback Notification...');
    try {
        await notifyBuyback(buyAmount, tokensBoughtStr, signature, burnSignature);
        logActivity('✅ Notification sent successfully!');
    }
    catch (e) {
        logError('Retry Notification', e);
        process.exit(1);
    }
}
retryNotification().then(() => process.exit(0));
