import axios from 'axios';
import { MarketData } from './intel';

export interface TacticalDecision {
    shouldBurn: boolean;
    burnAmount: number;
    shouldBuyback: boolean; // New: AI can decide to use SOL treasury
    buybackAmountSol: number;
    reasoning: string;
    narrativeLabel: string;
}

const NARRATIVES = {
    FLOOR_DEFENSE: "Protect the chart. Burn tokens if price drops > 10% in 24h. If SOL treasury > 0.1, consider BUYBACK to support the floor.",
    FOMO_ACCELERATOR: "Explosive growth. Burn tokens to increase scarcity during a breakout. Use SOL treasury to add more green candles.",
    STEADY_INCINERATION: "Routine removal. Burn small amounts. Use SOL treasury if balance > 1.0 SOL.",
    SELF_SUSTAINING: "Autonomous Growth. Prioritize using SOL treasury from fee-splits to buy and burn tokens constantly."
};

export async function getTacticalDecision(
    market: MarketData,
    strategy: keyof typeof NARRATIVES
): Promise<TacticalDecision> {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
        return {
            shouldBurn: true,
            burnAmount: 0.1,
            shouldBuyback: false,
            buybackAmountSol: 0,
            reasoning: "API Key missing, falling back to steady burn.",
            narrativeLabel: "SAFE_MODE"
        };
    }

    const prompt = `
You are THE INCINERATOR, a high-IQ Solana AI agent controlling a token burn crank. 
Your goal is to execute the "${strategy}" strategy.

CURRENT MARKET DATA:
- Price USD: $${market.priceUsd}
- 24h Change: ${market.priceChange24h}%
- Volume 24h: $${market.volume24h.toLocaleString()}
- FDV: $${market.fdv.toLocaleString()}
- SOL Treasury: ${market.solBalance} SOL

NARRATIVE GOAL:
${NARRATIVES[strategy]}

DECISION RULES:
1. ONLY return JSON.
2. 'shouldBurn' is true if the current data fits the narrative goals.
3. 'burnAmount' should be between 0.01 and 1.0 (percent of available tokens).
4. 'shouldBuyback' is true if you want to use the SOL treasury to buy tokens.
5. 'buybackAmountSol' should be between 0 (none) and your total treasury.
6. 'reasoning' should be a cold, calculated roast or high-IQ tactical explanation.

RESPONSE FORMAT:
{
  "shouldBurn": boolean,
  "burnAmount": number,
  "shouldBuyback": boolean,
  "buybackAmountSol": number,
  "reasoning": string,
  "narrativeLabel": string
}
`;

    try {
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 400,
            messages: [{ role: "user", content: prompt }],
            system: "You respond ONLY in valid JSON. Be tactical and arrogant."
        }, {
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            }
        });

        const text = response.data.content[0].text;
        return JSON.parse(text);

    } catch (error) {
        console.error("AI Decision Error:", error);
        return {
            shouldBurn: false,
            burnAmount: 0,
            shouldBuyback: false,
            buybackAmountSol: 0,
            reasoning: "The engine hit a snag. Aborting tactical maneuver.",
            narrativeLabel: "ERROR_IDLE"
        };
    }
}
