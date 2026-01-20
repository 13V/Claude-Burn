import axios from 'axios';
import { supabase } from './supabase';

export async function getMarketData(mint: string) {
    try {
        const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
        if (response.data?.pairs?.[0]) {
            const pair = response.data.pairs[0];
            return {
                fdv: pair.fdv || 0,
                priceUsd: pair.priceUsd || "0",
                volume24h: pair.volume?.h24 || 0,
                priceChange24h: pair.priceChange?.h24 || 0
            };
        }
        return null;
    } catch (e) {
        console.error("Error fetching market data:", e);
        return null;
    }
}

export async function getChatContext(limit: number = 50) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('text, created_at')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data.map(m => m.text).join('\n');
    } catch (e) {
        console.error("Error fetching chat context:", e);
        return "";
    }
}
