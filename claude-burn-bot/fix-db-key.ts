import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import bs58 from 'bs58';
import Database from 'better-sqlite3';

const WALLET_FILE = 'devnet-test-wallet.json';
const DB_PATH = './data/tokens-devnet.db';

function fix() {
    console.log('🔧 Fixing database record...');

    if (!fs.existsSync(WALLET_FILE)) {
        console.error('❌ Wallet file missing!');
        return;
    }

    const secret = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
    const wallet = Keypair.fromSecretKey(Uint8Array.from(secret));
    const privKey = bs58.encode(wallet.secretKey);

    const db = new Database(DB_PATH);

    // Get the latest registered token
    const row = db.prepare('SELECT address FROM tokens ORDER BY id DESC LIMIT 1').get() as any;

    if (row) {
        db.prepare('UPDATE tokens SET privateKey = ? WHERE address = ?')
            .run(privKey, row.address);
        console.log(`✅ Fixed key for ${row.address}`);
        console.log(`Key Length: ${privKey.length}`);
    } else {
        console.log('❌ No tokens found in DB');
    }

    db.close();
}

fix();
