# Specifications: Z-Score Bar Chart

## Functional Requirements

### FR-1: Z-Score Visualization
- **ID**: FR-1
- **Description**: Display z-score values as vertical bars extending from zero baseline
- **Acceptance Criteria**:
  - Positive z-scores render as green bars above zero line
  - Negative z-scores render as red bars below zero line
  - Bar height proportional to z-score magnitude
  - Zero line clearly visible as reference

### FR-2: Real-Time Updates
- **ID**: FR-2
- **Description**: Z-score bars update in real-time with incoming WebSocket data
- **Acceptance Criteria**:
  - New bars appear within 50ms of data receipt
  - Updates synchronized with main price chart
  - No visual lag or flickering
  - Smooth rendering at 5Hz update rate

### FR-3: Historical Data
- **ID**: FR-3
- **Description**: Load and display historical z-score data from IndexedDB
- **Acceptance Criteria**:
  - Historical z-scores loaded on component mount
  - Same downsampling logic as price data (~300 points for 5 minutes)
  - Historical and real-time data seamlessly connected
  - Correct color coding for all historical values

### FR-4: Time Synchronization
- **ID**: FR-4
- **Description**: Z-score chart time axis synchronized with main chart
- **Acceptance Criteria**:
  - Both charts show identical time range
  - Scrolling one chart scrolls the other
  - Zooming one chart zooms the other
  - Time labels consistent between charts

## Non-Functional Requirements

### NFR-1: Performance
- **ID**: NFR-1
- **Description**: Z-score chart rendering must not impact main chart performance
- **Metrics**:
  - Update latency: < 5ms per tick
  - Memory overhead: < 10MB
  - CPU usage: < 2% additional
  - Frame rate: Maintain 60fps

### NFR-2: Visual Consistency
- **ID**: NFR-2
- **Description**: Z-score chart follows same visual design as main chart
- **Requirements**:
  - Same background color (#0a0a0a)
  - Same grid styling
  - Same font and text color
  - Consistent spacing and padding

### NFR-3: Responsiveness
- **ID**: NFR-3
- **Description**: Z-score chart adapts to container size changes
- **Requirements**:
  - Width matches main chart width
  - Height fixed at 150px
  - Responsive to window resize events
  - No layout shift during updates

## Technical Constraints

### TC-1: Library Usage
- Use lightweight-charts `HistogramSeries` for bar rendering
- No additional charting libraries
- Reuse existing chart configuration patterns

### TC-2: Data Format
- Z-score data format: `{ time: number, value: number, color?: string }`
- Time in Unix seconds (consistent with main chart)
- Value precision: 2 decimal places

### TC-3: Color Mapping
- Positive values: `#22c55e` (green-500)
- Negative values: `#ef4444` (red-500)
- Zero line: `#666666` (gray-600)
- No gradient or interpolation

## API Specifications

### ChartController Extension

```typescript
interface ChartController {
  // Existing methods
  updateCandle: (data: CandleData) => void;
  setHistory: (data: MetricData[]) => void;
  
  // New methods for z-score
  updateZScore: (data: ZScorePoint) => void;
  setZScoreHistory: (data: ZScorePoint[]) => void;
}

interface ZScorePoint {
  time: number;  // Unix timestamp in seconds
  value: number; // Z-score value
  color?: string; // Optional override color
}
```

### Component Props

```typescript
interface StreamChartProps {
  signals?: Signal[];
  stopLossPrice?: number;
  takeProfitPrice?: number;
  windowSize?: number;
  showZScore?: boolean; // Optional flag to toggle z-score chart
}
```

## UI Specifications

### Layout Dimensions
- Main chart height: 350px
- Z-score chart height: 150px
- Gap between charts: 0px (seamless)
- Total height: 500px (unchanged from current)

### Visual Elements
- Zero baseline: 1px solid line, color #666
- Bars: 80% width of time interval
- Grid lines: Horizontal only, at ±1, ±2, ±3 sigma
- Y-axis labels: Right side, showing z-score values

### Interaction
- Hover: Show tooltip with exact z-score value and timestamp
- Click: No special interaction (passive display)
- Scroll: Synchronized with main chart
- Zoom: Synchronized with main chart

## Testing Requirements

### Unit Tests
- Color mapping function (positive → green, negative → red)
- Data transformation (MetricData → ZScorePoint)
- History loading and downsampling

### Integration Tests
- WebSocket data flow to z-score chart
- Time synchronization between charts
- Historical data loading from IndexedDB

### Visual Tests
- Screenshot comparison for color accuracy
- Bar height proportional to value
- Zero line alignment
- Responsive layout at different widths
