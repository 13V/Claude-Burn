import { bot, notifyBuyback } from './bot.js';
import { getAccruedFees, claimFees } from './pump.js';
import { swapSolToToken } from './swap.js';
import { burnTokens } from './burn.js';
import { FEE_THRESHOLD } from './config.js';
import { saveStats, getStats } from './stats.js';
import { logActivity } from './logger.js';
import express from 'express';
import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/api/stats', (req, res) => {
    res.json(getStats());
});

app.listen(port, () => {
    logActivity(`🌐 Web API listening on port ${port}`);
});

async function main() {
    logActivity('💎 Starting The Vault Flywheel Bot...');

    bot.launch(() => {
        logActivity("🤖 Telegram bot launched!");
    });

    const LOOP_INTERVAL = 60000;
    logActivity(`🔄 Starting flywheel loop (Interval: ${LOOP_INTERVAL}ms)...`);

    setInterval(async () => {
        try {
            logActivity('\n--- ⚙️ Flywheel Cycle Start ---');

            try {
                const accruedFees = await getAccruedFees();
                if (accruedFees > 0.001) {
                    await claimFees();
                    await new Promise(r => setTimeout(r, 5000));
                }
            } catch (e: any) {
                logActivity(`⚠️ Fee check/claim skipped: ${e.message}`);
            }

            const connection = new Connection(process.env.RPC_URL || '');
            const secret = bs58.decode(process.env.PRIVATE_KEY || '');
            const wallet = Keypair.fromSecretKey(secret);
            const balance = await connection.getBalance(wallet.publicKey);
            const balanceSol = balance / 1e9;

            logActivity(`💰 Current Sol Balance: ${balanceSol.toFixed(4)} SOL`);

            const TARGET_THRESHOLD = FEE_THRESHOLD;

            if (balanceSol > TARGET_THRESHOLD) {
                logActivity(`🚀 Threshold met (${TARGET_THRESHOLD} SOL). Executing Flywheel...`);

                const BUFFER = 0.01;
                const buyAmount = balanceSol - BUFFER;

                if (buyAmount > 0) {
                    const { signature, tokensBought } = await swapSolToToken(buyAmount);
                    await new Promise(r => setTimeout(r, 10000));
                    const burnSignature = await burnTokens(tokensBought);

                    saveStats(buyAmount, tokensBought);
                    await notifyBuyback(buyAmount, tokensBought.toLocaleString(), signature, burnSignature);
                    logActivity(`🎉 Flywheel Success: ${buyAmount.toFixed(4)} SOL converted & burned!`);
                }
            } else {
                logActivity(`😴 Balance below threshold. Idling...`);
            }
        } catch (error: any) {
            logActivity(`❌ Loop Error: ${error.message}`);
        }
    }, LOOP_INTERVAL);
}

main().catch(e => logActivity(`🛑 CRITICAL FATAL: ${e.message}`));
