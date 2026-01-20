/**
 * Scripted Speedrun Sequences
 * Pre-programmed action sequences that execute quickly without API calls
 */

import { Bot } from 'mineflayer';
import { goals, Movements } from 'mineflayer-pathfinder';

const { GoalNear, GoalBlock, GoalGetToBlock } = goals;

export class SpeedrunSequencer {
    private bot: Bot;
    private movements: Movements;

    constructor(bot: Bot) {
        this.bot = bot;
        // @ts-ignore
        this.movements = new Movements(bot);
        this.movements.allowSprinting = true;
        this.movements.canDig = true;
        this.movements.allow1by1towers = true;
        this.movements.allowParkour = true;

        // Increase pathfinding timeout
        // @ts-ignore
        this.bot.pathfinder.thinkTimeout = 10000; // 10s thinking time
    }

    /**
     * Execute the early game sequence (loot -> wood -> tools -> stone pickaxe)
     * This runs without API calls for maximum speed
     */
    async executeEarlyGame(): Promise<boolean> {
        console.log('⚡ FAST MODE: Executing early game sequence...');

        try {
            // Seed-specific optimization: Rush village first if on our God Seed
            if (this.isGodSeed()) {
                await this.rushVillage();
            }

            // Step 0: Loot nearby chests (village/portal)
            await this.lootNearbyChests();

            // Step 1: Get wood (only if needed)
            const logCount = this.bot.inventory.items().filter(i => i.name.includes('_log')).reduce((sum, i) => sum + i.count, 0);
            if (logCount < 4) {
                await this.gatherLogs(4 - logCount);
            }

            // Step 2-4: Basic tools (if not found in chests)
            await this.craftPlanks();
            await this.craftCraftingTable();
            await this.craftSticks();

            // Step 5: Place table and craft wooden pickaxe (if needed)
            const hasPickaxe = this.bot.inventory.items().some(i => i.name.includes('pickaxe'));
            if (!hasPickaxe) {
                await this.placeCraftingTable();
                await this.craftWoodenPickaxe();
            }

            // Step 6: Iron Golem skip (if in village)
            const ironInInv = this.bot.inventory.items().find(i => i.name === 'iron_ingot');
            if (!ironInInv || ironInInv.count < 3) {
                await this.huntIronGolem();
            }

            // Step 7: Mine stone for stone pickaxe (if needed)
            const hasStonePickaxe = this.bot.inventory.items().some(i => i.name === 'stone_pickaxe' || i.name === 'iron_pickaxe' || i.name === 'diamond_pickaxe');
            if (!hasStonePickaxe) {
                await this.mineStone(3);
                await this.craftStonePickaxe();
            }

            console.log('✅ Early game complete!');
            return true;
        } catch (e: any) {
            console.log('❌ Early game failed:', e.message);
            return false;
        }
    }

    private isGodSeed(): boolean {
        // We know we are on 1005528248408831 if the spawn is near x:17, z:8
        const pos = this.bot.entity.position;
        return Math.abs(pos.x - 17) < 50 && Math.abs(pos.z - 8) < 50;
    }

    private async rushVillage(): Promise<void> {
        console.log('🏃 Rushing village at (52, 68, 151)...');
        const villagePos = new (require('vec3')).Vec3(52, 68, 151);

        try {
            await this.goTo(villagePos);

            // Verify arrival
            const distance = this.bot.entity.position.distanceTo(villagePos);
            if (distance > 10) {
                console.log(`  Timeout/Stuck during rush (Distance: ${distance.toFixed(1)}). Retrying...`);
                await this.goTo(villagePos);
            }
        } catch (err) {
            console.log('  Rush failed, continuing sequence...');
        }
    }

