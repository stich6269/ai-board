# Specs: UI Overhaul

## ADDED Requirements

### Requirement: Metric Ingestion
The system SHALL ingest metrics from the Wick Hunter engine into the database.

#### Scenario: Server Telemetry
- **WHEN** the Wick Hunter engine completes a processing loop
- **AND** at least 1 second has passed since last update
- **THEN** it SHALL send metrics via WebSocket with:
    - `timestamp`
    - `price`
    - `median`
    - `mad`
    - `zScore`
    - `heatmapSnapshot` (Top 50 levels or condensed array)

### Requirement: Dashboard Visualization
The system SHALL display a real-time "Mission Control" dashboard.

#### Scenario: Heatmap Render
- **WHEN** a new metric record arrives
- **THEN** the Heatmap Component SHALL shift history to the left (time axis)
- **AND** render the new vertical slice of liquidation density (color coded by volume)
- **AND** limit the render loop to 60fps

### Requirement: Control Parameters
The system SHALL allow hot-swapping of configuration parameters.

#### Scenario: Update Threshold
- **WHEN** user changes "Z-Score Threshold" input
- **THEN** Update the `wick_configs` document in Convex
- **AND** The Server (listening to Convex changes) SHALL immediately apply the new threshold to the running engine.
