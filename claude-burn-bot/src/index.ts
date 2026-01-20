import TelegramBot from 'node-telegram-bot-api';
import { config, validateConfig } from './config';
import { setupTelegramHandlers } from './telegram-handlers';
import { Scheduler } from './scheduler';
import { logger } from './logger';
import { tokenDb } from './database';
import http from 'http';

async function main() {
    try {
        logger.info('🔥 Starting Claude Burn Bot...');

        // Validate configuration
        validateConfig();
        logger.success('Configuration validated');

        // Initialize Telegram bot
        const bot = new TelegramBot(config.telegramBotToken, { polling: true });
        logger.success('Telegram bot connected');

        // Setup command handlers
        setupTelegramHandlers(bot);

        // Start scheduler
        const scheduler = new Scheduler(bot);
        scheduler.start();
        logger.success('Scheduler started');

        // Start API server for the website
        const PORT = process.env.PORT || 3001;
        http.createServer((req, res) => {
            // CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Content-Type', 'application/json');

            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            if (req.url === '/api/tokens' && req.method === 'GET') {
                try {
                    const tokens = tokenDb.getAllActiveTokens();
                    const sanitized = tokens.map(t => ({ ...t, privateKey: undefined }));
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, tokens: sanitized }));
                } catch (e: any) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ success: false, error: e.message }));
                }
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ success: false, error: 'Not Found' }));
            }
        }).listen(PORT, () => {
            logger.info(`🌐 API Server listening on port ${PORT}`);
        });

        logger.success('🚀 Claude Burn Bot is LIVE!');
        logger.info(`Network: ${config.solanaNetwork}`);

        // Handle graceful shutdown
        const shutdown = () => {
            logger.info('Shutting down bot...');
            scheduler.stop();
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error: any) {
        logger.error('Fatal error starting bot', { error: error.message });
        process.exit(1);
    }
}

main();