    private async goTo(position: any): Promise<void> {
        // Use GoalNear for more flexibility than GoalGetToBlock
        const goal = new (require('mineflayer-pathfinder').goals.GoalNear)(position.x, position.y, position.z, 2);

        // @ts-ignore
        this.bot.pathfinder.setMovements(this.movements);

        let lastPos = this.bot.entity.position.clone();
        let stuckCount = 0;

        // Active stuck detection loop
        const stuckInterval = setInterval(() => {
            if (this.bot.entity.position.distanceTo(lastPos) < 0.2) {
                stuckCount++;
                if (stuckCount >= 3) {
                    console.log('⚠️ Stuck detected! Attempting emergency jump...');
                    this.bot.setControlState('jump', true);
                    setTimeout(() => this.bot.setControlState('jump', false), 500);
                    stuckCount = 0;
                }
            } else {
                stuckCount = 0;
            }
            lastPos = this.bot.entity.position.clone();
        }, 1000);

        try {
            // @ts-ignore
            await this.bot.pathfinder.goto(goal);
        } catch (err) {
            console.log(`  Pathfinding error, clearing nearby block:`, (err as Error).message);
            // Try to dig the block in front to clear a path
            const forward = this.bot.blockAt(this.bot.entity.position.offset(1, 0, 0));
            if (forward && forward.name !== 'air' && forward.name !== 'water' && forward.name !== 'lava') {
                await this.bot.dig(forward);
            }
        } finally {
            clearInterval(stuckInterval);
        }
    }

    private async huntIronGolem(): Promise<void> {
        console.log('🗡️ Looking for Iron Golem to farm iron...');
        const golem = this.bot.nearestEntity(e => e.name === 'iron_golem');

        if (golem) {
            console.log('  Found Golem! Pillar up and kill...');
            try {
                // Get ANY blocks for pillaring (3 is enough)
                const blocksInInv = this.bot.inventory.items().filter(i =>
                    i.name.includes('dirt') || i.name.includes('grass') || i.name.includes('stone') || i.name.includes('cobble') || i.name.includes('planks')
                ).reduce((sum, i) => sum + i.count, 0);

                if (blocksInInv < 3) {
                    console.log('  Need blocks for pillaring, getting some dirt/sand...');
                    await this.getPillarBlocks(3 - blocksInInv);
                }

                // Go near golem but not right on it
                await this.goTo(golem.position.offset(2, 0, 2));

                // Pillar up 3 blocks for safety
                console.log('  Pillaring up...');
                const pillarBlock = this.bot.inventory.items().find(i =>
                    i.name.includes('dirt') || i.name.includes('grass') || i.name.includes('stone') || i.name.includes('planks')
                );
                if (pillarBlock) {
                    for (let i = 0; i < 3; i++) {
                        await this.bot.equip(pillarBlock, 'hand');
                        this.bot.setControlState('jump', true);
                        await this.sleep(350);
                        // @ts-ignore
                        await this.bot.placeBlock(this.bot.blockAt(this.bot.entity.position.offset(0, -1, 0)), new (require('vec3')).Vec3(0, 1, 0));
                        this.bot.setControlState('jump', false);
                        await this.sleep(200);
                    }
                }

                // Attack golem from safety
                for (let i = 0; i < 20; i++) {
                    const currentGolem = this.bot.nearestEntity(e => e.name === 'iron_golem');
                    if (!currentGolem) break;

                    // @ts-ignore
                    this.bot.attack(currentGolem);
                    await this.sleep(600);
                }

                console.log('  Golem defeated! Collecting iron...');
                await this.sleep(2000); // Wait for drops
                const drops = this.bot.nearestEntity(e => e.name === 'item' && (e as any).onGround);
                if (drops) await this.goTo(drops.position);
            } catch (err) {
                console.log('  Failed golem hunt:', (err as Error).message);
            }
        } else {
            console.log('  No Golem found in village.');
        }
    }

    /**
     * Find and loot nearby chests
     */
    async lootNearbyChests(): Promise<void> {
        console.log('📦 Looking for nearby chests...');
        const chests = this.bot.findBlocks({
            matching: block => block.name === 'chest' || block.name === 'trapped_chest' || block.name === 'barrel',
            maxDistance: 64,
            count: 10
        });

        if (chests.length === 0) {
            console.log('  No chests found nearby.');
            return;
        }

        for (const chestPos of chests) {
            const block = this.bot.blockAt(chestPos);
            if (!block) continue;

            console.log(`  Opening ${block.name} at ${chestPos}...`);
            try {
                await this.goTo(chestPos);
                const container = await this.bot.openContainer(block);

                // Loot all items
                const items = container.containerItems();
                for (const item of items) {
                    console.log(`    Looted ${item.name} x${item.count}`);
                    try {
                        await container.withdraw(item.type, null, item.count);
                        await this.sleep(200);
                    } catch (err) {
                        // Sometimes slots are weird, just continue
                    }
                }
                container.close();
            } catch (err) {
                console.log(`  Failed to loot chest at ${chestPos}:`, (err as Error).message);
            }
        }
    }

