import { Connection } from '@solana/web3.js';
import * as dotenv from 'dotenv';
dotenv.config();

async function analyze() {
    const connection = new Connection(process.env.RPC_URL || '');
    const sig = "3neGrD4XDs2fsLDNgYmxtvPNvanUaMJNvQ4VGpV3RKnDugy6VDL6dTrKkPEaKv8rHvRKr4GWam8BdJoaJdfwfbHM";

    console.log(`Fetching TX: ${sig}`);
    const tx = await connection.getParsedTransaction(sig, { maxSupportedTransactionVersion: 0 });

    if (!tx) {
        console.log("TX not found or confirmed yet.");
        return;
    }

    if (tx.meta?.err) {
        console.log("TX Failed:", JSON.stringify(tx.meta.err));
    }

    // Look for burn instructions or balance changes
    const preBalances = tx.meta?.preTokenBalances || [];
    const postBalances = tx.meta?.postTokenBalances || [];

    console.log("\nToken Balance Changes:");
    preBalances.forEach(pre => {
        const post = postBalances.find(p => p.accountIndex === pre.accountIndex);
        if (post) {
            const diff = (post.uiTokenAmount.uiAmount || 0) - (pre.uiTokenAmount.uiAmount || 0);
            if (diff !== 0) {
                console.log(`Account [${pre.owner}]: ${diff} tokens`);
            }
        }
    });

    console.log("\nInstructions:");
    tx.transaction.message.instructions.forEach((ix: any, idx) => {
        if (ix.program === 'spl-token' || ix.programId.toBase58() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
            console.log(`#${idx} SPL Token: ${ix.parsed?.type} - ${JSON.stringify(ix.parsed?.info)}`);
        }
    });
}

analyze();
