"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JUPITER_QUOTE_API = exports.FEE_THRESHOLD = exports.TOKEN_MINT = exports.FEE_RECIPIENT_VIRTUAL = exports.GLOBAL_ACCOUNT = exports.PUMP_PROGRAM_ID = exports.CHAT_ID = exports.BOT_TOKEN = exports.PRIVATE_KEY = exports.RPC_URL = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const web3_js_1 = require("@solana/web3.js");
dotenv_1.default.config();
exports.RPC_URL = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
exports.PRIVATE_KEY = process.env.PRIVATE_KEY || '';
exports.BOT_TOKEN = process.env.BOT_TOKEN || '';
exports.CHAT_ID = process.env.CHAT_ID || '';
exports.PUMP_PROGRAM_ID = new web3_js_1.PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
exports.GLOBAL_ACCOUNT = new web3_js_1.PublicKey('4wTV9uUv8asZqnrbaKW4pVCp451pP3y48nuzW6Xb9K9G'); // Standard Pump.fun global account
exports.FEE_RECIPIENT_VIRTUAL = new web3_js_1.PublicKey('CebNbmXmRUEv9bSsqmY1YFfL27oToCDw7FmXNraGg92R'); // Example fee recipient
// User's token data
exports.TOKEN_MINT = process.env.TOKEN_MINT ? new web3_js_1.PublicKey(process.env.TOKEN_MINT) : null;
exports.FEE_THRESHOLD = parseFloat(process.env.FEE_THRESHOLD || '0.5'); // in SOL
exports.JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';
if (!exports.PRIVATE_KEY) {
    console.error('PRIVATE_KEY is not set in .env');
}
if (!exports.BOT_TOKEN) {
    console.warn('BOT_TOKEN is not set in .env');
}
//# sourceMappingURL=config.js.map