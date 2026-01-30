import type { MetricData } from '../lib/downsample';

interface StatsBarProps {
    totalPnL: number;
    winRate: number;
    totalRounds: number;
    lastPrice?: number;
    latency: number;
    currentMetric?: MetricData;
    zScoreThreshold: number;
}

export function StatsBar({ 
    totalPnL, 
    winRate, 
    totalRounds, 
    lastPrice, 
    latency,
    currentMetric,
    zScoreThreshold
}: StatsBarProps) {
    const zScore = currentMetric?.zScore || 0;
    const isExtremeZScore = Math.abs(zScore) > zScoreThreshold;
    
    return (
        <div className="border-t border-gray-800 bg-black/20 px-6 py-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Total PnL</span>
                        <span className={`text-sm font-bold font-mono ${
                            totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                            ${totalPnL.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Win Rate</span>
                        <span className="text-sm font-bold font-mono text-white">
                            {winRate.toFixed(1)}%
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Total Rounds</span>
                        <span className="text-sm font-bold font-mono text-white">
                            {totalRounds}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Last Price</span>
                        <span className="text-sm font-bold font-mono text-white">
                            ${lastPrice?.toFixed(2) || '---'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Latency</span>
                        <span className={`text-sm font-bold font-mono ${
                            latency > 500 ? 'text-red-500' : latency > 200 ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                            {latency}ms
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Z-Score</span>
                    <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8">
                            <svg className="w-8 h-8 transform -rotate-90">
                                <circle
                                    cx="16"
                                    cy="16"
                                    r="14"
                                    stroke="#2a2a2a"
                                    strokeWidth="3"
                                    fill="none"
                                />
                                <circle
                                    cx="16"
                                    cy="16"
                                    r="14"
                                    stroke={isExtremeZScore ? '#ef4444' : '#3b82f6'}
                                    strokeWidth="3"
                                    fill="none"
                                    strokeDasharray={`${Math.min(Math.abs(zScore / 5) * 87.96, 87.96)} 87.96`}
                                    className="transition-all duration-300"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-[10px] font-bold ${
                                    zScore > 0 ? 'text-green-500' : 'text-red-500'
                                }`}>
                                    {zScore > 0 ? '↑' : '↓'}
                                </span>
                            </div>
                        </div>
                        <span className={`text-sm font-bold font-mono ${
                            isExtremeZScore ? 'text-red-500' : 'text-white'
                        }`}>
                            {zScore.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
