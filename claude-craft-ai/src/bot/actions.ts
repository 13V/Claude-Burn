import { Bot } from 'mineflayer';
import { goals, Movements } from 'mineflayer-pathfinder';
import { Vec3 } from 'vec3';
import { AIDecision } from '../ai/claude';

const { GoalNear, GoalBlock, GoalXZ, GoalGetToBlock } = goals;

export interface ActionResult {
    success: boolean;
    message: string;
    data?: any;
}

export class ActionExecutor {
    private bot: Bot;
    private movements: Movements;

    constructor(bot: Bot) {
        this.bot = bot;
        // @ts-ignore - pathfinder types
        this.movements = new Movements(bot);
        this.movements.allowSprinting = true;
        this.movements.canDig = true;
    }

    async execute(decision: AIDecision): Promise<ActionResult> {
        console.log(`[ACTION] ${decision.action}: ${decision.reasoning}`);

        try {
            switch (decision.action) {
                case 'gatherWood':
                    return await this.gatherWood();
                case 'craftItem':
                    return await this.craftItem(decision.parameters?.item);
                case 'mineBlock':
                    return await this.mineBlock(decision.parameters?.block);
                case 'navigateTo':
                    return await this.navigateTo(
                        decision.parameters?.x,
                        decision.parameters?.y,
                        decision.parameters?.z
                    );
                case 'attackEntity':
                    return await this.attackEntity(decision.parameters?.entity || decision.target);
                case 'buildPortal':
                    return await this.buildNetherPortal();
                case 'useItem':
                    return await this.useItem();
                case 'equipItem':
                    return await this.equipItem(decision.parameters?.item);
                case 'eat':
                    return await this.eat();
                case 'lookAround':
                    return await this.lookAround();
                case 'smeltItem':
                    return await this.smeltItem(decision.parameters?.item, decision.parameters?.fuel);
                default:
                    return { success: false, message: `Unknown action: ${decision.action}` };
            }
        } catch (error: any) {
            return { success: false, message: `Action failed: ${error.message}` };
        }
    }

    private async gatherWood(): Promise<ActionResult> {
        // Find nearest log
        const logTypes = ['oak_log', 'birch_log', 'spruce_log', 'jungle_log', 'acacia_log', 'dark_oak_log'];

        for (const logType of logTypes) {
            const log = this.bot.findBlock({
                matching: block => block.name === logType,
                maxDistance: 64
            });

            if (log) {
                // Navigate to log and mine it
                await this.goToBlock(log.position);
                await this.bot.dig(log);
                return { success: true, message: `Collected ${logType}` };
            }
        }

        return { success: false, message: 'No logs found nearby' };
    }

