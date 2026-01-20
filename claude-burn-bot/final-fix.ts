import * as fs from 'fs';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import Database from 'better-sqlite3';

const WALLET_FILE = 'devnet-test-wallet.json';
const DB_PATH = './data/tokens-devnet.db';
const ENV_FILE = '.env';

async function finalFix() {
    console.log('🚀 Executing final key fix...');

    const secret = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
    const wallet = Keypair.fromSecretKey(Uint8Array.from(secret));
    const privKey = bs58.encode(wallet.secretKey);

    console.log(`✅ Correct Key: ${privKey}`);
    console.log(`Length: ${privKey.length}`);

    // Update Database
    const db = new Database(DB_PATH);
    const result = db.prepare('UPDATE tokens SET privateKey = ? WHERE address = ?')
        .run(privKey, '2f1vpd6nPmSSuPPM6p3KatotCeyMWkQaW8rVhM71gMxx');

    if (result.changes > 0) {
        console.log('✅ Database updated successfully');
    } else {
        console.log('❌ Token not found in database to update');
    }
    db.close();

    // Update .env
    let envContent = fs.readFileSync(ENV_FILE, 'utf8');
    envContent = envContent.replace(/^MAIN_WALLET_PRIVATE_KEY=.*/m, `MAIN_WALLET_PRIVATE_KEY=${privKey}`);
    fs.writeFileSync(ENV_FILE, envContent);
    console.log('✅ .env updated successfully');
}

finalFix().catch(console.error);
