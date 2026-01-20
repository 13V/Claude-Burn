import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import fetch from 'cross-fetch';

export interface SwapResult {
    success: boolean;
    signature?: string;
    error?: string;
    amountBought?: number;
}

export async function buyTokenWithSol(
    connection: Connection,
    wallet: Keypair,
    quoteMint: string,
    amountSol: number
): Promise<SwapResult> {
    try {
        const lamports = Math.floor(amountSol * 1e9);

        // 1. Get Quote from Jupiter
        const quoteResponse = await (
            await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${quoteMint}&amount=${lamports}&slippageBps=100`)
        ).json();

        if (quoteResponse.error) {
            throw new Error(`Jupiter Quote Error: ${quoteResponse.error}`);
        }

        // 2. Get Swap Transaction
        const { swapTransaction } = await (
            await fetch('https://quote-api.jup.ag/v6/swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteResponse,
                    userPublicKey: wallet.publicKey.toString(),
                    wrapAndUnwrapSol: true,
                })
            })
        ).json();

        // 3. Deserialize and Sign
        const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        transaction.sign([wallet]);

        // 4. Execute
        const signature = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: true,
            maxRetries: 2
        });

        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        return {
            success: true,
            signature,
            amountBought: parseFloat(quoteResponse.outAmount) / Math.pow(10, 6) // Assumes 6 decimals for typical tokens, should be dynamic in prod
        };

    } catch (error: any) {
        console.error("Jupiter Swap Error:", error);
        return {
            success: false,
            error: error.message || "Unknown error during Jupiter swap."
        };
    }
}
