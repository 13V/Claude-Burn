import axios from 'axios';

export interface MarketData {
    priceNative: string;
    priceUsd: string;
    priceChange24h: number;
    fdv: number;
    volume24h: number;
    solBalance: number; // Added for self-sustaining buybacks
    lastUpdated: number;
}

export async function fetchTokenIntelligence(
    connection: any,
    ca: string,
    walletAddress?: string
): Promise<MarketData | null> {
    try {
        const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${ca}`);
        const pair = response.data.pairs?.[0];

        if (!pair) return null;

        let solBalance = 0;
        if (walletAddress) {
            try {
                const balanceLamports = await connection.getBalance(new (await import('@solana/web3.js')).PublicKey(walletAddress));
                solBalance = balanceLamports / 1e9;
            } catch (e) {
                console.error("SOL Balance Fetch Error:", e);
            }
        }

        return {
            priceNative: pair.priceNative,
            priceUsd: pair.priceUsd,
            priceChange24h: pair.priceChange?.h24 || 0,
            fdv: pair.fdv || 0,
            volume24h: pair.volume?.h24 || 0,
            solBalance,
            lastUpdated: Date.now()
        };
    } catch (error) {
        console.error("Intelligence Fetch Error:", error);
        return null;
    }
}
