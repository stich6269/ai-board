import { useRef, useEffect } from 'react';

interface Metric {
    timestamp: number;
    price: number;
    median: number;
    mad: number;
    zScore: number;
    heatmapSnapshot: Array<{ price: number; volume: number }>;
}

interface HeatmapCanvasProps {
    metrics: Metric[];
}

export function HeatmapCanvas({ metrics }: HeatmapCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || metrics.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Auto-scale
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        // Find Price Range
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        metrics.forEach(m => {
            if (m.price < minPrice) minPrice = m.price;
            if (m.price > maxPrice) maxPrice = m.price;
        });

        // Add padding
        const range = maxPrice - minPrice || 1;
        const padding = range * 0.1;
        const yMin = minPrice - padding;
        const yMax = maxPrice + padding;
        const yRange = yMax - yMin;

        const timeStep = width / Math.max(metrics.length, 50);

        // Helper Map Y
        const mapY = (price: number) => height - ((price - yMin) / yRange) * height;

        // 1. Draw Heatmap
        metrics.forEach((m, i) => {
            const x = i * timeStep;
            const w = timeStep + 1; // overlap slightly

            // Snapshot is sparse array
            if (m.heatmapSnapshot) {
                m.heatmapSnapshot.forEach(point => {
                    const y = mapY(point.price);
                    // Intensity based on Volume. Cap at e.g. 1000? 
                    // Need dynamic scaling or log scale for volume.
                    // Assume volume comes pre-decayed.
                    const intensity = Math.min(point.volume / 100, 1); // Tune this divisor
                    ctx.fillStyle = `rgba(255, 165, 0, ${intensity})`; // Orange
                    ctx.fillRect(x, y - 2, w, 4); // Draw a small block
                });
            }
        });

        // 2. Draw Price Line
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff'; // White
        ctx.lineWidth = 2;
        metrics.forEach((m, i) => {
            const x = i * timeStep;
            const y = mapY(m.price);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // 3. Draw Median Line
        ctx.beginPath();
        ctx.strokeStyle = '#3b82f6'; // Blue
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        metrics.forEach((m, i) => {
            const x = i * timeStep;
            const y = mapY(m.median);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // 4. Draw Bands (Median ± 3 * MAD ? or utilize Z-Score?)
        // Let's draw Median ± 2*MAD (approx 2 sigma)

        // Upper Band
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444'; // Red
        ctx.setLineDash([]);
        metrics.forEach((m, i) => {
            const x = i * timeStep;
            // Z = (P - Med) / MAD. So P = Z*MAD + Med.
            // If we want to show where Z=3 would be:
            const upper = m.median + (3 * (m.mad || 0));
            const y = mapY(upper);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Lower Band
        ctx.beginPath();
        ctx.strokeStyle = '#22c55e'; // Green
        metrics.forEach((m, i) => {
            const x = i * timeStep;
            const lower = m.median - (3 * (m.mad || 0));
            const y = mapY(lower);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

    }, [metrics]);

    return (
        <div className="w-full h-full bg-black rounded-lg overflow-hidden relative">
            <canvas
                ref={canvasRef}
                width={800}
                height={450}
                className="w-full h-full object-contain"
            />
            <div className="absolute top-2 right-2 text-xs text-white/50 bg-black/50 px-2 rounded">
                Live Heatmap
            </div>
        </div>
    );
}
