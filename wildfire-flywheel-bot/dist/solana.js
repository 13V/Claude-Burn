import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { RPC_URL, PRIVATE_KEY } from './config.js';
export const connection = new Connection(RPC_URL, 'confirmed');
export const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
export async function getBalance(pubkey) {
    return await connection.getBalance(new (require('@solana/web3.js').PublicKey)(pubkey));
}
export async function getSolBalance() {
    return await connection.getBalance(wallet.publicKey);
}
