import { tokenDb } from './database';
import { pumpPortal } from './pump-portal';
import { aiAnalyzer } from './ai-analyzer';
import { buybackEngine } from './buyback';
import { logger } from './logger';
import { config } from './config';
import TelegramBot from 'node-telegram-bot-api';
import { sendTelegramNotification } from './telegram-handlers';
import { isSystemPaused, rateLimiter, retryWithBackoff } from './admin-controls';

export class Scheduler {
    private bot: TelegramBot | null = null;
    private feeCheckInterval: NodeJS.Timeout | null = null;
    private aiAnalysisInterval: NodeJS.Timeout | null = null;
    private mainTokenInterval: NodeJS.Timeout | null = null;

    constructor(bot: TelegramBot) {
        this.bot = bot;
    }

    start() {
        logger.info('Starting scheduler...');

        // Check fees every 5 minutes
        this.feeCheckInterval = setInterval(() => {
            this.checkAndClaimFees();
        }, config.feeCheckInterval);

        // Run AI analysis every 2 minutes (fast for memecoin volatility)
        this.aiAnalysisInterval = setInterval(() => {
            this.runAIAnalysis();
        }, config.aiAnalysisInterval);

        // Buyback main token every hour
        this.mainTokenInterval = setInterval(() => {
            this.buybackMainToken();
        }, 60 * 60 * 1000);

        // Run immediately on start
        setTimeout(() => this.checkAndClaimFees(), 5000);
        setTimeout(() => this.runAIAnalysis(), 10000);

        logger.success('Scheduler started successfully');
    }

    stop() {
        if (this.feeCheckInterval) clearInterval(this.feeCheckInterval);
        if (this.aiAnalysisInterval) clearInterval(this.aiAnalysisInterval);
        if (this.mainTokenInterval) clearInterval(this.mainTokenInterval);
        logger.info('Scheduler stopped');
    }

    /**
     * Check and claim fees for all active tokens
     */
    private async checkAndClaimFees() {
        if (isSystemPaused()) {
            logger.warn('System paused, skipping fee check');
            return;
        }

        logger.info('Checking fees for all tokens...');

        const tokens = tokenDb.getAllActiveTokens();

        for (const token of tokens) {
            try {
                const result = await retryWithBackoff(() =>
                    pumpPortal.claimFees(token.address, token.privateKey)
                );

                if (result.success && result.signature) {
                    logger.success(`Claimed fees for ${token.address}`, {
                        amount: result.amountClaimed,
                        signature: result.signature,
                    });

                    // Notify via Telegram
                    if (this.bot) {
                        const message = `💰 *Fees Claimed*

Token: \`${token.address}\`
Amount: ${result.amountClaimed?.toFixed(4)} SOL
Tx: [View](https://solscan.io/tx/${result.signature})`;

                        sendTelegramNotification(this.bot, message);
                    }
                }
            } catch (error: any) {
                logger.error(`Failed to check fees for ${token.address}`, {
                    error: error.message,
                });
            }
        }
    }

    /**
     * Run AI analysis for all active tokens
     */
    private async runAIAnalysis() {
        if (isSystemPaused()) {
            logger.warn('System paused, skipping AI analysis');
            return;
        }
        logger.info('Running AI analysis for all tokens...');

        const tokens = tokenDb.getAllActiveTokens();

        for (const token of tokens) {
            try {
                // Run AI analysis
                const analysis = await aiAnalyzer.analyzeChart(token.address, token.mode);

                logger.aiDecision(token.address, analysis.shouldBuy ? 'BUY' : 'WAIT', {
                    confidence: analysis.confidence,
                    reasoning: analysis.reasoning,
                    mode: token.mode,
                });

                // If AI says buy, execute buyback
                if (analysis.shouldBuy && analysis.recommendedAmount > 0) {
                    logger.info(`AI recommends buyback for ${token.address}`, {
                        amount: analysis.recommendedAmount,
                        confidence: analysis.confidence,
                    });

                    const result = await buybackEngine.executeBuybackAndBurn(
                        token.address,
                        token.privateKey,
                        analysis.recommendedAmount
                    );

                    if (result.success && this.bot) {
                        const message = `🔥 *AI-Powered Buyback & Burn*

Token: \`${token.address}\`
Mode: ${token.mode.toUpperCase()}
Confidence: ${analysis.confidence}%

Reasoning: ${analysis.reasoning}

Buyback: [View](https://solscan.io/tx/${result.buybackSignature})
Burn: [View](https://solscan.io/tx/${result.burnSignature})`;

                        sendTelegramNotification(this.bot, message);
                    }
                }
            } catch (error: any) {
                logger.error(`Failed AI analysis for ${token.address}`, {
                    error: error.message,
                });
            }

            // Wait a bit between tokens to avoid rate limits
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }

    /**
     * Execute buyback for main $claudeburn token
     */
    private async buybackMainToken() {
        logger.info('Checking main token buyback...');

        try {
            await buybackEngine.buybackMainToken();

            if (this.bot) {
                const message = `🔥 *$CLAUDEBURN Buyback Complete*

Service fees from all registered tokens have been used to buyback and burn $CLAUDEBURN!

The flywheel is spinning! 🚀`;

                sendTelegramNotification(this.bot, message);
            }
        } catch (error: any) {
            logger.error('Main token buyback failed', { error: error.message });
        }
    }
}
