import { Keypair, PublicKey } from '@solana/web3.js';
import { pumpPortal } from './pump-portal';
import bs58 from 'bs58';
import { logger } from './logger';
import { config } from './config';

/**
 * Verify that a private key belongs to the creator of a token
 * by checking if it can claim fees from pumpfun
 */
export async function verifyTokenCreator(
    tokenAddress: string,
    privateKeyBase58: string
): Promise<{ verified: boolean; wallet?: Keypair; error?: string }> {
    try {
        // Decode the private key
        const wallet = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));

        // Check if this wallet is eligible to claim creator fees
        // Only the creator can claim fees from pumpfun
        const availableFees = await pumpPortal.getAvailableFees(tokenAddress, wallet.publicKey);

        // DEVNET BYPASS: If we're on devnet and fee check fails or is 0, allow it for testing
        // This is necessary because newly created devnet tokens won't have fees/indexing
        if (config.solanaNetwork === 'devnet') {
            logger.info(`Devnet mode: Bypassing strict fee check for verification`);
            return { verified: true, wallet };
        }

        // If getAvailableFees returns a number (even 0), they're the creator
        // If it throws or returns null/undefined, they're not
        if (typeof availableFees === 'number') {
            logger.success(`Creator verified for ${tokenAddress}`, {
                creator: wallet.publicKey.toString(),
                availableFees,
            });
            return { verified: true, wallet };
        }

        return {
            verified: false,
            error: 'Wallet is not the creator of this token on pumpfun',
        };
    } catch (error: any) {
        logger.warn(`Creator verification failed for ${tokenAddress}`, {
            error: error.message,
        });
        return {
            verified: false,
            error: error.message || 'Invalid private key or verification failed',
        };
    }
}
