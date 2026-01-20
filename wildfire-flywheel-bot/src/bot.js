"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
exports.notifyBuyback = notifyBuyback;
const telegraf_1 = require("telegraf");
const config_1 = require("./config");
const solana_1 = require("./solana");
exports.bot = new telegraf_1.Telegraf(config_1.BOT_TOKEN);
exports.bot.start((ctx) => {
    ctx.reply('Wildfire Flywheel Bot is active! $WILDFIRE 🚀');
});
exports.bot.command('stats', async (ctx) => {
    try {
        const balance = await (0, solana_1.getSolBalance)();
        ctx.reply(`🔥 Wildfire Flywheel Stats 🔥\n\n- Wallet Balance: ${balance / 1e9} SOL\n- Total Buybacks: [Coming Soon]\n- Total Burned: [Coming Soon]`);
    }
    catch (e) {
        ctx.reply('Error fetching stats.');
    }
});
exports.bot.command('fire', (ctx) => {
    // Triggers a fancy animation/message
    ctx.reply('🔥 THE WILDFIRE IS SPREADING! 🔥\n\n[Animation triggered]');
});
async function notifyBuyback(solAmount, tokenAmount, signature) {
    const message = `🚀 **WILDFIRE BUYBACK DETECTED!** 🚀\n\n- Amount: ${solAmount} SOL\n- Tokens Bought: ${tokenAmount}\n- TX: [Solscan](https://solscan.io/tx/${signature})`;
    if (config_1.CHAT_ID) {
        await exports.bot.telegram.sendMessage(config_1.CHAT_ID, message, { parse_mode: 'Markdown' });
    }
}
process.once('SIGINT', () => exports.bot.stop('SIGINT'));
process.once('SIGTERM', () => exports.bot.stop('SIGTERM'));
//# sourceMappingURL=bot.js.map