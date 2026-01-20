import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import bs58 from 'bs58';

const secret = JSON.parse(fs.readFileSync('devnet-test-wallet.json', 'utf8'));
const wallet = Keypair.fromSecretKey(Uint8Array.from(secret));

console.log('ADDRESS:', wallet.publicKey.toString());
console.log('PRIVATE_KEY:', bs58.encode(wallet.secretKey));
