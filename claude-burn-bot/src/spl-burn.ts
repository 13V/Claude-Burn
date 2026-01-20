import {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
    getOrCreateAssociatedTokenAccount,
    transfer,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { config } from './config';
import { logger } from './logger';
import bs58 from 'bs58';

/**
 * Real SPL Token burning functionality
 * Uses @solana/spl-token to transfer tokens to burn address
 */

export async function burnSPLTokens(
    tokenAddress: string,
    amount: number,
    privateKey: string
): Promise<string> {
    const connection = new Connection(config.solanaRpcUrl, 'confirmed');
    const wallet = Keypair.fromSecretKey(bs58.decode(privateKey));
    const tokenMint = new PublicKey(tokenAddress);
    const burnWallet = new PublicKey(config.burnAddress);

    try {
        // Get or create token account for the wallet
        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            wallet,
            tokenMint,
            wallet.publicKey
        );

        // Get or create token account for burn address
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            wallet, // Payer
            tokenMint,
            burnWallet,
            true // Allow owner off curve (for burn address)
        );

        // Calculate amount (adjust for token decimals)
        const tokenDecimals = fromTokenAccount.mint ? 9 : 9; // Default to 9, should fetch from mint
        const transferAmount = BigInt(Math.floor(amount * Math.pow(10, tokenDecimals)));

        logger.info(`Burning ${amount} tokens (${transferAmount.toString()} raw amount)`);

        // Transfer tokens to burn address
        const signature = await transfer(
            connection,
            wallet,
            fromTokenAccount.address,
            toTokenAccount.address,
            wallet.publicKey,
            transferAmount
        );

        logger.success(`Tokens burned successfully`, { signature, amount });
        return signature;
    } catch (error: any) {
        logger.error('SPL token burn failed', { error: error.message, tokenAddress });
        throw error;
    }
}

/**
 * Get SPL token balance
 */
export async function getSPLTokenBalance(
    tokenAddress: string,
    walletPublicKey: PublicKey
): Promise<number> {
    const connection = new Connection(config.solanaRpcUrl, 'confirmed');
    const tokenMint = new PublicKey(tokenAddress);

    try {
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            Keypair.generate(), // Dummy keypair (won't sign)
            tokenMint,
            walletPublicKey
        );

        return Number(tokenAccount.amount) / 1e9; // Adjust for decimals
    } catch (error: any) {
        logger.warn(`Failed to get token balance for ${tokenAddress}`, {
            error: error.message,
        });
        return 0;
    }
}
