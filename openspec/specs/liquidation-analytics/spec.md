# Spec: Liquidation Analytics

Defines requirements for tracking liquidations and building the heatmap.

## ADDED Requirements

### Requirement: Liquidation Detection
The system SHALL detect liquidation events from the public trade feed, even if explicit flags are missing.

#### Scenario: Inference by heuristics
- **WHEN** a trade has `IOC` flag (if visible) OR price impact > Threshold
- **AND** trade size > Threshold
- **THEN** classify as potential liquidation

### Requirement: Heatmap Maintenance
The system SHALL maintain a spatio-temporal map of liquidation volumes.

#### Scenario: Heatmap Update
- **WHEN** a liquidation is detected at Price $P$ with Size $V$
- **THEN** identify Price Bin $B_i$ corresponding to $P$
- **THEN** apply time decay factor to existing volume in $B_i$: $V_{old} = V_{old} \times e^{-\lambda \Delta t}$
- **THEN** add new volume: $V_{new} = V_{old} + V$
