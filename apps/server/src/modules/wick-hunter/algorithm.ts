import { RollingMAD } from '@funding-harvester/shared/src/math/rolling-mad';

const MAX_USD_PER_TRADE = 20;
const MIN_TICK_DELTA_MS = 1;
const PANIC_MULTIPLIER = 3.0; 

export interface AlgorithmConfig {
    windowSize: number;
    zScoreThreshold: number;
    takeProfitPercent: number;
    stopLossPercent: number;
    investmentAmount: number;
    maxDcaEntries: number;
    dcaZScoreMultiplier: number;
    // [NEW] Минимальное падение цены (в %) для срабатывания DCA
    minDcaPriceDeviationPercent: number; 
    // [NEW] Минимальная волатильность (MAD), чтобы не торговать шум
    minMadThreshold: number;
    // [NEW] Время, после которого снижаем требования к выходу (мягкий таймаут)
    softTimeoutMs: number;
    // [NEW] Минимальный Z-Score для выхода (покрытие комиссии)
    minZScoreExit: number;
}

export interface AlgorithmState {
    positionState: 'NONE' | 'LONG';
    entryPrice: number;
    isPersisting: boolean;
    dcaCount: number;
    entryTime?: number;
}

export interface Stats {
    median: number;
    mad: number;
    zScore: number;
}

export type SignalType = 'BUY' | 'SELL' | undefined;
export type SellReason = 'CLOSED' | 'STOPPED_OUT';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SIGNAL';

export interface SignalResult {
    signal: SignalType;
    sellReason?: SellReason;
}

// ... LogSnapshot, LogEntry, LogHandler (без изменений) ...
// (Я сократил интерфейсы логов для краткости, оставь их как были)
export interface LogSnapshot {
    price: number;
    median: number;
    mad: number;
    zScore: number;
    velocity: number;
    acceleration: number;
    positionState: string;
    entryPrice?: number;
    pnlPercent?: number;
}
export interface LogEntry {
    timestamp: number;
    level: LogLevel;
    message: string;
    snapshot: LogSnapshot;
}
export type LogHandler = (entry: LogEntry) => void;

export class AlgorithmLayer {
    private config: AlgorithmConfig;
    private rollingStats: RollingMAD;
    private priceHistory: Array<{ price: number; time: number }> = [];
    private maxPriceHistory: number = 10;
    private velocity: number = 0;
    private acceleration: number = 0;
    private samplesCollected: number = 0;
    private lastSignalTime: number = 0;
    private minSignalInterval: number = 500;
    private currentPrice: number = 0;
    private currentStats: Stats = { median: 0, mad: 0, zScore: 0 };
    private onLog?: LogHandler;
    private lastLogTime: number = 0;
    private minLogInterval: number = 20;

    constructor(config: AlgorithmConfig) {
        this.config = config;
        this.rollingStats = new RollingMAD(config.windowSize);
    }

    public setLogHandler(handler: LogHandler) { this.onLog = handler; }

    private log(level: LogLevel, message: string, state: AlgorithmState) {
        if (!this.onLog) return;

        // Throttle non-SIGNAL logs to prevent spam (2 sec interval)
        // But always allow SIGNAL logs through (BUY/SELL are critical)
        if (level !== 'SIGNAL' && Date.now() - this.lastLogTime < this.minLogInterval) {
            return;
        }

        const pnlPercent = state.positionState === 'LONG' && state.entryPrice > 0
            ? ((this.currentPrice - state.entryPrice) / state.entryPrice) * 100
            : undefined;

        this.onLog({
            timestamp: Date.now(),
            level,
            message,
            snapshot: {
                price: this.currentPrice,
                median: this.currentStats.median,
                mad: this.currentStats.mad,
                zScore: this.currentStats.zScore,
                velocity: this.velocity,
                acceleration: this.acceleration,
                positionState: state.positionState,
                entryPrice: state.entryPrice || undefined,
                pnlPercent,
            }
        });

        this.lastLogTime = Date.now();
    }

