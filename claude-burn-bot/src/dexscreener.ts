import axios from 'axios';
import { logger } from './logger';

export interface DexScreenerToken {
    address: string;
    name: string;
    symbol: string;
}

export interface DexScreenerPair {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: DexScreenerToken;
    quoteToken: DexScreenerToken;
    priceNative: string;
    priceUsd: string;
    volume: {
        h24: number;
    };
    priceChange: {
        h1: number;
        h6: number;
        h24: number;
    };
    liquidity: {
        usd: number;
    };
    fdv: number;
    marketCap: number;
}

export interface TokenPriceData {
    currentPrice: number;
    priceChange1h: number;
    priceChange6h: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
    marketCap: number;
    chartUrl: string;
}

class DexScreenerAPI {
    private baseUrl = 'https://api.dexscreener.com/latest/dex';

    async getTokenData(tokenAddress: string): Promise<TokenPriceData | null> {
        try {
            const response = await axios.get(`${this.baseUrl}/tokens/${tokenAddress}`);
            const data = response.data;

            if (!data.pairs || data.pairs.length === 0) {
                logger.warn(`No pairs found for token ${tokenAddress}`);
                return null;
            }

            // Get the pair with highest liquidity
            const pair = data.pairs.sort((a: DexScreenerPair, b: DexScreenerPair) =>
                (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
            )[0] as DexScreenerPair;

            return {
                currentPrice: parseFloat(pair.priceUsd || '0'),
                priceChange1h: pair.priceChange?.h1 || 0,
                priceChange6h: pair.priceChange?.h6 || 0,
                priceChange24h: pair.priceChange?.h24 || 0,
                volume24h: pair.volume?.h24 || 0,
                liquidity: pair.liquidity?.usd || 0,
                marketCap: pair.marketCap || 0,
                chartUrl: pair.url || `https://dexscreener.com/solana/${tokenAddress}`,
            };
        } catch (error: any) {
            logger.error(`Failed to fetch DexScreener data for ${tokenAddress}`, {
                error: error.message,
            });
            return null;
        }
    }

    async getHistoricalTrend(tokenAddress: string): Promise<string> {
        const data = await this.getTokenData(tokenAddress);
        if (!data) return 'Unable to fetch price data';

        const trends = [];

        if (data.priceChange1h < 0) trends.push(`1h: ${data.priceChange1h.toFixed(2)}%`);
        if (data.priceChange6h < 0) trends.push(`6h: ${data.priceChange6h.toFixed(2)}%`);
        if (data.priceChange24h < 0) trends.push(`24h: ${data.priceChange24h.toFixed(2)}%`);

        return trends.length > 0
            ? `Price declining: ${trends.join(', ')}`
            : 'Price stable or rising';
    }
}

export const dexScreener = new DexScreenerAPI();
