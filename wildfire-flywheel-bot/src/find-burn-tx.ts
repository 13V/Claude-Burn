import { Connection, Keypair } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import bs58 from 'bs58';
dotenv.config();

async function findBurn() {
    const connection = new Connection(process.env.RPC_URL || '');
    const secret = bs58.decode(process.env.PRIVATE_KEY || '');
    const wallet = Keypair.fromSecretKey(secret).publicKey;

    console.log(`Scanning history for: ${wallet.toBase58()}`);

    // Fetch last 50 transactions
    const signatures = await connection.getSignaturesForAddress(wallet, { limit: 50 });

    console.log(`Found ${signatures.length} transactions. analyzing...`);

    for (const sigInfo of signatures) {
        if (sigInfo.err) continue; // Skip failed txs

        const tx = await connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 });
        if (!tx) continue;

        // Check for burn instructions
        const instructions = tx.transaction.message.instructions;
        for (const ix of instructions) {
            if ('program' in ix && ix.program === 'spl-token') {
                const parsed = (ix as any).parsed;
                if (parsed.type === 'burn') {
                    const amount = parsed.info.amount;
                    console.log(`--------------------------------------------------`);
                    console.log(`Signature: https://solscan.io/tx/${sigInfo.signature}`);
                    console.log(`Time: ${new Date((sigInfo.blockTime || 0) * 1000).toISOString()}`);
                    console.log(`Action: BURN`);
                    console.log(`Amount (Raw): ${amount}`);
                    console.log(`Amount (UI):  ${amount / 1e6} (assuming 6 decimals)`);
                }
            }
        }
    }
}

findBurn();