    public processPrice(price: number, time: number): Stats {
        const stats = this.rollingStats.update(price);
        this.samplesCollected++;
        this.currentPrice = price;
        this.currentStats = stats;
        this.updateDifferentialAnalysis(price, time);
        return stats;
    }

    private updateDifferentialAnalysis(price: number, time: number) {
        this.priceHistory.push({ price, time });
        if (this.priceHistory.length > this.maxPriceHistory) this.priceHistory.shift();
        if (this.priceHistory.length < 3) {
            this.velocity = 0;
            this.acceleration = 0;
            return;
        }
        const current = this.priceHistory[this.priceHistory.length - 1];
        const previous = this.priceHistory[this.priceHistory.length - 2];
        let deltaT = (current.time - previous.time);
        if (deltaT < MIN_TICK_DELTA_MS) deltaT = MIN_TICK_DELTA_MS;
        deltaT = deltaT / 1000;
        const newVelocity = (current.price - previous.price) / deltaT;
        if (this.velocity !== 0) {
            this.acceleration = (newVelocity - this.velocity) / deltaT;
        }
        this.velocity = newVelocity;
    }

    public evaluateSignal(stats: Stats, price: number, state: AlgorithmState): SignalResult {
        // 1. Прогрев и Персистентность
        if (this.samplesCollected < this.config.windowSize) return { signal: undefined };
        if (state.isPersisting) return { signal: undefined };

        const now = Date.now();

        // =========================================================
        // ПРИОРИТЕТ 1: ЛОГИКА ВЫХОДА (SELL)
        // (Она должна работать всегда, независимо от волатильности!)
        // =========================================================
        
        // 1.1 Stop Loss / Take Profit
        if (state.positionState === 'LONG' && state.entryPrice > 0) {
            const pnlPercent = (price - state.entryPrice) / state.entryPrice;

            if (pnlPercent <= -this.config.stopLossPercent / 100) {
                this.log('SIGNAL', `📉 Stop Loss! PnL: ${(pnlPercent * 100).toFixed(2)}%`, state);
                return { signal: 'SELL', sellReason: 'STOPPED_OUT' };
            }

            if (pnlPercent >= this.config.takeProfitPercent / 100) {
                this.log('SIGNAL', `💰 Take Profit! PnL: ${(pnlPercent * 100).toFixed(2)}%`, state);
                return { signal: 'SELL', sellReason: 'CLOSED' };
            }
        }

        // 1.2 Soft Timeout Exit (Dynamic Target Z-Score)
        if (state.positionState === 'LONG') {
            // Базовая цель: вернуться к медиане с учетом комиссии
            let targetZScore = this.config.minZScoreExit;
            
            // Если держим позицию долго, снижаем планку ожиданий
            const holdTime = state.entryTime ? (now - state.entryTime) : 0;
            
            if (holdTime > this.config.softTimeoutMs) {
                // Через 30 сек: согласны выйти при Z >= -1.0
                targetZScore = -1.0;
                
                // Через 60 сек: согласны выйти при Z >= -1.5
                if (holdTime > this.config.softTimeoutMs * 2) {
                    targetZScore = -1.5;
                }
            }

            // Проверка выхода
            if (stats.zScore >= targetZScore) {
                
                // ЗАЩИТА ОТ ЯМЫ: не продаем, если цена активно падает
                const isPanicExit = targetZScore < 0; // Мы снизили требования
                const isPriceCrashing = this.velocity < 0; // Цена летит вниз

                if (isPanicExit && isPriceCrashing) {
                    // Ждем. Не продаем на красной свече.
                    return { signal: undefined };
                }

                if (now - this.lastSignalTime < this.minSignalInterval) {
                    return { signal: undefined };
                }

                const exitType = targetZScore < 0 ? 'TIME_DECAY' : 'PROFIT';
                this.log('SIGNAL', `🔴 ${exitType} Exit! Z: ${stats.zScore.toFixed(2)} (Target: ${targetZScore.toFixed(1)}, Hold: ${(holdTime/1000).toFixed(0)}s)`, state);
                this.lastSignalTime = now;
                return { signal: 'SELL', sellReason: 'CLOSED' };
            }
        }

        // =========================================================
        // ПРИОРИТЕТ 2: ФИЛЬТРЫ ВХОДА
        // (Применяем только для новых покупок)
        // =========================================================

        // [FIX] Фильтр волатильности перенесен сюда.
        // Если рынок мертв (флэт), не открываем НОВЫЕ позиции.
        if (stats.mad < this.config.minMadThreshold) {
            return { signal: undefined };
        }

        // =========================================================
        // ПРИОРИТЕТ 3: ЛОГИКА ВХОДА (BUY)
        // =========================================================

        // 3.1 DCA (Усреднение)
        if (state.positionState === 'LONG') {
            const dcaThreshold = this.config.zScoreThreshold * this.config.dcaZScoreMultiplier;
            const currentDrawdownPercent = (price - state.entryPrice) / state.entryPrice;
            const requiredDrawdown = -(this.config.minDcaPriceDeviationPercent / 100);

            // Условие: Z-Score ниже порога DCA И Лимит не исчерпан
            if (stats.zScore < (dcaThreshold * -1) && state.dcaCount < this.config.maxDcaEntries) {
                
                // [FIX] Строгая проверка просадки
                // Если drawdown (-0.0001) > required (-0.005), значит просадка МЕНЬШЕ требуемой
                // (Помним про отрицательные числа: -0.0001 > -0.005)
                if (currentDrawdownPercent > requiredDrawdown) {
                    // Debug: показываем почему DCA не сработал
                    this.log('INFO', `DCA Blocked: Drawdown ${(currentDrawdownPercent*100).toFixed(3)}% < Required ${(requiredDrawdown*100).toFixed(3)}%`, state);
                    return { signal: undefined };
                }

                if (now - this.lastSignalTime < this.minSignalInterval) {
                    return { signal: undefined };
                }

                this.log('SIGNAL', `🔥 DCA ENTRY! Z: ${stats.zScore.toFixed(2)}, Drawdown: ${(currentDrawdownPercent*100).toFixed(3)}% (Required: ${(requiredDrawdown*100).toFixed(3)}%)`, state);
                this.lastSignalTime = now;
                return { signal: 'BUY' };
            }
        }

        // 3.2 Первый вход (First Entry)
        if (state.positionState === 'NONE' && stats.zScore < -this.config.zScoreThreshold) {
            
            if (now - this.lastSignalTime < this.minSignalInterval) return { signal: undefined };

            const isExtremePanic = stats.zScore < (this.config.zScoreThreshold * PANIC_MULTIPLIER * -1);

            // Фильтр "Падающего ножа" (отключается при панике)
            if (!isExtremePanic && this.priceHistory.length >= 3) {
                if (this.velocity < 0 && this.acceleration < 0) {
                    return { signal: undefined }; 
                }
            }

            this.log('SIGNAL', `🟢 BUY Signal! Z: ${stats.zScore.toFixed(2)}`, state);
            this.lastSignalTime = now;
            return { signal: 'BUY' };
        }

        return { signal: undefined };
    }

    public calculateBuyAmount(price: number): number {
        const MAX_USD_PER_TRADE = 20;
        const safeInvestment = Math.min(this.config.investmentAmount, MAX_USD_PER_TRADE);
        return safeInvestment / price;
    }

    public getVelocity(): number { return this.velocity; }
    public getAcceleration(): number { return this.acceleration; }

    public getCurrentStats(): Stats | null {
        if (!this.currentStats) {
            return null;
        }
        return this.currentStats;
    }

    public getLastPrice(): number {
        return this.currentPrice;
    }
}