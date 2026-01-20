import { Telegraf } from 'telegraf';
import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { getSession, updateSession, getAllSessions } from './db';
import { executeBurn } from './engine';
import { fetchTokenIntelligence } from './intel';
import { getTacticalDecision } from './tactical';
import { buyTokenWithSol } from './swap';
import express from 'express';
import cors from 'cors';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const RPC_URL = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';

if (!BOT_TOKEN) {
    console.error("BOT_TOKEN missing in .env");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const connection = new Connection(RPC_URL, 'confirmed');

const activeIntervals: Record<number, NodeJS.Timeout> = {};

bot.start((ctx) => {
    ctx.reply(`🔥 *The Incinerator* is online.\n\n` +
        `Use this bot to automate token burns for your Solana project.\n\n` +
        `*Commands:*\n` +
        `/set_token <CA> - Set the token to burn\n` +
        `/set_key <PK> - Set the burn wallet Private Key (Base58)\n` +
        `/crank <interval_ms> <amount> - Start automated burn cycle\n` +
        `/ai_mode <mode> - Trigger AI tactical mode (Modes: FLOOR, FOMO, STEADY)\n` +
        `/stop - Stop the current crank\n` +
        `/status - View current setup and health\n\n` +
        `⚠️ *SECURITY:* Use a disposable wallet. Never put your main treasury key here.`,
        { parse_mode: 'Markdown' }
    );
});

bot.command('set_token', (ctx) => {
    if (ctx.chat.type !== 'private') return ctx.reply("❌ For security, use this command in Direct Messages.");
    const session = getSession(ctx.chat.id);
    if (session.developerId && session.developerId !== ctx.from.id) return ctx.reply("❌ Unauthorized.");

    const text = ctx.message.text.split(' ');
    const ca = text[1];
    if (!ca) return ctx.reply("Usage: /set_token <Token_Mint_Address>");

    updateSession(ctx.chat.id, {
        tokenCA: ca,
        developerId: ctx.from.id
    });
    ctx.reply(`✅ Token CA set to: \`${ca}\`\nYou are now the authorized developer for this session.`, { parse_mode: 'Markdown' });
});

bot.command('set_key', (ctx) => {
    if (ctx.chat.type !== 'private') return ctx.reply("❌ CRITICAL: For security, you MUST use this command in Direct Messages only.");
    const session = getSession(ctx.chat.id);
    if (session.developerId && session.developerId !== ctx.from.id) return ctx.reply("❌ Unauthorized.");

    const text = ctx.message.text.split(' ');
    const pk = text[1];
    if (!pk) return ctx.reply("Usage: /set_key <Private_Key_Base58>");

    try {
        Keypair.fromSecretKey(bs58.decode(pk));
        updateSession(ctx.chat.id, {
            privateKey: pk,
            developerId: ctx.from.id
        });
        ctx.reply("✅ Private Key saved securely for this session.");
    } catch (e) {
        ctx.reply("❌ Invalid Private Key format. Must be Base58.");
    }
});

bot.command('set_broadcast', (ctx) => {
    if (ctx.chat.type !== 'private') return ctx.reply("❌ Use this in DMs.");
    const session = getSession(ctx.chat.id);
    if (session.developerId !== ctx.from.id) return ctx.reply("❌ Unauthorized.");

    const targetId = ctx.message.text.split(' ')[1];
    if (!targetId) return ctx.reply("Usage: /set_broadcast <Group/Channel_ID>\n(e.g., -123456789)");

    updateSession(ctx.chat.id, { broadcastChatId: targetId });
    ctx.reply(`✅ Broadcast target set to: \`${targetId}\`\nI will now post burn updates to that chat.`, { parse_mode: 'Markdown' });
});

bot.command('status', (ctx) => {
    const session = getSession(ctx.chat.id);
    if (session.developerId && session.developerId !== ctx.from.id) return ctx.reply("❌ Unauthorized.");

    const status = session.crankActive ? "🟢 ACTIVE" : "🔴 INACTIVE";
    ctx.reply(
        `📊 *Incinerator Status:*\n\n` +
        `*Status:* ${status}\n` +
        `*Token:* \`${session.tokenCA || "Not Set"}\`\n` +
        `*Wallet:* ${session.privateKey ? "✅ Connected" : "❌ Disconnected"}\n` +
        `*Total Burns:* ${session.burnCount}\n` +
        `*Last Sig:* \`${session.lastBurnSignature || "None"}\``,
        { parse_mode: 'Markdown' }
    );
});

bot.command('stop', (ctx) => {
    if (ctx.chat.type !== 'private') return ctx.reply("❌ Use this in DMs.");
    const session = getSession(ctx.chat.id);
    if (session.developerId !== ctx.from.id) return ctx.reply("❌ Unauthorized.");

    if (activeIntervals[ctx.chat.id]) {
        clearInterval(activeIntervals[ctx.chat.id]);
        delete activeIntervals[ctx.chat.id];
    }
    updateSession(ctx.chat.id, { crankActive: false });
    ctx.reply("🛑 Crank stopped.");
});

bot.command('crank', async (ctx) => {
    const parts = ctx.message.text.split(' ');
    const intervalStr = parts[1];
    const amountStr = parts[2];

    if (!intervalStr || !amountStr) {
        return ctx.reply("Usage: /crank <interval_ms> <amount>");
    }

    const interval = parseInt(intervalStr);
    const amount = parseFloat(amountStr);

    if (isNaN(interval) || isNaN(amount) || interval < 5000) {
        return ctx.reply("Usage: /crank <interval_ms> <amount>\n(Min interval: 5000ms)");
    }

    const session = getSession(ctx.chat.id);
    if (ctx.chat.type !== 'private') return ctx.reply("❌ For security, use this command in Direct Messages.");
    if (session.developerId && session.developerId !== ctx.from.id) return ctx.reply("❌ Unauthorized.");

    if (!session.tokenCA || !session.privateKey) {
        return ctx.reply("❌ Setup incomplete. Use /set_token and /set_key first.");
    }

    if (activeIntervals[ctx.chat.id]) {
        clearInterval(activeIntervals[ctx.chat.id]);
    }

    updateSession(ctx.chat.id, {
        crankActive: true,
        crankInterval: interval,
        crankAmount: amount
    });

    ctx.reply(`🚀 Crank started! Burning ${amount} tokens every ${interval}ms.`);

    const runBurn = async () => {
        const s = getSession(ctx.chat.id);
        if (!s.crankActive) return;

        try {
            const wallet = Keypair.fromSecretKey(bs58.decode(s.privateKey!));
            const result = await executeBurn(connection, wallet, s.tokenCA!, s.crankAmount!);

            if (result.success && result.signature) {
                updateSession(ctx.chat.id, {
                    burnCount: s.burnCount + 1,
                    lastBurnSignature: result.signature
                });

                const burnMsg = `🔥 *Burn Successful!*\n\n` +
                    `*Amount:* ${s.crankAmount} tokens\n` +
                    `[View on Solscan](https://solscan.io/tx/${result.signature})`;

                ctx.reply(burnMsg, { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } });

                if (s.broadcastChatId) {
                    bot.telegram.sendMessage(s.broadcastChatId, burnMsg, {
                        parse_mode: 'Markdown',
                        link_preview_options: { is_disabled: true }
                    }).catch(e => console.error("Broadcast failed:", e));
                }

                console.log(`[BURN SUCCESS] ${ctx.chat.id}: ${result.signature}`);
            } else {
                console.error(`[BURN FAILED] ${ctx.chat.id}: ${result.error}`);
                bot.telegram.sendMessage(ctx.chat.id, `⚠️ *Burn Failed:* ${result.error}`, { parse_mode: 'Markdown' });
            }
        } catch (e: any) {
            console.error(`[CRITICAL ERROR] ${ctx.chat.id}:`, e);
        }
    };

    activeIntervals[ctx.chat.id] = setInterval(runBurn, interval);
    runBurn(); // Run once immediately
});