    /**
     * Execute iron gathering sequence with survival checks
     */
    async executeIronGathering(): Promise<boolean> {
        console.log('⚡ FAST MODE: Gathering iron (SAFE)...');

        try {
            // Check if we already have iron (from looting or golem)
            const ironIngots = this.bot.inventory.items().filter(i => i.name === 'iron_ingot').reduce((sum, i) => sum + i.count, 0);
            const ironOre = this.bot.inventory.items().filter(i => i.name === 'iron_ore' || i.name === 'raw_iron').reduce((sum, i) => sum + i.count, 0);

            if (ironIngots >= 3) {
                console.log('✅ Already have iron ingots, skipping mining phase.');
                return true;
            }

            if (ironOre >= 3) {
                console.log('✅ Already have iron ore, skipping mining phase.');
                await this.craftFurnace();
                return true;
            }

            // Survival check first
            await this.handleSurvival();

            // First, try to find iron on surface or in caves
            const ironMined = await this.safeMinOre('iron_ore', 6);
            if (ironMined < 3) {
                console.log('⚠️ Only found', ironMined, 'iron ore');
                return false;
            }

            // Craft furnace
            await this.handleSurvival();
            await this.craftFurnace();

            console.log('✅ Iron gathering complete!');
            return true;
        } catch (e: any) {
            console.log('❌ Iron gathering failed:', e.message);
            return false;
        }
    }

    /**
     * Execute nether preparation (smelt iron, craft bucket, get water)
     */
    async executeNetherPrep(): Promise<boolean> {
        console.log('⚡ FAST MODE: Preparing for Nether...');

        try {
            // 0. Check if we already have items
            const hasBucket = this.bot.inventory.items().some(i => i.name === 'bucket');
            const hasWaterBucket = this.bot.inventory.items().some(i => i.name === 'water_bucket');

            if (hasWaterBucket) {
                console.log('✅ Already have water bucket, skipping prep.');
                return true;
            }

            // 1. Smelt iron (if needed)
            const ironIngots = this.bot.inventory.items().filter(i => i.name === 'iron_ingot').reduce((sum, i) => sum + i.count, 0);
            if (!hasBucket && !hasWaterBucket && ironIngots < 3) {
                await this.smeltIron(3);
            }

            // 2. Craft bucket (if needed)
            if (!hasBucket && !hasWaterBucket) {
                await this.craftBucket();
            }

            // 3. Get water (if needed)
            if (!hasWaterBucket) {
                await this.getWater();
            }

            console.log('✅ Nether prep complete! Have water bucket.');
            return true;
        } catch (e: any) {
            console.log('❌ Nether prep failed:', e.message);
            return false;
        }
    }

