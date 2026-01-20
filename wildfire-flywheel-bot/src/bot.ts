import { Telegraf } from 'telegraf';
import { BOT_TOKEN, CHAT_ID } from './config.js';
import { getSolBalance } from './solana.js';

export const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
    ctx.replyWithHTML(
        "<b>🔒 THE VAULT IS OPEN</b>\n\n" +
        "The automated vault mechanism is now active.\n\n" +
        "<b>Available Commands:</b>\n" +
        "/stats - View Vault metrics\n" +
        "/id - Get Chat ID"
    );
});

bot.command('stats', async (ctx) => {
    try {
        const balance = await getSolBalance();
        const solBalance = (balance / 1e9).toFixed(4);

        ctx.replyWithHTML(
            "<b>📊 THE VAULT DASHBOARD</b>\n\n" +
            `💰 <b>Operating Balance:</b> <code>${solBalance} SOL</code>\n` +
            `🔒 <b>Vault Status:</b> <code>Secure & Active</code>\n\n` +
            "<i>The floor price always climbs.</i>"
        );
    } catch (e) {
        ctx.reply("❌ Error retrieving vault metrics.");
    }
});

bot.command('fire', (ctx) => {
    ctx.replyWithHTML(
        "<b>🔒 THE VAULT ACKNOWLEDGES YOU</b>\n\n" +
        "Your contribution to the vault is noted.\n\n" +
        "✨ <i>The floor price always climbs</i> ✨"
    );
});

bot.command('id', (ctx) => {
    ctx.replyWithHTML(`🆔 <b>Chat ID:</b> <code>${ctx.chat.id}</code>`);
});

export async function notifyBuyback(solAmount: number, tokenAmount: string, signature: string, burnSignature: string) {
    const message =
        "<b>🔒 THE VAULT IS OPEN</b>\n\n" +
        `💰 <b>Vault Inflow:</b> <code>${solAmount} SOL</code>\n` +
        `💎 <b>Tokens Secured:</b> <code>${tokenAmount}</code>\n\n` +
        `🔒 <b>Status:</b> <code>Vaulted Forever</code>\n\n` +
        "<i>The floor price always climbs.</i>";

    if (CHAT_ID) {
        try {
            await bot.telegram.sendMessage(CHAT_ID, message, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🔒 View Vault TX", url: `https://solscan.io/tx/${burnSignature}` },
                            { text: "🔗 View Buyback", url: `https://solscan.io/tx/${signature}` }
                        ]
                    ]
                }
            });
        } catch (e) {
            console.error("Failed to send telegram message:", e);
        }
    }
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
