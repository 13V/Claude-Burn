import TelegramBot from 'node-telegram-bot-api';
import { config } from './config';
import { tokenDb, Token } from './database';
import { logger } from './logger';
import { dexScreener } from './dexscreener';
import { pumpPortal } from './pump-portal';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { verifyTokenCreator } from './verify-creator';

interface UserState {
    step: 'idle' | 'awaiting_address' | 'awaiting_key' | 'awaiting_percentage' | 'awaiting_mode';
    tokenAddress?: string;
    privateKey?: string;
    burnPercentage?: number;
}

const userStates = new Map<number, UserState>();

export function setupTelegramHandlers(bot: TelegramBot) {
    // /start command
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const welcomeMessage = `🔥 *Welcome to Claude Burn Bot* 🔥

The AI-powered buyback and burn system for Solana memecoins.

*For Token Creators:*
Use /register to add your token to the system

*Commands:*
/register - Register your token
/status - View your token stats
/settings - Update burn settings
/help - Get help

*How it works:*
1. Register your pumpfun token
2. We claim your creator fees automatically
3. Claude AI analyzes the chart
4. We buyback on dips and burn tokens
5. 5% service fee goes to $claudeburn

Let's make those burns count! 🚀`;

        bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });

    // /register command
    bot.onText(/\/register/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id;

        if (!userId) return;

        userStates.set(userId, { step: 'awaiting_address' });

        bot.sendMessage(
            chatId,
            '📝 *Token Registration*\n\nStep 1/4: Send me your token address (Solana)',
            { parse_mode: 'Markdown' }
        );
    });

    // /status command
    bot.onText(/\/status/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id?.toString();

        if (!userId) return;

        const tokens = tokenDb.getTokensByOwner(userId);

        if (tokens.length === 0) {
            bot.sendMessage(chatId, 'You have no registered tokens. Use /register to add one.');
            return;
        }

        for (const token of tokens) {
            const priceData = await dexScreener.getTokenData(token.address);
            const status = token.isActive ? '✅ Active' : '❌ Paused';
            const lastBurnTime = token.lastBurn
                ? new Date(token.lastBurn).toLocaleString()
                : 'Never';

            const message = `📊 *Token Status*

*Address:* \`${token.address}\`
*Status:* ${status}
*Mode:* ${token.mode.toUpperCase()}
*Burn %:* ${token.burnPercentage}%
*Total Burned:* ${token.totalBurned.toFixed(4)} tokens
*Last Burn:* ${lastBurnTime}

*Current Price:* $${priceData?.currentPrice.toFixed(8) || 'N/A'}
*24h Change:* ${priceData?.priceChange24h.toFixed(2) || 'N/A'}%

[View Chart](${priceData?.chartUrl || 'https://dexscreener.com'})`;

            bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        }
    });

    // /settings command
    bot.onText(/\/settings (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id?.toString();
        const args = match?.[1].split(' ');

        if (!userId || !args || args.length < 2) {
            bot.sendMessage(
                chatId,
                'Usage: /settings <token_address> <burn_%> <mode>\n\nExample: /settings ABC...123 50 aggressive'
            );
            return;
        }

        const [tokenAddress, percentageStr, mode] = args;
        const percentage = parseInt(percentageStr);

        const token = tokenDb.getToken(tokenAddress);

        if (!token || token.ownerTelegramId !== userId) {
            bot.sendMessage(chatId, 'Token not found or you are not the owner.');
            return;
        }

        if (percentage < 10 || percentage > 100) {
            bot.sendMessage(chatId, 'Burn percentage must be between 10 and 100.');
            return;
        }

        if (mode && !['standard', 'aggressive', 'conservative'].includes(mode)) {
            bot.sendMessage(chatId, 'Mode must be: standard, aggressive, or conservative');
            return;
        }

        tokenDb.updateTokenSettings(tokenAddress, percentage, mode || token.mode);

        bot.sendMessage(
            chatId,
            `✅ Settings updated!\n\nBurn %: ${percentage}%\nMode: ${mode || token.mode}`,
            { parse_mode: 'Markdown' }
        );
    });

    // /help command
    bot.onText(/\/help/, async (msg) => {
        const chatId = msg.chat.id;
        logger.info(`Help command received from chat ${chatId}`);

        const helpMessage = `🔥 *Claude Burn Bot - Help*

*Commands:*
/start - Welcome message
/register - Register a new token
/status - View token stats
/settings \\<address\\> \\<burn\\_\\%\\> \\<mode\\> - Update settings
/pause \\<address\\> - Pause buybacks
/resume \\<address\\> - Resume buybacks
/help - This message

*Modes:*
• *Standard* - AI buys on 5% dips (50% of fees)
• *Aggressive* - AI buys on 3% dips (75% of fees)
• *Conservative* - AI buys on 10% dips (30% of fees)

*Service Fee:*
5% of all buybacks go to \\$claudeburn token

*Support:*
DM @ClaudeBurnSupport for help`;

        try {
            await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
            logger.success(`Help message sent to chat ${chatId}`);
        } catch (error: any) {
            logger.error(`Failed to send help message`, { error: error.message });
        }
    });

    // /pauseall command (admin only - pause entire system)
    bot.onText(/\/pauseall/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id?.toString();

        // Simple admin check - you should add your Telegram ID to config
        const adminIds = (process.env.ADMIN_TELEGRAM_IDS || '').split(',');

        if (!userId || !adminIds.includes(userId)) {
            bot.sendMessage(chatId, '❌ Admin only command');
            return;
        }

        const { pauseSystem } = await import('./admin-controls');
        pauseSystem();

        bot.sendMessage(chatId, '⏸️ *System Paused*\n\nAll fee claiming and buybacks have been paused.', {
            parse_mode: 'Markdown',
        });
        logger.warn('System paused by admin');
    });

    // /resumeall command (admin only - resume system)
    bot.onText(/\/resumeall/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id?.toString();

        const adminIds = (process.env.ADMIN_TELEGRAM_IDS || '').split(',');

        if (!userId || !adminIds.includes(userId)) {
            bot.sendMessage(chatId, '❌ Admin only command');
            return;
        }

        const { resumeSystem } = await import('./admin-controls');
        resumeSystem();

        bot.sendMessage(chatId, '▶️ *System Resumed*\n\nAll operations have been resumed.', {
            parse_mode: 'Markdown',
        });
        logger.success('System resumed by admin');
    });

    // /pause command (developers can pause their own token)
    bot.onText(/\/pause (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id?.toString();
        const tokenAddress = match?.[1];

        if (!userId || !tokenAddress) {
            bot.sendMessage(chatId, 'Usage: /pause <token_address>');
            return;
        }

        const token = tokenDb.getToken(tokenAddress);

        if (!token || token.ownerTelegramId !== userId) {
            bot.sendMessage(chatId, '❌ Token not found or you are not the owner.');
            return;
        }

        tokenDb.setTokenActive(tokenAddress, false);

        bot.sendMessage(
            chatId,
            `⏸️ *Token Paused*\n\nBuybacks and burns have been paused for:\n\`${tokenAddress}\`\n\nUse /resume to restart.`,
            { parse_mode: 'Markdown' }
        );

        logger.info(`Token paused by owner: ${tokenAddress}`);
    });

    // /resume command (developers can resume their own token)
    bot.onText(/\/resume (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id?.toString();
        const tokenAddress = match?.[1];

        if (!userId || !tokenAddress) {
            bot.sendMessage(chatId, 'Usage: /resume <token_address>');
            return;
        }

        const token = tokenDb.getToken(tokenAddress);

        if (!token || token.ownerTelegramId !== userId) {
            bot.sendMessage(chatId, '❌ Token not found or you are not the owner.');
            return;
        }

        tokenDb.setTokenActive(tokenAddress, true);

        bot.sendMessage(
            chatId,
            `▶️ *Token Resumed*\n\nBuybacks and burns have been resumed for:\n\`${tokenAddress}\``,
            { parse_mode: 'Markdown' }
        );

        logger.success(`Token resumed by owner: ${tokenAddress}`);
    });

    // /testbuyback command (admin only - manually trigger a buyback cycle for testing)
    bot.onText(/\/testbuyback (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id?.toString();
        const tokenAddress = match?.[1];

        const adminIds = (process.env.ADMIN_TELEGRAM_IDS || '').split(',');
        if (!userId || !adminIds.includes(userId)) {
            bot.sendMessage(chatId, '❌ Admin only command');
            return;
        }

        if (!tokenAddress) {
            bot.sendMessage(chatId, 'Usage: /testbuyback <token_address>');
            return;
        }

        const token = tokenDb.getToken(tokenAddress);
        if (!token) {
            bot.sendMessage(chatId, '❌ Token not found in database.');
            return;
        }

        bot.sendMessage(chatId, `🧪 *Executing Test Buyback for:* \`${tokenAddress}\`...\n\nChecking AI and wallet balance...`, { parse_mode: 'Markdown' });

        try {
            const { buybackEngine } = await import('./buyback');
            const result = await buybackEngine.executeBuybackAndBurn(token.address, token.privateKey, token.burnPercentage);

            if (result.success) {
                bot.sendMessage(
                    chatId,
                    `✅ *Test Buyback Successful!*\n\n🔹 *Buy:* [Solscan](https://solscan.io/tx/${result.buybackSignature}?cluster=${config.solanaNetwork})\n🔥 *Burn:* [Solscan](https://solscan.io/tx/${result.burnSignature}?cluster=${config.solanaNetwork})`,
                    { parse_mode: 'Markdown', disable_web_page_preview: true }
                );
            } else {
                bot.sendMessage(chatId, '❌ *Test Buyback Failed.*\n\nCheck bot logs for details (insufficient balance or swap failure).', { parse_mode: 'Markdown' });
            }
        } catch (error: any) {
            bot.sendMessage(chatId, `❌ *Error:* ${error.message}`);
        }
    });

    // Handle text messages (for registration flow)
    bot.on('message', async (msg) => {
        if (msg.text?.startsWith('/')) return; // Ignore commands

        const userId = msg.from?.id;
        const chatId = msg.chat.id;

        if (!userId) return;

        const state = userStates.get(userId);
        if (!state || state.step === 'idle') return;

        const text = msg.text || '';

        switch (state.step) {
            case 'awaiting_address':
                state.tokenAddress = text.trim();
                state.step = 'awaiting_key';
                bot.sendMessage(
                    chatId,
                    '🔐 Step 2/4: Send me your wallet private key (Base58)\n\n⚠️ This will be encrypted and stored securely.',
                    { parse_mode: 'Markdown' }
                );
                break;

            case 'awaiting_key':
                const providedKey = text.trim();

                bot.sendMessage(chatId, '🔍 Verifying creator ownership...', { parse_mode: 'Markdown' });

                const verification = await verifyTokenCreator(state.tokenAddress!, providedKey);

                if (!verification.verified) {
                    bot.sendMessage(
                        chatId,
                        `❌ *Verification Failed*\n\n${verification.error || 'Not the token creator'}\n\nOnly the actual pumpfun creator can register.\n\nUse /register to try again.`,
                        { parse_mode: 'Markdown' }
                    );
                    userStates.set(userId, { step: 'idle' });
                    return;
                }

                bot.sendMessage(chatId, '✅ *Creator Verified!*', { parse_mode: 'Markdown' });

                state.privateKey = providedKey;
                state.step = 'awaiting_percentage';
                bot.sendMessage(
                    chatId,
                    '📊 Step 3/4: What % of claimed fees should be used for buyback?\n\nRecommended: 50-70%\nEnter a number between 10-100:',
                    { parse_mode: 'Markdown' }
                );
                break;

            case 'awaiting_percentage':
                const percentage = parseInt(text);
                if (isNaN(percentage) || percentage < 10 || percentage > 100) {
                    bot.sendMessage(chatId, '❌ Please enter a number between 10 and 100');
                    return;
                }
                state.burnPercentage = percentage;
                state.step = 'awaiting_mode';

                const modeMessage = `🎯 Step 4/4: Choose your buyback mode:

1️⃣ *Standard* - AI buys on 5% dips (50% of fees)
2️⃣ *Aggressive* - AI buys on 3% dips (75% of fees)
3️⃣ *Conservative* - AI buys on 10% dips (30% of fees)

Reply with: standard, aggressive, or conservative`;

                bot.sendMessage(chatId, modeMessage, { parse_mode: 'Markdown' });
                break;

            case 'awaiting_mode':
                const mode = text.toLowerCase();
                if (!['standard', 'aggressive', 'conservative'].includes(mode)) {
                    bot.sendMessage(chatId, '❌ Please choose: standard, aggressive, or conservative');
                    return;
                }

                // Save token to database
                try {
                    tokenDb.addToken({
                        address: state.tokenAddress!,
                        ownerTelegramId: userId.toString(),
                        ownerUsername: msg.from?.username || 'Unknown',
                        privateKey: state.privateKey!,
                        burnPercentage: state.burnPercentage!,
                        mode: mode as any,
                        createdAt: Date.now(),
                        lastBurn: 0,
                        totalBurned: 0,
                        isActive: true,
                    });

                    const successMessage = `✅ *Token Registered Successfully!*

*Address:* \`${state.tokenAddress}\`
*Burn %:* ${state.burnPercentage}%
*Mode:* ${mode.toUpperCase()}

Your token is now active! Claude AI will start analyzing the chart and executing buybacks on dips.

Use /status to check progress.`;

                    bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });

                    logger.success(`Token registered: ${state.tokenAddress} by @${msg.from?.username}`);

                    // Reset state
                    userStates.set(userId, { step: 'idle' });
                } catch (error: any) {
                    bot.sendMessage(chatId, `❌ Error: ${error.message}`);
                    userStates.set(userId, { step: 'idle' });
                }
                break;
        }
    });

    logger.info('Telegram bot handlers initialized');
}

export async function sendTelegramNotification(bot: TelegramBot, message: string) {
    if (!config.telegramGroupChatId) return;

    try {
        await bot.sendMessage(config.telegramGroupChatId, message, {
            parse_mode: 'Markdown',
        });
    } catch (error: any) {
        logger.error('Failed to send Telegram notification', { error: error.message });
    }
}
