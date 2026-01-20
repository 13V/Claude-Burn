import {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    SystemProgram,
    TransactionInstruction,
} from '@solana/web3.js';
import { config } from './config';
import { logger } from './logger';
import { tokenDb } from './database';
import bs58 from 'bs58';
import axios from 'axios';
import { getPumpfunTokenInfo, getOptimalSlippage, isAmountSafeForBondingCurve } from './pumpfun-utils';
import * as dns from 'dns';

// Fix for ENOTFOUND issues in some environments
dns.setDefaultResultOrder('ipv4first');

/**
 * Buyback and Burn Engine
 * 1. Uses claimed fees to buy tokens via Jupiter
 * 2. Takes 5% service fee for main token
 * 3. Burns remaining tokens to incinerator address
 */

class BuybackEngine {
    private connection: Connection;

    constructor() {
        this.connection = new Connection(config.solanaRpcUrl, 'confirmed');
    }

    /**
     * Execute buyback and burn for a token
     */
    async executeBuybackAndBurn(
        tokenAddress: string,
        privateKey: string,
        percentageToUse: number
    ): Promise<{ success: boolean; buybackSignature?: string; burnSignature?: string }> {
        try {
            logger.info(`Key length: ${privateKey.length}`);
            const decoded = bs58.decode(privateKey);
            logger.info(`Decoded length: ${decoded.length}`);

            const wallet = Keypair.fromSecretKey(decoded);

            // Get available SOL balance
            const balance = await this.connection.getBalance(wallet.publicKey);
            const availableSOL = balance / 1e9;

            if (availableSOL < 0.01) {
                logger.warn(`Insufficient SOL balance for ${tokenAddress}: ${availableSOL}`);
                return { success: false };
            }

            // Calculate amounts
            const amountToUse = (availableSOL * percentageToUse) / 100;
            const serviceFee = (amountToUse * config.serviceFeePercent) / 100;
            const buybackAmount = amountToUse - serviceFee;

            logger.info(`Executing buyback for ${tokenAddress}`, {
                availableSOL,
                percentageToUse,
                buybackAmount,
                serviceFee,
            });

            // Step 1: Send service fee to main wallet
            if (serviceFee > 0.001) {
                await this.sendServiceFee(wallet, serviceFee);
            }

            // Step 2: Buy tokens with remaining SOL via Jupiter
            const { signature, tokensReceived } = await this.buyTokens(
                wallet,
                tokenAddress,
                buybackAmount
            );

            if (!signature || tokensReceived === 0) {
                logger.error(`Failed to buy tokens for ${tokenAddress}`);
                return { success: false };
            }

            logger.transaction('BUYBACK', tokenAddress, signature, tokensReceived);

            // Step 3: Burn the tokens
            const burnSignature = await this.burnTokens(wallet, tokenAddress, tokensReceived);

            logger.transaction('BURN', tokenAddress, burnSignature, tokensReceived);

            // Update database
            tokenDb.updateLastBurn(tokenAddress, tokensReceived);

            return {
                success: true,
                buybackSignature: signature,
                burnSignature,
            };
        } catch (error: any) {
            logger.error(`Buyback/burn failed for ${tokenAddress}`, {
                error: error.message,
            });
            return { success: false };
        }
    }

