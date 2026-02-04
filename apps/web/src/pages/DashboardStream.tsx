import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

import { StreamChart } from "@/modules/wick-hunter/components/StreamChart";
import { BottomPanel } from "@/modules/wick-hunter/components/BottomPanel";
import { StrategySettings } from "@/modules/wick-hunter/components/StrategySettings";
import { DashboardHeader } from "@/modules/wick-hunter/components/DashboardHeader";
import { StatsBar } from "@/modules/wick-hunter/components/StatsBar";
import { useMetricsStream } from "@/modules/wick-hunter/model/hooks/useMetricsStream";
import type { ChartController, MetricData } from "@/modules/wick-hunter/model/hooks/useMetricsStream";
import { useAppStore, AppActions } from "@/store";
import { AIAdvisorPanel } from "@/modules/ai-advisor";

const DEFAULT_CONFIG = {
    buyDipPercent: 1.5,
    takeProfitPercent: 1.0,
    stopLossPercent: 3.0,
    investmentAmount: 15,
    zScoreThreshold: 3.0,
    minZScoreExit: 0.1,
};

export default function DashboardStream() {
    const { userId, currentSymbol } = useAppStore();
    const config = useQuery(api.wick.getConfig, { userId, symbol: currentSymbol });
    const toggleBot = useMutation(api.wick.toggleBot);
    const createConfig = useMutation(api.wick.createConfig);
    const setActiveSymbol = useMutation(api.wick.setActiveSymbol);
    const [isCreatingConfig, setIsCreatingConfig] = useState(false);

    useEffect(() => {
        if (config) {
            AppActions.setConfig(config._id, config.isRunning);
        } else if (config === null && !isCreatingConfig) {
            setIsCreatingConfig(true);
            createConfig({
                userId,
                symbol: currentSymbol,
                ...DEFAULT_CONFIG,
            }).then(() => {
                setIsCreatingConfig(false);
                fetch('/api/workers/wick-hunter/start', { method: 'POST' });
            }).catch((err) => {
                console.error('Failed to create config:', err);
                setIsCreatingConfig(false);
            });
        }
    }, [config, currentSymbol, userId, isCreatingConfig, createConfig]);

    const statsData = useQuery(api.wick.getStats, config ? { configId: config._id } : "skip");
    const signals = useQuery(api.wick.getSignals, config ? { configId: config._id } : "skip");
    const orders = useQuery(api.wick.getOrders, config ? { configId: config._id, limit: 100 } : "skip");
    const logs = useQuery(api.wick.getLogs, config ? { configId: config._id, limit: 100 } : "skip");

    const { stats, rounds } = statsData || {
        stats: { totalRounds: 0, totalPnL: 0, winRate: 0, winCount: 0, lossCount: 0 },
        rounds: []
    };

    const openRound = useMemo(() => rounds.find(r => r.status === "OPEN"), [rounds]);
    const limitedTrades = useMemo(() => rounds.slice(0, 100), [rounds]);
    const slPrice = useMemo(() => openRound && config ? openRound.buyPrice * (1 - config.stopLossPercent / 100) : undefined, [openRound, config]);
    const tpPrice = useMemo(() => openRound && config ? openRound.buyPrice * (1 + (config.takeProfitPercent || 0) / 100) : undefined, [openRound, config]);
    const totalPnL = useMemo(() => stats.totalPnL || 0, [stats.totalPnL]);

    // 🔥 State для метрик в хедере (минимальный state только для UI)
    const [currentMetric, setCurrentMetric] = useState<MetricData | undefined>(undefined);
    const [latency, setLatency] = useState<number>(0);

    // 🔥 Создаем ссылку для управления графиком
    const chartControllerRef = useRef<ChartController>(null);

    // Коллбеки для обновления хедера
    const handleMetricUpdate = useCallback((metric: MetricData) => {
        setCurrentMetric(metric);
    }, []);

    const handleLatencyUpdate = useCallback((lat: number) => {
        setLatency(lat);
    }, []);

    const handleSymbolChange = useCallback(async (newSymbol: string) => {
        AppActions.setSymbol(newSymbol);
        setCurrentMetric(undefined);
        setLatency(0);
        if (chartControllerRef.current) {
            chartControllerRef.current.setHistory([]);
            chartControllerRef.current.setZScoreHistory([]);
        }
        await setActiveSymbol({ userId, symbol: newSymbol });
    }, [userId, setActiveSymbol]);

    useMetricsStream({
        chartController: chartControllerRef,
        onMetricUpdate: handleMetricUpdate,
        onLatencyUpdate: handleLatencyUpdate
    });

    // Initial Loading - only for the very first load
    const isFirstLoad = config === undefined && !currentSymbol;

    if (isFirstLoad) {
        return (
            <div className="p-8 space-y-6 max-w-[1400px] mx-auto">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-[600px] w-full" />
            </div>
        );
    }

    // While switching symbols, we show the previous UI but with loading indicators for data
    const isSwitching = config === undefined || isCreatingConfig;
    const effectiveConfig = config || {
        _id: "placeholder",
        isRunning: false,
        windowSize: 200,
        zScoreThreshold: 3.0,
        stopLossPercent: 3.0,
        takeProfitPercent: 1.0,
    };

    return (
        <div className="h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
            <DashboardHeader
                symbol={currentSymbol}
                isRunning={effectiveConfig.isRunning}
                onToggle={() => config && toggleBot({ configId: config._id })}
                onSymbolChange={handleSymbolChange}
            />

            <div className={`flex-1 flex overflow-hidden ${isSwitching ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <StatsBar
                        totalPnL={totalPnL}
                        winRate={stats.winRate}
                        totalRounds={stats.totalRounds}
                        lastPrice={currentMetric?.price}
                        latency={latency}
                        currentMetric={currentMetric}
                        zScoreThreshold={effectiveConfig.zScoreThreshold || 3.0}
                    />

                    <div className="flex-1 flex overflow-hidden">
                        <div className="flex-1 overflow-hidden bg-[#0a0a0a] p-2">
                            <StreamChart
                                ref={chartControllerRef}
                                trades={isSwitching ? [] : (orders as any[])}
                                stopLossPrice={slPrice}
                                takeProfitPrice={tpPrice}
                                windowSize={effectiveConfig.windowSize}
                            />
                        </div>

                        <div className="w-[280px] flex-shrink-0 border-l border-gray-800">
                            {config ? (
                                <StrategySettings config={config} />
                            ) : (
                                <div className="p-4"><Skeleton className="h-full w-full" /></div>
                            )}
                        </div>
                    </div>

                    <div className="h-[280px] flex-shrink-0 border-t border-gray-800">
                        <BottomPanel
                            trades={isSwitching ? [] : (limitedTrades as any[])}
                            openPosition={isSwitching ? undefined : openRound}
                            slPrice={slPrice}
                            tpPrice={tpPrice}
                            currentPrice={currentMetric?.price}
                            configId={config?._id}
                            logs={isSwitching ? [] : (logs || [])}
                        />
                    </div>
                </div>

                <div className="w-[350px] flex-shrink-0">
                    <AIAdvisorPanel
                        configId={config?._id}
                        config={config}
                        trades={isSwitching ? [] : limitedTrades}
                        signals={isSwitching ? [] : (signals || [])}
                        symbol={currentSymbol}
                    />
                </div>
            </div>

        </div>
    );
}
