# Tasks: Wick Hunter Module

<!--
Status:
[ ] = Todo
[/] = In Progress
[x] = Done
-->

- [x] **Infrastructure**: Set up directory structure and shared utils <!-- id: 1 -->
    - [x] Create `packages/shared/src/math/`
    - [x] Implement `TwoHeaps` class for rolling median
    - [x] Implement `RollingMAD` class

- [x] **Data Layer**: Implement Liquidation Analytics <!-- id: 2 -->
    - [x] Create `apps/server/src/modules/wick-hunter/heatmap.ts`
    - [x] Implement `LiquidationHeatmap` class with time decay
    - [x] Implement liquidation detection heuristics

- [x] **Execution**: Order Signing Worker <!-- id: 3 -->
    - [x] Create `apps/server/src/workers/signing.worker.ts`
    - [x] Implement EIP-712 signing logic in worker
    - [x] Create `SigningService` in main thread to communicate with worker

- [x] **Core Strategy**: Wick Hunter Logic <!-- id: 4 -->
    - [x] Create `apps/server/src/modules/wick-hunter/engine.ts`
    - [x] Implement WebSocket connection management with `ws`
    - [x] Implement signal generation (Robust Z-score + Heatmap)
    - [x] Implement "Whale Watchlist" logic

- [x] **Integration**: Connect to Server <!-- id: 5 -->
    - [x] Update `apps/server/src/index.ts` to use new module
    - [x] Replace/Deprecate old `wick-hunter.worker.ts`
    - [x] Update Convex schema (if needed) for new metrics