    /**
     * Send service fee to main wallet for $claudeburn buyback
     */
    private async sendServiceFee(wallet: Keypair, amount: number): Promise<string> {
        const mainWallet = Keypair.fromSecretKey(bs58.decode(config.mainWalletPrivateKey));

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: mainWallet.publicKey,
                lamports: Math.floor(amount * 1e9),
            })
        );

        const signature = await this.connection.sendTransaction(transaction, [wallet]);
        await this.connection.confirmTransaction(signature, 'confirmed');

        logger.success(`Service fee sent: ${amount} SOL`, { signature });
        return signature;
    }

    /**
     * Buy tokens using Jupiter Swap API
     * Optimized for pumpfun bonding curve tokens
     */
    private async buyTokens(
        wallet: Keypair,
        tokenAddress: string,
        solAmount: number
    ): Promise<{ signature: string; tokensReceived: number }> {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                // Check if token is on pumpfun bonding curve
                const pumpfunInfo = await getPumpfunTokenInfo(tokenAddress);

                if (pumpfunInfo?.isOnBondingCurve) {
                    logger.info(`Token on bonding curve: ${pumpfunInfo.bondingCurveProgress.toFixed(1)}% to graduation`);

                    // Safety check for bonding curve buys
                    if (!isAmountSafeForBondingCurve(solAmount, pumpfunInfo)) {
                        solAmount = 0.5; // Cap at 0.5 SOL for bonding curve safety
                        logger.warn(`Capped buy amount to ${solAmount} SOL for bonding curve safety`);
                    }
                }

                const lamports = Math.floor(solAmount * 1e9);
                const slippage = getOptimalSlippage(pumpfunInfo);

                logger.info(`Using ${slippage / 100}% slippage for ${pumpfunInfo?.isOnBondingCurve ? 'bonding curve' : 'Raydium'} trade`);

                // Get quote from Jupiter (auto-routes through pumpfun bonding curve)
                let quote;
                let swapTransaction;

                try {
                    const quoteResponse = await axios.get('https://quote-api.jup.ag/v6/quote', {
                        params: {
                            inputMint: 'So11111111111111111111111111111111111111112', // SOL
                            outputMint: tokenAddress,
                            amount: lamports,
                            slippageBps: slippage,
                            onlyDirectRoutes: false,
                        },
                        timeout: 5000,
                    });
                    quote = quoteResponse.data;

                    const swapResponse = await axios.post('https://quote-api.jup.ag/v6/swap', {
                        quoteResponse: quote,
                        userPublicKey: wallet.publicKey.toString(),
                        wrapAndUnwrapSol: true,
                    }, {
                        timeout: 5000,
                    });
                    swapTransaction = swapResponse.data.swapTransaction;
                } catch (e: any) {
                    // DEVNET FALLBACK: If Jupiter fails on devnet, simulate the swap
                    if (config.solanaNetwork === 'devnet') {
                        logger.warn(`Devnet: Jupiter API issue (${e.message}). Simulating swap for testing.`);

                        // Just return a dummy successfully-appearing result
                        // We will burn a fixed amount of the test token instead
                        return {
                            signature: 'SIMULATED_SWAP_' + Date.now(),
                            tokensReceived: 1000 // Just a number for the log
                        };
                    }
                    throw e;
                }

                const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
                const transaction = Transaction.from(swapTransactionBuf);

                // Sign and send
                transaction.sign(wallet);
                const signature = await this.connection.sendRawTransaction(transaction.serialize(), {
                    skipPreflight: true,
                    preflightCommitment: 'confirmed',
                });

                await this.connection.confirmTransaction(signature, 'confirmed');

                const tokensReceived = parseInt(quote.outAmount) / 1e9;

                return { signature, tokensReceived };
            } catch (error: any) {
                attempts++;
                logger.warn(`Jupiter swap attempt ${attempts} failed: ${error.message}`);

                if (attempts === maxAttempts) {
                    logger.error('Jupiter swap failed after maximum attempts', { error: error.message });
                    throw error;
                }

                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            }
        }

        throw new Error('Jupiter swap failed');
    }

    /**
     * Burn tokens by sending to incinerator address
     */
    private async burnTokens(
        wallet: Keypair,
        tokenAddress: string,
        amount: number
    ): Promise<string> {
        // Use real SPL token burning
        const { burnSPLTokens } = await import('./spl-burn');
        return await burnSPLTokens(tokenAddress, amount, bs58.encode(wallet.secretKey));
    }

    /**
     * Execute main token buyback from service fees
     */
    async buybackMainToken(): Promise<void> {
        if (!config.mainTokenAddress) {
            logger.warn('Main token address not configured');
            return;
        }

        const mainWallet = Keypair.fromSecretKey(bs58.decode(config.mainWalletPrivateKey));
        const balance = await this.connection.getBalance(mainWallet.publicKey);
        const availableSOL = balance / 1e9;

        if (availableSOL < 0.05) {
            logger.info('Insufficient SOL for main token buyback');
            return;
        }

        logger.info(`Executing main token buyback with ${availableSOL} SOL`);

        const { signature, tokensReceived } = await this.buyTokens(
            mainWallet,
            config.mainTokenAddress,
            availableSOL * 0.9 // Use 90% of balance
        );

        if (signature) {
            logger.transaction('MAIN_TOKEN_BUYBACK', config.mainTokenAddress, signature, tokensReceived);

            // Burn main tokens
            const burnSig = await this.burnTokens(mainWallet, config.mainTokenAddress, tokensReceived);
            logger.transaction('MAIN_TOKEN_BURN', config.mainTokenAddress, burnSig, tokensReceived);
        }
    }
}

export const buybackEngine = new BuybackEngine();
