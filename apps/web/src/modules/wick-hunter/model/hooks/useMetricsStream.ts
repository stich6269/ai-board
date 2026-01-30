import { useEffect, useRef } from 'react';

// Интерфейс для внешнего управления графиком
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

// IndexedDB helpers
const DB_NAME = 'WickHunterDB';
const DB_VERSION = 2; // Increased to recreate schema
const STORE_NAME = 'metrics';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            
            // Delete old store if exists
            if (db.objectStoreNames.contains(STORE_NAME)) {
                db.deleteObjectStore(STORE_NAME);
            }
            
            // Create new store with timestamp as key
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'timestamp' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
        };
    });
}

// Downsample metrics to target count (keep every Nth point)
function downsampleMetrics(metrics: MetricData[], targetCount: number): MetricData[] {
    if (metrics.length <= targetCount) return metrics;
    
    const step = Math.floor(metrics.length / targetCount);
    const downsampled: MetricData[] = [];
    
    for (let i = 0; i < metrics.length; i += step) {
        downsampled.push(metrics[i]);
    }
    
    // Always include the last point
    if (downsampled[downsampled.length - 1] !== metrics[metrics.length - 1]) {
        downsampled.push(metrics[metrics.length - 1]);
    }
    
    return downsampled;
}

// Save metrics to IndexedDB
async function saveMetricsToIndexedDB(metrics: MetricData[]): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        // Add all metrics
        for (const metric of metrics) {
            store.put(metric);
        }
        
        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => {
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        });
        
        // Cleanup old data (keep only last 10 minutes)
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

interface UseMetricsStreamProps {
    chartController: React.MutableRefObject<ChartController | null>;
    onMetricUpdate?: (metric: MetricData) => void;
    onLatencyUpdate?: (latency: number) => void;
}

