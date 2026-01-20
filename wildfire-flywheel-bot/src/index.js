"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./bot");
const pump_1 = require("./pump");
const swap_1 = require("./swap");
const config_1 = require("./config");
const bot_2 = require("./bot");
async function main() {
    console.log('Starting Wildfire Flywheel Bot...');
    // Launch Telegram Bot
    bot_1.bot.launch();
    // Flywheel Loop
    setInterval(async () => {
        try {
            console.log('Checking accrued fees...');
            const fees = await (0, pump_1.getAccruedFees)();
            console.log(`Current fees: ${fees} SOL (Threshold: ${config_1.FEE_THRESHOLD} SOL)`);
            if (fees >= config_1.FEE_THRESHOLD) {
                console.log('Threshold met! Triggering flywheel...');
                // 1. Claim Fees
                await (0, pump_1.claimFees)();
                // 2. Buyback (using claimed amount - small gas buffer)
                const solIn = fees - 0.01; // Small buffer for gas
                if (solIn > 0) {
                    const tx = await (0, swap_1.swapSolToToken)(solIn);
                    // 3. Notify
                    await (0, bot_2.notifyBuyback)(solIn, 'N/A', tx);
                }
            }
        }
        catch (error) {
            console.error('Error in flywheel loop:', error);
        }
    }, 60000); // Check every 60 seconds
}
main().catch(console.error);
//# sourceMappingURL=index.js.map