# Proposal: Z-Score Bar Chart

Add a secondary chart below the main price chart to visualize z-score values as directional bars with color-coded indicators.

## Problem

Currently, the z-score metric is only visible as a numeric value in the stats bar. This makes it difficult to:
- Visualize z-score trends and patterns over time
- Identify extreme deviations at a glance
- Correlate z-score movements with price action visually
- Understand the magnitude and direction of statistical deviations

## Solution

Implement a secondary bar chart positioned below the main price chart that displays z-score values with the following characteristics:

1. **Directional Bars**:
   - Bars extend in one direction only (from zero baseline)
   - Positive z-scores: green bars extending upward
   - Negative z-scores: red bars extending downward

2. **Visual Integration**:
   - Synchronized time axis with main chart
   - Compact height (~150px) to preserve main chart visibility
   - Horizontal zero line as baseline reference
   - Optional threshold lines at ±3σ for extreme values

3. **Real-time Updates**:
   - Bars update in sync with incoming WebSocket data
   - Historical z-score data loaded from IndexedDB
   - Smooth rendering using lightweight-charts histogram series

## What Changes

- **StreamChart Component**: Add second chart instance for z-score visualization
- **useMetricsStream Hook**: Pass z-score data to chart controller
- **ChartController Interface**: Add methods for z-score series updates
- **Layout**: Adjust main chart height to accommodate secondary chart

## Capabilities

### New Capabilities

- `zscore-visualization`: Histogram series for z-score bars with conditional coloring
- `dual-chart-sync`: Time axis synchronization between price and z-score charts

### Modified Capabilities

- `stream-chart`: Enhanced to support multiple synchronized chart panes
- `chart-controller`: Extended interface for z-score data updates

## Impact

- **Code**: Modifications to `StreamChart.tsx` and `useMetricsStream.ts`
- **UI/UX**: Improved visual feedback for statistical deviations
- **Performance**: Minimal impact - histogram series is lightweight
- **Dependencies**: No new dependencies (uses existing lightweight-charts)