    private async craftItem(itemName: string): Promise<ActionResult> {
        if (!itemName) return { success: false, message: 'No item specified' };

        const mcData = require('minecraft-data')(this.bot.version);
        const item = mcData.itemsByName[itemName];

        if (!item) return { success: false, message: `Unknown item: ${itemName}` };

        // Items that require crafting table (3x3 recipes)
        const needsTable = ['wooden_pickaxe', 'stone_pickaxe', 'iron_pickaxe', 'diamond_pickaxe',
            'wooden_sword', 'stone_sword', 'iron_sword', 'diamond_sword',
            'wooden_axe', 'stone_axe', 'iron_axe', 'diamond_axe',
            'wooden_shovel', 'stone_shovel', 'iron_shovel', 'diamond_shovel',
            'wooden_hoe', 'stone_hoe', 'iron_hoe', 'diamond_hoe',
            'bow', 'bucket', 'flint_and_steel', 'shears', 'bed',
            'furnace', 'chest', 'shield', 'iron_helmet', 'iron_chestplate',
            'iron_leggings', 'iron_boots'];

        const requiresTable = needsTable.includes(itemName);

        // If we need a crafting table, find or place one first
        if (requiresTable) {
            let craftingTable = this.bot.findBlock({
                matching: block => block.name === 'crafting_table',
                maxDistance: 32
            });

            if (!craftingTable) {
                // Try to place from inventory
                const tableItem = this.bot.inventory.items().find(i => i.name === 'crafting_table');
                if (!tableItem) {
                    return { success: false, message: 'Need to craft a crafting_table first (use craftItem with item=crafting_table)' };
                }

                // Place the table
                const pos = this.bot.entity.position;
                const below = this.bot.blockAt(pos.offset(1, -1, 0));

                if (below && below.name !== 'air') {
                    try {
                        await this.bot.equip(tableItem, 'hand');
                        // @ts-ignore
                        await this.bot.placeBlock(below, new (require('vec3')).Vec3(0, 1, 0));
                        console.log('📦 Placed crafting table!');
                        await new Promise(r => setTimeout(r, 500));
                    } catch (e: any) {
                        console.log('Failed to place table:', e.message);
                    }
                }

                craftingTable = this.bot.findBlock({
                    matching: block => block.name === 'crafting_table',
                    maxDistance: 8
                });
            }

            if (!craftingTable) {
                return { success: false, message: 'Could not find or place crafting table' };
            }

            await this.goToBlock(craftingTable.position);
        }

        // Now try to get recipe and craft
        // @ts-ignore
        const recipes = this.bot.recipesFor(item.id, null, 1, requiresTable ? this.bot.findBlock({ matching: b => b.name === 'crafting_table', maxDistance: 4 }) : null);

        if (recipes.length === 0) {
            // Check if we're missing materials
            return { success: false, message: `No recipe found for ${itemName} - check if you have required materials` };
        }

        try {
            const recipe = recipes[0];
            await this.bot.craft(recipe, 1, requiresTable ? this.bot.findBlock({ matching: b => b.name === 'crafting_table', maxDistance: 4 }) ?? undefined : undefined);
            return { success: true, message: `Crafted ${itemName}` };
        } catch (e: any) {
            return { success: false, message: `Craft failed: ${e.message}` };
        }
    }

    private async mineBlock(blockName: string): Promise<ActionResult> {
        if (!blockName) return { success: false, message: 'No block specified' };

        const block = this.bot.findBlock({
            matching: b => b.name.includes(blockName),
            maxDistance: 64
        });

        if (!block) {
            return { success: false, message: `No ${blockName} found nearby` };
        }

        await this.goToBlock(block.position);

        // Equip best tool
        await this.equipBestTool(block);

        await this.bot.dig(block);
        return { success: true, message: `Mined ${block.name}` };
    }

