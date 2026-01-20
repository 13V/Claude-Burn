import dotenv from 'dotenv';
import { PublicKey } from '@solana/web3.js';
import dns from 'dns';
// Force Google DNS to bypass local resolution issues
dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();
export const RPC_URL = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
export const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
export const BOT_TOKEN = process.env.BOT_TOKEN || '';
export const CHAT_ID = process.env.CHAT_ID || '';
export const PUMP_PROGRAM_ID = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
export const GLOBAL_ACCOUNT = new PublicKey('4wTV9uUv8asZqnrbaKW4pVCp451pP3y48nuzW6Xb9K9G'); // Standard Pump.fun global account
export const FEE_RECIPIENT_VIRTUAL = new PublicKey('CebNbmXmRUEv9bSsqmY1YFfL27oToCDw7FmXNraGg92R'); // Example fee recipient
// User's token data
export const TOKEN_MINT = process.env.TOKEN_MINT ? new PublicKey(process.env.TOKEN_MINT) : null;
export const FEE_THRESHOLD = parseFloat(process.env.FEE_THRESHOLD || '0.5'); // in SOL
// Flywheel Performance Tuning
export const PRIORITY_FEE = parseFloat(process.env.PRIORITY_FEE || '0.0001');
export const SLIPPAGE_PCT = parseInt(process.env.SLIPPAGE_PCT || '10'); // 10% to handle launch volatility
export const LOG_FILE = './vault_activity.log';
export const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';
if (!PRIVATE_KEY) {
    console.error('PRIVATE_KEY is not set in .env');
}
if (!BOT_TOKEN) {
    console.warn('BOT_TOKEN is not set in .env');
}
