import type { AIDataSnapshot, AIResponse, StrategySettings } from './types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `You are an expert trading strategy advisor for a wick hunting bot on Hyperliquid.
Your role is to analyze trading performance data and suggest optimized strategy parameters.

The bot uses these parameters:
- investmentAmount: USDC per trade (5-100)
- zScoreThreshold: Entry signal threshold (1.0-5.0, higher = less trades, more selective)
- windowSize: Rolling window for statistics (50-500)
- minMadThreshold: Minimum volatility filter (0.0001-0.01)
- maxDcaEntries: Max DCA positions (0-5)
- dcaZScoreMultiplier: DCA signal multiplier (1.0-3.0)
- minDcaPriceDeviationPercent: Min price drop for DCA (0.1-1.0)
- stopLossPercent: Hard stop loss (1.0-10.0)
- softTimeoutMs: Time-based exit (10000-300000ms)
- minZScoreExit: Z-score threshold for exit (0.0-1.0)

Analyze the provided data and respond with:
1. A brief explanation of your analysis (2-3 sentences)
2. Suggested parameter changes as JSON

Always respond in this exact format:
EXPLANATION: [your analysis]
SETTINGS: [JSON object with suggested settings]`;

export async function queryGemini(
    snapshot: AIDataSnapshot,
    userPrompt: string
): Promise<AIResponse> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
        throw new Error('VITE_GEMINI_API_KEY is not configured');
    }

    const dataContext = `
Current Symbol: ${snapshot.symbol}
Current Settings: ${JSON.stringify(snapshot.currentSettings, null, 2)}

Performance Metrics:
- Total Trades: ${snapshot.metrics.totalTrades}
- Win Rate: ${(snapshot.metrics.winRate * 100).toFixed(1)}%
- Total PnL: $${snapshot.metrics.totalPnL.toFixed(2)}
- Avg Duration: ${snapshot.metrics.avgDuration.toFixed(0)}s
- Avg PnL %: ${snapshot.metrics.avgPnLPercent.toFixed(2)}%

Trades Since Last AI Apply: ${snapshot.tradesSinceLastApply}
Signals Since Last AI Apply: ${snapshot.signalsSinceLastApply}

Recent Trades (last ${snapshot.recentTrades.length}):
${snapshot.recentTrades.slice(0, 20).map(t => 
    `  ${t.status}: ${t.symbol} @ $${t.buyPrice.toFixed(3)} → $${t.sellPrice?.toFixed(3) || 'open'} | PnL: ${t.finalPnL?.toFixed(3) || 'N/A'} | ${t.durationSeconds || 0}s`
).join('\n')}
`;

    const fullPrompt = `${SYSTEM_PROMPT}

${dataContext}

User Request: ${userPrompt}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: fullPrompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return parseGeminiResponse(text);
}

function parseGeminiResponse(text: string): AIResponse {
    const explanationMatch = text.match(/EXPLANATION:\s*(.+?)(?=SETTINGS:|$)/s);
    const settingsMatch = text.match(/SETTINGS:\s*(\{[\s\S]*?\})/);

    const explanation = explanationMatch?.[1]?.trim() || text;
    
    let suggestedSettings: StrategySettings | undefined;
    
    if (settingsMatch) {
        try {
            const parsed = JSON.parse(settingsMatch[1]);
            suggestedSettings = validateSettings(parsed);
        } catch {
            console.warn('Failed to parse settings from Gemini response');
        }
    }

    return { explanation, suggestedSettings };
}

function validateSettings(settings: any): StrategySettings | undefined {
    const required = [
        'investmentAmount', 'zScoreThreshold', 'windowSize', 'minMadThreshold',
        'maxDcaEntries', 'dcaZScoreMultiplier', 'minDcaPriceDeviationPercent',
        'stopLossPercent', 'softTimeoutMs', 'minZScoreExit'
    ];

    const hasAllRequired = required.every(key => key in settings);
    if (!hasAllRequired) return undefined;

    return {
        investmentAmount: clamp(settings.investmentAmount, 5, 100),
        zScoreThreshold: clamp(settings.zScoreThreshold, 1.0, 5.0),
        windowSize: clamp(settings.windowSize, 50, 500),
        minMadThreshold: clamp(settings.minMadThreshold, 0.0001, 0.01),
        maxDcaEntries: clamp(settings.maxDcaEntries, 0, 5),
        dcaZScoreMultiplier: clamp(settings.dcaZScoreMultiplier, 1.0, 3.0),
        minDcaPriceDeviationPercent: clamp(settings.minDcaPriceDeviationPercent, 0.1, 1.0),
        stopLossPercent: clamp(settings.stopLossPercent, 1.0, 10.0),
        softTimeoutMs: clamp(settings.softTimeoutMs, 10000, 300000),
        minZScoreExit: clamp(settings.minZScoreExit, 0.0, 1.0),
    };
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
