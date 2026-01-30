# Design: Z-Score Bar Chart

## Architecture

### Component Structure

```
StreamChart (modified)
├── Main Chart Container (existing)
│   ├── Price Series
│   ├── Median Series
│   ├── Upper/Lower Bands
│   └── Price Lines (SL/TP)
└── Z-Score Chart Container (new)
    ├── Histogram Series (z-score bars)
    └── Zero Baseline
```

### Data Flow

```
WebSocket → useMetricsStream → ChartController → StreamChart
                    ↓
              MetricData { zScore }
                    ↓
         [Price Chart] + [Z-Score Chart]
```

## Technical Specifications

### Chart Configuration

**Main Chart**:
- Height: 350px (reduced from 500px)
- Existing configuration unchanged

**Z-Score Chart**:
- Height: 150px
- Background: Same as main chart (#0a0a0a)
- Grid: Minimal horizontal lines only
- Time Scale: Synchronized with main chart, labels hidden

### Histogram Series Configuration

```typescript
{
  color: (data) => data.value >= 0 ? '#22c55e' : '#ef4444',
  priceFormat: { type: 'price', precision: 2 },
  priceScaleId: 'zscore',
  baseLineVisible: true,
  baseLineColor: '#666',
  baseLineWidth: 1
}
```

### Color Scheme

- **Positive Z-Score**: `#22c55e` (green-500)
- **Negative Z-Score**: `#ef4444` (red-500)
- **Zero Line**: `#666` (gray)
- **Threshold Lines** (optional): `#fbbf24` (amber-400) at ±3σ

## Interface Updates

### ChartController

```typescript
export interface ChartController {
  updateCandle: (data: any) => void;
  setHistory: (data: any[]) => void;
  updateZScore: (data: { time: number; value: number }) => void; // NEW
  setZScoreHistory: (data: { time: number; value: number }[]) => void; // NEW
}
```

### MetricData

No changes needed - already includes `zScore` field.

## Layout Structure

```
┌─────────────────────────────────────┐
│     Price Chart (350px)             │
│  - Price line                       │
│  - Median + Bands                   │
│  - SL/TP lines                      │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│   Z-Score Chart (150px)             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ← Zero line
│     ▌ ▌  ▌▌▌                       │ ← Green bars (positive)
│  ▌▌ ▌ ▌▌                           │ ← Red bars (negative)
└─────────────────────────────────────┘
```

## Synchronization Strategy

1. **Time Axis**: Both charts share the same time range
2. **Updates**: Single update call updates both charts simultaneously
3. **History Loading**: Load z-score history alongside price history
4. **Scrolling**: User scroll on either chart affects both (via shared time scale)

## Performance Considerations

- Histogram series is more efficient than line series for this use case
- No additional WebSocket data needed (z-score already streamed)
- IndexedDB already stores z-score values
- Minimal rendering overhead (~1-2ms per update)

## Edge Cases

1. **Missing Z-Score Data**: Display zero value
2. **Extreme Values**: Auto-scale y-axis to fit all values
3. **Chart Resize**: Both charts resize proportionally
4. **Historical Data Gap**: Connect bars across gaps
