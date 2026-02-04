import { telemetry } from '../../lib/telemetry';
import { convexClient } from '../../lib/convexClient.js';
import { api } from '../../../../../convex/_generated/api.js';
import { SigningService } from '../../services/signing.service';
import { LiquidationHeatmap } from './heatmap';

export interface InfraConfig {
    configId: string;
    symbol: string;
    walletPrivateKey: string;
    heatmapDecay: number;
}

export interface PositionState {
    state: 'NONE' | 'LONG';
    roundId: string | null;
    entryPrice: number;
    isPersisting: boolean;
    dcaCount: number;
    totalAmount: number;
    entryTime?: number;
}

export interface MetricData {
    price: number;
    median: number;
    mad: number;
    zScore: number;
    time: number;
    signal?: 'BUY' | 'SELL';
    wsLatency?: number;
}

export class InfrastructureLayer {
    private config: InfraConfig;
    private signer: SigningService;
    private heatmap: LiquidationHeatmap;
    private assetMap: Map<string, number> = new Map();

    private stateCheckTimer: NodeJS.Timeout | null = null;

    public position: PositionState = {
        state: 'NONE',
        roundId: null,
        entryPrice: 0,
        isPersisting: false,
        dcaCount: 0,
        totalAmount: 0
    };

    private onManualClose?: () => void;

    constructor(config: InfraConfig) {
        this.config = config;
        this.signer = new SigningService(config.walletPrivateKey);
        this.heatmap = new LiquidationHeatmap({ binSize: 0.1, decayLambda: config.heatmapDecay });
    }

    public setManualCloseHandler(handler: () => void) {
        this.onManualClose = handler;
    }

    public async start() {
        await this.signer.start();
        await this.loadMeta();
        await this.recoverPosition();
        this.startBackgroundTasks();
    }

    public async stop() {
        if (this.stateCheckTimer) {
            clearInterval(this.stateCheckTimer);
            this.stateCheckTimer = null;
        }
        await this.signer.stop();
    }

    private startBackgroundTasks() {
        this.stateCheckTimer = setInterval(() => this.checkStateAsync(), 1000);
    }

