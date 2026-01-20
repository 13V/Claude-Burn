import { createBurnInstruction, getAssociatedTokenAddress, } from '@solana/spl-token';
import { Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { connection, wallet } from './solana.js';
import { TOKEN_MINT } from './config.js';
import { logActivity, logError } from './logger.js';
export async function burnTokens(amount) {
    if (!TOKEN_MINT) {
        throw new Error("TOKEN_MINT is not set");
    }
    logActivity(`🔥 Initiating Burn: ${amount.toLocaleString()} tokens...`);
    try {
        const mintInfo = await connection.getAccountInfo(TOKEN_MINT);
        if (!mintInfo)
            throw new Error("Mint account not found");
        const accounts = await connection.getTokenAccountsByOwner(wallet.publicKey, { mint: TOKEN_MINT });
        let tokenAccount = null;
        if (accounts.value.length > 0) {
            for (const acc of accounts.value) {
                const balanceEncoded = await connection.getTokenAccountBalance(acc.pubkey);
                if (balanceEncoded.value.uiAmount && balanceEncoded.value.uiAmount > 0) {
                    tokenAccount = acc.pubkey;
                    break;
                }
            }
        }
        if (!tokenAccount) {
            const ata = await getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
            tokenAccount = ata;
        }
        const burnAmount = Math.floor(amount * 1000000);
        const transaction = new Transaction().add(createBurnInstruction(tokenAccount, TOKEN_MINT, wallet.publicKey, burnAmount, [], mintInfo.owner));
        const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
        logActivity(`🔒 Burn Confirmed! Signature: ${signature}`);
        return signature;
    }
    catch (error) {
        logError("Burn Execution", error);
        throw error;
    }
}
