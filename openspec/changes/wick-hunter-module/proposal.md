# Proposal: Wick Hunter Module

Create a sophisticated high-frequency trading (HFT) module "Wick Hunter" for Hyperliquid, designed to capture mean reversion opportunities following liquidation cascades.

## Problem

The current basic implementation of trading logic lacks the statistical robustness needed for the "Wick Hunter" strategy. Specifically:
- Standard Deviation/Mean metrics fail during crypto market leptokurtic events (heavy tails).
- No integration with liquidation data to confirm signal validity.
- Performance bottlenecks in Node.js event loop and GC during high-load events.
- Lack of "Whale" and Copy-Trader flow analysis.

## Solution

Implement a new `WickHunter` module with the following core components:

1.  **Robust Statistics Engine**:
    - Use **Median** and **MAD** (Median Absolute Deviation) instead of Mean/SD.
    - Implement **Two-Heaps Algorithm** for $O(\log N)$ rolling median calculation.
    - Implement **Approximate Rolling MAD** using circular buffers and QuickSelect logic.

2.  **Liquidation Heatmap**:
    - Spatio-temporal data structure to track liquidation clusters.
    - Logic to filter Z-score signals: enter only when high Z-score aligns with liquidation volume.

3.  **Whale & Copy-Trader Tracking**:
    - Monitor specific "smart money" addresses.
    - Use whale positions as signal amplifiers or filters.

4.  **Optimized Execution Engine**:
    - **WebSocket**: Connection pool, aggressive reconnection, heartbeat.
    - **Memory**: Object pools, TypedArrays (Float64Array) to minimize GC.
    - **Signing**: Offload EIP-712 signing to Worker Threads.
    - **Order Types**: ALO (Add Liquidity Only) for passive entry, IOC for aggressive catch, Reduce-Only for exits.

## What Changes

- **New Worker**: A completely rewritten `wick-hunter.worker.ts` (or modularized into `apps/server/src/modules/wick-hunter/`).
- **Shared Logic**: New math utilities for Two-Heaps and MAD in `packages/shared` or local utils.
- **Config**: Enhanced configuration schema for `WickConfig` to support new parameters (MAD threshold, Heatmap decay, etc.).

## Capabilities

### New Capabilities

- `wick-hunter-core`: The main strategy loop and state management.
- `robust-stats`: Mathematical utilities for rolling median/MAD.
- `liquidation-analytics`: Heatmap and liquidation detection logic.
- `execution-optimization`: Worker thread signing and memory-optimized structures.

### Modified Capabilities

- `market-connector`: Enhanced WebSocket handling for Hyperliquid specific channels (userFills, extensive trade feeds).

## Impact

- **Code**: Significant addition to `apps/server`.
- **Performance**: High requirement for low-latency execution; requires careful testing.
- **Dependencies**: May need `heap-js` or similar for heap structures if not implementing custom.
