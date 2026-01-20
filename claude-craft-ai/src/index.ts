import mineflayer from 'mineflayer';
import { pathfinder } from 'mineflayer-pathfinder';
import { plugin as pvp } from 'mineflayer-pvp';
import { plugin as collectBlock } from 'mineflayer-collectblock';
import { mineflayer as prismarineViewer } from 'prismarine-viewer';
import dotenv from 'dotenv';

import { captureGameState, GameState } from './bot/gameState';
import { getAIDecision, AIDecision } from './ai/claude';
import { ActionExecutor, ActionResult } from './bot/actions';
import { RelayProxy } from './viewer/relay';
import { OverlayServer } from './viewer/overlay';

// Load environment variables
dotenv.config();

// Configuration
const config = {
    host: process.env.MINECRAFT_HOST || 'localhost',
    port: parseInt(process.env.MINECRAFT_PORT || '25565'),
    username: process.env.MINECRAFT_USERNAME || 'ClaudeCraftBot',
    version: process.env.MINECRAFT_VERSION || '1.20.4',
    viewerPort: parseInt(process.env.VIEWER_PORT || '3000')
};

// State
let bot: mineflayer.Bot;
let actionExecutor: ActionExecutor;
let isRunning = false;
let startTime: number;
let lastDecision: AIDecision | null = null;
let lastActionResult: ActionResult | null = null;

async function main() {
    console.log('🎮 Claude Craft AI - Minecraft Speedrun Bot');
    console.log('==========================================');

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_claude_api_key') {
        console.error('❌ ERROR: ANTHROPIC_API_KEY not set in .env file!');
        console.error('Please add your Claude API key to the .env file');
        process.exit(1);
    }
    console.log(`✅ Claude API key found (${apiKey.substring(0, 15)}...)`);

    console.log(`Connecting to ${config.host}:${config.port} as ${config.username}`);

    // Create bot
    bot = mineflayer.createBot({
        host: config.host,
        port: config.port,
        username: config.username,
        version: config.version
    });

    // Load plugins
    bot.loadPlugin(pathfinder);
    bot.loadPlugin(pvp);
    bot.loadPlugin(collectBlock);

    // Event handlers
    bot.once('spawn', onSpawn);
    bot.on('kicked', onKicked);
    bot.on('error', onError);
    bot.on('death', onDeath);
    bot.on('health', onHealthUpdate);
}

async function onSpawn() {
    console.log('✅ Bot spawned in world!');
    console.log(`Position: ${bot.entity.position}`);

    // Start prismarine-viewer for visualization
    try {
        prismarineViewer(bot, {
            port: config.viewerPort,
            firstPerson: true
        });
        console.log(`👁️ Viewer started at http://localhost:${config.viewerPort}`);

        // Start overlay HUD and relay
        const relay = new RelayProxy(bot, 25566);
        relay.start();

        const overlay = new OverlayServer(bot, 3001);
        overlay.start();
    } catch (e) {
        console.error('Failed to start viewer/overlay/relay:', e);
    }

    // Initialize action executor
    actionExecutor = new ActionExecutor(bot);

    // Record start time
    startTime = Date.now();

    // Start AI loop after a short delay
    console.log('🧠 Starting AI decision loop in 3 seconds...');
    await sleep(3000);

    isRunning = true;
    runAILoop();
}

async function runAILoop() {
    while (isRunning) {
        try {
            // Capture current game state
            const gameState = captureGameState(bot, startTime);

            // Log status
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            console.log(`\n⏱️ [${minutes}:${seconds.toString().padStart(2, '0')}] Phase: ${gameState.phase}`);
            console.log(`❤️ Health: ${gameState.health}/20 | 🍖 Food: ${gameState.food}/20`);

            // Get AI decision
            console.log('🤔 Asking Claude for next action...');
            const decision = await getAIDecision(gameState);
            lastDecision = decision;

            console.log(`📋 Decision: ${decision.action}`);
            console.log(`💭 Reasoning: ${decision.reasoning}`);

            // Execute action
            const result = await actionExecutor.execute(decision);
            lastActionResult = result;

            if (result.success) {
                console.log(`✅ ${result.message}`);
            } else {
                console.log(`❌ ${result.message}`);
            }

            // Check for game completion
            if (gameState.phase === 'completed') {
                const finalTime = Math.floor((Date.now() - startTime) / 1000);
                console.log('\n🏆 SPEEDRUN COMPLETE! 🏆');
                console.log(`Total time: ${Math.floor(finalTime / 60)}:${(finalTime % 60).toString().padStart(2, '0')}`);
                isRunning = false;
                break;
            }

            // Small delay between decisions to avoid rate limiting
            await sleep(2000);

        } catch (error) {
            console.error('AI loop error:', error);
            await sleep(5000);
        }
    }
}

function onKicked(reason: string) {
    console.log(`❌ Bot kicked: ${reason}`);
    isRunning = false;
}

function onError(error: Error) {
    console.error('Bot error:', error);
}

function onDeath() {
    console.log('💀 Bot died! Respawning...');
    // Death is handled automatically, we continue the loop
}

function onHealthUpdate() {
    if (bot.health < 5) {
        console.log('⚠️ LOW HEALTH WARNING!');
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    isRunning = false;
    if (bot) bot.quit();
    process.exit(0);
});

// Start the bot
main().catch(console.error);