export function useMetricsStream({ chartController, onMetricUpdate, onLatencyUpdate }: UseMetricsStreamProps) {
    const wsRef = useRef<WebSocket | null>(null);
    const latencyBufferRef = useRef<number[]>([]);
    const metricsBufferRef = useRef<MetricData[]>([]);

    // Load history from IndexedDB on mount
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const db = await openDB();
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const request = store.getAll();
                
                const allMetrics: MetricData[] = await new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
                
                // Filter to last 5 minutes and sort
                const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
                const recentMetrics = allMetrics
                    .filter((m: MetricData) => m.timestamp >= fiveMinutesAgo)
                    .sort((a: MetricData, b: MetricData) => a.timestamp - b.timestamp);

                // Downsample to ~300 points for history (one per second at 5Hz)
                const downsampled = downsampleMetrics(recentMetrics, 300);
                
                metricsBufferRef.current = downsampled;

                if (downsampled.length > 0) {
                    // Wait for chart to be ready
                    const loadToChart = () => {
                        if (chartController.current) {
                            // Convert UTC timestamps to local time for chart display
                            const timezoneOffsetSeconds = new Date().getTimezoneOffset() * -60;
                            
                            console.log('📊 Loading history:', {
                                totalPoints: downsampled.length,
                                timezoneOffset: timezoneOffsetSeconds,
                                firstPoint: downsampled[0],
                                lastPoint: downsampled[downsampled.length - 1]
                            });
                            
                            // Filter out invalid data and convert timestamps
                            const historyWithLocalTime = downsampled
                                .filter(d => {
                                    const valid = d.timestamp && !isNaN(d.timestamp) && d.price && !isNaN(d.price) && d.median && !isNaN(d.median);
                                    if (!valid) {
                                        console.warn('⚠️ Invalid data point:', d);
                                    }
                                    return valid;
                                })
                                .map(d => {
                                    // Convert to local time (in milliseconds)
                                    const localTimestamp = d.timestamp + (timezoneOffsetSeconds * 1000);
                                    return {
                                        timestamp: localTimestamp,
                                        price: d.price,
                                        median: d.median,
                                        mad: d.mad,
                                        zScore: d.zScore
                                    };
                                });
                            
                            console.log('📊 Processed history:', {
                                validPoints: historyWithLocalTime.length,
                                firstTime: historyWithLocalTime[0]?.timestamp,
                                lastTime: historyWithLocalTime[historyWithLocalTime.length - 1]?.timestamp
                            });
                            
                            if (historyWithLocalTime.length > 0) {
                                chartController.current.setHistory(historyWithLocalTime);
                                                
                                const zScoreHistory = downsampled
                                    .filter(d => d.timestamp && !isNaN(d.timestamp) && d.zScore !== undefined && !isNaN(d.zScore))
                                    .map(d => ({
                                        time: (d.timestamp / 1000) + timezoneOffsetSeconds,
                                        value: d.zScore
                                    }));
                                    
                                if (zScoreHistory.length > 0) {
                                    chartController.current.setZScoreHistory(zScoreHistory);
                                }
                            }
                        } else {
                                setTimeout(loadToChart, 100);
                        }
                    };
                    loadToChart();
                }
            } catch (e) {
                console.error('Failed to load history:', e);
            }
        };

        loadHistory();
    }, [chartController]);

    // 1. WebSocket соединение
    useEffect(() => {
        let reconnectTimeout: NodeJS.Timeout;
        let isMounted = true;

        const connect = () => {
            if (!isMounted) return;

            const ws = new WebSocket('ws://localhost:3002');
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ WebSocket connected');
            };

            ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                
                if (msg.type === 'tick') {
                    const metricData: MetricData = {
                        price: msg.data.price,
                        median: msg.data.median,
                        mad: msg.data.mad,
                        zScore: msg.data.zScore,
                        timestamp: msg.data.timestamp
                    };

                    // Update chart
                    if (chartController.current) {
                        // Convert UTC timestamp to local time for chart display
                        // Lightweight Charts displays time as UTC, so we add timezone offset
                        const timezoneOffsetSeconds = new Date().getTimezoneOffset() * -60;
                        const localTime = (msg.data.timestamp / 1000) + timezoneOffsetSeconds;
                        
                        chartController.current.updateCandle({
                            time: localTime,
                            price: msg.data.price,
                            median: msg.data.median,
                            upper: msg.data.median + (3 * msg.data.mad),
                            lower: msg.data.median - (3 * msg.data.mad),
                        });
                        
                        chartController.current.updateZScore({
                            time: localTime,
                            value: msg.data.zScore
                        });
                    }

                    // Update stats in header
                    if (onMetricUpdate) {
                        onMetricUpdate(metricData);
                    }

                    // Calculate latency
                    if (msg.data.wsLatency !== undefined && onLatencyUpdate) {
                        latencyBufferRef.current.push(msg.data.wsLatency);
                        if (latencyBufferRef.current.length > 10) {
                            latencyBufferRef.current.shift();
                        }
                        const avgLatency = latencyBufferRef.current.reduce((a, b) => a + b, 0) / latencyBufferRef.current.length;
                        onLatencyUpdate(Math.round(avgLatency));
                    }

                    // Save to IndexedDB buffer
                    metricsBufferRef.current.push(metricData);
                    
                    // Save to IndexedDB every 10 ticks (every 2 seconds at 5Hz)
                    if (metricsBufferRef.current.length >= 10) {
                        // Clone buffer to save
                        const toSave = [...metricsBufferRef.current];
                        saveMetricsToIndexedDB(toSave).catch(console.error);
                        
                        // Clear buffer after saving
                        metricsBufferRef.current = [];
                    }
                }
            } catch (e) {
                console.error('Stream error:', e);
            }
        };

            ws.onclose = () => {
                console.log('❌ WebSocket closed, reconnecting in 1s...');
                wsRef.current = null;
                if (isMounted) {
                    reconnectTimeout = setTimeout(connect, 1000);
                }
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
            };
        };

        connect();

        return () => {
            isMounted = false;
            clearTimeout(reconnectTimeout);
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []); // WebSocket runs continuously
}
