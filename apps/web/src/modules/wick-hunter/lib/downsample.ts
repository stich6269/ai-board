export interface MetricData {
    timestamp: number;
    price: number;
    median: number;
    mad: number;
    zScore: number;
    tradeTimestamp?: number;
}

export function downsampleMetrics(metrics: MetricData[]): MetricData[] {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    
    const recentMetrics = metrics.filter(m => m.timestamp >= oneMinuteAgo);
    const oldMetrics = metrics.filter(m => m.timestamp < oneMinuteAgo);
    const aggregatedOld = new Map<number, MetricData[]>();
    
    oldMetrics.forEach(m => {
        const secondKey = Math.floor(m.timestamp / 1000);
        if (!aggregatedOld.has(secondKey)) {
            aggregatedOld.set(secondKey, []);
        }
        aggregatedOld.get(secondKey)!.push(m);
    });
    
    const downsampledOld = Array.from(aggregatedOld.entries()).map(([secondKey, points]) => {
        const avg: MetricData = {
            timestamp: secondKey * 1000,
            price: points.reduce((sum, p) => sum + p.price, 0) / points.length,
            median: points.reduce((sum, p) => sum + p.median, 0) / points.length,
            mad: points.reduce((sum, p) => sum + p.mad, 0) / points.length,
            zScore: points.reduce((sum, p) => sum + p.zScore, 0) / points.length,
            tradeTimestamp: points[0].tradeTimestamp
        };
        return avg;
    });
    
    return [...downsampledOld, ...recentMetrics];
}
