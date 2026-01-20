import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { config } from './config';
import { logger } from './logger';
import bs58 from 'bs58';
import axios from 'axios';

/**
 * Pump Portal Integration for claiming creator fees
 * Docs: https://pumpportal.fun/docs
 */

class PumpPortal {
    private connection: Connection;

    constructor() {
        this.connection = new Connection(config.solanaRpcUrl, 'confirmed');
    }

    /**
     * Check available creator fees for a token
     */
    async getAvailableFees(tokenAddress: string, walletPublicKey: PublicKey): Promise<number> {
        try {
            // Pump Portal API endpoint to check fees
            const response = await axios.get(
                `https://pumpportal.fun/api/fees?token=${tokenAddress}&wallet=${walletPublicKey.toString()}`
            );

            if (response.data && response.data.availableFees) {
                return response.data.availableFees / 1e9; // Convert lamports to SOL
            }

            return 0;
        } catch (error: any) {
            logger.warn(`Failed to check fees for ${tokenAddress}`, {
                error: error.message,
            });
            return 0;
        }
    }

    /**
     * Claim creator fees from Pump Portal
     */
    async claimFees(
        tokenAddress: string,
        privateKey: string
    ): Promise<{ success: boolean; signature?: string; amountClaimed?: number }> {
        try {
            const wallet = Keypair.fromSecretKey(bs58.decode(privateKey));
            const availableFees = await this.getAvailableFees(tokenAddress, wallet.publicKey);

            if (availableFees === 0) {
                logger.info(`No fees available for ${tokenAddress}`);
                return { success: false };
            }

            logger.info(`Claiming ${availableFees} SOL in fees for ${tokenAddress}`);

            // Build claim transaction via Pump Portal API
            const response = await axios.post('https://pumpportal.fun/api/claim', {
                token: tokenAddress,
                wallet: wallet.publicKey.toString(),
            });

            if (!response.data || !response.data.transaction) {
                throw new Error('Failed to get claim transaction from Pump Portal');
            }

            // Deserialize and sign transaction
            const transaction = Transaction.from(Buffer.from(response.data.transaction, 'base64'));
            transaction.sign(wallet);

            // Send transaction
            const signature = await this.connection.sendRawTransaction(transaction.serialize());
            await this.connection.confirmTransaction(signature, 'confirmed');

            logger.success(`Claimed ${availableFees} SOL for ${tokenAddress}`, { signature });

            return {
                success: true,
                signature,
                amountClaimed: availableFees,
            };
        } catch (error: any) {
            logger.error(`Failed to claim fees for ${tokenAddress}`, {
                error: error.message,
            });
            return { success: false };
        }
    }

    /**
     * Get SOL balance for a wallet
     */
    async getSOLBalance(publicKey: PublicKey): Promise<number> {
        try {
            const balance = await this.connection.getBalance(publicKey);
            return balance / 1e9; // Convert lamports to SOL
        } catch (error: any) {
            logger.error('Failed to get SOL balance', { error: error.message });
            return 0;
        }
    }
}

export const pumpPortal = new PumpPortal();
