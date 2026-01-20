import { FlywheelEngine } from './src/lib/engine';
import { supabase } from './src/lib/supabase';
import * as dotenv from 'dotenv';

dotenv.config();

const engine = new FlywheelEngine(process.env.RPC_URL);

async function crankAll() {
    console.log(`\n[MASTER CRANK] Starting global cycle: ${new Date().toISOString()}`);

    try {
        const { data: projects, error } = await supabase
            .from('projects')
            .select('id, name')
            .eq('is_active', true);

        if (error) throw error;
        if (!projects || projects.length === 0) {
            console.log("[MASTER CRANK] No active projects found.");
            return;
        }

        console.log(`[MASTER CRANK] Processing ${projects.length} projects...`);

        for (const project of projects) {
            try {
                await engine.runProjectCycle(project.id);
            } catch (e: any) {
                console.error(`[MASTER CRANK] Failed project ${project.name}:`, e.message);
            }
        }

        console.log("[MASTER CRANK] Global cycle complete.");
    } catch (e: any) {
        console.error("[MASTER CRANK] Fatal error:", e.message);
    }
}

// Every 2 minutes to avoid rate limits since we are processing multi-tenant
const INTERVAL = 120000;

console.log("FLYWHEEL PRO: Master Cranker Active.");
crankAll();
setInterval(crankAll, INTERVAL);
