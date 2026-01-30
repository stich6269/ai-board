# Specs: Wick Hunter Module

## ADDED Requirements

### Requirement: Rolling Median Calculation
**Capability**: `robust-stats`
The system SHALL maintain a rolling median of market prices over a configurable window size $N$, using an $O(\log N)$ algorithm (e.g., Two-Heaps) to handle high-frequency updates.

#### Scenario: Price update
- **WHEN** a new price $P_{new}$ arrives
- **THEN** remove the oldest price $P_{old}$ from the window
- **THEN** insert $P_{new}$
- **THEN** update the median
- **THEN** return the new median value

### Requirement: Rolling MAD Calculation
**Capability**: `robust-stats`
The system SHALL calculate the Median Absolute Deviation (MAD) of the current window to use as a robust volatility metric.

#### Scenario: MAD Update
- **WHEN** the window updates
- **THEN** calculate the median of absolute deviations $|X_i - \tilde{X}|$
- **THEN** update the MAD value with optimized complexity

### Requirement: Robust Z-Score Generation
**Capability**: `robust-stats`
The system SHALL generate a Z-score signal based on the robust metrics.

#### Scenario: Signal Generation
- **WHEN** a new price arrives
- **THEN** calculate $Z_{robust} = \frac{0.6745(X_i - \tilde{X})}{MAD}$
- **THEN** emit a signal if $|Z_{robust}| > Threshold$

### Requirement: Liquidation Detection
**Capability**: `liquidation-analytics`
The system SHALL detect liquidation events from the public trade feed using heuristics (IOC + impact + size) if explicit flags are missing.

### Requirement: Heatmap Maintenance
**Capability**: `liquidation-analytics`
The system SHALL maintain a spatio-temporal map of liquidation volumes with time decay.

#### Scenario: Heatmap Update
- **WHEN** a liquidation is detected at Price $P$ with Size $V$
- **THEN** update the corresponding price bin with new volume and apply decay.

### Requirement: Non-Blocking Signing
**Capability**: `execution-optimization`
The system SHALL sign orders in a separate thread to prevent blocking the WebSocket event loop.

### Requirement: Signal Evaluation
**Capability**: `wick-hunter-core`
The system SHALL evaluate trading signals by combining Robust Z-score and Liquidation Heatmap density.

#### Scenario: Contrarion Entry
- **WHEN** $|Z_{robust}| > Threshold$
- **AND** Liquidation Heatmap density at signal price $> Threshold$
- **THEN** generate ENTRY signal
