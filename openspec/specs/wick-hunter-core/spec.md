# Spec: Wick Hunter Core

Defines the core strategy loop and state management.

## ADDED Requirements

### Requirement: Signal Evaluation
The system SHALL evaluate trading signals by combining Z-score and Heatmap data.

#### Scenario: Contrarion Entry
- **WHEN** $|Z_{robust}| > Threshold$
- **AND** Liquidation Heatmap density at current price $> Threshold$
- **THEN** generate ENTRY signal

### Requirement: Whale Watchlist
The system SHALL adjust signal sensitivity based on "Whale" activity.

#### Scenario: Whale Liquidation
- **WHEN** a liquidation event is linked to a whitelisted address
- **THEN** increase the weight of the signal (or lower the Z-score threshold)
