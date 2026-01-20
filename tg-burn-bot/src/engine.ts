import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction
} from '@solana/web3.js';
import {
    createBurnInstruction,
    getAssociatedTokenAddress,
    getMint
} from '@solana/spl-token';

export interface BurnResult {
    success: boolean;
    signature?: string;
    error?: string;
    amount?: number;
}

export async function executeBurn(
    connection: Connection,
    wallet: Keypair,
    mintAddress: string,
    amount: number
): Promise<BurnResult> {
    try {
        const mint = new PublicKey(mintAddress);

        // 1. Get Mint info (to find owner and decimals)
        const mintInfo = await getMint(connection, mint);
        const decimals = mintInfo.decimals;
        const burnAmount = Math.floor(amount * Math.pow(10, decimals));

        // 2. Get Associated Token Account
        const tokenAccount = await getAssociatedTokenAddress(mint, wallet.publicKey);

        // 3. Create Instruction
        const transaction = new Transaction().add(
            createBurnInstruction(
                tokenAccount,
                mint,
                wallet.publicKey,
                burnAmount
            )
        );

        // 4. Send & Confirm
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [wallet],
            { commitment: 'confirmed' }
        );

        return {
            success: true,
            signature,
            amount
        };

    } catch (error: any) {
        console.error("Burn Error:", error);
        return {
            success: false,
            error: error.message || "Unknown error during burn execution."
        };
    }
}
