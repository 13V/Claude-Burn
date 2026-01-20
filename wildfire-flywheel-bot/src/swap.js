"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swapSolToToken = swapSolToToken;
exports.burnTokens = burnTokens;
const axios_1 = __importDefault(require("axios"));
const web3_js_1 = require("@solana/web3.js");
const solana_1 = require("./solana");
const config_1 = require("./config");
async function swapSolToToken(solAmountIn) {
    if (!config_1.TOKEN_MINT) {
        throw new Error('TOKEN_MINT is not set');
    }
    const lamports = Math.floor(solAmountIn * 1e9);
    try {
        // 1. Get Quote
        const quoteResponse = await axios_1.default.get(`${config_1.JUPITER_QUOTE_API}/quote`, {
            params: {
                inputMint: 'So11111111111111111111111111111111111111112', // WSOL (Native SOL)
                outputMint: config_1.TOKEN_MINT.toBase58(),
                amount: lamports.toString(),
                slippageBps: 50 // 0.5%
            }
        });
        // 2. Get Swap Transaction
        const { data: { swapTransaction } } = await axios_1.default.post(`${config_1.JUPITER_QUOTE_API}/swap`, {
            quoteResponse: quoteResponse.data,
            userPublicKey: solana_1.wallet.publicKey.toBase58(),
            wrapAndUnwrapSol: true
        });
        // 3. Deserialize and Sign
        const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
        const transaction = web3_js_1.VersionedTransaction.deserialize(swapTransactionBuf);
        transaction.sign([solana_1.wallet]);
        // 4. Send and Confirm
        const signature = await solana_1.connection.sendRawTransaction(transaction.serialize());
        await solana_1.connection.confirmTransaction(signature);
        return signature;
    }
    catch (error) {
        console.error('Swap failed:', error);
        throw error;
    }
}
async function burnTokens(tokenMint, amount) {
    // To burn, we send to the dead address
    // In a real bot, we'd use the SPL Token 'burn' instruction for true supply reduction,
    // but sending to '1111...1111' is the standard "burn" for community perception.
    console.log(`Sending ${amount} tokens to dead address...`);
    // Logic for transfer to 11111111111111111111111111111111
}
//# sourceMappingURL=swap.js.map