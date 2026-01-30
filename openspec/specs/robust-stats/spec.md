# Spec: Robust Statistics Engine

Defines the mathematical requirements for signal generation using robust statistics (Median/MAD).

## ADDED Requirements

### Requirement: Rolling Median Calculation
The system SHALL maintain a rolling median of market prices over a configurable window size $N$.

#### Scenario: Price update
- **WHEN** a new price $P_{new}$ arrives
- **THEN** remove the oldest price $P_{old}$ from the window
- **THEN** insert $P_{new}$
- **THEN** update the median using $O(\log N)$ Two-Heaps algorithm
- **THEN** return the new median value

### Requirement: Rolling MAD Calculation
The system SHALL calculate the Median Absolute Deviation (MAD) of the current window.

#### Scenario: MAD Update
- **WHEN** the window updates
- **THEN** calculate the median of absolute deviations $|X_i - \tilde{X}|$
- **THEN** update the MAD value with $O(N)$ worst-case complexity (using QuickSelect approximation or optimized method)

### Requirement: Robust Z-Score Generation
The system SHALL generate a Z-score signal based on the robust metrics.

#### Scenario: Signal Generation
- **WHEN** a new price arrives
- **THEN** calculate $Z_{robust} = \frac{0.6745(X_i - \tilde{X})}{MAD}$
- **THEN** emit a signal if $|Z_{robust}| > Threshold$
