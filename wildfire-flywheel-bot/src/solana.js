"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wallet = exports.connection = void 0;
exports.getBalance = getBalance;
exports.getSolBalance = getSolBalance;
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const config_1 = require("./config");
exports.connection = new web3_js_1.Connection(config_1.RPC_URL, 'confirmed');
exports.wallet = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(config_1.PRIVATE_KEY));
async function getBalance(pubkey) {
    return await exports.connection.getBalance(new (require('@solana/web3.js').PublicKey)(pubkey));
}
async function getSolBalance() {
    return await exports.connection.getBalance(exports.wallet.publicKey);
}
//# sourceMappingURL=solana.js.map