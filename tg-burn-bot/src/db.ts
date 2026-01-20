import fs from 'fs';
import path from 'path';

export interface UserSession {
    chatId: number;
    developerId?: number; // The user who configured the bot
    broadcastChatId?: number | string; // Public group or channel ID
    tokenCA?: string;
    privateKey?: string;
    crankActive: boolean;
    aiActive: boolean;
    strategy?: "FLOOR_DEFENSE" | "FOMO_ACCELERATOR" | "STEADY_INCINERATION";
    crankInterval?: number;
    crankAmount?: number;
    lastBurnSignature?: string;
    burnCount: number;
}

const DB_PATH = path.join(process.cwd(), 'sessions.json');

export function loadSessions(): Record<number, UserSession> {
    if (!fs.existsSync(DB_PATH)) return {};
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        console.error("Error loading sessions:", e);
        return {};
    }
}

export function saveSessions(sessions: Record<number, UserSession>) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(sessions, null, 2));
    } catch (e) {
        console.error("Error saving sessions:", e);
    }
}

export function getSession(chatId: number): UserSession {
    let sessions = loadSessions();
    if (!sessions[chatId]) {
        sessions[chatId] = {
            chatId,
            burnCount: 0,
            crankActive: false,
            aiActive: false
        };
        saveSessions(sessions);
    }
    return sessions[chatId]!;
}

export function getAllSessions(): UserSession[] {
    const sessions = loadSessions();
    return Object.values(sessions);
}

export function updateSession(chatId: number, data: Partial<UserSession>) {
    const sessions = loadSessions();
    sessions[chatId] = { ...getSession(chatId), ...data };
    saveSessions(sessions);
}
