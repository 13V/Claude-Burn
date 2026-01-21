import TelegramBot from 'node-telegram-bot-api';
import { config, validateConfig } from './config';
import { setupTelegramHandlers } from './telegram-handlers';
import { Scheduler } from './scheduler';
import { logger } from './logger';
import { tokenDb } from './database';
import { pumpPortal } from './pump-portal';
import { dexScreener } from './dexscreener';
import http from 'http';
import fs from 'fs';
import path from 'path';

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

        // Start API server and dashboard
        const PORT = process.env.PORT || 3001;
        const dashboardPath = path.join(__dirname, '..', 'public', 'index.html');

        http.createServer(async (req, res) => {
            // CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            // API endpoint
            if (req.url === '/api/tokens' && req.method === 'GET') {
                res.setHeader('Content-Type', 'application/json');
                try {
                    const tokens = tokenDb.getAllActiveTokens();
                    const sanitized = tokens.map(t => ({ ...t, privateKey: undefined }));

                    // Fetch metadata from DexScreener for each token
                    const enriched = await Promise.all(sanitized.map(async (token) => {
                        try {
                            const axios = require('axios');
                            // Try DexScreener first
                            const dexRes = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${token.address}`);
                            const pair = dexRes.data.pairs?.[0];

                            if (pair) {
                                return {
                                    ...token,
                                    metadata: {
                                        image: pair.info?.imageUrl || '',
                                        name: pair.baseToken?.name || 'Unknown',
                                        marketCap: pair.fdv || pair.marketCap || 0
                                    }
                                };
                            }

                            // Fallback to Pump Portal if DexScreener doesn't have data
                            const pumpData = await pumpPortal.getTokenData(token.address);
                            if (pumpData && pumpData.marketCap > 0) {
                                return {
                                    ...token,
                                    metadata: {
                                        image: pumpData.image,
                                        name: pumpData.name,
                                        marketCap: pumpData.marketCap
                                    }
                                };
                            }

                            return {
                                ...token,
                                metadata: {
                                    image: '',
                                    name: 'Unknown',
                                    marketCap: 0
                                }
                            };
                        } catch (error) {
                            return {
                                ...token,
                                metadata: {
                                    image: '',
                                    name: 'Unknown',
                                    marketCap: 0
                                }
                            };
                        }
                    }));

                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, tokens: enriched }));
                } catch (e: any) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ success: false, error: e.message }));
                }
            }
            // Activity logs endpoint
            else if (req.url === '/api/activity' && req.method === 'GET') {
                res.setHeader('Content-Type', 'application/json');
                try {
                    const { activityLogger } = require('./activity-logger');
                    const logs = activityLogger.getLogs(50);
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, logs }));
                } catch (e: any) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ success: false, error: e.message }));
                }
            }
            // Serve dashboard HTML
            else if (req.url === '/' || req.url === '/index.html' || req.url === '/dashboard') {
                res.setHeader('Content-Type', 'text/html');
                fs.readFile(dashboardPath, (err, data) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error loading dashboard');
                        logger.error('Failed to load dashboard', { error: err.message });
                    } else {
                        res.writeHead(200);
                        res.end(data);
                    }
                });
            }
            // Serve static files (PNG images)
            else if (req.url?.endsWith('.png')) {
                const filePath = path.join(__dirname, '..', 'public', req.url);
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'File Not Found' }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'image/png' });
                        res.end(data);
                    }
                });
            }
            else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Not Found' }));
            }
        }).listen(PORT, () => {
            logger.info(`🌐 Dashboard and API running on http://localhost:${PORT}`);
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
