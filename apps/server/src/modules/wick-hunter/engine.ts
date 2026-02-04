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

        // Start 1Hz heartbeat timer (slower, just for UI continuity)
        this.tickInterval = setInterval(() => {
            this.generateHeartbeat();
        }, 1000);
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

            // 5. Update current state (but postpone broadcast)
            this.currentPrice = price;

            // Log latencies every 1000 trades or as needed
            if (this.tradeCount % 100 === 0) {
                console.log(`⏱️ LATENCY [#${this.tradeCount}] WS: ${wsLatency}ms | Total: ${tradeTotal.toFixed(2)}ms`);
            }
        }

        // Broadcast only the FINAL state of the batch to the UI
        if (trades.length > 0) {
            const lastTrade = trades[trades.length - 1];
            // Use current stats (from the last processed trade)
            const stats = this.algorithm.getCurrentStats();
            if (stats) {
                this.broadcastLiveTick(lastTrade.price, stats, lastTrade.time);
            }
        }

        const batchTotal = performance.now() - batchStart;
        if (trades.length > 5) {
            console.log(`📦 BATCH [${trades.length} trades] Total: ${batchTotal.toFixed(2)}ms`);
        }
    }

    private broadcastLiveTick(price: number, stats: Stats, time: number) {
        this.lastTickTime = Date.now();
        this.infra.broadcastTick({
            price,
            median: stats.median,
            mad: stats.mad,
            zScore: stats.zScore,
            time,
            signal: undefined,
            wsLatency: this.lastWsLatency
        });
    }

    private async executeBuy(price: number, stats: Stats, time: number) {
        console.log(`🔍 Attempting BUY at ${price.toFixed(2)} (Z: ${stats.zScore.toFixed(2)})`);

        // Debug: Log attempt to DB so it shows in UI
        this.infra.saveLog({
            timestamp: Date.now(),
            level: 'INFO',
            message: `🔍 Attempting BUY at ${price.toFixed(2)} (Z: ${stats.zScore.toFixed(2)})`,
            snapshot: { price, median: stats.median, mad: stats.mad, zScore: stats.zScore, velocity: 0, acceleration: 0, positionState: this.infra.position.state }
        }).catch(console.error);

        const isRunning = await this.infra.checkIsRunning();
        console.log(`🔍 Engine Running State: ${isRunning}`);

        if (!isRunning) {
            console.warn(`⚠️ Buy skipped: Engine not running (Infra check failed)`);
            this.infra.saveLog({
                timestamp: Date.now(),
                level: 'WARN',
                message: `⚠️ Buy skipped: Engine not running (Infra check failed)`,
                snapshot: { price, median: stats.median, mad: stats.mad, zScore: stats.zScore, velocity: 0, acceleration: 0, positionState: this.infra.position.state }
            }).catch(console.error);
            return;
        }

        const amount = this.algorithm.calculateBuyAmount(price);
        console.log(`🔍 Calculated Buy Amount: ${amount}`);

        if (amount <= 0) {
            console.warn(`⚠️ Buy skipped: Invalid amount (${amount})`);
            this.infra.saveLog({
                timestamp: Date.now(),
                level: 'WARN',
                message: `⚠️ Buy skipped: Invalid amount (${amount})`,
                snapshot: { price, median: stats.median, mad: stats.mad, zScore: stats.zScore, velocity: 0, acceleration: 0, positionState: this.infra.position.state }
            }).catch(console.error);
            return;
        }

        this.infra.openPosition(price, amount)
            .then((id) => {
                if (id) {
                    console.log(`✅ Virtual Position Opened/Updated! RoundID: ${id}`);
                    this.infra.saveLog({
                        timestamp: Date.now(),
                        level: 'INFO',
                        message: `✅ Virtual Position Opened/Updated! RoundID: ${id}`,
                        snapshot: { price, median: stats.median, mad: stats.mad, zScore: stats.zScore, velocity: 0, acceleration: 0, positionState: this.infra.position.state }
                    }).catch(console.error);
                    this.infra.saveSignal('BUY', price, stats.zScore, time).catch(console.error);
                } else {
                    console.error(`❌ Virtual Position Failed: ID is null`);
                    this.infra.saveLog({
                        timestamp: Date.now(),
                        level: 'ERROR',
                        message: `❌ Virtual Position Failed: ID is null`,
                        snapshot: { price, median: stats.median, mad: stats.mad, zScore: stats.zScore, velocity: 0, acceleration: 0, positionState: this.infra.position.state }
                    }).catch(console.error);
                }
            })
            .catch(err => {
                console.error(`❌ Virtual Position Except: ${err.message}`);
                this.infra.saveLog({
                    timestamp: Date.now(),
                    level: 'ERROR',
                    message: `❌ Virtual Position Except: ${err.message}`,
                    snapshot: { price, median: stats.median, mad: stats.mad, zScore: stats.zScore, velocity: 0, acceleration: 0, positionState: this.infra.position.state }
                }).catch(console.error);
            });
    }

    private executeSell(price: number, status: 'CLOSED' | 'STOPPED_OUT') {
        this.infra.closePosition(price, status).catch(console.error);
    }

    private generateHeartbeat() {
        const now = Date.now();

        // If we recently sent a live tick, skip heartbeat to reduce noise
        if (this.lastTickTime && now - this.lastTickTime < 900) {
            return;
        }

        const stats = this.algorithm.getCurrentStats();
        const price = this.algorithm.getLastPrice();
        if (!stats || price === 0) return;

        this.infra.broadcastTick({
            price: price,
            median: stats.median,
            mad: stats.mad,
            zScore: stats.zScore,
            time: now,
            signal: undefined,
            wsLatency: this.lastWsLatency
        });

        // Heartbeat log with full precision
        console.log(`📡 Heartbeat: price=${price.toFixed(5)}, zScore=${stats.zScore.toFixed(3)}`);
    }
}