    private async navigateTo(x: number, y: number, z: number): Promise<ActionResult> {
        if (x === undefined || z === undefined) {
            return { success: false, message: 'Invalid coordinates' };
        }

        const goal = new GoalNear(x, y || this.bot.entity.position.y, z, 2);

        // @ts-ignore - pathfinder
        this.bot.pathfinder.setMovements(this.movements);
        // @ts-ignore
        this.bot.pathfinder.setGoal(goal);

        // Wait for arrival or timeout
        await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => resolve(), 30000);
            // @ts-ignore
            this.bot.once('goal_reached', () => {
                clearTimeout(timeout);
                resolve();
            });
        });

        return { success: true, message: `Navigated to ${x}, ${y}, ${z}` };
    }

    private async attackEntity(entityType: string): Promise<ActionResult> {
        if (!entityType) return { success: false, message: 'No entity specified' };

        const entity = this.bot.nearestEntity(e =>
            e.name?.toLowerCase().includes(entityType.toLowerCase()) ||
            e.type?.toLowerCase().includes(entityType.toLowerCase())
        );

        if (!entity) {
            return { success: false, message: `No ${entityType} found nearby` };
        }

        // Equip weapon
        await this.equipBestWeapon();

        // @ts-ignore - pvp
        if (this.bot.pvp) {
            // @ts-ignore
            this.bot.pvp.attack(entity);

            // Wait for entity death or escape
            await new Promise(resolve => setTimeout(resolve, 5000));
            // @ts-ignore
            this.bot.pvp.stop();
        } else {
            // Manual attack
            this.bot.attack(entity);
        }

        return { success: true, message: `Attacked ${entityType}` };
    }

    private async buildNetherPortal(): Promise<ActionResult> {
        // Check for obsidian
        const obsidian = this.bot.inventory.items().filter(i => i.name === 'obsidian');
        const obsidianCount = obsidian.reduce((sum, i) => sum + i.count, 0);

        if (obsidianCount < 10) {
            return { success: false, message: `Need 10 obsidian, have ${obsidianCount}` };
        }

        // Check for flint and steel
        const flint = this.bot.inventory.items().find(i => i.name === 'flint_and_steel');
        if (!flint) {
            return { success: false, message: 'Need flint and steel' };
        }

        // Simple portal build logic (placeholder - full implementation would be complex)
        return { success: false, message: 'Portal building not fully implemented - manual override needed' };
    }

    private async useItem(): Promise<ActionResult> {
        await this.bot.activateItem();
        return { success: true, message: 'Used item' };
    }

    private async equipItem(itemName: string): Promise<ActionResult> {
        if (!itemName) return { success: false, message: 'No item specified' };

        const item = this.bot.inventory.items().find(i => i.name.includes(itemName));
        if (!item) {
            return { success: false, message: `${itemName} not in inventory` };
        }

        await this.bot.equip(item, 'hand');
        return { success: true, message: `Equipped ${item.name}` };
    }

    private async eat(): Promise<ActionResult> {
        const foods = ['cooked_beef', 'cooked_porkchop', 'bread', 'apple', 'carrot', 'potato'];

        for (const food of foods) {
            const item = this.bot.inventory.items().find(i => i.name.includes(food));
            if (item) {
                await this.bot.equip(item, 'hand');
                await this.bot.consume();
                return { success: true, message: `Ate ${item.name}` };
            }
        }

        return { success: false, message: 'No food in inventory' };
    }

    private async lookAround(): Promise<ActionResult> {
        // Rotate view to survey area
        for (let i = 0; i < 4; i++) {
            await this.bot.look(this.bot.entity.yaw + Math.PI / 2, 0);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        return { success: true, message: 'Surveyed surroundings' };
    }

    private async smeltItem(item: string, fuel: string): Promise<ActionResult> {
        // Find furnace
        const furnace = this.bot.findBlock({
            matching: block => block.name === 'furnace',
            maxDistance: 32
        });

        if (!furnace) {
            return { success: false, message: 'No furnace nearby' };
        }

        // Placeholder - smelting logic
        return { success: false, message: 'Smelting not fully implemented' };
    }

    // Helper methods
    private async goToBlock(position: Vec3): Promise<void> {
        const goal = new GoalGetToBlock(position.x, position.y, position.z);
        // @ts-ignore
        this.bot.pathfinder.setMovements(this.movements);
        // @ts-ignore
        this.bot.pathfinder.setGoal(goal);

        await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => resolve(), 15000);
            // @ts-ignore
            this.bot.once('goal_reached', () => {
                clearTimeout(timeout);
                resolve();
            });
        });
    }

    private async equipBestTool(block: any): Promise<void> {
        // Simple logic - equip pickaxe for stone, axe for wood
        const tools = this.bot.inventory.items().filter(i =>
            i.name.includes('pickaxe') || i.name.includes('axe') || i.name.includes('shovel')
        );

        if (tools.length > 0) {
            // Prioritize diamond > iron > stone > wood
            const sorted = tools.sort((a, b) => {
                const priority = ['diamond', 'iron', 'stone', 'wooden'];
                const aP = priority.findIndex(p => a.name.includes(p));
                const bP = priority.findIndex(p => b.name.includes(p));
                return aP - bP;
            });

            await this.bot.equip(sorted[0], 'hand');
        }
    }

    private async equipBestWeapon(): Promise<void> {
        const weapons = this.bot.inventory.items().filter(i =>
            i.name.includes('sword') || i.name.includes('axe')
        );

        if (weapons.length > 0) {
            const sorted = weapons.sort((a, b) => {
                const priority = ['diamond', 'iron', 'stone', 'wooden'];
                const aP = priority.findIndex(p => a.name.includes(p));
                const bP = priority.findIndex(p => b.name.includes(p));
                return aP - bP;
            });

            await this.bot.equip(sorted[0], 'hand');
        }
    }
}
