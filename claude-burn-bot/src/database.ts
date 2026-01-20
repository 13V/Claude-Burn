import Database from 'better-sqlite3';
import { config } from './config';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export interface Token {
    id?: number;
    address: string;
    ownerTelegramId: string;
    ownerUsername: string;
    privateKey: string;
    burnPercentage: number;
    mode: 'standard' | 'aggressive' | 'conservative';
    createdAt: number;
    lastBurn: number;
    totalBurned: number;
    isActive: boolean;
}

class TokenDatabase {
    private db: Database.Database;

    constructor() {
        // Ensure data directory exists
        const dbDir = dirname(config.databasePath);
        if (!existsSync(dbDir)) {
            mkdirSync(dbDir, { recursive: true });
        }

        this.db = new Database(config.databasePath);
        this.initDatabase();
    }

    private initDatabase() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT UNIQUE NOT NULL,
        ownerTelegramId TEXT NOT NULL,
        ownerUsername TEXT NOT NULL,
        privateKey TEXT NOT NULL,
        burnPercentage INTEGER NOT NULL DEFAULT 50,
        mode TEXT NOT NULL DEFAULT 'standard',
        createdAt INTEGER NOT NULL,
        lastBurn INTEGER DEFAULT 0,
        totalBurned REAL DEFAULT 0,
        isActive INTEGER DEFAULT 1
      );

      CREATE INDEX IF NOT EXISTS idx_owner ON tokens(ownerTelegramId);
      CREATE INDEX IF NOT EXISTS idx_active ON tokens(isActive);
    `);
    }

    addToken(token: Omit<Token, 'id'>): number {
        const stmt = this.db.prepare(`
      INSERT INTO tokens (
        address, ownerTelegramId, ownerUsername, privateKey,
        burnPercentage, mode, createdAt, isActive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

        const result = stmt.run(
            token.address,
            token.ownerTelegramId,
            token.ownerUsername,
            token.privateKey,
            token.burnPercentage,
            token.mode,
            token.createdAt,
            token.isActive ? 1 : 0
        );

        return result.lastInsertRowid as number;
    }

    getToken(address: string): Token | null {
        const stmt = this.db.prepare('SELECT * FROM tokens WHERE address = ?');
        const row = stmt.get(address) as any;
        return row ? this.mapToToken(row) : null;
    }

    getTokensByOwner(ownerTelegramId: string): Token[] {
        const stmt = this.db.prepare('SELECT * FROM tokens WHERE ownerTelegramId = ?');
        const rows = stmt.all(ownerTelegramId) as any[];
        return rows.map(this.mapToToken);
    }

    getAllActiveTokens(): Token[] {
        const stmt = this.db.prepare('SELECT * FROM tokens WHERE isActive = 1');
        const rows = stmt.all() as any[];
        return rows.map(this.mapToToken);
    }

    updateTokenSettings(address: string, burnPercentage: number, mode: string) {
        const stmt = this.db.prepare(`
      UPDATE tokens 
      SET burnPercentage = ?, mode = ?
      WHERE address = ?
    `);
        stmt.run(burnPercentage, mode, address);
    }

    updateLastBurn(address: string, amount: number) {
        const stmt = this.db.prepare(`
      UPDATE tokens 
      SET lastBurn = ?, totalBurned = totalBurned + ?
      WHERE address = ?
    `);
        stmt.run(Date.now(), amount, address);
    }

    setTokenActive(address: string, active: boolean) {
        const stmt = this.db.prepare('UPDATE tokens SET isActive = ? WHERE address = ?');
        stmt.run(active ? 1 : 0, address);
    }

    private mapToToken(row: any): Token {
        return {
            id: row.id,
            address: row.address,
            ownerTelegramId: row.ownerTelegramId,
            ownerUsername: row.ownerUsername,
            privateKey: row.privateKey,
            burnPercentage: row.burnPercentage,
            mode: row.mode,
            createdAt: row.createdAt,
            lastBurn: row.lastBurn,
            totalBurned: row.totalBurned,
            isActive: row.isActive === 1,
        };
    }

    close() {
        this.db.close();
    }
}

export const tokenDb = new TokenDatabase();
