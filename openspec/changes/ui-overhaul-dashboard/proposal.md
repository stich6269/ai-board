# Proposal: UI Overhaul & Dashboard Cleanup (Phase 2)

## Goal
Streamline the dashboard by removing redundant UI elements, implementing dynamic ticker switching with volatility display, and preparing for Clerk authentication integration.

## Changes Overview

### 1. Header Cleanup
- **Remove**: "Trades" link from header (already in BottomPanel widget)
- **Remove**: `/trades` page (`VirtualTrades.tsx`) - redundant
- **Transform**: Static ticker display → Searchable dropdown with volatility

### 2. Ticker Dropdown System
- Searchable combobox showing all USDC pairs from Hyperliquid
- Display 1-hour volatility percentage for each pair
- On ticker change:
  - Clear chart history and IndexedDB
  - Restart engine with new symbol
  - Filter logs/trades/positions by new ticker
  - Update all dashboard widgets

### 3. Settings Modal Cleanup
- **Remove**: Start/Stop Engine buttons (moved to header)
- **Remove**: Panic Close button (moved to header)
- Keep only algorithm parameters (Entry, DCA, Exit settings)

### 4. Engine Control Logic Refactor
- Engine runs **always** in background
- Play/Stop button controls **trading** only (not data streaming)
- Stop action with open positions → auto-close all positions
- Separate concepts: "Engine Running" vs "Trading Active"

### 5. Clerk Authentication (Placeholder)
- Add Clerk provider wrapper
- Protect dashboard route
- Skip Convex auth integration for now

## Implementation Steps

1. Delete `VirtualTrades.tsx` and route
2. Remove trades link from `DashboardHeader.tsx`
3. Clean up `SettingsModal.tsx` - remove trading controls
4. Create `TickerSelector` component with search + volatility
5. Add Hyperliquid API call to fetch USDC pairs with volatility
6. Implement ticker change logic with full system restart
7. Add Clerk authentication wrapper

## Files Affected
- `apps/web/src/App.tsx` - remove /trades route
- `apps/web/src/pages/VirtualTrades.tsx` - DELETE
- `apps/web/src/modules/wick-hunter/components/DashboardHeader.tsx` - refactor
- `apps/web/src/modules/wick-hunter/components/SettingsModal.tsx` - cleanup
- `apps/web/src/modules/wick-hunter/components/TickerSelector.tsx` - NEW
- `convex/wick.ts` - add ticker change mutation

## Risks
- Ticker change requires engine restart - brief data gap
- Volatility API calls may add latency to dropdown
