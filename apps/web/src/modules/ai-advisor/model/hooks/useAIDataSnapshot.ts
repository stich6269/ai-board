import { useMemo } from 'react';
import type { AIDataSnapshot, StrategySettings, TradeSnapshot, SignalSnapshot, PerformanceMetrics } from '../../lib/types';
import { useAIAdvisorStore } from '../store';

interface UseAIDataSnapshotProps {
    config: any;
    trades: any[];
    signals: any[];
    symbol: string;
}

export function useAIDataSnapshot({ config, trades, signals, symbol }: UseAIDataSnapshotProps): AIDataSnapshot {
    const lastApplyTimestamp = useAIAdvisorStore(state => state.lastApplyTimestamp);

    return useMemo(() => {
        const currentSettings: StrategySettings = {
            investmentAmount: config?.investmentAmount || 10,
            zScoreThreshold: config?.zScoreThreshold || 2.0,
            windowSize: config?.windowSize || 200,
            minMadThreshold: config?.minMadThreshold || 0.001,
            maxDcaEntries: config?.maxDcaEntries ?? 2,
            dcaZScoreMultiplier: config?.dcaZScoreMultiplier || 1.3,
            minDcaPriceDeviationPercent: config?.minDcaPriceDeviationPercent || 0.2,
            stopLossPercent: config?.stopLossPercent || 3.0,
            softTimeoutMs: config?.softTimeoutMs || 30000,
            minZScoreExit: config?.minZScoreExit || 0.1,
        };

        const recentTrades: TradeSnapshot[] = (trades || []).slice(0, 100).map(t => ({
            symbol: t.symbol,
            buyTime: t.buyTime,
            buyPrice: t.buyPrice,
            sellPrice: t.sellPrice,
            status: t.status,
            finalPnL: t.finalPnL,
            durationSeconds: t.durationSeconds,
        }));

        const recentSignals: SignalSnapshot[] = (signals || []).slice(0, 50).map(s => ({
            timestamp: s.timestamp,
            type: s.type,
            price: s.price,
            zScore: s.zScore,
        }));

        const closedTrades = recentTrades.filter(t => t.status === 'CLOSED' || t.status === 'STOPPED_OUT');
        const winningTrades = closedTrades.filter(t => (t.finalPnL || 0) > 0);
        
        const metrics: PerformanceMetrics = {
            totalTrades: closedTrades.length,
            winRate: closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0,
            totalPnL: closedTrades.reduce((sum, t) => sum + (t.finalPnL || 0), 0),
            avgDuration: closedTrades.length > 0 
                ? closedTrades.reduce((sum, t) => sum + (t.durationSeconds || 0), 0) / closedTrades.length 
                : 0,
            avgPnLPercent: closedTrades.length > 0
                ? closedTrades.reduce((sum, t) => {
                    if (t.sellPrice && t.buyPrice) {
                        return sum + ((t.sellPrice - t.buyPrice) / t.buyPrice) * 100;
                    }
                    return sum;
                }, 0) / closedTrades.length
                : 0,
        };

        const tradesSinceLastApply = lastApplyTimestamp
            ? recentTrades.filter(t => t.buyTime > lastApplyTimestamp).length
            : recentTrades.length;

        const signalsSinceLastApply = lastApplyTimestamp
            ? recentSignals.filter(s => s.timestamp > lastApplyTimestamp).length
            : recentSignals.length;

        return {
            currentSettings,
            recentTrades,
            recentSignals,
            metrics,
            tradesSinceLastApply,
            signalsSinceLastApply,
            symbol,
        };
    }, [config, trades, signals, symbol, lastApplyTimestamp]);
}
