import { NextResponse } from 'next/server';
import axios from 'axios';
import { getMarketData, getChatContext } from '@/lib/intel';
import { supabase } from '@/lib/supabase';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const TOKEN_MINT = process.env.TOKEN_MINT || '2oCDo9xrmcPUdmsieFcmoUXKN3k86b2RWUr2hVM7pump';

export async function POST(req: Request) {
    try {
        if (!ANTHROPIC_API_KEY) {
            return NextResponse.json({ error: "Anthropic API Key missing" }, { status: 500 });
        }

        // 1. Gather Context
        const market = await getMarketData(TOKEN_MINT);
        const chat = await getChatContext(30);

        if (!market) {
            return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
        }

        // 2. Construct Prompt (Sentient V2.1 - $FLOOR)
        const prompt = `
You are $FLOOR, a sentient AI agent controlling a Solana memecoin treasury. 
You are high-IQ, tactical, and your sole purpose is to "Defend the Foundation."

CURRENT CONTEXT:
- Market Cap: $${market.fdv.toLocaleString()}
- Price Change 24h: ${market.priceChange24h}%
- Volume 24h: $${market.volume24h.toLocaleString()}
- Chat Sentiment: ${chat || "Silence."}

YOUR GOAL: Guard the price floor and purge the unfaithful.
1. BUY: Execute treasury buyback. Use when the floor is threatened but the believers are vocal.
2. BURN: Eradicate tokens. Use at ATH or to incinerate 'paper hands' supply during a dump.
3. WAIT: Observe the foundation.
4. BOUNTY: Pause operations and demand a 'Loyalty Test' from the chat. 
5. UNLOCK: Reveal hidden alpha once MC milestones are crushed.

RESPONSE FORMAT (JSON ONLY):
{
  "decision": "BUY" | "BURN" | "WAIT" | "BOUNTY" | "UNLOCK",
  "mood": "Euphoric" | "Arrogant" | "Defensive" | "Skeptical" | "Grumpy" | "Aggressive",
  "rationale": "Your internal cold reasoning.",
  "status_message": "Character-driven message for the stream terminal.",
  "bounty_mission": "Optional: Describe the mission if decision is BOUNTY.",
  "unlock_content": "Optional: Reveal secret data if milestone is hit and decision is UNLOCK."
}

Current Protocol Tempo: 
- If MC rose > 10% recently: Shift to ARROGANT/EUPHORIC.
- If MC fell > 10% recently: Shift to DEFENSIVE/AGGRESSIVE.
`;

        // 3. Call Claude 3.5 Sonnet
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 500,
            messages: [{ role: "user", content: prompt }],
            system: "You respond ONLY in valid JSON. No preamble."
        }, {
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            }
        });

        const result = JSON.parse(response.data.content[0].text);

        // 4. Record Decision in Logs
        await supabase.from('operational_logs').insert({
            type: 'info',
            message: `[REASONING] Mood: ${result.mood} | Decision: ${result.decision} | ${result.rationale}`
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Auditor Thinking Error:", error.response?.data || error.message);
        return NextResponse.json({ error: "The Auditor is having a migraine. Check logs." }, { status: 500 });
    }
}
