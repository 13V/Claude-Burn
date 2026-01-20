import Anthropic from '@anthropic-ai/sdk';
import { config } from './config';
import { dexScreener, TokenPriceData } from './dexscreener';
import { logger } from './logger';

export interface AIAnalysisResult {
    shouldBuy: boolean;
    confidence: number; // 0-100
    reasoning: string;
    recommendedAmount: number; // percentage of available fees to use
}

class AIAnalyzer {
    private anthropic: Anthropic;

    constructor() {
        this.anthropic = new Anthropic({
            apiKey: config.claudeApiKey,
        });
    }

    async analyzeChart(
        tokenAddress: string,
        mode: 'standard' | 'aggressive' | 'conservative'
    ): Promise<AIAnalysisResult> {
        try {
            let priceData = await dexScreener.getTokenData(tokenAddress);

            if (!priceData) {
                // For devnet testing, provide simulated data if DexScreener has no info
                if (config.solanaNetwork === 'devnet') {
                    logger.info(`Devnet mode: Using simulated price data for ${tokenAddress}`);
                    priceData = {
                        currentPrice: 0.0001,
                        priceChange1h: -5.5, // Simulated 5% dip
                        priceChange6h: -2.1,
                        priceChange24h: 12.4,
                        volume24h: 50000,
                        liquidity: 10000,
                        marketCap: 100000,
                        chartUrl: `https://dexscreener.com/solana/${tokenAddress}`
                    };
                } else {
                    return {
                        shouldBuy: false,
                        confidence: 0,
                        reasoning: 'Unable to fetch price data',
                        recommendedAmount: 0,
                    };
                }
            }

            // At this point priceData is guaranteed to be non-null if not returned early
            const validPriceData = priceData as TokenPriceData;
            const modeConfig = config.modes[mode];
            const prompt = this.buildAnalysisPrompt(validPriceData, modeConfig, tokenAddress);

            logger.info(`Analyzing ${tokenAddress} with Claude AI (${mode} mode)`);

            const message = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });

            const responseText = message.content[0].type === 'text'
                ? message.content[0].text
                : '';

            return this.parseAIResponse(responseText, modeConfig.buyPercentage);
        } catch (error: any) {
            logger.error('AI analysis failed', { error: error.message });
            return {
                shouldBuy: false,
                confidence: 0,
                reasoning: `Error: ${error.message}`,
                recommendedAmount: 0,
            };
        }
    }

    private buildAnalysisPrompt(
        priceData: TokenPriceData,
        modeConfig: any,
        tokenAddress: string
    ): string {
        return `You are a crypto trading analyst for an automated buyback and burn system. Analyze this token and decide if NOW is a good time to buy for maximum impact.

**Token:** ${tokenAddress}
**Current Price:** $${priceData.currentPrice.toFixed(8)}
**Price Changes:**
- 1 hour: ${priceData.priceChange1h.toFixed(2)}%
- 6 hours: ${priceData.priceChange6h.toFixed(2)}%
- 24 hours: ${priceData.priceChange24h.toFixed(2)}%

**Market Data:**
- 24h Volume: $${priceData.volume24h.toLocaleString()}
- Liquidity: $${priceData.liquidity.toLocaleString()}
- Market Cap: $${priceData.marketCap.toLocaleString()}

**Strategy Mode:** ${modeConfig.name}
**Description:** ${modeConfig.description}
**Dip Threshold:** ${modeConfig.dipThreshold}%
**Max Buy %:** ${modeConfig.buyPercentage}%

**Your Task:**
1. Determine if we're in a DIP (based on the mode's threshold)
2. Consider if buying now would create good buy pressure
3. Account for volume and liquidity
4. Decide: BUY NOW or WAIT

**Response Format (must be exact):**
DECISION: [BUY or WAIT]
CONFIDENCE: [0-100]
AMOUNT: [0-${modeConfig.buyPercentage}]
REASONING: [One short sentence explaining why]

Be decisive and concise.`;
    }

    private parseAIResponse(response: string, maxPercentage: number): AIAnalysisResult {
        const lines = response.split('\n');
        let shouldBuy = false;
        let confidence = 0;
        let recommendedAmount = 0;
        let reasoning = 'AI analysis completed';

        for (const line of lines) {
            if (line.includes('DECISION:')) {
                shouldBuy = line.toUpperCase().includes('BUY') && !line.toUpperCase().includes('WAIT');
            } else if (line.includes('CONFIDENCE:')) {
                const match = line.match(/(\d+)/);
                if (match) confidence = parseInt(match[1]);
            } else if (line.includes('AMOUNT:')) {
                const match = line.match(/(\d+)/);
                if (match) recommendedAmount = Math.min(parseInt(match[1]), maxPercentage);
            } else if (line.includes('REASONING:')) {
                reasoning = line.split('REASONING:')[1]?.trim() || reasoning;
            }
        }

        // Safety check: only buy if confidence > 60
        if (confidence < 60) {
            shouldBuy = false;
        }

        return {
            shouldBuy,
            confidence,
            reasoning,
            recommendedAmount,
        };
    }
}

export const aiAnalyzer = new AIAnalyzer();
