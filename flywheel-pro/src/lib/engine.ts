import {
    Connection,
    Keypair,
    PublicKey,
    VersionedTransaction,
    Transaction,
    sendAndConfirmTransaction
} from '@solana/web3.js';
import {
    createBurnInstruction,
    getAssociatedTokenAddress,
    getAccount
} from '@solana/spl-token';
import axios from 'axios';
import bs58 from 'bs58';
import { supabase } from './supabase';

// Multi-tenant Flywheel Engine
export class FlywheelEngine {
    private connection: Connection;
    private rpcUrl: string;

    constructor(rpcUrl: string = 'https://api.mainnet-beta.solana.com') {
        this.rpcUrl = rpcUrl;
        this.connection = new Connection(this.rpcUrl, 'confirmed');
    }

    private getWallet(privateKey: string) {
        try {
            return Keypair.fromSecretKey(bs58.decode(privateKey));
        } catch (e) {
            console.error("Invalid Private Key format");
            return null;
        }
    }

    async getPumpMarketCap(mintAddress: string) {
        try {
            const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`);
            if (response.data?.pairs?.[0]) {
                return response.data.pairs[0].fdv || 0;
            }
            return 0; // Fallback or handle on-chain if needed
        } catch (e) {
            console.error("Error fetching MC:", e);
            return 0;
        }
    }

    async swapSolToToken(wallet: Keypair, mintStr: string, solAmountIn: number) {
        try {
            const response = await axios.post('https://pumpportal.fun/api/trade-local', {
                "publicKey": wallet.publicKey.toBase58(),
                "action": "buy",
                "mint": mintStr,
                "amount": solAmountIn,
                "denominatedInSol": true,
                "slippage": 10,
                "priorityFee": 0.0001,
                "pool": "pump"
            }, {
                headers: { "Content-Type": "application/json" },
                responseType: 'arraybuffer'
            });

            const tx = VersionedTransaction.deserialize(new Uint8Array(response.data));
            tx.sign([wallet]);
            const signature = await this.connection.sendRawTransaction(tx.serialize());
            await this.connection.confirmTransaction(signature);
            return signature;
        } catch (e: any) {
            console.error("Error swapping SOL:", e.message);
            throw e;
        }
    }

    async burnTokens(wallet: Keypair, mintStr: string, amount: number) {
        try {
            const mint = new PublicKey(mintStr);
            const ata = await getAssociatedTokenAddress(mint, wallet.publicKey);
            const burnAmount = Math.floor(amount * 1000000); // 6 decimals

            const transaction = new Transaction().add(
                createBurnInstruction(ata, mint, wallet.publicKey, burnAmount)
            );

            const signature = await sendAndConfirmTransaction(this.connection, transaction, [wallet]);
            return signature;
        } catch (e: any) {
            console.error("Error burning tokens:", e.message);
            throw e;
        }
    }

    async runProjectCycle(projectId: string) {
        console.log(`[ENGINE] Starting cycle for project: ${projectId}`);

        try {
            const { data: project, error: pError } = await supabase
                .from('projects')
                .select('*, flywheel_configs(*)')
                .eq('id', projectId)
                .single();

            if (pError || !project) throw new Error("Project not found");
            const config = project.flywheel_configs;
            const wallet = this.getWallet(project.bot_private_key);
            if (!wallet) throw new Error("Invalid bot wallet");

            const currentMc = await this.getPumpMarketCap(project.token_mint);

            // Gating Logic
            if (currentMc < config.activation_mc) {
                await this.log(projectId, 'info', `Gated: Waiting for $${config.activation_mc.toLocaleString()} MC`);
                return;
            }

            // check balance
            const balance = await this.connection.getBalance(wallet.publicKey);
            const solBalance = balance / 1e9;

            if (solBalance > config.buyback_threshold_sol) {
                const swapAmount = solBalance - config.keep_sol_balance;
                await this.log(projectId, 'swap', `Executing Buyback: ${swapAmount.toFixed(4)} SOL`);

                await this.swapSolToToken(wallet, project.token_mint, swapAmount);

                if (currentMc >= config.burn_mc) {
                    // Quick balance check for burn
                    const mint = new PublicKey(project.token_mint);
                    const ata = await getAssociatedTokenAddress(mint, wallet.publicKey);
                    const acc = await getAccount(this.connection, ata);
                    const tokenAmount = Number(acc.amount) / 1e6;

                    if (tokenAmount > 0) {
                        await this.log(projectId, 'burn', `Burning ${tokenAmount.toLocaleString()} tokens`);
                        await this.burnTokens(wallet, project.token_mint, tokenAmount);
                    }
                }
            }

            await this.log(projectId, 'scan', `Cycle complete: $${currentMc.toLocaleString()} MC`);

        } catch (e: any) {
            console.error(`[ENGINE] Project ${projectId} failed:`, e.message);
            await this.log(projectId, 'info', `Error: ${e.message}`);
        }
    }

    private async log(projectId: string, type: 'scan' | 'claim' | 'swap' | 'burn' | 'info', message: string) {
        await supabase.from('operational_logs').insert({
            project_id: projectId,
            type,
            message
        });
    }
}
