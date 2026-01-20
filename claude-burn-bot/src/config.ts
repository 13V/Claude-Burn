import dotenv from 'dotenv';
dotenv.config();

export const config = {
    // Telegram
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    telegramGroupChatId: process.env.TELEGRAM_GROUP_CHAT_ID || '',

    // Claude AI
    claudeApiKey: process.env.CLAUDE_API_KEY || '',

    // Solana
    solanaNetwork: process.env.SOLANA_NETWORK || 'mainnet-beta',
    solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',

    // Main Token
    mainTokenAddress: process.env.MAIN_TOKEN_ADDRESS || '',
    mainWalletPrivateKey: process.env.MAIN_WALLET_PRIVATE_KEY || '',

    // Database
    databasePath: process.env.DATABASE_PATH || './data/tokens.db',

    // Burn Configuration
    burnAddress: '1nc1nerator11111111111111111111111111111111', // Solana incinerator
    serviceFeePercent: 5, // 5% fee for main token

    // AI Analysis Settings
    aiAnalysisInterval: 2 * 60 * 1000, // 2 minutes (fast for memecoin volatility)
    feeCheckInterval: 5 * 60 * 1000, // 5 minutes

    // Buyback Modes
    modes: {
        standard: {
            name: 'Standard',
            description: 'AI analyzes chart and buys on significant dips',
            dipThreshold: 5, // 5% dip
            buyPercentage: 50, // Use 50% of available fees
        },
        aggressive: {
            name: 'Aggressive',
            description: 'Extra buy pressure on dips (lower threshold, larger buys)',
            dipThreshold: 3, // 3% dip
            buyPercentage: 75, // Use 75% of available fees
        },
        conservative: {
            name: 'Conservative',
            description: 'Only buys on major dips',
            dipThreshold: 10, // 10% dip
            buyPercentage: 30, // Use 30% of available fees
        },
    },
};

export function validateConfig() {
    const required = [
        'telegramBotToken',
        'claudeApiKey',
    ];

    const missing = required.filter((key) => !config[key as keyof typeof config]);

    if (missing.length > 0) {
        throw new Error(`Missing required config: ${missing.join(', ')}`);
    }
}
