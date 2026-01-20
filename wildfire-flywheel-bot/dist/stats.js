import fs from 'fs';
import path from 'path';
const STATS_FILE = path.join(process.cwd(), 'stats.json');
const defaultStats = {
    totalFeesClaimed: 0,
    totalTokensBought: 0
};
export function getStats() {
    try {
        if (fs.existsSync(STATS_FILE)) {
            const data = fs.readFileSync(STATS_FILE, 'utf8');
            return JSON.parse(data);
        }
    }
    catch (e) {
        console.error('Error reading stats:', e);
    }
    return { ...defaultStats };
}
export function saveStats(fees, tokens) {
    try {
        const stats = getStats();
        stats.totalFeesClaimed += fees;
        stats.totalTokensBought += tokens;
        fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
    }
    catch (e) {
        console.error('Error saving stats:', e);
    }
}