    private async smeltIron(count: number): Promise<void> {
        console.log(`🔥 Smelting ${count} iron ingots...`);

        const furnace = this.bot.findBlock({
            matching: b => b.name === 'furnace',
            maxDistance: 32
        });

        if (!furnace) {
            // Place furnace if we have one
            const furnaceItem = this.bot.inventory.items().find(i => i.name === 'furnace');
            if (!furnaceItem) throw new Error('No furnace to smelt with');

            const pos = this.bot.entity.position;
            const below = this.bot.blockAt(pos.offset(1, -1, 0));
            if (below && below.name !== 'air') {
                await this.bot.equip(furnaceItem, 'hand');
                // @ts-ignore
                await this.bot.placeBlock(below, new (require('vec3')).Vec3(0, 1, 0));
                await this.sleep(500);
            }
        }

        const furnaceBlock = this.bot.findBlock({
            matching: b => b.name === 'furnace',
            maxDistance: 4
        });

        if (!furnaceBlock) throw new Error('Could not find placed furnace');

        const furnaceObj = await this.bot.openFurnace(furnaceBlock);

        // Add fuel (logs or coal)
        const fuel = this.bot.inventory.items().find(i =>
            i.name.includes('log') || i.name.includes('planks') || i.name === 'coal' || i.name === 'charcoal' || i.name === 'stick'
        );
        if (!fuel) throw new Error('No fuel for furnace');

        await furnaceObj.putFuel(fuel.type, null, Math.min(fuel.count, 2));

        // Add iron ore
        const ironOre = this.bot.inventory.items().find(i => i.name === 'iron_ore' || i.name === 'raw_iron');
        if (!ironOre) throw new Error('No iron ore to smelt');

        await furnaceObj.putInput(ironOre.type, null, count);

        console.log('  Waiting for smelting...');
        // Wait for smelting (10s per item)
        await this.sleep(count * 10500);

        // Take output
        await furnaceObj.takeOutput();
        furnaceObj.close();
        console.log('  Collected iron ingots!');
    }

    private async craftBucket(): Promise<void> {
        console.log('🔨 Crafting bucket...');
        const mcData = require('minecraft-data')(this.bot.version);
        const item = mcData.itemsByName['bucket'];

        const table = this.bot.findBlock({
            matching: b => b.name === 'crafting_table',
            maxDistance: 32
        });

        if (!table) throw new Error('No crafting table found for bucket');

        await this.goTo(table.position);

        // @ts-ignore
        const recipes = this.bot.recipesFor(item.id, null, 1, table);
        if (recipes.length > 0) {
            await this.bot.craft(recipes[0], 1, table);
            console.log('✅ Crafted bucket!');
        } else {
            throw new Error('Could not craft bucket - check materials');
        }
    }

    private async getWater(): Promise<void> {
        console.log('💧 Finding water...');

        const water = this.bot.findBlock({
            matching: b => b.name === 'water' || b.name === 'flowing_water',
            maxDistance: 64
        });

        if (!water) {
            console.log('  No water nearby, searching...');
            // In a real speedrun, we'd search further, but for now just fail
            throw new Error('No water found nearby');
        }

        const bucket = this.bot.inventory.items().find(i => i.name === 'bucket');
        if (!bucket) throw new Error('No bucket to collect water');

        await this.goTo(water.position);
        await this.bot.equip(bucket, 'hand');

        // @ts-ignore
        await this.bot.activateBlock(water);
        console.log('✅ Collected water!');
    }


    // === HELPER METHODS ===

    private async gatherLogs(count: number): Promise<void> {
        console.log(`🪓 Gathering ${count} logs...`);

        for (let i = 0; i < count; i++) {
            let log = this.bot.findBlock({
                matching: block => block.name.includes('_log'),
                maxDistance: 32
            });

            if (!log) {
                console.log('  No logs in sight, moving to find some...');
                // Move in a random direction to find trees
                const angle = Math.random() * Math.PI * 2;
                const dest = this.bot.entity.position.offset(Math.cos(angle) * 20, 0, Math.sin(angle) * 20);
                await this.goTo(dest);

                log = this.bot.findBlock({
                    matching: block => block.name.includes('_log'),
                    maxDistance: 32
                });
            }

            if (!log) {
                if (i > 0) {
                    console.log('  Could only find', i, 'logs, continuing anyway...');
                    return;
                }
                throw new Error('No logs found nearby even after moving');
            }

            await this.goTo(log.position);
            await this.bot.dig(log);
            console.log(`  Got log ${i + 1}/${count}`);
        }
    }

