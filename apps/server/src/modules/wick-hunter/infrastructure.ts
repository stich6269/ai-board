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
        try {
            // 1. Fetch current control state from Convex
            const state = await convexClient.query(api.wick.getState, {
                configId: this.config.configId as any
            });

            if (!state) return;

            // 2. Handle Manual Interventions (MANUAL_CLOSE / PANIC_CLOSE)
            const isManualAction = state.status === 'MANUAL_CLOSE' || state.status === 'PANIC_CLOSE';

            if (isManualAction && this.position.state === 'LONG') {
                console.log(`🔴 Manual Intervention [${state.status}] detected - Triggering exit...`);

                // Clear the status in Convex FIRST to avoid double-triggering
                // but keep it active locally until the sell is executed
                await convexClient.mutation(api.wick.updateState, {
                    configId: this.config.configId as any,
                    status: 'IDLE'
                });

                // Trigger the engine's sell logic
                this.onManualClose?.();
                return;
            }

            // 3. Periodic Sync: Check if our local "LONG" state matches the DB's "OPEN" rounds
            if (this.position.state === 'LONG' && this.position.roundId) {
                const openRound = await convexClient.query(api.wick.getRound, {
                    id: this.position.roundId as any
                });

                // If the round we are tracking disappeared or was closed externally
                if (!openRound || openRound.status !== 'OPEN') {
                    console.warn(`🔄 Sync Mismatch: Round ${this.position.roundId} is ${openRound?.status || 'DELETED'} in DB. Resetting engine to NONE.`);
                    this.resetLocalState();
                }
            }

            // 4. Ghost Position Recovery: If we think we are "NONE" but DB has an "OPEN" round
            if (this.position.state === 'NONE' && !this.position.isPersisting) {
                const openRound = await convexClient.query(api.wick.getOpenRound, {
                    configId: this.config.configId as any
                });

                if (openRound) {
                    console.log(`👻 Ghost Position Found: Recovering round ${openRound._id}`);
                    this.position.roundId = openRound._id;
                    this.position.state = 'LONG';
                    this.position.entryPrice = openRound.buyPrice;
                    this.position.totalAmount = openRound.buyAmount;
                    this.position.entryTime = openRound.buyTime;
                }
            }
        } catch (e) {
            // Silently ignore sync/network hiccups to keep engine running
        }
    }

    private resetLocalState() {
        this.position.state = 'NONE';
        this.position.roundId = null;
        this.position.entryPrice = 0;
        this.position.totalAmount = 0;
        this.position.dcaCount = 0;
        this.position.entryTime = undefined;
        this.position.isPersisting = false;
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

    public async openPosition(price: number, amount: number, timestamp: number, snapshot: any): Promise<string | null> {
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
                    buyAmount: amount,
                    buyTime: timestamp,
                    snapshot: {
                        median: snapshot.median,
                        mad: snapshot.mad,
                        zScore: snapshot.zScore,
                        velocity: snapshot.velocity || 0,
                        acceleration: snapshot.acceleration || 0
                    }
                });
                this.position.roundId = id;
                this.position.entryPrice = price;
                this.position.dcaCount = 0;
                this.position.totalAmount = amount;
                this.position.entryTime = timestamp; // Use exchange time
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
                    newAmount: amount,
                    timestamp: timestamp,
                    snapshot: {
                        median: snapshot.median,
                        mad: snapshot.mad,
                        zScore: snapshot.zScore,
                        velocity: snapshot.velocity || 0,
                        acceleration: snapshot.acceleration || 0
                    }
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

    public async closePosition(price: number, status: 'CLOSED' | 'STOPPED_OUT', timestamp?: number, snapshot?: any) {
        const roundToClose = this.position.roundId;

        this.position.isPersisting = true;
        this.resetLocalState();

        if (roundToClose) {
            try {
                await convexClient.mutation(api.wick.closeRound, {
                    roundId: roundToClose as any,
                    sellPrice: price,
                    status: status,
                    sellTime: timestamp,
                    snapshot: snapshot ? {
                        median: snapshot.median,
                        mad: snapshot.mad,
                        zScore: snapshot.zScore,
                        velocity: snapshot.velocity || 0,
                        acceleration: snapshot.acceleration || 0
                    } : undefined
                });
                console.log(`✅ Round ${roundToClose} closed successfully in DB.`);
            } catch (e) {
                console.error('WHE closeRound Error:', e);
            } finally {
                this.position.isPersisting = false;
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
