import Anthropic from '@anthropic-ai/sdk';
import { Bot } from 'mineflayer';
import { GameState } from '../bot/gameState';

let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
    if (!anthropic) {
        anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }
    return anthropic;
}

export interface AIDecision {
    action: string;
    target?: string;
    parameters?: Record<string, any>;
    reasoning: string;
}

const SYSTEM_PROMPT = `You are an expert Minecraft RSG (Random Seed Glitchless) speedrunner AI. Your ONLY goal is to defeat the Ender Dragon as fast as possible.

CRITICAL RULES:
1. USE WHATEVER RESOURCES YOU HAVE - Don't search for specific wood types! Oak, birch, spruce - ANY log works the same. NEVER waste time looking for a specific type.
2. SPEED IS EVERYTHING - Every second counts. Make decisions instantly.
3. CRAFT IMMEDIATELY when you have materials - don't keep gathering if you have enough.

RSG SPEEDRUN ROUTE:

PHASE 1: WOOD & TOOLS (Target: 30 seconds)
- Punch ANY nearby tree (oak, birch, spruce, ANY log works!)
- Get 3-4 logs minimum, then IMMEDIATELY craft:
  * Planks (4 per log)
  * Crafting table (4 planks)
  * Sticks (2 planks = 4 sticks)
  * Wooden pickaxe (3 planks + 2 sticks)
- Find stone, mine 3 cobblestone
- Craft stone pickaxe immediately

PHASE 2: IRON & BUCKET (Target: 2-3 minutes)
- Find iron ore (check caves, ravines, or dig down)
- Need 3 iron for bucket (PRIORITY #1)
- Need 3 more iron for iron pickaxe
- Craft bucket FIRST - it enables portal building

PHASE 3: NETHER PORTAL (Target: 4-5 minutes)
- Find lava pool (surface or underground)
- Use bucket method: pour water near lava to create obsidian
- Build portal frame (minimum 4x5 obsidian frame)
- Light with flint & steel (gravel + iron)

PHASE 4: NETHER (Target: 10-15 minutes)
- Find Nether Fortress (follow positive X axis often helps)
- Kill Blazes for 7+ blaze rods
- Kill Endermen or barter with Piglins for ender pearls (need 12+)

PHASE 5: STRONGHOLD (Target: 20 minutes)
- Craft Eyes of Ender (blaze powder + ender pearl)
- Throw eyes to locate stronghold
- Dig down to end portal
- Place eyes in portal frames

PHASE 6: DRAGON FIGHT (Target: 25-30 minutes)
- Bring beds! Bed explosions deal massive damage when dragon perches
- Destroy end crystals on towers
- When dragon perches on fountain, place bed and right-click to explode
- Timing is critical - explode when dragon is close

AVAILABLE ACTIONS:
- gatherWood: Collect ANY nearby logs (don't be picky!)
- craftItem: {item: "item_name"} - Craft immediately when possible
- mineBlock: {block: "block_name"} - Mine blocks (stone, iron_ore, etc.)
- navigateTo: {x, y, z} - Move to coordinates
- attackEntity: {entity: "entity_type"} - Attack mobs
- equipItem: {item: "item_name"} - Equip tools/armor
- useItem: Use held item (for bucket, flint&steel, etc.)
- lookAround: Survey area (use sparingly!)

RESPOND WITH JSON ONLY:
{
  "action": "action_name",
  "parameters": {},
  "reasoning": "Brief explanation"
}`;

export async function getAIDecision(gameState: GameState): Promise<AIDecision> {
    const stateDescription = formatGameState(gameState);

    try {
        const response = await getAnthropicClient().messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Current game state:\n${stateDescription}\n\nWhat action should I take next? Respond with JSON only.`
                }
            ]
        });

        const content = response.content[0];
        if (content.type === 'text') {
            // Extract JSON from response
            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as AIDecision;
            }
        }

        // Fallback action
        return {
            action: 'lookAround',
            reasoning: 'Could not parse AI response, surveying area'
        };
    } catch (error: any) {
        console.error('❌ AI decision error:');
        console.error('  Message:', error.message);
        console.error('  Status:', error.status);
        console.error('  Full error:', JSON.stringify(error, null, 2));
        if (error.status === 401) {
            console.error('❌ Invalid API key! Check your ANTHROPIC_API_KEY in .env');
        } else if (error.status === 429) {
            console.error('⏳ Rate limited, waiting...');
        }
        return {
            action: 'lookAround',
            reasoning: 'AI error, surveying area'
        };
    }
}

function formatGameState(state: GameState): string {
    return `
POSITION: x=${state.position.x.toFixed(1)}, y=${state.position.y.toFixed(1)}, z=${state.position.z.toFixed(1)}
DIMENSION: ${state.dimension}
HEALTH: ${state.health}/20
HUNGER: ${state.food}/20
TIME: ${state.timeOfDay} (${state.isDay ? 'Day' : 'Night'})
GAME PHASE: ${state.phase}
ELAPSED TIME: ${state.elapsedSeconds}s

INVENTORY:
${state.inventory.map(item => `- ${item.name} x${item.count}`).join('\n') || '(empty)'}

NEARBY BLOCKS:
${state.nearbyBlocks.slice(0, 10).map(b => `- ${b.name} at (${b.x}, ${b.y}, ${b.z})`).join('\n') || '(none visible)'}

NEARBY ENTITIES:
${state.nearbyEntities.slice(0, 5).map(e => `- ${e.type} at distance ${e.distance.toFixed(1)}`).join('\n') || '(none)'}

CURRENT GOALS:
${state.currentGoals.join('\n') || '- Start speedrun'}
`;
}