    private async loadMeta() {
        try {
            const response = await fetch('https://api.hyperliquid.xyz/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: "meta" })
            });
            const data = await response.json() as any;
            for (let i = 0; i < data.universe.length; i++) {
                const asset = data.universe[i];
                this.assetMap.set(asset.name, i);
            }
        } catch (e) {
            console.error('WHE Failed to load meta:', e);
        }
    }

    private async recoverPosition() {
        try {
            const openRound = await convexClient.query(api.wick.getOpenRound, {
                configId: this.config.configId as any
            });
            if (openRound) {
                this.position.roundId = openRound._id;
                this.position.state = 'LONG';
                this.position.entryPrice = openRound.buyPrice;
                this.position.totalAmount = openRound.buyAmount;
                this.position.dcaCount = 0; // Will be recalculated if needed
                console.log(`🔄 Position recovered: Entry ${openRound.buyPrice}, Amount ${openRound.buyAmount}`);
            }
        } catch (e) {
            console.error('WHE Recovery Error:', e);
        }
    }

    private async checkStateAsync() {
        if (!this.position.roundId) return;
        try {
            const state = await convexClient.query(api.wick.getState, {
                configId: this.config.configId as any
            });

            if (state && state.status === 'MANUAL_CLOSE' && this.position.state === 'LONG') {
                console.log('🔴 MANUAL_CLOSE detected - closing position');
                this.onManualClose?.();

                await convexClient.mutation(api.wick.updateState, {
                    configId: this.config.configId as any,
                    status: 'IDLE'
                });
            }
        } catch (e) {
            // Ignore network errors
        }
    }

    public updateHeatmap(price: number, size: number, time: number) {
        this.heatmap.update(price, size, time);
    }

    public getHeatmapLevels(time: number, count: number) {
        return this.heatmap.getTopLevels(time, count);
    }

    public broadcastTick(data: MetricData) {
        try {
            const heatmapLevels = this.heatmap.getTopLevels(data.time, 20);
            const coin = this.config.symbol.split('/')[0];

            telemetry.broadcast('tick', {
                configId: this.config.configId,
                symbol: coin,
                timestamp: data.time,
                price: data.price,
                median: data.median,
                mad: data.mad,
                zScore: data.zScore,
                heatmapSnapshot: heatmapLevels,
                wsLatency: data.wsLatency
            });
        } catch (e) {
            // Ignore telemetry errors
        }
    }

    public async saveSignal(signal: 'BUY' | 'SELL', price: number, zScore: number, timestamp: number) {
        console.log(`🚨 WHE Signal Generated: ${signal} at price ${price}, zScore: ${zScore}`);
        try {
            await convexClient.mutation(api.wick.saveSignal, {
                configId: this.config.configId as any,
                timestamp: timestamp,
                price: price,
                type: signal,
                zScore: zScore
            });
            console.log(`✅ WHE Signal Saved to Convex: ${signal}`);
        } catch (e) {
            console.error('WHE Signal Save Error:', e);
        }
    }

    public async openPosition(price: number, amount: number): Promise<string | null> {
        this.position.isPersisting = true;

        const isDCA = this.position.state === 'LONG' && this.position.roundId !== null;

        if (!isDCA) {
            // First entry - create new round
            this.position.state = 'LONG';

            try {
                const id = await convexClient.mutation(api.wick.openRound, {
                    configId: this.config.configId as any,
                    symbol: this.config.symbol,
                    buyPrice: price,
                    buyAmount: amount
                });
                this.position.roundId = id;
                this.position.entryPrice = price;
                this.position.dcaCount = 0;
                this.position.totalAmount = amount;
                this.position.entryTime = Date.now();
                this.position.entryTime = Date.now();
                return id;
            } catch (e: any) {
                console.error('❌ WHE openRound Error Details:', {
                    message: e.message,
                    configId: this.config.configId,
                    symbol: this.config.symbol,
                    amount
                });
                throw new Error(`openRound failed: ${e.message}`);
            } finally {
                this.position.isPersisting = false;
            }
        } else {
            // DCA entry - update existing round
            try {
                await convexClient.mutation(api.wick.averagePosition, {
                    roundId: this.position.roundId as any,
                    newPrice: price,
                    newAmount: amount
                });

                // Calculate new average price locally (instant, no DB query needed)
                const oldAmount = this.position.totalAmount;
                const newAmount = amount;
                const avgPrice = ((this.position.entryPrice * oldAmount) + (price * newAmount)) / (oldAmount + newAmount);

                this.position.entryPrice = avgPrice;
                this.position.totalAmount += newAmount;
                this.position.dcaCount++;

                console.log(`🔥 DCA Entry #${this.position.dcaCount} executed at ${price}. New Avg Price: ${avgPrice.toFixed(4)}`);

                return this.position.roundId;
            } catch (e) {
                console.error('WHE averagePosition Error:', e);
                return null;
            } finally {
                this.position.isPersisting = false;
            }
        }
    }

    public async closePosition(price: number, status: 'CLOSED' | 'STOPPED_OUT') {
        this.position.isPersisting = true;
        this.position.state = 'NONE';
        this.position.entryPrice = 0;
        this.position.dcaCount = 0;
        this.position.totalAmount = 0;
        this.position.entryTime = undefined;

        if (this.position.roundId) {
            try {
                await convexClient.mutation(api.wick.closeRound, {
                    roundId: this.position.roundId as any,
                    sellPrice: price,
                    status: status
                });
            } catch (e) {
                console.error('WHE closeRound Error:', e);
            } finally {
                this.position.isPersisting = false;
                this.position.roundId = null;
            }
        } else {
            this.position.isPersisting = false;
        }
    }

    public async checkIsRunning(): Promise<boolean> {
        try {
            const config = await convexClient.query(api.wick.getConfigById, {
                configId: this.config.configId as any
            });
            return config?.isRunning ?? false;
        } catch (e) {
            console.error('WHE checkIsRunning Error:', e);
            return false;
        }
    }

    public async saveLog(entry: {
        timestamp: number;
        level: 'INFO' | 'WARN' | 'ERROR' | 'SIGNAL';
        message: string;
        snapshot: {
            price: number;
            median: number;
            mad: number;
            zScore: number;
            velocity: number;
            acceleration: number;
            positionState: string;
            entryPrice?: number;
            pnlPercent?: number;
        };
    }) {
        try {
            await convexClient.mutation(api.wick.saveLog, {
                configId: this.config.configId as any,
                ...entry
            });
        } catch (e) {
            // Ignore log save errors
        }
    }
}
