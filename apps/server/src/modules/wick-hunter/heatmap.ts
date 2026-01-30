export interface HeatmapConfig {
    binSize: number;      // Price bin size (e.g. 0.5 for ETH, 0.05 for SOL)
    decayLambda: number;  // Time decay factor
}

interface BinData {
    volume: number;
    lastUpdate: number;
}

export class LiquidationHeatmap {
    private bins: Map<number, BinData>;
    private config: HeatmapConfig;

    constructor(config: HeatmapConfig) {
        this.bins = new Map();
        this.config = config;
    }

    public update(price: number, size: number, timestamp: number) {
        const binIndex = Math.floor(price / this.config.binSize);
        const data = this.bins.get(binIndex);

        if (!data) {
            this.bins.set(binIndex, { volume: size, lastUpdate: timestamp });
            return;
        }

        // Apply decay to existing volume
        // V_new = V_old * e^(-lambda * dt) + size
        const dt = (timestamp - data.lastUpdate) / 1000; // seconds
        // Prevent negative time if clock skew occurs
        const safeDt = Math.max(0, dt);

        const decayedVolume = data.volume * Math.exp(-this.config.decayLambda * safeDt);

        data.volume = decayedVolume + size;
        data.lastUpdate = timestamp;
    }

    /**
     * Get density around a price level.
     * Can sum up adjacent bins for better signal.
     */
    public getDensity(price: number): number {
        const binIndex = Math.floor(price / this.config.binSize);
        // Simple implementation: just return current bin
        // Could be enhanced to return kernel density estimate
        return this.getBinVolume(binIndex, Date.now());
    }

    private getBinVolume(binIndex: number, now: number): number {
        const data = this.bins.get(binIndex);
        if (!data) return 0;

        // Return decayed volume at 'now'
        const dt = (now - data.lastUpdate) / 1000;
        const safeDt = Math.max(0, dt);
        return data.volume * Math.exp(-this.config.decayLambda * safeDt);
    }

    /**
     * Debugging / Visualization helper
     */
    public getTopLevels(now: number, limit: number = 5): { price: number, volume: number }[] {
        const levels = [];
        for (const [bin, data] of this.bins.entries()) {
            const dt = (now - data.lastUpdate) / 1000;
            const vol = data.volume * Math.exp(-this.config.decayLambda * Math.max(0, dt));
            if (vol > 10) { // Filter noise
                levels.push({ price: bin * this.config.binSize, volume: vol });
            }
        }
        return levels.sort((a, b) => b.volume - a.volume).slice(0, limit);
    }
}