    private async craftPlanks(): Promise<void> {
        console.log('🔨 Crafting planks...');
        const mcData = require('minecraft-data')(this.bot.version);

        // Find any log in inventory
        const log = this.bot.inventory.items().find(i => i.name.includes('_log'));
        if (!log) throw new Error('No logs in inventory');

        // Craft planks from the log type we have
        const plankType = log.name.replace('_log', '_planks');
        const plankItem = mcData.itemsByName[plankType] || mcData.itemsByName['oak_planks'];

        // @ts-ignore
        const recipes = this.bot.recipesFor(plankItem.id, null, 1, null);
        if (recipes.length > 0) {
            await this.bot.craft(recipes[0], 4); // Craft 4 times to get 16 planks
        }
    }

    private async craftCraftingTable(): Promise<void> {
        console.log('🔨 Crafting crafting table...');
        const mcData = require('minecraft-data')(this.bot.version);
        const item = mcData.itemsByName['crafting_table'];

        // @ts-ignore
        const recipes = this.bot.recipesFor(item.id, null, 1, null);
        if (recipes.length > 0) {
            await this.bot.craft(recipes[0], 1);
        }
    }

    private async craftSticks(): Promise<void> {
        console.log('🔨 Crafting sticks...');
        const mcData = require('minecraft-data')(this.bot.version);
        const item = mcData.itemsByName['stick'];

        // @ts-ignore
        const recipes = this.bot.recipesFor(item.id, null, 1, null);
        if (recipes.length > 0) {
            await this.bot.craft(recipes[0], 2);
        }
    }

    private async placeCraftingTable(): Promise<void> {
        console.log('📦 Placing crafting table...');

        const tableItem = this.bot.inventory.items().find(i => i.name === 'crafting_table');
        if (!tableItem) throw new Error('No crafting table in inventory');

        const pos = this.bot.entity.position;
        const below = this.bot.blockAt(pos.offset(1, -1, 0));

        if (below && below.name !== 'air') {
            await this.bot.equip(tableItem, 'hand');
            // @ts-ignore
            await this.bot.placeBlock(below, new (require('vec3')).Vec3(0, 1, 0));
            await this.sleep(300);
        }
    }

    private async craftWoodenPickaxe(): Promise<void> {
        console.log('🔨 Crafting wooden pickaxe...');
        const mcData = require('minecraft-data')(this.bot.version);
        const item = mcData.itemsByName['wooden_pickaxe'];

        const table = this.bot.findBlock({
            matching: b => b.name === 'crafting_table',
            maxDistance: 4
        });

        // @ts-ignore
        const recipes = this.bot.recipesFor(item.id, null, 1, table);
        if (recipes.length > 0) {
            await this.bot.craft(recipes[0], 1, table ?? undefined);
            console.log('✅ Crafted wooden pickaxe!');
        }
    }

    private async mineStone(count: number): Promise<void> {
        console.log(`⛏️ Mining ${count} stone...`);

        // Equip pickaxe first
        const pickaxe = this.bot.inventory.items().find(i => i.name.includes('pickaxe'));
        if (pickaxe) await this.bot.equip(pickaxe, 'hand');

        let mined = 0;
        for (let attempt = 0; attempt < count * 5; attempt++) {
            const stone = this.bot.findBlock({
                matching: block => block.name === 'stone' || block.name === 'cobblestone' || block.name === 'andesite' || block.name === 'diorite',
                maxDistance: 32
            });

            if (!stone) {
                // Instead of digging straight down, try to find a "hillside" (block with air above/beside it)
                console.log('  No stone in sight, searching for exposed stone nearby...');
                await this.goTo(this.bot.entity.position.offset(Math.random() * 10 - 5, 0, Math.random() * 10 - 5));
                continue;
            }

            try {
                await this.goTo(stone.position);
                await this.bot.dig(stone);
                mined++;
            } catch (err) {
                console.log('  Dig failed/interrupted');
            }

            if (mined >= count) break;
        }
    }

    /**
     * Get any blocks (dirt, grass, etc.) for pillaring or pathfinding
     */
    private async getPillarBlocks(count: number): Promise<void> {
        console.log(`🌱 Getting ${count} blocks for pillaring...`);

        let gathered = 0;
        for (let i = 0; i < count; i++) {
            const target = this.bot.findBlock({
                matching: b => b.name === 'dirt' || b.name === 'grass_block' || b.name === 'sand' || b.name === 'gravel',
                maxDistance: 5
            });

            if (target) {
                await this.bot.dig(target);
                gathered++;
            } else {
                // If no dirt near, just dig whatever we are standing next to (at foot level)
                const footLevel = this.bot.blockAt(this.bot.entity.position.offset(1, 0, 0));
                if (footLevel && footLevel.name !== 'air') {
                    await this.bot.dig(footLevel);
                    gathered++;
                }
            }
        }
    }

