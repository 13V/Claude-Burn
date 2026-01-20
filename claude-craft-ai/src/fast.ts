/**
 * FAST MODE - Scripted Speedrun
 * Uses pre-programmed sequences instead of AI for maximum speed
 * AI is only used for high-level decisions and complex situations
 */

import mineflayer from 'mineflayer';
import { pathfinder } from 'mineflayer-pathfinder';
import { plugin as pvp } from 'mineflayer-pvp';
import { plugin as collectBlock } from 'mineflayer-collectblock';
import { mineflayer as prismarineViewer } from 'prismarine-viewer';
import dotenv from 'dotenv';

import { SpeedrunSequencer } from './bot/speedrun';
import { captureGameState } from './bot/gameState';
import { getAIDecision, AIDecision } from './ai/claude';
import { ActionExecutor, ActionResult } from './bot/actions';
import { RelayProxy } from './viewer/relay';
import { OverlayServer } from './viewer/overlay';

dotenv.config();

const config = {
    host: process.env.MINECRAFT_HOST || 'localhost',
    port: parseInt(process.env.MINECRAFT_PORT || '25565'),
    username: process.env.MINECRAFT_USERNAME || 'ClaudeCraftBot',
    version: process.env.MINECRAFT_VERSION || '1.20.4',
    viewerPort: parseInt(process.env.VIEWER_PORT || '3000')
};

let bot: mineflayer.Bot;
let sequencer: SpeedrunSequencer;
let actionExecutor: ActionExecutor;
let startTime: number;
let isAIActive = false;

async function main() {
    console.log('🚀 Claude Craft AI - FAST MODE');
    console.log('==============================');
    console.log('Using scripted sequences for maximum speed!');
    console.log(`Connecting to ${config.host}:${config.port} as ${config.username}`);

    bot = mineflayer.createBot({
        host: config.host,
        port: config.port,
        username: config.username,
        version: config.version
    });

    bot.loadPlugin(pathfinder);
    bot.loadPlugin(pvp);
    bot.loadPlugin(collectBlock);

    bot.once('spawn', onSpawn);
    bot.on('kicked', (reason) => console.log('Kicked:', reason));
    bot.on('error', console.error);
    bot.on('death', () => {
        console.log('💀 Died! Respawning...');
    });
}

async function onSpawn() {
    console.log('✅ Bot spawned!');
    console.log(`Position: ${bot.entity.position}`);

    // Start viewer and relay
    try {
        prismarineViewer(bot, { port: config.viewerPort, firstPerson: true });
        console.log(`👁️ Viewer: http://localhost:${config.viewerPort}`);

        const relay = new RelayProxy(bot, 25566);
        relay.start();

        const overlay = new OverlayServer(bot, 3001);
        overlay.start();
    } catch (e) {
        console.error('Viewer/Relay failed:', e);
    }

    // Initialize sequencer and executor
    sequencer = new SpeedrunSequencer(bot);
    actionExecutor = new ActionExecutor(bot);
    startTime = Date.now();

    console.log('\n⚡ Starting FAST speedrun in 2 seconds...\n');
    await sleep(2000);

    // Run the speedrun!
    await runSpeedrun();
}

async function runSpeedrun() {
    const phases = [
        { name: 'Early Game', fn: () => sequencer.executeEarlyGame() },
        { name: 'Iron Gathering', fn: () => sequencer.executeIronGathering() },
        { name: 'Nether Prep', fn: () => sequencer.executeNetherPrep() },
    ];

    for (const phase of phases) {
        const elapsed = getElapsed();
        console.log(`\n${'='.repeat(50)}`);
        console.log(`⏱️ [${elapsed}] Starting: ${phase.name}`);
        console.log('='.repeat(50));

        // Handle survival before each phase
        await sequencer.handleSurvival();

        const success = await phase.fn();

        const phaseEnd = getElapsed();
        if (success) {
            console.log(`✅ [${phaseEnd}] ${phase.name} complete!`);
        } else {
            console.log(`⚠️ [${phaseEnd}] ${phase.name} had issues, continuing...`);
        }
    }

    const finalTime = getElapsed();
    console.log(`\n🏁 Scripted phases complete in ${finalTime}`);
    console.log('Now continuing with AI for remaining phases...');

    isAIActive = true;
    runAILoop();
}

async function runAILoop() {
    while (isAIActive) {
        try {
            // Survival check before AI decision
            await sequencer.handleSurvival();

            const state = captureGameState(bot, startTime);

            console.log('\n🤔 Asking Claude for next action...');
            const decision = await getAIDecision(state);

            if (decision) {
                console.log(`📋 Decision: ${decision.action}`);
                console.log(`💭 Reasoning: ${decision.reasoning}`);

                const result = await actionExecutor.execute(decision);

                if (result.success) {
                    console.log(`✅ ${result.message}`);
                } else {
                    console.log(`❌ Action failed: ${result.message}`);
                }
            }

            // Short delay between decisions
            await sleep(1000);
        } catch (e: any) {
            console.error('AI Loop Error:', e.message);
            await sleep(5000);
        }
    }
}

function getElapsed(): string {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
}

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    isAIActive = false;
    if (bot) bot.quit();
    process.exit(0);
});

main().catch(console.error);
