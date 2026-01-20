import Database from 'better-sqlite3';
import { join } from 'path';

export interface Token {
    id: number;
    address: string;
    ownerUsername: string;
    burnPercentage: number;
    mode: string;
    createdAt: number;
    lastBurn: number;
    totalBurned: number;
    isActive: boolean;
}

export async function getTokens(): Promise<Token[]> {
    // If an external API URL is provided, fetch from there (for Vercel/Cloud deployment)
    if (process.env.DATA_SOURCE_API_URL) {
        try {
            const res = await fetch(`${process.env.DATA_SOURCE_API_URL}/api/tokens`, { next: { revalidate: 30 } });
            const data = await res.json();
            if (data.success) return data.tokens;
        } catch (error) {
            console.error('Failed to fetch from external API:', error);
        }
    }

    try {
        // Connect to bot's database (read-only) - only works if on same server
        const dbPath = join(process.cwd(), '..', 'claude-burn-bot', 'data', 'tokens.db');
        const db = new Database(dbPath, { readonly: true });

        const tokens = db
            .prepare('SELECT * FROM tokens WHERE isActive = 1 ORDER BY createdAt DESC')
            .all() as any[];

        db.close();

        return tokens.map((row) => ({
            id: row.id,
            address: row.address,
            ownerUsername: row.ownerUsername,
            burnPercentage: row.burnPercentage,
            mode: row.mode,
            createdAt: row.createdAt,
            lastBurn: row.lastBurn,
            totalBurned: row.totalBurned,
            isActive: row.isActive === 1,
        }));
    } catch (error) {
        // console.error('Local DB not found or failed, standard for cloud deployment');
        return [];
    }
}

export async function getStats() {
    try {
        const tokens = await getTokens();

        return {
            totalTokens: tokens.length,
            totalBurned: tokens.reduce((sum, t) => sum + t.totalBurned, 0),
            activeBurns: tokens.filter(t => Date.now() - t.lastBurn < 24 * 60 * 60 * 1000).length,
        };
    } catch (error) {
        return {
            totalTokens: 0,
            totalBurned: 0,
            activeBurns: 0,
        };
    }
}