    private async craftStonePickaxe(): Promise<void> {
        console.log('🔨 Crafting stone pickaxe...');
        const mcData = require('minecraft-data')(this.bot.version);
        const item = mcData.itemsByName['stone_pickaxe'];

        const table = this.bot.findBlock({
            matching: b => b.name === 'crafting_table',
            maxDistance: 32
        });

        if (!table) {
            await this.placeCraftingTable();
        }

        const tableNow = this.bot.findBlock({
            matching: b => b.name === 'crafting_table',
            maxDistance: 4
        });

        // @ts-ignore
        const recipes = this.bot.recipesFor(item.id, null, 1, tableNow);
        if (recipes.length > 0) {
            await this.bot.craft(recipes[0], 1, tableNow ?? undefined);
            console.log('✅ Crafted stone pickaxe!');
        }
    }

    private async craftFurnace(): Promise<void> {
        console.log('🔨 Crafting furnace...');
        // First ensure we have 8 cobblestone
        const cobble = this.bot.inventory.items().filter(i => i.name === 'cobblestone');
        const count = cobble.reduce((sum, i) => sum + i.count, 0);

        if (count < 8) {
            await this.mineStone(8 - count);
        }

        const mcData = require('minecraft-data')(this.bot.version);
        const item = mcData.itemsByName['furnace'];

        const table = this.bot.findBlock({
            matching: b => b.name === 'crafting_table',
            maxDistance: 32
        });

        // @ts-ignore
        const recipes = this.bot.recipesFor(item.id, null, 1, table);
        if (recipes.length > 0) {
            await this.bot.craft(recipes[0], 1, table ?? undefined);
            console.log('✅ Crafted furnace!');
        }
    }

    private async mineOre(oreType: string, count: number): Promise<number> {
        console.log(`⛏️ Mining ${count} ${oreType}...`);

        const pickaxe = this.bot.inventory.items().find(i => i.name.includes('pickaxe'));
        if (pickaxe) await this.bot.equip(pickaxe, 'hand');

        let mined = 0;
        for (let i = 0; i < count * 3; i++) { // Try more times since ore is sparse
            const ore = this.bot.findBlock({
                matching: block => block.name === oreType,
                maxDistance: 32
            });

            if (!ore) {
                // Dig around to find ore
                await this.digSearchPattern();
                continue;
            }

            await this.goTo(ore.position);
            await this.bot.dig(ore);
            mined++;

            if (mined >= count) break;
        }

        return mined;
    }

    private async digSearchPattern(): Promise<void> {
        // Simple strip mine pattern
        const pos = this.bot.entity.position;
        const forward = this.bot.blockAt(pos.offset(1, 0, 0));
        if (forward && forward.name !== 'air') {
            const pickaxe = this.bot.inventory.items().find(i => i.name.includes('pickaxe'));
            if (pickaxe) await this.bot.equip(pickaxe, 'hand');
            await this.bot.dig(forward);
        }
    }



    private sleep(ms: number): Promise<void> {
        return new Promise(r => setTimeout(r, ms));
    }