bot.command('ai_mode', async (ctx) => {
    const strategyMap: Record<string, "FLOOR_DEFENSE" | "FOMO_ACCELERATOR" | "STEADY_INCINERATION" | "SELF_SUSTAINING"> = {
        'FLOOR': 'FLOOR_DEFENSE',
        'FOMO': 'FOMO_ACCELERATOR',
        'STEADY': 'STEADY_INCINERATION',
        'SELF': 'SELF_SUSTAINING'
    };

    const mode = ctx.message.text.split(' ')[1]?.toUpperCase();
    if (!mode || !strategyMap[mode]) {
        return ctx.reply("Usage: /ai_mode <FLOOR | FOMO | STEADY | SELF>");
    }
    const strategy = strategyMap[mode]!;

    const session = getSession(ctx.chat.id);
    if (ctx.chat.type !== 'private') return ctx.reply("❌ For security, use this command in Direct Messages.");
    if (session.developerId && session.developerId !== ctx.from.id) return ctx.reply("❌ Unauthorized.");

    if (!session.tokenCA || !session.privateKey) {
        return ctx.reply("❌ Setup incomplete. Use /set_token and /set_key first.");
    }

    updateSession(ctx.chat.id, {
        aiActive: true,
        crankActive: true,
        strategy: strategy,
        crankInterval: 60000 // 1 minute checks in AI mode
    });

    if (activeIntervals[ctx.chat.id]) clearInterval(activeIntervals[ctx.chat.id]);

    ctx.reply(`🧠 *AI Tactical Mode Active:* \`${strategy}\`\n` +
        `Claude is now monitoring the chart every 60s and will execute burns when tactical conditions are met.`,
        { parse_mode: 'Markdown' }
    );

    const runAIBurn = async () => {
        const s = getSession(ctx.chat.id);
        if (!s.aiActive || !s.crankActive) return;

        try {
            const wallet = Keypair.fromSecretKey(bs58.decode(s.privateKey!));
            const market = await fetchTokenIntelligence(connection, s.tokenCA!, wallet.publicKey.toString());
            if (!market) return;

            const decision = await getTacticalDecision(market, s.strategy!);

            // 1. Handle Buyback first (if AI decides)
            if (decision.shouldBuyback && decision.buybackAmountSol > 0) {
                const buyResult = await buyTokenWithSol(connection, wallet, s.tokenCA!, decision.buybackAmountSol);
                if (buyResult.success) {
                    const buyMsg = `💰 *AI BUYBACK TRIGGERED:* \`${decision.narrativeLabel}\`\n\n` +
                        `*Spent:* ${decision.buybackAmountSol} SOL\n` +
                        `[View Buyback Transaction](https://solscan.io/tx/${buyResult.signature})`;

                    bot.telegram.sendMessage(ctx.chat.id, buyMsg, { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } });
                    if (s.broadcastChatId) {
                        bot.telegram.sendMessage(s.broadcastChatId, buyMsg, { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } }).catch(() => { });
                    }
                }
            }

            // 2. Handle Burn
            if (decision.shouldBurn) {
                const result = await executeBurn(connection, wallet, s.tokenCA!, decision.burnAmount);

                if (result.success && result.signature) {
                    updateSession(ctx.chat.id, {
                        burnCount: s.burnCount + 1,
                        lastBurnSignature: result.signature
                    });

                    const msg = `🚀 *AI TACTICAL STRIKE:* \`${decision.narrativeLabel}\`\n\n` +
                        `🔥 *Burned:* ${decision.burnAmount} tokens\n` +
                        `🧠 *Reasoning:* ${decision.reasoning}\n\n` +
                        `[View Transaction](https://solscan.io/tx/${result.signature})`;

                    bot.telegram.sendMessage(ctx.chat.id, msg, {
                        parse_mode: 'Markdown',
                        link_preview_options: { is_disabled: true }
                    });

                    if (s.broadcastChatId) {
                        bot.telegram.sendMessage(s.broadcastChatId, msg, {
                            parse_mode: 'Markdown',
                            link_preview_options: { is_disabled: true }
                        }).catch(e => console.error("Broadcast failed:", e));
                    }
                }
            } else {
                console.log(`[AI IDLE] ${ctx.chat.id}: ${decision.reasoning}`);
            }
        } catch (e) {
            console.error("AI Loop Error:", e);
        }
    };

    activeIntervals[ctx.chat.id] = setInterval(runAIBurn, 60000);
    runAIBurn();
});

// API for Hall of Flame Dashboard
const app = express();
app.use(cors());

app.get('/api/stats', (req, res) => {
    const sessions = getAllSessions();
    const publicStats = sessions
        .filter(s => s.tokenCA) // Only show configured tokens
        .map(s => ({
            chatId: s.chatId,
            tokenCA: s.tokenCA,
            burnCount: s.burnCount,
            lastBurnSignature: s.lastBurnSignature,
            aiActive: s.aiActive,
            strategy: s.strategy,
            crankActive: s.crankActive
        }));
    res.json(publicStats);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔥 API Server running on port ${PORT}`);
});

bot.launch().then(() => {
    console.log("Incinerator Bot is live!");
});

process.once('SIGINT', () => {
    bot.stop('SIGINT');
    process.exit(0);
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    process.exit(0);
});
