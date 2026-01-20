import { Bot } from 'mineflayer';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

export class ClaudeAgent {
    private bot: Bot;
    private anthropic: Anthropic;
    private lastAction: string = 'Spawning...';
    private agentThoughts: string[] = [];

    constructor(bot: Bot) {
        this.bot = bot;
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || '',
        });
    }

    async startLoop() {
        console.log('Claude reasoning loop started');
        while (true) {
            try {
                await this.reasoningStep();
            } catch (error) {
                console.error('Error in reasoning loop:', error);
            }
            // Wait before next reasoning step to save API costs and avoid spam
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
    }

    private async reasoningStep() {
        console.log('Taking a moment to think...');

        // 1. Capture State
        const state = {
            health: this.bot.health,
            food: this.bot.food,
            position: this.bot.entity.position,
            inventory: this.bot.inventory.items().map(i => `${i.count}x ${i.name}`),
            nearbyEntities: Object.values(this.bot.entities)
                .filter(e => e.position.distanceTo(this.bot.entity.position) < 10)
                .map(e => ({ type: e.type, name: e.name, pos: e.position })),
        };

        // 2. Capture Vision (Simulated or via Prismarine Viewer buffer)
        // NOTE: In a real environment, we'd grab the canvas from prismarine-viewer.
        // For now, we provide factual state to Claude. 
        // Claude 3.5 Sonnet is great with text too, but Vision is the goal.

        const prompt = `
      You are Claude, an elite Minecraft speedrunner AI. 
      Your goal is to beat the Ender Dragon.
      Current State:
      - Health: ${state.health}/20
      - Hunger: ${state.food}/20
      - Position: ${state.position.x.toFixed(1)}, ${state.position.y.toFixed(1)}, ${state.position.z.toFixed(1)}
      - Inventory: ${state.inventory.join(', ') || 'Empty'}
      - Nearby: ${state.nearbyEntities.map(e => e.name).join(', ') || 'None'}

      What is your next move? 
      Provide your response in JSON format:
      {
        "thought": "Brief explanation of your strategy",
        "action": "one of: mine, move, craft, attack, idle",
        "target": "item or entity name",
        "chat": "Message to send to the stream chat"
      }
    `;

        const response = await this.anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }],
        });

        const content = response.content[0];
        if (content.type === 'text') {
            try {
                const result = JSON.parse(content.text);
                this.executeAction(result);
                this.logThought(result.thought, result.chat);
            } catch (e) {
                console.log('Failed to parse Claude response as JSON:', content.text);
            }
        }
    }

    private executeAction(result: any) {
        this.lastAction = `${result.action}: ${result.target}`;
        console.log(`Executing Action: ${this.lastAction}`);

        // Basic action mapping
        switch (result.action) {
            case 'move':
                // Implementation of pathfinding to target
                break;
            case 'mine':
                // Implementation of block mining
                break;
            case 'attack':
                // Implementation of combat
                break;
            case 'chat':
                this.bot.chat(result.chat);
                break;
        }
    }

    private async logThought(thought: string, chat: string) {
        this.agentThoughts.push(thought);
        console.log(`[CLAUDE THOUGHT]: ${thought}`);
        if (chat) this.bot.chat(chat);

        // Sync with Web Dashboard
        try {
            await fetch(`${process.env.WEB_URL || 'http://localhost:3000'}/api/thoughts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'thought', content: thought }),
            });
        } catch (e) {
            console.error('Failed to sync thought to web:', e);
        }
    }
}