    /**
     * Check and handle survival needs (food/health/mobs)
     * Call this frequently during dangerous operations!
     */
    async handleSurvival(): Promise<boolean> {
        // Check for nearby hostile mobs
        const hostiles = this.getNearbyHostiles();
        if (hostiles.length > 0) {
            console.log(`⚔️ ${hostiles.length} hostile mob(s) nearby!`);

            // If health is low, run away
            if (this.bot.health < 10) {
                console.log('🏃 Low health, running away!');
                await this.runAway(hostiles[0]);
                return false;
            }

            // Fight if we have a weapon
            const weapon = this.bot.inventory.items().find(i =>
                i.name.includes('sword') || i.name.includes('axe')
            );
            if (weapon) {
                await this.bot.equip(weapon, 'hand');
                // @ts-ignore
                if (this.bot.pvp) {
                    // @ts-ignore
                    this.bot.pvp.attack(hostiles[0]);
                    await this.sleep(2000);
                    // @ts-ignore
                    await this.bot.pvp.stop();
                }
            }
        }

        // Desperate health - stop everything but try to find food!
        if (this.bot.health < 5) {
            console.log('💔 CRITICAL HEALTH! Need healing!');
            const hasFood = this.bot.inventory.items().some(i =>
                this.isFood(i.name)
            );
            if (!hasFood) {
                console.log('  No food in inventory! Looking for animals...');
                await this.huntForFood();
            }
            return false;
        }

        // Eat if hungry or slightly damaged
        if (this.bot.food < 15 || (this.bot.health < 18 && this.bot.food < 20)) {
            const foods = this.bot.inventory.items().filter(i => this.isFood(i.name));

            if (foods.length > 0) {
                await this.bot.equip(foods[0], 'hand');
                await this.bot.consume();
                console.log('🍖 Ate food');
            } else if (this.bot.food < 10) {
                console.log('  Very hungry and no food! Hunting...');
                await this.huntForFood();
            }
        }

        return true; // Safe to continue
    }

    private isFood(name: string): boolean {
        const list = [
            'cooked_beef', 'beef', 'cooked_porkchop', 'porkchop',
            'cooked_chicken', 'chicken', 'cooked_mutton', 'mutton',
            'cooked_rabbit', 'rabbit', 'bread', 'apple', 'carrot',
            'potato', 'baked_potato', 'melon_slice', 'sweet_berries',
            'golden_apple', 'dried_kelp'
        ];
        return list.includes(name) || name.includes('cooked');
    }

    private async huntForFood(): Promise<void> {
        const animals = Object.values(this.bot.entities).filter(e =>
            ['pig', 'cow', 'sheep', 'chicken', 'rabbit'].includes(e.name || '') &&
            this.bot.entity.position.distanceTo(e.position) < 32
        );

        if (animals.length > 0) {
            const target = animals[0];
            console.log(`  🎯 Hunting ${target.name} for food...`);

            await this.goTo(target.position);

            const weapon = this.bot.inventory.items().find(i =>
                i.name.includes('sword') || i.name.includes('axe') || i.name.includes('pickaxe')
            );
            if (weapon) await this.bot.equip(weapon, 'hand');

            await this.bot.attack(target);
            await this.sleep(1000);

            // Try to pick up drops
            const drop = this.bot.findBlock({
                matching: b => b.name === 'air', // This doesn't work for entities, but we'll just stand there for a sec
                maxDistance: 2
            });
            await this.sleep(1000);
        }
    }

    /**
     * Get nearby hostile mobs
     */
    private getNearbyHostiles(): any[] {
        const hostileTypes = ['zombie', 'skeleton', 'spider', 'creeper', 'enderman', 'witch', 'drowned'];
        const hostiles: any[] = [];

        for (const entity of Object.values(this.bot.entities)) {
            if (entity === this.bot.entity) continue;

            const name = entity.name?.toLowerCase() || '';
            const distance = this.bot.entity.position.distanceTo(entity.position);

            if (hostileTypes.some(h => name.includes(h)) && distance < 16) {
                hostiles.push(entity);
            }
        }

        return hostiles.sort((a, b) =>
            this.bot.entity.position.distanceTo(a.position) -
            this.bot.entity.position.distanceTo(b.position)
        );
    }

