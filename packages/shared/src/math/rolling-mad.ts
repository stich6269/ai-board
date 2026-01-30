import { TwoHeaps } from './two-heaps.js';

/**
 * Rolling Median Absolute Deviation (MAD) calculator.
 * MAD = median(|Xi - median(X)|)
 * 
 * Since updating the main median changes ALL deviations, a strictly correct O(1) update is impossible.
 * We use an approximation or windowed recalc depending on performance needs.
 * 
 * For HFT on Node.js, iterating 200 items to recalculate deviations is fast (microseconds).
 * So we will use:
 * 1. TwoHeaps for the Price Median (O(log N))
 * 2. On each tick, get new Price Median
 * 3. Re-calculate deviations for the window
 * 4. Use a standardized selection algorithm (QuickSelect) to find the median of deviations (O(N))
 * 
 * Total complexity: O(N) per tick.
 * For N=200, this is extremely fast and much more accurate than approximations.
 */
export class RollingMAD {
    private windowSize: number;
    private prices: number[];
    private medianFinder: TwoHeaps;
    private writeValues: Float64Array; // Pre-allocated buffer for deviations calculation

    constructor(windowSize: number) {
        this.windowSize = windowSize;
        this.prices = [];
        this.medianFinder = new TwoHeaps();
        this.writeValues = new Float64Array(windowSize);
    }

    public update(price: number): { median: number, mad: number, zScore: number } {
        // 1. Update Price Window
        if (this.prices.length >= this.windowSize) {
            const oldPrice = this.prices.shift()!;
            this.medianFinder.remove(oldPrice);
        }
        this.prices.push(price);
        this.medianFinder.insert(price);

        // 2. Get Price Median
        const median = this.medianFinder.getMedian();

        // 3. Calculate Deviations
        // We use a pre-allocated Float64Array to avoid GC churn
        const len = this.prices.length;
        for (let i = 0; i < len; i++) {
            this.writeValues[i] = Math.abs(this.prices[i] - median);
        }

        // 4. Calculate Median of Deviations (MAD) using QuickSelect logic
        // We only sort the relevant part of the buffer
        const mad = this.quickSelectMedian(this.writeValues, len);

        // 5. Calculate Z-Score
        // Avoid division by zero
        const safeMad = mad === 0 ? 1e-9 : mad;
        const zScore = (0.6745 * (price - median)) / safeMad;

        return { median, mad, zScore };
    }

    /**
     * Finds median of the first 'k' elements in 'arr' using native sort.
     * Native sort on Float64Array is very optimized in V8.
     * For N=200, sorting is likely faster than custom QuickSelect in JS due to engine intrinsics.
     */
    private quickSelectMedian(arr: Float64Array, length: number): number {
        if (length === 0) return 0;

        // We need to copy to sort, or sort in place? 
        // arr is our reusable buffer, so we can sort in place every time? 
        // No, 'update' re-writes it every time, so the order doesn't matter for next tick.
        // But we must limit the view to 'length'.
        const view = arr.subarray(0, length);
        view.sort(); // In-place sort of the subarray

        const mid = Math.floor(length / 2);

        if (length % 2 !== 0) {
            return view[mid];
        } else {
            return (view[mid - 1] + view[mid]) / 2.0;
        }
    }

    public getWindow(): number[] {
        return this.prices;
    }
}
