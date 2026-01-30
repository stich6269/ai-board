import { useState, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";

import { StreamChart } from "@/modules/wick-hunter/components/StreamChart";
import { CreateConfig } from "@/modules/wick-hunter/components/CreateConfig";
import { BottomPanel } from "@/modules/wick-hunter/components/BottomPanel";
import { StrategySettings } from "@/modules/wick-hunter/components/StrategySettings";
import { DashboardHeader } from "@/modules/wick-hunter/components/DashboardHeader";
import { StatsBar } from "@/modules/wick-hunter/components/StatsBar";
import { useMetricsStream } from "@/modules/wick-hunter/model/hooks/useMetricsStream";
import type { ChartController, MetricData } from "@/modules/wick-hunter/model/hooks/useMetricsStream";

export default function DashboardStream() {
    const config = useQuery(api.wick.getConfig, { userId: "default" });
    const toggleBot = useMutation(api.wick.toggleBot);
    const changeSymbol = useMutation(api.wick.changeSymbol);
    const statsData = useQuery(api.wick.getStats, config ? { configId: config._id } : "skip");
    const signals = useQuery(api.wick.getSignals, config ? { configId: config._id } : "skip");
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
        if (!config) return;
        await changeSymbol({ configId: config._id, symbol: newSymbol });
        // Clear local state
        setCurrentMetric(undefined);
        setLatency(0);
    }, [config, changeSymbol]);

    // 🔥 Подключаем стрим с коллбеками
    useMetricsStream({ 
        chartController: chartControllerRef,
        onMetricUpdate: handleMetricUpdate,
        onLatencyUpdate: handleLatencyUpdate
    });

    const [refreshKey, setRefreshKey] = useState(0);

    // Initial Loading
    if (config === undefined) {
        return (
            <div className="p-8 space-y-6 max-w-[1400px] mx-auto">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-[600px] w-full" />
            </div>
        );
    }

    // Onboarding
    if (config === null) {
        return (
            <div className="p-8 max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Target className="h-8 w-8 text-blue-600" />
                        <h1 className="text-3xl font-bold">Mission Control (Stream)</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Initialize modules to access the dashboard.
                    </p>
                </div>
                <CreateConfig
                    key={refreshKey}
                    onCreated={() => setRefreshKey(k => k + 1)}
                />
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
            <DashboardHeader
                symbol={config.symbol}
                isRunning={config.isRunning}
                onToggle={() => toggleBot({ configId: config._id })}
                onSymbolChange={handleSymbolChange}
            />
            
            <StatsBar
                totalPnL={totalPnL}
                winRate={stats.winRate}
                totalRounds={stats.totalRounds}
                lastPrice={currentMetric?.price}
                latency={latency}
                currentMetric={currentMetric}
                zScoreThreshold={config.zScoreThreshold || 3.0}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 overflow-hidden bg-[#0a0a0a] p-2">
                        {/* 🔥 НОВЫЙ ГРАФИК С СИГНАЛАМИ И ЛИНИЯМИ */}
                        <StreamChart 
                            ref={chartControllerRef}
                            signals={signals || []}
                            stopLossPrice={slPrice}
                            takeProfitPrice={tpPrice}
                            windowSize={config.windowSize}
                        />
                    </div>

                    <div className="w-[280px] flex-shrink-0">
                        <StrategySettings config={config} />
                    </div>
                </div>

                <div className="h-[280px] flex-shrink-0">
                    <BottomPanel
                        trades={limitedTrades as any[]}
                        openPosition={openRound}
                        slPrice={slPrice}
                        tpPrice={tpPrice}
                        currentPrice={currentMetric?.price}
                        configId={config._id}
                        logs={logs || []}
                    />
                </div>
            </div>

        </div>
    );
}
