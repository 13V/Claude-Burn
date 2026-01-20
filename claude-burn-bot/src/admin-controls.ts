/**
 * Admin Controls
 * Allows pausing/resuming operations via environment flag or Telegram command
 */

let systemPaused = false;

export function pauseSystem() {
    systemPaused = true;
}

export function resumeSystem() {
    systemPaused = false;
}

export function isSystemPaused(): boolean {
    return systemPaused;
}

/**
 * Rate limiter for API calls
 */
class RateLimiter {
    private lastCalls: Map<string, number[]> = new Map();

    /**
     * Check if we can make a call
     * @param key - Identifier for the rate limit (e.g., 'claude-ai', 'dexscreener')
     * @param maxCalls - Max calls allowed
     * @param windowMs - Time window in milliseconds
     */
    canCall(key: string, maxCalls: number, windowMs: number): boolean {
        const now = Date.now();
        const calls = this.lastCalls.get(key) || [];

        // Remove calls outside the window
        const recentCalls = calls.filter((time) => now - time < windowMs);

        if (recentCalls.length >= maxCalls) {
            return false;
        }

        // Record this call
        recentCalls.push(now);
        this.lastCalls.set(key, recentCalls);
        return true;
    }

    /**
     * Wait until we can make a call
     */
    async waitForSlot(key: string, maxCalls: number, windowMs: number): Promise<void> {
        while (!this.canCall(key, maxCalls, windowMs)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
}

export const rateLimiter = new RateLimiter();

/**
 * Retry wrapper with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (attempt < maxRetries - 1) {
                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}
