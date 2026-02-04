export interface StrategySettings {
    investmentAmount: number;
    zScoreThreshold: number;
    windowSize: number;
    minMadThreshold: number;
    maxDcaEntries: number;
    dcaZScoreMultiplier: number;
    minDcaPriceDeviationPercent: number;
    stopLossPercent: number;
    softTimeoutMs: number;
    minZScoreExit: number;
}

export interface TradeSnapshot {
    symbol: string;
    buyTime: number;
    buyPrice: number;
    sellPrice?: number;
    status: string;
    finalPnL?: number;
    durationSeconds?: number;
}

export interface SignalSnapshot {
    timestamp: number;
    type: string;
    price: number;
    zScore: number;
}

export interface PerformanceMetrics {
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    avgDuration: number;
    avgPnLPercent: number;
}

export interface AIDataSnapshot {
    currentSettings: StrategySettings;
    recentTrades: TradeSnapshot[];
    recentSignals: SignalSnapshot[];
    metrics: PerformanceMetrics;
    tradesSinceLastApply: number;
    signalsSinceLastApply: number;
    symbol: string;
}

export interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    suggestedSettings?: StrategySettings;
    isLoading?: boolean;
}

export interface AIResponse {
    explanation: string;
    suggestedSettings?: StrategySettings;
    confidence?: number;
}
