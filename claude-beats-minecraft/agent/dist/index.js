"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mineflayer_1 = require("mineflayer");
const mineflayer_pathfinder_1 = require("mineflayer-pathfinder");
// @ts-ignore
const prismarine_viewer_1 = __importDefault(require("prismarine-viewer"));
const dotenv = __importStar(require("dotenv"));
const claude_1 = require("./claude");
dotenv.config();
const options = {
    host: process.env.MC_HOST || 'localhost',
    port: parseInt(process.env.MC_PORT || '25565'),
    username: process.env.MC_USERNAME || 'ClaudeAgent',
    version: '1.20.1' // Specific version for better compatibility
};
const bot = (0, mineflayer_1.createBot)(options);
// Load plugins
bot.loadPlugin(mineflayer_pathfinder_1.pathfinder);
bot.once('spawn', () => {
    console.log(`Bot spawned as ${bot.username}`);
    // Setup movements
    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = new mineflayer_pathfinder_1.Movements(bot, mcData);
    bot.pathfinder.setMovements(defaultMove);
    // Setup Vision Viewer (Port 3007)
    prismarine_viewer_1.default.mineflayer(bot, { port: 3007, firstPerson: true });
    console.log('Vision viewer started on port 3007');
    // Initialize Claude Agent
    const claude = new claude_1.ClaudeAgent(bot);
    // Start the reasoning loop
    claude.startLoop();
});
bot.on('chat', (username, message) => {
    if (username === bot.username)
        return;
    console.log(`${username}: ${message}`);
});
bot.on('kicked', console.log);
bot.on('error', console.log);
