import axios from 'axios';
async function checkDexScreener() {
    try {
        console.log("Fetching Solana pairs from DexScreener...");
        // Not documented in 'latest' usually, but often works or similar: /latest/dex/pairs/solana
        // Or sometimes /latest/dex/search?q=solana matches chain?
        // Let's try to find a way to get top pairs.
        // Actually, the search query 'solana' usually returns pairs where chainId is solana?
        // Let's try hitting the pairs endpoint directly if it exists, or a known hack.
        // If this fails, we will stick to the 'search' method but maybe 'SOL' is better.
        // Attempt 1: Get pairs by chain (often requires pagination or specific pair addresses)
        // Docs say: GET /latest/dex/pairs/:chainId/:pairAddresses
        // So we can't just get ALL.
        // Attempt 2: Search for 'SOL' (wrapped sol) which most pairs are against.
        // Address: So11111111111111111111111111111111111111112
        const response = await axios.get('https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112');
        if (response.data && response.data.pairs) {
            const pairs = response.data.pairs;
            console.log(`Found ${pairs.length} pairs against SOL.`);
            // Filter for solana chain and pump tokens
            const pumpTokens = pairs.filter((p) => p.chainId === 'solana' && p.baseToken.address.endsWith('pump'));
            console.log(`Found ${pumpTokens.length} tokens ending in 'pump'.`);
            pumpTokens.sort((a, b) => b.priceChange.h24 - a.priceChange.h24);
            pumpTokens.slice(0, 20).forEach((p) => {
                console.log(`Sym: ${p.baseToken.symbol}, Price: $${p.priceUsd}, 24h: ${p.priceChange.h24}%, Vol: $${p.volume.h24}, Addr: ${p.baseToken.address}`);
            });
        }
    }
    catch (e) {
        console.error("Error:", e.message);
    }
}
checkDexScreener();
