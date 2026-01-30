import { NetworkLayer, TradeData } from './network';
import { InfrastructureLayer } from './infrastructure';
import { AlgorithmLayer, Stats, LogEntry } from './algorithm';

export interface EngineConfig {
    symbol: string;
    windowSize: number;
    zScoreThreshold: number;
    takeProfitPercent: number;
    stopLossPercent: number;
    heatmapDecay: number;
    walletPrivateKey: string;
    wsUrl: string;
    configId: string;
    investmentAmount: number;
    maxDcaEntries: number;
    dcaZScoreMultiplier: number;
    minDcaPriceDeviationPercent: number;
    minMadThreshold: number;
    softTimeoutMs: number;
    minZScoreExit: number;
}

export class WickHunterEngine {
    private config: EngineConfig;
    private network: NetworkLayer;
    private infra: InfrastructureLayer;
    private algorithm: AlgorithmLayer;
    private currentPrice: number = 0;
    private tradeCount: number = 0;
    private lastLatencyLog: number = 0;
    private lastWsLatency: number = 0;
    private tickInterval: NodeJS.Timeout | null = null;
    private lastTickTime: number = 0;

    constructor(config: EngineConfig) {
        this.config = config;

        // Network Layer
        this.network = new NetworkLayer(
            { wsUrl: config.wsUrl, symbol: config.symbol },
            (trades) => this.processTrades(trades)
        );

        // Infrastructure Layer
        this.infra = new InfrastructureLayer({
            configId: config.configId,
            symbol: config.symbol,
            walletPrivateKey: config.walletPrivateKey,
            heatmapDecay: config.heatmapDecay
        });

        // Algorithm Layer
        this.algorithm = new AlgorithmLayer({
            windowSize: config.windowSize,
            zScoreThreshold: config.zScoreThreshold,
            takeProfitPercent: config.takeProfitPercent,
            stopLossPercent: config.stopLossPercent,
            investmentAmount: config.investmentAmount,
            maxDcaEntries: config.maxDcaEntries,
            dcaZScoreMultiplier: config.dcaZScoreMultiplier,
            minDcaPriceDeviationPercent: config.minDcaPriceDeviationPercent,
            minMadThreshold: config.minMadThreshold,
            softTimeoutMs: config.softTimeoutMs,
            minZScoreExit: config.minZScoreExit
        });

        // Wire up log handler
        this.algorithm.setLogHandler((entry: LogEntry) => {
            this.infra.saveLog(entry).catch(console.error);
        });

        // Wire up manual close handler
        this.infra.setManualCloseHandler(() => {
            this.executeSell(this.currentPrice, 'CLOSED');
        });
    }

    public async start() {
        await this.infra.start();
        this.network.start();
        
        // Start 5Hz tick timer
        this.tickInterval = setInterval(() => {
            this.generateFixedTick();
        }, 200); // 200ms = 5Hz
    }

    public async stop() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
        this.network.stop();
        await this.infra.stop();
    }

    private processTrades(trades: TradeData[]) {
        const batchStart = performance.now();
        
        for (const trade of trades) {
            const tradeStart = performance.now();
            const { price, size, time } = trade;
            this.tradeCount++;

            // 1. Update infrastructure (heatmap)
            const heatmapStart = performance.now();
            this.infra.updateHeatmap(price, size, time);
            const heatmapTime = performance.now() - heatmapStart;

            // 2. Update algorithm (rolling stats, differential analysis)
            const algoStart = performance.now();
            const stats = this.algorithm.processPrice(price, time);
            const algoTime = performance.now() - algoStart;
            this.currentPrice = price;

            // 3. Evaluate signal
            const signalStart = performance.now();
            const { signal, sellReason } = this.algorithm.evaluateSignal(stats, price, {
                positionState: this.infra.position.state,
                entryPrice: this.infra.position.entryPrice,
                isPersisting: this.infra.position.isPersisting,
                dcaCount: this.infra.position.dcaCount || 0,
                entryTime: this.infra.position.entryTime
            });
            const signalTime = performance.now() - signalStart;

            // 4. Execute signal
            if (signal === 'BUY') {
                this.executeBuy(price, stats, time);
            } else if (signal === 'SELL' && sellReason) {
                this.executeSell(price, sellReason);
                this.infra.saveSignal('SELL', price, stats.zScore, time).catch(console.error);
            }

            const tradeTotal = performance.now() - tradeStart;
            const wsLatency = Date.now() - time;
            this.lastWsLatency = wsLatency;

            // 5. Update current state only (no broadcast - handled by timer)
            this.currentPrice = price;

            // Log latencies every second
            const now = Date.now();
            if (now - this.lastLatencyLog > 1000) {
                this.lastLatencyLog = now;
                console.log(`⏱️ LATENCY [#${this.tradeCount}] WS: ${wsLatency}ms | Heatmap: ${heatmapTime.toFixed(2)}ms | Algo: ${algoTime.toFixed(2)}ms | Signal: ${signalTime.toFixed(2)}ms | Total: ${tradeTotal.toFixed(2)}ms`);
                console.log(`⏱️ LATENCY [#${this.tradeCount}] WS: ${wsLatency}ms | Heatmap: ${heatmapTime.toFixed(2)}ms | Algo: ${algoTime.toFixed(2)}ms | Signal: ${signalTime.toFixed(2)}ms | Total: ${tradeTotal.toFixed(2)}ms`);
            }
        }

        const batchTotal = performance.now() - batchStart;
        if (trades.length > 1) {
            console.log(`📦 BATCH [${trades.length} trades] Total: ${batchTotal.toFixed(2)}ms | Avg: ${(batchTotal / trades.length).toFixed(2)}ms/trade`);
        }
    }

    private async executeBuy(price: number, stats: Stats, time: number) {
        // Check if trading is enabled before opening position
        const isRunning = await this.infra.checkIsRunning();
        if (!isRunning) {
            console.log('⏸️ Trading paused - skipping BUY signal');
            return;
        }
        
        const amount = this.algorithm.calculateBuyAmount(price);
        
        this.infra.openPosition(price, amount)
            .then(() => {
                this.infra.saveSignal('BUY', price, stats.zScore, time).catch(console.error);
            })
            .catch(console.error);
    }

    private executeSell(price: number, status: 'CLOSED' | 'STOPPED_OUT') {
        this.infra.closePosition(price, status).catch(console.error);
    }

    private generateFixedTick() {
        const now = Date.now();
        
        // Duplicate protection (avoid sending same tick twice)
        if (this.lastTickTime && now - this.lastTickTime < 180) {
            return;
        }
        
        this.lastTickTime = now;
        
        // Get current stats from algorithm
        const stats = this.algorithm.getCurrentStats();
        if (!stats) {
            return;
        }

        // Get latest price from algorithm (updates with every trade)
        const price = this.algorithm.getLastPrice();
        if (price === 0) {
            return;
        }
        
        // Broadcast fixed-frequency tick
        this.infra.broadcastTick({
            price: price,
            median: stats.median,
            mad: stats.mad,
            zScore: stats.zScore,
            time: now,
            signal: undefined,
            wsLatency: this.lastWsLatency
        });
        
        // Debug: Log every 10th broadcast
        if (Math.random() < 0.1) {
            console.log(`📡 Broadcasting tick: price=${price.toFixed(2)}, zScore=${stats.zScore.toFixed(2)}`);
        }
    }
}
