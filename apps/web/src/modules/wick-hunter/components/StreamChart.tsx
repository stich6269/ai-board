import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createChart, ColorType, LineSeries, HistogramSeries, createSeriesMarkers } from 'lightweight-charts';
import type { ChartController } from '../model/hooks/useMetricsStream';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';

interface MetricData {
    timestamp: number;
    price: number;
    median: number;
    mad: number;
    zScore: number;
}

interface Signal {
    timestamp: number;
    type: 'BUY' | 'SELL';
    price: number;
}

interface StreamChartProps {
    signals?: Signal[];
    stopLossPrice?: number;
    takeProfitPrice?: number;
    windowSize?: number;
}

// Оборачиваем в forwardRef, чтобы родитель мог получить доступ к методам
export const StreamChart = forwardRef<ChartController, StreamChartProps>((props, ref) => {
    const { stopLossPrice, takeProfitPrice } = props;
    const containerRef = useRef<HTMLDivElement>(null);
    const zScoreContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const zScoreChartRef = useRef<IChartApi | null>(null);

    // Ссылки на серии данных (чтобы обновлять их без рендера)
    const seriesRef = useRef<{
        price: ISeriesApi<'Line'>;
        median: ISeriesApi<'Line'>;
        upper: ISeriesApi<'Line'>;
        lower: ISeriesApi<'Line'>;
    } | null>(null);

    const zScoreSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const seriesMarkersRef = useRef<any>(null);

    // Ссылки на price lines для удаления
    const priceLinesRef = useRef<any[]>([]);

    // Инициализация графика (ОДИН РАЗ)
    useEffect(() => {
        if (!containerRef.current || !zScoreContainerRef.current) return;

        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height: 350,
            layout: { background: { type: ColorType.Solid, color: '#0a0a0a' }, textColor: '#ccc' },
            grid: { vertLines: { color: '#333' }, horzLines: { color: '#333' } },
            timeScale: {
                visible: false,
                rightOffset: 12
            },
            localization: {
                timeFormatter: (time: any) => {
                    return new Date(time * 1000).toLocaleString();
                }
            },
            rightPriceScale: {
                minimumWidth: 120,
                borderVisible: true,
                borderColor: '#333',
            },
        });

        const zScoreChart = createChart(zScoreContainerRef.current, {
            width: zScoreContainerRef.current.clientWidth,
            height: 150,
            layout: { background: { type: ColorType.Solid, color: '#0a0a0a' }, textColor: '#ccc' },
            grid: { vertLines: { color: '#333' }, horzLines: { color: '#666' } },
            timeScale: {
                timeVisible: true,
                secondsVisible: true,
                rightOffset: 12,
                // Format ticks to local time
                tickMarkFormatter: (time: any) => {
                    return new Date(time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                }
            },
            localization: {
                // Tooltip time format
                timeFormatter: (time: any) => {
                    return new Date(time * 1000).toLocaleString();
                }
            },
            rightPriceScale: {
                minimumWidth: 120,
                borderVisible: true,
                borderColor: '#333',
            },
        });

        const priceSeries = chart.addSeries(LineSeries, {
            color: 'white',
            lineWidth: 2,
            lastValueVisible: false,
            priceLineVisible: false
        });
        const medianSeries = chart.addSeries(LineSeries, {
            color: '#3b82f6',
            lineWidth: 2,
            lastValueVisible: false,
            priceLineVisible: false
        });
        const upperSeries = chart.addSeries(LineSeries, {
            color: 'red',
            lineWidth: 1,
            lineStyle: 2,
            lastValueVisible: false,
            priceLineVisible: false
        });
        const lowerSeries = chart.addSeries(LineSeries, {
            color: 'green',
            lineWidth: 1,
            lineStyle: 2,
            lastValueVisible: false,
            priceLineVisible: false
        });

        const zScoreSeries = zScoreChart.addSeries(HistogramSeries, {
            color: '#22c55e',
            priceFormat: { type: 'price', precision: 2 },
            priceScaleId: 'right',
            lastValueVisible: false,
            priceLineVisible: false
        });

        seriesRef.current = {
            price: priceSeries,
            median: medianSeries,
            upper: upperSeries,
            lower: lowerSeries
        };

        zScoreSeriesRef.current = zScoreSeries;
        chartRef.current = chart;
        zScoreChartRef.current = zScoreChart;

        // Create markers primitive immediately after series creation
        seriesMarkersRef.current = createSeriesMarkers(priceSeries, []);

        chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
            const logicalRange = chart.timeScale().getVisibleLogicalRange();
            if (logicalRange) {
                zScoreChart.timeScale().setVisibleLogicalRange(logicalRange);
            }
        });

        const handleResize = () => {
            if (containerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
            }
            if (zScoreContainerRef.current && zScoreChartRef.current) {
                zScoreChartRef.current.applyOptions({ width: zScoreContainerRef.current.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            zScoreChart.remove();
        };
    }, []);

    // Render stop-loss and take-profit lines
    useEffect(() => {
        if (!seriesRef.current?.price) return;

        // Remove old price lines
        priceLinesRef.current.forEach(line => {
            seriesRef.current?.price.removePriceLine(line);
        });
        priceLinesRef.current = [];

        // Create new price lines
        if (stopLossPrice) {
            const slLine = seriesRef.current.price.createPriceLine({
                price: stopLossPrice,
                color: '#ef4444',
                lineWidth: 2,
                lineStyle: 2,
                axisLabelVisible: true,
                title: 'SL',
            });
            priceLinesRef.current.push(slLine);
        }

        if (takeProfitPrice) {
            const tpLine = seriesRef.current.price.createPriceLine({
                price: takeProfitPrice,
                color: '#22c55e',
                lineWidth: 2,
                lineStyle: 2,
                axisLabelVisible: true,
                title: 'TP',
            });
            priceLinesRef.current.push(tpLine);
        }
    }, [stopLossPrice, takeProfitPrice]);

    const updateMarkers = (signals: Signal[]) => {
        if (!seriesMarkersRef.current || !seriesRef.current?.price) return;

        if (signals && signals.length > 0) {
            const priceData = seriesRef.current.price.data();
            if (priceData.length === 0) {
                seriesMarkersRef.current.setMarkers([]);
                return;
            }

            const minTime = priceData[0].time as number;
            const maxTime = priceData[priceData.length - 1].time as number;

            const markers = signals
                .map(signal => ({
                    ...signal,
                    timeSec: signal.timestamp / 1000
                }))
                // Filter: only show signals that fall within the loaded price data range
                .filter(signal => signal.timeSec >= minTime && signal.timeSec <= maxTime)
                .map(signal => ({
                    time: signal.timeSec as any,
                    position: signal.type === 'BUY' ? 'belowBar' as const : 'aboveBar' as const,
                    color: signal.type === 'BUY' ? '#22c55e' : '#ef4444',
                    shape: signal.type === 'BUY' ? 'arrowUp' as const : 'arrowDown' as const,
                    text: signal.type
                }));
            seriesMarkersRef.current.setMarkers(markers);
        } else {
            seriesMarkersRef.current.setMarkers([]);
        }
    };

    useEffect(() => {
        updateMarkers(props.signals || []);
    }, [props.signals]);

    // 🔥 ЭКСПОРТ МЕТОДОВ ДЛЯ ХУКА (useImperativeHandle)
    useImperativeHandle(ref, () => ({
        setHistory: (data: MetricData[]) => {
            if (!seriesRef.current) return;

            // Timestamps are in UTC (milliseconds), convert to seconds for lightweight-charts
            const prices = data.map(d => ({ time: (d.timestamp / 1000) as any, value: d.price }));
            const medians = data.map(d => ({ time: (d.timestamp / 1000) as any, value: d.median }));
            const uppers = data.map(d => ({ time: (d.timestamp / 1000) as any, value: d.median + (3 * d.mad) }));
            const lowers = data.map(d => ({ time: (d.timestamp / 1000) as any, value: d.median - (3 * d.mad) }));

            seriesRef.current.price.setData(prices);
            seriesRef.current.median.setData(medians);
            seriesRef.current.upper.setData(uppers);
            seriesRef.current.lower.setData(lowers);

            // Refilter markers because price data range has changed
            updateMarkers(props.signals || []);

            if (chartRef.current && data.length > 0) {
                // Use the actual data range for visible range
                const startTime = (data[0].timestamp / 1000) as any;
                const endTime = (data[data.length - 1].timestamp / 1000) as any;
                chartRef.current.timeScale().setVisibleRange({
                    from: startTime,
                    to: endTime
                });
            }
        },

        setZScoreHistory: (data: { time: number; value: number }[]) => {
            if (!zScoreSeriesRef.current) return;

            const zScoreData = data.map(d => ({
                time: d.time as any,
                value: d.value,
                color: d.value >= 0 ? '#22c55e' : '#ef4444'
            }));

            zScoreSeriesRef.current.setData(zScoreData);
        },

        // Метод для обновления ОДНОГО тика (вызывается из сокета)
        updateCandle: (tick: any) => {
            if (!seriesRef.current || !chartRef.current) return;

            try {
                // Determine the last timestamp from the series to prevent out-of-order updates
                const data = seriesRef.current.price.data();
                const lastPoint = data.length > 0 ? data[data.length - 1] : null;
                const lastTime = lastPoint ? (lastPoint.time as number) : 0;

                // Validate time
                if (typeof tick.time !== 'number' || isNaN(tick.time)) {
                    console.warn('⚠️ Invalid tick time:', tick.time);
                    return;
                }

                // If new time is older than last time, ignore it (prevent crash)
                if (tick.time < lastTime) {
                    // console.warn(`⚠️ Out-of-order tick ignored: ${tick.time} < ${lastTime}`);
                    return;
                }

                seriesRef.current.price.update({ time: tick.time, value: tick.price });
                seriesRef.current.median.update({ time: tick.time, value: tick.median });
                seriesRef.current.upper.update({ time: tick.time, value: tick.upper });
                seriesRef.current.lower.update({ time: tick.time, value: tick.lower });
            } catch (err) {
                console.error('❌ Chart Update Error:', err, 'Tick:', tick);
            }
        },

        updateZScore: (data: { time: number; value: number }) => {
            if (!zScoreSeriesRef.current) return;

            try {
                // Validate time
                if (typeof data.time !== 'number' || isNaN(data.time)) {
                    // console.warn('⚠️ Invalid zScore time:', data.time);
                    return;
                }

                // Determine the last timestamp from the series to prevent out-of-order updates
                const seriesData = zScoreSeriesRef.current.data();
                const lastPoint = seriesData.length > 0 ? seriesData[seriesData.length - 1] : null;
                const lastTime = lastPoint ? (lastPoint.time as number) : 0;

                // If new time is older than last time, ignore it
                if (data.time < lastTime) {
                    return;
                }

                zScoreSeriesRef.current.update({
                    time: data.time as any,
                    value: data.value,
                    color: data.value >= 0 ? '#22c55e' : '#ef4444'
                });
            } catch (err) {
                console.error('❌ Z-Score Update Error:', err);
            }
        }
    }));

    return (
        <div className="w-full h-full flex flex-col">
            <div ref={containerRef} className="w-full" style={{ height: '350px' }} />
            <div ref={zScoreContainerRef} className="w-full" style={{ height: '150px' }} />
        </div>
    );
});

StreamChart.displayName = 'StreamChart';
