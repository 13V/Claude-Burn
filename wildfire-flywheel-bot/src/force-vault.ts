import { notifyBuyback } from './bot.js';
import { getAccruedFees, claimFees } from './pump.js';
import { swapSolToToken } from './swap.js';
import { burnTokens } from './burn.js';
import { saveStats } from './stats.js';
import { logActivity, logError } from './logger.js';
import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import * as dotenv from 'dotenv';

dotenv.config();

async function forceVault() {
    logActivity('🚨 FORCE BUYBACK INITIATED 🚨');

    try {
        // 1. Claim Fees
        try {
            const fees = await getAccruedFees();
            if (fees > 0.001) {
                await claimFees();
                logActivity('⏳ Waiting for fee claim propagation...');
                await new Promise(r => setTimeout(r, 5000));
            } else {
                logActivity('No significant fees to claim.');
            }
        } catch (e) {
            logError('Force Claim', e);
        }

        // 2. Check Balance
        const connection = new Connection(process.env.RPC_URL || '');
        const secret = bs58.decode(process.env.PRIVATE_KEY || '');
        const wallet = Keypair.fromSecretKey(secret);
        const balance = await connection.getBalance(wallet.publicKey);
        const balanceSol = balance / 1e9;

        logActivity(`💰 Current Balance: ${balanceSol.toFixed(4)} SOL`);

        // Use everything minus a small gas buffer
        const BUFFER = 0.01;
        const buyAmount = balanceSol - BUFFER;

        if (buyAmount > 0.001) {
            logActivity(`🚀 Forcing sweep of ${buyAmount.toFixed(4)} SOL...`);

            // 3. Swap
            const { signature, tokensBought } = await swapSolToToken(buyAmount);
            logActivity(`✅ Buyback Success: ${signature}`);

            logActivity('⏳ Waiting for token balance propagation (10s)...');
            await new Promise(r => setTimeout(r, 10000));

            // 4. Burn
            const burnSignature = await burnTokens(tokensBought);
            logActivity(`🔥 Burn Success: ${burnSignature}`);

            // 5. Log & Notify
            saveStats(buyAmount, tokensBought);
            await notifyBuyback(buyAmount, tokensBought.toLocaleString(), signature, burnSignature);

            logActivity('🏁 FORCE BUYBACK COMPLETED SUCCESSFULLY');
        } else {
            logActivity('❌ Balance too low to force buyback (Need > 0.01 SOL).');
        }
    } catch (error: any) {
        logError('Force Vault', error);
        process.exit(1);
    }
}

forceVault().then(() => process.exit(0));
