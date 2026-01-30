# Tasks: Z-Score Bar Chart

## Phase 1: Core Implementation

### Task 1.1: Update ChartController Interface
- [ ] Add `updateZScore` method to ChartController interface
- [ ] Add `setZScoreHistory` method to ChartController interface
- [ ] Update type definitions in `useMetricsStream.ts`

**Files**: `@/Volumes/work/aiboard/apps/web/src/modules/wick-hunter/model/hooks/useMetricsStream.ts:4-7`

### Task 1.2: Create Z-Score Chart Instance
- [ ] Add second chart container div in StreamChart component
- [ ] Initialize histogram series for z-score data
- [ ] Configure chart styling (background, grid, colors)
- [ ] Set up zero baseline line

**Files**: `@/Volumes/work/aiboard/apps/web/src/modules/wick-hunter/components/StreamChart.tsx:46-83`

### Task 1.3: Implement Time Synchronization
- [ ] Share time scale between main and z-score charts
- [ ] Synchronize visible range on scroll/zoom
- [ ] Handle resize events for both charts

**Files**: `@/Volumes/work/aiboard/apps/web/src/modules/wick-hunter/components/StreamChart.tsx:72-82`

## Phase 2: Data Integration

### Task 2.1: Update useImperativeHandle
- [ ] Implement `updateZScore` method
- [ ] Implement `setZScoreHistory` method
- [ ] Add color logic (green for positive, red for negative)
- [ ] Update histogram series with new data points

**Files**: `@/Volumes/work/aiboard/apps/web/src/modules/wick-hunter/components/StreamChart.tsx:159-199`

### Task 2.2: Connect WebSocket Data
- [ ] Extract z-score from incoming tick data
- [ ] Call `updateZScore` on chart controller
- [ ] Ensure proper time formatting (Unix seconds)

**Files**: `@/Volumes/work/aiboard/apps/web/src/modules/wick-hunter/model/hooks/useMetricsStream.ts:178-200`

### Task 2.3: Load Historical Z-Score Data
- [ ] Extract z-score values from IndexedDB metrics
- [ ] Transform to histogram data format
- [ ] Call `setZScoreHistory` on chart ready
- [ ] Apply same downsampling as price data

**Files**: `@/Volumes/work/aiboard/apps/web/src/modules/wick-hunter/model/hooks/useMetricsStream.ts:116-165`

## Phase 3: Visual Polish

### Task 3.1: Adjust Layout
- [ ] Reduce main chart height from 500px to 350px
- [ ] Set z-score chart height to 150px
- [ ] Ensure total height remains 500px
- [ ] Test responsive behavior

**Files**: `@/Volumes/work/aiboard/apps/web/src/modules/wick-hunter/components/StreamChart.tsx:50-56`

### Task 3.2: Add Visual Indicators
- [ ] Add horizontal grid lines at ±1, ±2, ±3 sigma
- [ ] Style zero baseline prominently
- [ ] Configure y-axis labels for z-score values
- [ ] Add optional threshold markers

**Files**: `@/Volumes/work/aiboard/apps/web/src/modules/wick-hunter/components/StreamChart.tsx`

### Task 3.3: Color Refinement
- [ ] Verify green color (#22c55e) for positive values
- [ ] Verify red color (#ef4444) for negative values
- [ ] Test color visibility on dark background
- [ ] Ensure consistent opacity/brightness

**Files**: `@/Volumes/work/aiboard/apps/web/src/modules/wick-hunter/components/StreamChart.tsx`

## Phase 4: Testing & Optimization

### Task 4.1: Performance Testing
- [ ] Measure update latency with z-score chart
- [ ] Profile memory usage
- [ ] Test with 5-minute historical data load
- [ ] Verify 60fps rendering maintained

### Task 4.2: Edge Case Handling
- [ ] Test with missing z-score data
- [ ] Test with extreme z-score values (±10)
- [ ] Test chart resize behavior
- [ ] Test rapid WebSocket updates

### Task 4.3: Visual QA
- [ ] Verify bar colors match specification
- [ ] Check time alignment between charts
- [ ] Validate zero line positioning
- [ ] Test on different screen sizes

## Estimated Effort

- Phase 1: 2-3 hours
- Phase 2: 2-3 hours
- Phase 3: 1-2 hours
- Phase 4: 1-2 hours

**Total**: 6-10 hours
