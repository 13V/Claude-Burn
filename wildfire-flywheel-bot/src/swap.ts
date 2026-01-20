import axios from 'axios';
import {
    VersionedTransaction,
    PublicKey
} from '@solana/web3.js';
import { connection, wallet } from './solana.js';
import { TOKEN_MINT, PRIORITY_FEE, SLIPPAGE_PCT } from './config.js';
import { logActivity, logError } from './logger.js';

import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

export async function swapSolToToken(solAmountIn: number): Promise<{ signature: string, tokensBought: number }> {
    if (!TOKEN_MINT) {
        throw new Error('TOKEN_MINT is not set');
    }

    logActivity(`🔄 Initiating Swap: ${solAmountIn.toFixed(4)} SOL for $VAULT...`);

    // Get token balance before
    let balanceBefore = 0;
    const ata = await getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
    try {
        const account = await getAccount(connection, ata);
        balanceBefore = Number(account.amount);
    } catch (e: any) {
        // Only ignore if account truly doesn't exist
        if (e.message.includes("TokenAccountNotFoundError") || e.name === "TokenAccountNotFoundError") {
            balanceBefore = 0;
        } else {
            logError("Fetch Initial Balance", e);
            throw new Error("Failed to fetch initial token balance.");
        }
    }

    try {
        const response = await axios.post('https://pumpportal.fun/api/trade-local', {
            "publicKey": wallet.publicKey.toBase58(),
            "action": "buy",
            "mint": TOKEN_MINT.toBase58(),
            "amount": solAmountIn,
            "denominatedInSol": true,
            "slippage": SLIPPAGE_PCT,
            "priorityFee": PRIORITY_FEE,
            "pool": "pump"
        }, {
            headers: {
                "Content-Type": "application/json"
            },
            responseType: 'arraybuffer'
        });

        if (response.status !== 200) {
            throw new Error(`PumpPortal returned ${response.status}`);
        }

        const txBuffer = Buffer.from(Uint8Array.from(response.data));

        const tx = VersionedTransaction.deserialize(txBuffer);
        tx.sign([wallet]);
        const signature = await connection.sendRawTransaction(tx.serialize());
        logActivity(`🚀 Swap TX Sent: ${signature}`);
        await connection.confirmTransaction(signature);
        logActivity(`✅ Swap Confirmed!`);

        // Get token balance after with a small delay for consistency
        let balanceAfter = 0;
        for (let i = 0; i < 5; i++) {
            await new Promise(r => setTimeout(r, 2000));
            try {
                const accounts = await connection.getTokenAccountsByOwner(wallet.publicKey, { mint: TOKEN_MINT });
                if (accounts.value.length > 0) {
                    const balanceObj = await connection.getTokenAccountBalance(accounts.value[0].pubkey);
                    balanceAfter = Number(balanceObj.value.amount);
                    if (balanceAfter > balanceBefore) break;
                }
            } catch (e: any) {
                console.log(`Balance Check Retry ${i + 1} failed: ${e.message}`);
            }
        }

        const tokensBought = (balanceAfter - balanceBefore) / 1e6;
        logActivity(`💎 Tokens Secured: ${tokensBought.toLocaleString()}`);
        return { signature, tokensBought };

    } catch (error: any) {
        logError("Swap Execution", error);
        throw error;
    }
}
