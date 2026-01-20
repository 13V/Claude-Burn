import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import * as fs from 'fs';
import bs58 from 'bs58';
import Database from 'better-sqlite3';

const RPC_URL = 'https://api.devnet.solana.com';
const WALLET_FILE = 'devnet-test-wallet.json';
const DB_PATH = './data/tokens-devnet.db';

async function setup() {
    console.log('🚀 Starting automated devnet test setup...');

    const connection = new Connection(RPC_URL, 'confirmed');

    // 1. Create/Load Wallet
    let wallet: Keypair;
    if (fs.existsSync(WALLET_FILE)) {
        const secret = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
        wallet = Keypair.fromSecretKey(Uint8Array.from(secret));
    } else {
        wallet = Keypair.generate();
        fs.writeFileSync(WALLET_FILE, JSON.stringify(Array.from(wallet.secretKey)));
    }

    const address = wallet.publicKey.toString();
    const privKey = bs58.encode(wallet.secretKey);
    console.log(`✅ Wallet: ${address}`);

    // 2. Airdrop SOL (with simple retry)
    console.log('💧 Requesting airdrop (1 SOL)...');
    try {
        const signature = await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL);
        await connection.confirmTransaction(signature);
        console.log('✅ Airdrop successful');
    } catch (e) {
        console.log('⚠️ Airdrop failed (likely rate limit). Continuing to check balance...');
        const balance = await connection.getBalance(wallet.publicKey);
        if (balance < 0.05 * LAMPORTS_PER_SOL) {
            console.error('❌ Insufficient balance to continue. Please manually airdrop SOL to:', address);
            // We'll still try to create the record in the DB so user can fund it later
        }
    }

    // 3. Create SPL Token
    console.log('🪙 Creating test SPL token...');
    let tokenAddress = '';
    try {
        const mint = await createMint(
            connection,
            wallet,
            wallet.publicKey,
            null,
            9
        );
        tokenAddress = mint.toString();
        console.log(`✅ Token created: ${tokenAddress}`);

        // 4. Create Token Account & Mint
        console.log('📦 Minting 1,000,000 tokens...');
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            wallet,
            mint,
            wallet.publicKey
        );

        await mintTo(
            connection,
            wallet,
            mint,
            tokenAccount.address,
            wallet.publicKey,
            1000000 * 10 ** 9
        );
        console.log('✅ Tokens minted successfully');
    } catch (e: any) {
        console.error('❌ Failed to create/mint token:', e.message);
        console.log('Proceeding with DB injection using a placeholder address if needed...');
        if (!tokenAddress) tokenAddress = 'DevNetTestToken' + Math.floor(Math.random() * 1000);
    }

    // 5. Inject into Database
    console.log('🗄️ Registering token in database...');
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data');
        const db = new Database(DB_PATH);

        // Ensure table exists (simplified)
        db.exec(`
            CREATE TABLE IF NOT EXISTS tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                address TEXT UNIQUE NOT NULL,
                ownerTelegramId TEXT NOT NULL,
                ownerUsername TEXT NOT NULL,
                privateKey TEXT NOT NULL,
                burnPercentage INTEGER NOT NULL DEFAULT 50,
                mode TEXT NOT NULL DEFAULT 'standard',
                createdAt INTEGER NOT NULL,
                lastBurn INTEGER DEFAULT 0,
                totalBurned REAL DEFAULT 0,
                isActive INTEGER DEFAULT 1
            )
        `);

        const stmt = db.prepare(`
            INSERT OR REPLACE INTO tokens (
                address, ownerTelegramId, ownerUsername, privateKey,
                burnPercentage, mode, createdAt, isActive
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            tokenAddress,
            '6059709311', // User's Telegram ID
            'UserAccount',
            privKey,
            50,
            'standard',
            Date.now(),
            1
        );

        db.close();
        console.log('✅ Token registered in database');
    } catch (e: any) {
        console.error('❌ Database injection failed:', e.message);
    }

    console.log('\n--- SETUP COMPLETE ---');
    console.log(`TOKEN_ADDRESS: ${tokenAddress}`);
    console.log(`WALLET_ADDRESS: ${address}`);
    console.log(`PRIVATE_KEY: ${privKey}`);
    console.log('----------------------\n');
}

setup().catch(console.error);
