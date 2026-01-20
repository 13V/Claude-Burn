import axios from 'axios';
import {
    PublicKey,
    VersionedTransaction
} from '@solana/web3.js';
import { connection, wallet } from './solana.js';
import { PUMP_PROGRAM_ID, TOKEN_MINT, FEE_THRESHOLD, PRIORITY_FEE } from './config.js';
import { logActivity, logError } from './logger.js';

export async function getAccruedFees(): Promise<number> {
    if (!TOKEN_MINT) return 0;

    try {
        const [revenuePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("creator-revenue"), TOKEN_MINT.toBuffer()],
            PUMP_PROGRAM_ID
        );

        const balance = await connection.getBalance(revenuePda);
        const solBalance = balance / 1e9;

        logActivity(`🔍 Accrued Fees (PDA: ${revenuePda.toBase58().substring(0, 4)}...): ${solBalance.toFixed(4)} SOL`);
        return solBalance;
    } catch (e) {
        logError("Fetch Fees", e);
        return 0;
    }
}

export async function claimFees() {
    logActivity('🏦 Automating Fee Claim...');

    try {
        const response = await axios.post('https://pumpportal.fun/api/trade-local', {
            "publicKey": wallet.publicKey.toBase58(),
            "action": "collectCreatorFee",
            "priorityFee": PRIORITY_FEE
        }, {
            headers: { "Content-Type": "application/json" },
            responseType: 'arraybuffer'
        });

        if (response.status !== 200) throw new Error(`Claim failed with status ${response.status}`);

        const tx = VersionedTransaction.deserialize(new Uint8Array(response.data));
        tx.sign([wallet]);

        const signature = await connection.sendRawTransaction(tx.serialize());
        logActivity(`🚀 Claim TX Sent: ${signature}`);

        await connection.confirmTransaction(signature);
        logActivity('✅ Fees Claimed Successfully!');

        return signature;
    } catch (e: any) {
        logError("Claim Fees", e);
        throw e;
    }
}
