import { existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

const LOG_DIR = './logs';

class Logger {
    constructor() {
        if (!existsSync(LOG_DIR)) {
            mkdirSync(LOG_DIR, { recursive: true });
        }
    }

    private write(level: string, message: string, data?: any) {
        const timestamp = new Date().toISOString();
        const logMessage = data
            ? `[${timestamp}] [${level}] ${message} ${JSON.stringify(data)}`
            : `[${timestamp}] [${level}] ${message}`;

        console.log(logMessage);

        // Write to file
        const logFile = join(LOG_DIR, `${new Date().toISOString().split('T')[0]}.log`);
        appendFileSync(logFile, logMessage + '\n');
    }

    info(message: string, data?: any) {
        this.write('INFO', message, data);
    }

    error(message: string, data?: any) {
        this.write('ERROR', message, data);
    }

    warn(message: string, data?: any) {
        this.write('WARN', message, data);
    }

    success(message: string, data?: any) {
        this.write('SUCCESS', message, data);
    }

    aiDecision(tokenAddress: string, decision: string, data?: any) {
        this.write('AI', `${tokenAddress}: ${decision}`, data);
    }

    transaction(type: string, tokenAddress: string, signature: string, amount?: number) {
        this.write('TX', `${type} for ${tokenAddress}`, {
            signature,
            amount,
            explorer: `https://solscan.io/tx/${signature}`,
        });
    }
}

export const logger = new Logger();
