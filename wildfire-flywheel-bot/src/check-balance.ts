import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        const connection = new Connection(process.env.RPC_URL || '');
        const secret = bs58.decode(process.env.PRIVATE_KEY || '');
        const wallet = Keypair.fromSecretKey(secret);
        const balance = await connection.getBalance(wallet.publicKey);
        console.log("ADDRESS:", wallet.publicKey.toBase58());
        console.log("ACC_BALANCE:", balance / 1e9);
    } catch (e: any) {
        console.error("ERROR:", e.message);
    }
}
check();
