import axios from 'axios';
import { logger } from './logger';

/**
 * Pumpfun-specific utilities
 * Helps detect if a token is on bonding curve vs graduated to Raydium
 */

export interface PumpfunTokenInfo {
    address: string;
    isOnBondingCurve: boolean;
    marketCap: number;
    bondingCurveProgress: number; // 0-100%
    graduationThreshold: number; // Market cap needed to graduate
}

export async function getPumpfunTokenInfo(tokenAddress: string): Promise<PumpfunTokenInfo | null> {
    try {
        // Check pumpfun API for token status
        const response = await axios.get(`https://frontend-api.pump.fun/coins/${tokenAddress}`);

        if (!response.data) {
            return null;
        }

        const data = response.data;
        const isOnBondingCurve = !data.raydium_pool; // If no Raydium pool, still on curve
        const marketCap = data.usd_market_cap || 0;
        const graduationThreshold = 69000; // $69k is typical graduation threshold
        const bondingCurveProgress = Math.min((marketCap / graduationThreshold) * 100, 100);

        return {
            address: tokenAddress,
            isOnBondingCurve,
            marketCap,
            bondingCurveProgress,
            graduationThreshold,
        };
    } catch (error: any) {
        logger.warn(`Failed to fetch pumpfun info for ${tokenAddress}`, { error: error.message });
        return null;
    }
}

/**
 * Determine optimal slippage based on bonding curve status
 */
export function getOptimalSlippage(tokenInfo: PumpfunTokenInfo | null): number {
    if (!tokenInfo) {
        return 500; // 5% default
    }

    if (tokenInfo.isOnBondingCurve) {
        // On bonding curve - lower liquidity, need higher slippage
        if (tokenInfo.bondingCurveProgress < 50) {
            return 1000; // 10% for early bonding curve
        }
        return 700; // 7% for late bonding curve
    }

    // Graduated to Raydium - better liquidity
    return 300; // 3% for raydium pools
}

/**
 * Check if buyback is safe on bonding curve
 * Avoid buying too much at once on low liquidity
 */
export function isAmountSafeForBondingCurve(
    solAmount: number,
    tokenInfo: PumpfunTokenInfo | null
): boolean {
    if (!tokenInfo || !tokenInfo.isOnBondingCurve) {
        return true; // Always safe on Raydium
    }

    // On bonding curve, limit buys to max 0.5 SOL at a time
    const maxSafeAmount = 0.5;

    if (solAmount > maxSafeAmount) {
        logger.warn(`Buy amount ${solAmount} SOL too large for bonding curve, max safe: ${maxSafeAmount}`);
        return false;
    }

    return true;
}