    /**
     * Run away from a threat
     */
    private async runAway(threat: any): Promise<void> {
        const myPos = this.bot.entity.position;
        const threatPos = threat.position;

        // Calculate direction away from threat
        const dx = myPos.x - threatPos.x;
        const dz = myPos.z - threatPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0) {
            const safeX = myPos.x + (dx / dist) * 10;
            const safeZ = myPos.z + (dz / dist) * 10;

            const goal = new GoalNear(safeX, myPos.y, safeZ, 2);
            // @ts-ignore
            this.bot.pathfinder.setGoal(goal);
            await this.sleep(3000);
        }
    }

    /**
     * Safely mine ore with survival checks
     */
    async safeMinOre(oreType: string, count: number): Promise<number> {
        console.log(`⛏️ SAFE mining ${count} ${oreType}...`);

        const pickaxe = this.bot.inventory.items().find(i => i.name.includes('pickaxe'));
        if (pickaxe) await this.bot.equip(pickaxe, 'hand');

        let mined = 0;
        for (let attempt = 0; attempt < count * 5; attempt++) {
            // Survival check every iteration
            const safe = await this.handleSurvival();
            if (!safe) {
                console.log('⚠️ Not safe, waiting...');
                await this.sleep(2000);
                continue;
            }

            const ore = this.bot.findBlock({
                matching: block => block.name === oreType || block.name === `deepslate_${oreType}` || block.name === 'raw_iron_block',
                maxDistance: 32
            });

            if (!ore) {
                // If we're looking for iron and high up, go down
                if (oreType === 'iron_ore' && this.bot.entity.position.y > 40) {
                    console.log('  Too high for easy iron, staircasing down...');
                    await this.staircaseDown(16);
                    continue;
                }
                // Safe dig pattern
                await this.safeDigSearch();
                continue;
            }

            // Check if path to ore is safe (not over void/lava)
            const blockBelow = this.bot.blockAt(ore.position.offset(0, -1, 0));
            if (blockBelow && (blockBelow.name === 'lava' || blockBelow.name === 'air')) {
                console.log('  Skipping ore near danger');
                continue;
            }

            try {
                await this.goTo(ore.position);
                await this.bot.dig(ore);
                mined++;
                console.log(`  ⛏️ Got ${oreType} (${mined}/${count})`);
            } catch (e) {
                // Dig interrupted, probably by mob
                await this.handleSurvival();
            }

            if (mined >= count) break;
        }

        return mined;
    }

    /**
     * Safer dig pattern - horizontal strip mine
     */
    private async safeDigSearch(): Promise<void> {
        const pos = this.bot.entity.position;

        // Dig forward at eye level (don't dig down!)
        const forward = this.bot.blockAt(pos.offset(1, 0, 0));
        const forwardUp = this.bot.blockAt(pos.offset(1, 1, 0));

        if (forward && forward.name !== 'air' && forward.name !== 'lava' && forward.name !== 'water') {
            const pickaxe = this.bot.inventory.items().find(i => i.name.includes('pickaxe'));
            if (pickaxe) await this.bot.equip(pickaxe, 'hand');
            await this.bot.dig(forward);
        }
        if (forwardUp && forwardUp.name !== 'air' && forwardUp.name !== 'lava' && forwardUp.name !== 'water') {
            await this.bot.dig(forwardUp);
        }

        // Move forward after digging
        this.bot.setControlState('forward', true);
        await this.sleep(500);
        this.bot.setControlState('forward', false);
    }

    /**
     * Dig down in a staircase pattern to target Y level
     */
    private async staircaseDown(targetY: number): Promise<void> {
        if (this.bot.entity.position.y <= targetY) return;

        console.log(`  Staircasing down to Y=${targetY}...`);

        while (this.bot.entity.position.y > targetY) {
            const pos = this.bot.entity.position;

            // Dig ahead and down
            const forward = this.bot.blockAt(pos.offset(1, 0, 0));
            const forwardUp = this.bot.blockAt(pos.offset(1, 1, 0));
            const belowForward = this.bot.blockAt(pos.offset(1, -1, 0));

            if (forward && forward.name !== 'air') await this.bot.dig(forward);
            if (forwardUp && forwardUp.name !== 'air') await this.bot.dig(forwardUp);
            if (belowForward && belowForward.name !== 'air') await this.bot.dig(belowForward);

            // Move into the stair
            await this.goTo(pos.offset(1, 0, 0));

            // Survival check after each step
            const safe = await this.handleSurvival();
            if (!safe) break;

            if (this.bot.entity.position.y <= targetY) break;
        }
    }
}
