import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import bs58 from 'bs58';
import * as dotenv from 'dotenv';
dotenv.config();
async function checkTokenBalance() {
    try {
        const connection = new Connection(process.env.RPC_URL || '');
        const secret = bs58.decode(process.env.PRIVATE_KEY || '');
        const wallet = Keypair.fromSecretKey(secret);
        const mint = new PublicKey(process.env.TOKEN_MINT || '');
        console.log("Wallet:", wallet.publicKey.toBase58());
        console.log("Mint:", mint.toBase58());
        const ata = await getAssociatedTokenAddress(mint, wallet.publicKey);
        console.log("ATA:", ata.toBase58());
        try {
            const account = await getAccount(connection, ata);
            console.log("Raw Amount:", account.amount.toString());
            // Assuming 6 decimals for display, but raw is truth
            console.log("Tokens (6 decimals):", Number(account.amount) / 1e6);
        }
        catch (e) {
            console.log("Error fetching account (maybe empty/closed):", e.message);
        }
    }
    catch (e) {
        console.error("ERROR:", e.message);
    }
}
checkTokenBalance();
