# Design: Wick Hunter Module

## Context

The current `WickHunter` implementation is a basic volatility-based bot that lacks the sophistication to handle the specific market microstructure of Hyperliquid. It relies on standard deviation which is flawed for crypto markets, and does not utilize liquidation data. The new design aims to implement a "mean reversion after liquidation cascade" strategy described in the technical report.

## Goals

- **Robust Anomaly Detection**: Switch from Mean/SD to Median/MAD (Median Absolute Deviation) to handle heavy-tailed price distributions.
- **Microstructure Confirmation**: Use a Liquidation Heatmap to validate signal quality and filter noise.
- **Low Latency Execution**: Optimize Node.js event loop usage, memory management, and signing processes.
- **Smart Money Tracking**: Incorporate "Whale" and "Copy-Trader" signals.

## Decisions

### 1. Robust Statistics Engine

We will implement a rolling window robust Z-score calculation.

*   **Algorithm**: Use **Two-Heaps Algorithm** (MaxHeap + MinHeap) to maintain the rolling median with $O(\log N)$ complexity.
*   **MAD Calculation**: Use an approximate on-line MAD calculation or optimized QuickSelect on a circular buffer to keep latency under control (target < 1ms per tick).
*   **Justification**: Standard deviation explodes during cascades, killing the signal. MAD is robust against outliers.

### 2. Spatio-Temporal Liquidation Heatmap

We will maintain a map of liquidation volumes by price level.

*   **Structure**: `Map<PriceBinIndex, {volume, timestamp}>`.
*   **Decay**: Apply exponential time decay ($\lambda$) so old liquidations don't pollute the signal.
*   **Data Source**: Parse specific trade flags or infer liquidations (IOC + deep market impact) if explicit flags aren't available on the `trades` channel.

### 3. Execution Architecture

*   **Threading**: Move cryptographic signing (EIP-712) to a `Worker Thread`. This prevents the CPU-intensive signing operation from blocking the WebSocket event loop.
*   **Memory**: Use `Float64Array` for storing price history to minimize GC pressure. Avoid creating new objects for every trade; reuse object pools where possible.
*   **Network**: Use `ws` library with `skipUTF8Validation: true` for maximum performance. Implement a "Connection Pool" logic if we need multiple streams, though a single connection usually suffices for one symbol.

### 4. Trade Logic & Order Types

*   **Entry**:
    *   **Passive (Preferred)**: ALO (Add Liquidity Only) limit orders placed IN the liquidation wick.
    *   **Aggressive**: IOC orders only if $Z_{robust} > 5.0$.
*   **Exit**: trailing take-profit or fixed R:R using `Reduce-Only` orders.
*   **Whale Multiplier**: If a trade matches a "Whale Watchlist" address, reduce the Z-score threshold for entry (signal confirmation).

## Risks / Trade-offs

*   **Complexity**: Implementing a Two-Heaps rolling median is significantly more complex than `Array.reduce`. Correctness is critical.
*   **Memory Overhead**: Maintaining the heatmap and high-res price history requires more RAM, but this is acceptable for a server-side bot.
*   **Heuristics**: Inferring liquidations (if flags are missing) is heuristic and may have false positives. We must calibrate thresholds carefully.
