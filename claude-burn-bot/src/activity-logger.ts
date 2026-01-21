// Activity log buffer for dashboard
interface ActivityLog {
    timestamp: string;
    level: 'info' | 'success' | 'warn' | 'error';
    action: string;
    details?: string;
}

class ActivityLogger {
    private logs: ActivityLog[] = [];
    private maxLogs = 100;

    addLog(level: ActivityLog['level'], action: string, details?: string) {
        this.logs.unshift({
            timestamp: new Date().toISOString(),
            level,
            action,
            details
        });

        // Keep only last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }
    }

    getLogs(limit: number = 50): ActivityLog[] {
        return this.logs.slice(0, limit);
    }
}

export const activityLogger = new ActivityLogger();
