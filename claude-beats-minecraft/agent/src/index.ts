import { createBot, Bot } from 'mineflayer';
import { pathfinder, Movements, goals } from 'mineflayer-pathfinder';
// @ts-ignore
import { inventoryViewer } from 'mineflayer-web-inventory';
// @ts-ignore
import prismarineViewer from 'prismarine-viewer';
import * as dotenv from 'dotenv';
import { ClaudeAgent } from './claude';

dotenv.config();

const options = {
    host: process.env.MC_HOST || 'localhost',
    port: parseInt(process.env.MC_PORT || '25565'),
    username: process.env.MC_USERNAME || 'ClaudeAgent',
    version: '1.20.1' // Specific version for better compatibility
};

const bot: Bot = createBot(options);

// Load plugins
bot.loadPlugin(pathfinder);

bot.once('spawn', () => {
    console.log(`Bot spawned as ${bot.username}`);

    // Setup movements
    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = new Movements(bot);
    bot.pathfinder.setMovements(defaultMove);

    // Setup Vision Viewer (Port 3007)
    prismarineViewer.mineflayer(bot, { port: 3007, firstPerson: true });
    console.log('Vision viewer started on port 3007');

    // Initialize Claude Agent
    const claude = new ClaudeAgent(bot);

    // Start the reasoning loop
    claude.startLoop();
});

bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    console.log(`${username}: ${message}`);
});

bot.on('kicked', console.log);
bot.on('error', console.log);
