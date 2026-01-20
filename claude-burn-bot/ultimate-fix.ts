import * as fs from 'fs';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import Database from 'better-sqlite3';

const WALLET_FILE = 'devnet-test-wallet.json';
const DB_PATH = './data/tokens-devnet.db';
const ENV_FILE = '.env';

async function ultimateFix() {
    console.log('🚀 Executing ULTIMATE key fix...');

    if (!fs.existsSync(WALLET_FILE)) {
        throw new Error('Wallet file not found!');
    }

    const secret = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
    const wallet = Keypair.fromSecretKey(Uint8Array.from(secret));
    const privKey = bs58.encode(wallet.secretKey);

    console.log(`✅ Extracted key for ${wallet.publicKey.toString()}`);
    console.log(`✅ Key Length: ${privKey.length}`);

    if (privKey.length !== 88) {
        console.warn('⚠️ Warning: Key length is not 88. This might be normal for some keys, but unexpected here.');
    }

    // 1. Update EVERY token in the database with this owner's private key
    // (Since this is a test environment and we only have one test owner/wallet)
    const db = new Database(DB_PATH);
    const result = db.prepare('UPDATE tokens SET privateKey = ?').run(privKey);
    console.log(`✅ Database updated: ${result.changes} rows affected`);
    db.close();

    // 2. Update .env file
    if (fs.existsSync(ENV_FILE)) {
        let envContent = fs.readFileSync(ENV_FILE, 'utf8');

        // Replace MAIN_WALLET_PRIVATE_KEY
        envContent = envContent.replace(/^MAIN_WALLET_PRIVATE_KEY=.*/m, `MAIN_WALLET_PRIVATE_KEY=${privKey}`);

        // Also update MAIN_TOKEN_ADDRESS if it's the latest one we created
        // (Optional, but helpful)

        fs.writeFileSync(ENV_FILE, envContent);
        console.log('✅ .env file updated');
    }

    console.log('\n✨ FIX COMPLETE. Please restart the bot and try again.');
}

ultimateFix().catch(e => console.error('❌ FIX FAILED:', e.message));
