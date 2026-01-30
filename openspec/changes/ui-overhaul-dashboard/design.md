# Design: UI Overhaul & Mission Control

## Context
The current UI is a basic placeholder. The new Wick Hunter module produces rich data (Heatmaps, Z-Scores) that needs visualization. We are building a "Mission Control" style dashboard to aggregate this data.

## Goals
- **High Frequency Visualization**: Visualize fast-changing data (1Hz+) without lag.
- **Unified Control**: Control all bot parameters from a single interface.
- **Deep Observability**: See exactly "what the bot sees" (Liquidation levels, robust bands).

## Architecture

### 1. Data Pipeline
*   **Server (Engine)**: Aggregates metrics (Price, Median, MAD, Heatmap Bins) into a `SystemState` object.
*   **WebSocket**: Direct Engine → Frontend communication at 40Hz
*   **IndexedDB**: Client-side persistence for page reloads
*   **Frontend**: Subscribes to live feed.

### 2. Frontend Components
*   **`MissionControlLayout`**: A CSS Grid layout managing the screen real estate.
*   **`LiquidationHeatmap`**: A **Canvas 2D** based component.
    *   *Why Canvas?* tens/hundreds of bins updating every second is too heavy for DOM/SVG (React reconciliation overhead).
    *   *Visuals*: X-axis = Price, Y-axis = Time (waterfall) OR X-axis = Time, Y-axis = Price (traditional heatmap).
    *   *Decision*: Y-Axis Price, X-Axis Time (scrolling left).
    *   *Overlay*: Current Price line and Band lines drawn on top.
*   **`ControlPanel`**: Shadcn Form components binding directly to `wick_configs` table in Convex.

### 3. Tech Stack
*   **Charts**: `recharts` for standard time-series (PnL, Balance).
*   **Heatmap**: Raw `<canvas>` with custom render loop.
*   **State**: `convex/react` hooks.

## Decisions
*   **Polling vs Streaming**: We use Convex subscription (streaming-like) which is robust and implemented. No direct WebSocket from UI to Bot to keep architecture simple (Bot <-> Convex <-> UI).
*   **Decay Persistence**: The Heatmap state is strictly in the Bot's memory. The UI only receives the *current* density map snapshot. Ideally, for a scrolling history, the Bot needs to send a stream of snapshots, or the UI builds the history buffer.
    *   *Choice*: UI maintains a client-side circular buffer of received snapshots to render the scrolling history effect.

## Risks
*   **Network Jitter**: Client-side buffer might have gaps if network lags.
*   **Browser Performance**: Canvas drawing needs to be optimized (requestAnimationFrame).
