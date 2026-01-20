import fs from 'fs';
import { LOG_FILE } from './config.js';
export function logActivity(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    console.log(message); // Still log to console for real-time visibility
    try {
        fs.appendFileSync(LOG_FILE, logEntry);
    }
    catch (error) {
        console.error('Failed to write to log file:', error);
    }
}
export function logError(context, error) {
    const errorMessage = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error.message || error;
    logActivity(`❌ ERROR [${context}]: ${errorMessage}`);
}
