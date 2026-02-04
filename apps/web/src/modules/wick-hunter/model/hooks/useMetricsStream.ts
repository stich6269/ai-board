import { useEffect, useRef } from 'react';
import { useAppStore, type AppState } from '@/store';

export interface ChartController {
    updateCandle: (data: any) => void;
    setHistory: (data: any[]) => void;
    updateZScore: (data: { time: number; value: number }) => void;
    setZScoreHistory: (data: { time: number; value: number }[]) => void;
}

export interface MetricData {
    price: number;
    median: number;
    mad: number;
    zScore: number;
    timestamp: number;
}

const DB_NAME = 'WickHunterDB';
const DB_VERSION = 4;
const STORE_NAME = 'metrics';

interface StoredMetric extends MetricData {
    symbol: string;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (db.objectStoreNames.contains(STORE_NAME)) {
                db.deleteObjectStore(STORE_NAME);
            }

            const store = db.createObjectStore(STORE_NAME, { keyPath: ['symbol', 'timestamp'] });
            store.createIndex('symbol', 'symbol', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
        };
    });
}

// Save metrics to IndexedDB with symbol
async function saveMetricsToIndexedDB(symbol: string, metrics: MetricData[]): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        for (const metric of metrics) {
            store.put({ ...metric, symbol });
        }

        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        // Cleanup old data (last 10m)
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
        const cleanupTx = db.transaction(STORE_NAME, 'readwrite');
        const cleanupStore = cleanupTx.objectStore(STORE_NAME);
        const index = cleanupStore.index('timestamp');
        const range = IDBKeyRange.upperBound(tenMinutesAgo);
        const deleteRequest = index.openCursor(range);

        deleteRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };
    } catch (e) {
        console.error('Failed to save metrics:', e);
    }
}

function downsampleMetrics(metrics: MetricData[], targetCount: number): MetricData[] {
    if (metrics.length <= targetCount) return metrics;

    const step = Math.floor(metrics.length / targetCount);
    const downsampled: MetricData[] = [];

    for (let i = 0; i < metrics.length; i += step) {
        downsampled.push(metrics[i]);
    }

    if (downsampled[downsampled.length - 1] !== metrics[metrics.length - 1]) {
        downsampled.push(metrics[metrics.length - 1]);
    }

    return downsampled;
}

interface UseMetricsStreamProps {
    chartController: React.MutableRefObject<ChartController | null>;
    onMetricUpdate?: (metric: MetricData) => void;
    onLatencyUpdate?: (latency: number) => void;
}

export function useMetricsStream({ chartController, onMetricUpdate, onLatencyUpdate }: UseMetricsStreamProps) {
    const currentSymbol = useAppStore((state: AppState) => state.currentSymbol);
    const wsRef = useRef<WebSocket | null>(null);
    const latencyBufferRef = useRef<number[]>([]);
    const metricsBufferRef = useRef<MetricData[]>([]);

    useEffect(() => {
        let reconnectTimeout: NodeJS.Timeout;
        let isMounted = true;

        const connect = () => {
            if (!isMounted) return;

            console.log(`🔌 WebSocket connecting for ${currentSymbol}...`);
            const ws = new WebSocket('ws://localhost:3002');
            wsRef.current = ws;

            ws.onopen = () => {
                if (!isMounted) return;
                console.log(`✅ WebSocket connected for ${currentSymbol}`);
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    symbol: currentSymbol
                }));
            };

            ws.onmessage = (event) => {
                if (!isMounted) return;
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'welcome') console.log('👋 Received welcome');

                    if (msg.type === 'tick') {
                        // Filter by symbol immediately
                        if (msg.data.symbol && msg.data.symbol.toUpperCase() !== currentSymbol.toUpperCase() &&
                            !msg.data.symbol.toUpperCase().startsWith(currentSymbol.toUpperCase())) {
                            return;
                        }

                        const metricData: MetricData = {
                            price: msg.data.price,
                            median: msg.data.median,
                            mad: msg.data.mad,
                            zScore: msg.data.zScore,
                            timestamp: msg.data.timestamp
                        };

                        if (chartController.current) {
                            const utcTime = msg.data.timestamp / 1000;

                            chartController.current.updateCandle({
                                time: utcTime,
                                price: msg.data.price,
                                median: msg.data.median,
                                upper: msg.data.median + (3 * msg.data.mad),
                                lower: msg.data.median - (3 * msg.data.mad),
                            });

                            chartController.current.updateZScore({
                                time: utcTime,
                                value: msg.data.zScore
                            });
                        }

                        if (onMetricUpdate) onMetricUpdate(metricData);

                        if (msg.data.wsLatency !== undefined && onLatencyUpdate) {
                            latencyBufferRef.current.push(msg.data.wsLatency);
                            if (latencyBufferRef.current.length > 10) latencyBufferRef.current.shift();
                            const avgLatency = latencyBufferRef.current.reduce((a, b) => a + b, 0) / latencyBufferRef.current.length;
                            onLatencyUpdate(Math.round(avgLatency));
                        }

                        metricsBufferRef.current.push(metricData);
                        if (metricsBufferRef.current.length >= 10) {
                            saveMetricsToIndexedDB(currentSymbol, [...metricsBufferRef.current]).catch(console.error);
                            metricsBufferRef.current = [];
                        }
                    }
                } catch (e) {
                    console.error('Stream error:', e);
                }
            };

            ws.onclose = () => {
                wsRef.current = null;
                if (isMounted) {
                    console.log('❌ WebSocket closed, reconnecting in 1s...');
                    reconnectTimeout = setTimeout(connect, 1000);
                }
            };
        };

        const loadHistory = async () => {
            try {
                const db = await openDB();
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const index = store.index('symbol');
                const request = index.getAll(currentSymbol);

                const allMetrics: StoredMetric[] = await new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
                const recentMetrics = allMetrics
                    .filter(m => m.timestamp >= fiveMinutesAgo && m.symbol === currentSymbol)
                    .sort((a, b) => a.timestamp - b.timestamp);

                const downsampled = downsampleMetrics(recentMetrics, 300);
                metricsBufferRef.current = [];

                if (downsampled.length > 0) {
                    const loadToChart = () => {
                        if (!isMounted) return;
                        if (chartController.current) {
                            console.log(`📊 History: ${downsampled.length} points for ${currentSymbol}`);
                            chartController.current.setHistory(downsampled);

                            const zScoreHistory = downsampled.map(d => ({
                                time: d.timestamp / 1000,
                                value: d.zScore
                            }));
                            chartController.current.setZScoreHistory(zScoreHistory);
                        } else {
                            setTimeout(loadToChart, 100);
                        }
                    };
                    loadToChart();
                } else {
                    // Reset chart if no history for this symbol
                    if (chartController.current) {
                        chartController.current.setHistory([]);
                        chartController.current.setZScoreHistory([]);
                    }
                }
            } catch (e) {
                console.error('Failed to load history:', e);
            }
        };

        loadHistory();
        connect();

        return () => {
            isMounted = false;
            clearTimeout(reconnectTimeout);
            if (wsRef.current) {
                if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
                    wsRef.current.close();
                }
            }
        };
    }, [currentSymbol, chartController, onMetricUpdate, onLatencyUpdate]);
}
