# Tasks: UI Overhaul & Dashboard

- [x] **Data Pipeline**: Implement Telemetry <!-- id: 1 -->
    - [x] Implement `flushMetrics` in `WickHunterEngine`
    - [x] Create `convex/wick.ts` mutation for metrics ingestion

- [x] **UI Infrastructure**: Setup Dashboard <!-- id: 2 -->
    - [x] Create `apps/web/src/pages/Dashboard.tsx`
    - [x] Implement `MissionControlLayout` component
    - [x] Setup routing to new dashboard

- [x] **Components**: Build Visualizers <!-- id: 3 -->
    - [x] Implement `HeatmapCanvas` component (Canvas 2D)
    - [x] Implement `RobustStatsChart` using Recharts
    - [x] Create `ControlPanel` form bound to Convex data

- [x] **Polish**: Integration & Cleanup <!-- id: 4 -->
    - [x] Verify 1Hz refresh rate performance
    - [x] Deprecate/Remove old `WickHunter.tsx`
    - [x] Add responsive tweaks
