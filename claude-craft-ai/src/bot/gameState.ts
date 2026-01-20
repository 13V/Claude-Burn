import { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';

export interface InventoryItem {
    name: string;
    count: number;
    slot: number;
}

export interface NearbyBlock {
    name: string;
    x: number;
    y: number;
    z: number;
}

export interface NearbyEntity {
    type: string;
    name?: string;
    distance: number;
    position: Vec3;
    health?: number;
}

export type GamePhase =
    | 'early_game'
    | 'tool_progression'
    | 'nether_prep'
    | 'nether'
    | 'end_prep'
    | 'stronghold_search'
    | 'end_fight'
    | 'completed';

export interface GameState {
    // Player status
    position: Vec3;
    health: number;
    food: number;
    dimension: string;
    elapsedTime: string;
    timeOfDay: number;
    isDay: boolean;
    elapsedSeconds: number;

    // Inventory
    inventory: InventoryItem[];
    equippedItem?: string;

    // Surroundings
    nearbyBlocks: NearbyBlock[];
    nearbyEntities: NearbyEntity[];

    // Game progress
    phase: GamePhase;
    currentGoals: string[];

    // Flags
    hasWood: boolean;
    hasPickaxe: boolean;
    hasIronTools: boolean;
    hasDiamondTools: boolean;
    hasBlazeRods: boolean;
    hasEnderPearls: boolean;
    portalBuilt: boolean;
    inNether: boolean;
    inEnd: boolean;
}

export function captureGameState(bot: Bot, startTime: number): GameState {
    const position = bot.entity.position.clone();
    const inventory = getInventory(bot);
    const nearbyBlocks = getNearbyBlocks(bot);
    const nearbyEntities = getNearbyEntities(bot);

    // Determine game phase
    const phase = determinePhase(bot, inventory);
    const goals = getGoalsForPhase(phase, inventory);

    // Check inventory flags
    const hasWood = inventory.some(i => i.name.includes('log') || i.name.includes('planks'));
    const hasPickaxe = inventory.some(i => i.name.includes('pickaxe'));
    const hasIronTools = inventory.some(i => i.name.includes('iron_pickaxe'));
    const hasDiamondTools = inventory.some(i => i.name.includes('diamond_pickaxe'));
    const hasBlazeRods = inventory.some(i => i.name === 'blaze_rod');
    const hasEnderPearls = inventory.some(i => i.name === 'ender_pearl');

    const dimension = bot.game.dimension;

    return {
        position,
        health: bot.health,
        food: bot.food,
        dimension,
        elapsedTime: formatElapsed(startTime),
        timeOfDay: bot.time.timeOfDay,
        isDay: bot.time.timeOfDay < 13000,
        elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
        inventory,
        equippedItem: bot.heldItem?.name,
        nearbyBlocks,
        nearbyEntities,
        phase,
        currentGoals: goals,
        hasWood,
        hasPickaxe,
        hasIronTools,
        hasDiamondTools,
        hasBlazeRods,
        hasEnderPearls,
        portalBuilt: false, // Track separately
        inNether: dimension === 'the_nether',
        inEnd: dimension === 'the_end'
    };
}

function formatElapsed(startTime: number): string {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

function getInventory(bot: Bot): InventoryItem[] {
    return bot.inventory.items().map(item => ({
        name: item.name,
        count: item.count,
        slot: item.slot
    }));
}

function getNearbyBlocks(bot: Bot): NearbyBlock[] {
    const blocks: NearbyBlock[] = [];
    const pos = bot.entity.position;

    // Scan a small area around the player
    for (let x = -8; x <= 8; x++) {
        for (let y = -4; y <= 4; y++) {
            for (let z = -8; z <= 8; z++) {
                const block = bot.blockAt(pos.offset(x, y, z));
                if (block && block.name !== 'air') {
                    blocks.push({
                        name: block.name,
                        x: block.position.x,
                        y: block.position.y,
                        z: block.position.z
                    });
                }
            }
        }
    }

    return blocks;
}

function getNearbyEntities(bot: Bot): NearbyEntity[] {
    const entities: NearbyEntity[] = [];
    const pos = bot.entity.position;

    for (const entity of Object.values(bot.entities)) {
        if (entity === bot.entity) continue;

        const distance = pos.distanceTo(entity.position);
        if (distance < 32) {
            entities.push({
                type: entity.name || entity.type || 'unknown',
                distance,
                position: entity.position.clone(),
                health: (entity as any).health
            });
        }
    }

    // Sort by distance
    entities.sort((a, b) => a.distance - b.distance);

    return entities;
}

function determinePhase(bot: Bot, inventory: InventoryItem[]): GamePhase {
    const dimension = bot.game.dimension;

    if (dimension === 'the_end') return 'end_fight';
    if (dimension === 'the_nether') return 'nether';

    const hasBlaze = inventory.some(i => i.name === 'blaze_rod' || i.name === 'blaze_powder');
    const hasPearls = inventory.some(i => i.name === 'ender_pearl' || i.name === 'ender_eye');
    const hasIron = inventory.some(i => i.name.includes('iron'));
    const hasTools = inventory.some(i => i.name.includes('pickaxe'));

    if (hasBlaze && hasPearls) return 'stronghold_search';
    if (hasBlaze) return 'end_prep';
    if (hasIron && hasTools) return 'nether_prep';
    if (hasTools) return 'tool_progression';

    return 'early_game';
}

function getGoalsForPhase(phase: GamePhase, inventory: InventoryItem[]): string[] {
    // Count specific items
    const logCount = inventory.filter(i => i.name.includes('_log')).reduce((sum, i) => sum + i.count, 0);
    const plankCount = inventory.filter(i => i.name.includes('planks')).reduce((sum, i) => sum + i.count, 0);
    const stickCount = inventory.filter(i => i.name === 'stick').reduce((sum, i) => sum + i.count, 0);
    const hasCraftingTable = inventory.some(i => i.name === 'crafting_table');
    const hasWoodenPickaxe = inventory.some(i => i.name === 'wooden_pickaxe');
    const hasStonePickaxe = inventory.some(i => i.name === 'stone_pickaxe');
    const cobbleCount = inventory.filter(i => i.name === 'cobblestone').reduce((sum, i) => sum + i.count, 0);

    switch (phase) {
        case 'early_game':
            const goals: string[] = [];

            if (logCount < 3 && plankCount < 12) {
                goals.push('GET WOOD NOW - punch nearest tree, need 3+ logs');
            } else if (logCount >= 3 || plankCount >= 4) {
                // Have enough wood to craft!
                if (plankCount < 4 && logCount > 0) {
                    goals.push('CRAFT NOW: craftItem with item="oak_planks" (or any planks)');
                }
                if (!hasCraftingTable && plankCount >= 4) {
                    goals.push('CRAFT NOW: craftItem with item="crafting_table"');
                }
                if (stickCount < 2 && plankCount >= 2) {
                    goals.push('CRAFT NOW: craftItem with item="stick"');
                }
                if (!hasWoodenPickaxe && hasCraftingTable && plankCount >= 3 && stickCount >= 2) {
                    goals.push('CRAFT NOW: craftItem with item="wooden_pickaxe"');
                }
                if (hasWoodenPickaxe && cobbleCount < 3) {
                    goals.push('MINE STONE: mineBlock with block="stone" - need 3 cobblestone');
                }
                if (!hasStonePickaxe && cobbleCount >= 3 && stickCount >= 2) {
                    goals.push('CRAFT NOW: craftItem with item="stone_pickaxe"');
                }
            }

            if (goals.length === 0) {
                goals.push('Progress to next phase - look for iron ore');
            }

            return goals;
        case 'tool_progression':
            return [
                'Mine iron ore (need 3+)',
                'Craft furnace',
                'Smelt iron ingots',
                'Craft iron pickaxe'
            ];
        case 'nether_prep':
            return [
                'Get 10 obsidian (bucket method or mine)',
                'Build nether portal',
                'Get flint and steel',
                'Enter Nether'
            ];
        case 'nether':
            return [
                'Find nether fortress',
                'Kill blazes (need 6+ rods)',
                'Return to overworld'
            ];
        case 'end_prep':
            return [
                'Hunt endermen (need 12 pearls)',
                'Craft eyes of ender',
                'Throw eyes to find stronghold'
            ];
        case 'stronghold_search':
            return [
                'Follow eye of ender',
                'Dig to stronghold',
                'Find end portal',
                'Activate portal'
            ];
        case 'end_fight':
            return [
                'Destroy end crystals',
                'Attack dragon when perched',
                'Defeat the Ender Dragon!'
            ];
        default:
            return ['Speedrun complete!'];
    }
}
