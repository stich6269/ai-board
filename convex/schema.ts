import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    exchange_keys: defineTable({
        userId: v.string(),
        exchangeId: v.literal("hyperliquid"),
        label: v.string(),
        walletAddress: v.string(),
        privateKey: v.string(),
        isValid: v.boolean(),
        lastChecked: v.optional(v.number()),
        usdcBalance: v.optional(v.number()),
    }).index("by_user", ["userId"]),

    scan_results: defineTable({
        exchangeId: v.string(),
        results: v.any(),
        scannedAt: v.number(),
    }).index("by_exchange", ["exchangeId"]),

    opportunities: defineTable({
        symbol: v.string(),
        exchangeId: v.literal("hyperliquid"),
        price: v.number(),
        fundingRate: v.number(),
        apr: v.number(),
        volume24h: v.number(),
        url: v.optional(v.string()),
        timestamp: v.number(),
        history: v.optional(v.array(v.object({
            rate: v.number(),
            timestamp: v.number(),
        }))),
        averageApr3d: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
        spread: v.optional(v.number()),
        isSpotAvailable: v.boolean(),
        spotSymbol: v.optional(v.string()),
        perpSymbol: v.optional(v.string()),
    }).index("by_apr", ["apr"]),

    positions: defineTable({
        userId: v.string(),
        symbol: v.string(),
        exchangeId: v.literal("hyperliquid"),
        direction: v.string(),      // "ARBITRAGE_LONG" (Long Spot + Short Perp)
        status: v.string(),         // "OPEN", "CLOSED"

        // Financials
        investedAmount: v.optional(v.number()), // Total USD size (e.g., 1000)
        entryPriceSpot: v.optional(v.number()),
        entryPricePerp: v.optional(v.number()),

        // Performance Tracking
        currentPnL: v.optional(v.number()), // Calculated periodically
        exitPriceSpot: v.optional(v.number()),
        exitPricePerp: v.optional(v.number()),
        finalPnL: v.optional(v.number()),

        // Metadata
        notes: v.optional(v.string()), // User notes
        tags: v.optional(v.array(v.string())), // e.g., ["High Yield", "Manual"]

        // Trade Link (Future)
        tradeCount: v.number(),     // Default 0

        timestamps: v.object({
            opened: v.number(),
            closed: v.optional(v.number()),
        }),
    })
        .index("by_user_status", ["userId", "status"]) // For "Active Positions" tab
        .index("by_user_closed", ["userId", "timestamps.closed"]), // For "History" tab

    // Tracks the lifecycle of adding liquidity
    liquidity_ops: defineTable({
        positionId: v.id("positions"),
        userId: v.string(),
        exchangeId: v.string(),
        symbol: v.string(),

        // User Inputs
        totalAmountUsd: v.number(),
        spotAmountUsd: v.number(),
        perpAmountUsd: v.number(),

        // Execution State
        status: v.string(), // "DRAFT", "PENDING", "EXECUTING", "COMPLETED", "FAILED", "ROLLBACK_IN_PROGRESS", "ROLLED_BACK"

        // Financial Projections
        estimatedFee: v.optional(v.number()),
        estimatedSpreadLoss: v.optional(v.number()),

        // Execution Results
        spotOrderId: v.optional(v.string()),
        perpOrderId: v.optional(v.string()),

        // Error Logging
        error: v.optional(v.string()),
        logs: v.array(v.string()),

        timestamp: v.number(),
    }).index("by_status", ["status"]),

    // User Balances (Synced from Exchange)
    balances: defineTable({
        userId: v.string(),
        exchangeId: v.string(),
        totalUsd: v.number(),
        availableUsd: v.number(),
        updatedAt: v.number(),
    }).index("by_user_exchange", ["userId", "exchangeId"]),

    // Harvester Status (Synced from Harvester)
    scanner_status: defineTable({
        exchangeId: v.string(),
        instanceId: v.optional(v.string()), // Unique ID for this harvester process
        lastScanAt: v.number(),
        nextScanAt: v.number(),
        status: v.string(), // "IDLE", "SCANNING"
        version: v.optional(v.string()), // To track stale processes
    }).index("by_exchange", ["exchangeId"]),

    // ============================================
    // WICK HUNTER MODULE
    // ============================================

    // Wick Hunter Config (Settings & Control)
    wick_config: defineTable({
        userId: v.string(),
        symbol: v.string(),              // "HYPE/USDC"
        isRunning: v.boolean(),          // PLAY/STOP button

        // Entry Strategy
        investmentAmount: v.number(),    // Base investment amount in USDC
        zScoreThreshold: v.optional(v.number()), // Z-Score entry threshold (default 2.0)
        windowSize: v.optional(v.number()), // Rolling window size (default 200)
        minMadThreshold: v.optional(v.number()), // Min volatility filter (default 0.001)
        
        // DCA & Averaging
        maxDcaEntries: v.optional(v.number()), // Max DCA entries (0 = disabled, default 2)
        dcaZScoreMultiplier: v.optional(v.number()), // DCA signal multiplier (default 1.3)
        minDcaPriceDeviationPercent: v.optional(v.number()), // Min price step % (default 0.2)
        
        // Exit & Safety
        stopLossPercent: v.number(),     // Hard stop loss %
        softTimeoutMs: v.optional(v.number()), // Soft timeout in ms (default 30000)
        minZScoreExit: v.optional(v.number()), // Min Z-Score for exit (default 0.1)
        chartRetentionMinutes: v.optional(v.number()), // Chart data retention (default 10)
        
        // Legacy (deprecated but kept for compatibility)
        buyDipPercent: v.optional(v.number()),
        takeProfitPercent: v.optional(v.number()),
        
        // Volatility status (for UI)
        currentVolatility: v.optional(v.number()), // Current % change in 1 min
    }).index("by_user", ["userId"])
        .index("by_user_symbol", ["userId", "symbol"]),

    // Wick Hunter State (Realtime - Updated every 2-3 sec)
    wick_state: defineTable({
        configId: v.id("wick_config"),
        status: v.string(), // "IDLE", "TRAILING_BUY", "FILLED_BUY", "PLACING_SELL", "MONITORING_EXIT", "STOPPED"

        // Visualization data for "Magnet"
        marketPrice: v.number(),         // $33.50
        myOrderPrice: v.optional(v.number()),  // $33.00 (Where our bucket is)
        distancePercent: v.optional(v.number()), // 1.49% (Real distance)

        // If bought:
        entryPrice: v.optional(v.number()),
        targetSellPrice: v.optional(v.number()),
        stopLossPrice: v.optional(v.number()),
        pnlCurrent: v.optional(v.number()),  // Current unrealized PnL

        // Order tracking
        buyOrderId: v.optional(v.string()),
        sellOrderId: v.optional(v.string()),

        updatedAt: v.number(),
    }).index("by_config", ["configId"]),

    // Wick Hunter Rounds (History & Reports)
    wick_rounds: defineTable({
        configId: v.id("wick_config"),
        symbol: v.string(),

        // Buy phase
        buyTime: v.number(),
        buyPrice: v.number(),
        buyAmount: v.number(),           // in coins

        // Sell phase
        sellTime: v.optional(v.number()),
        sellPrice: v.optional(v.number()),

        // Result
        status: v.string(),              // "OPEN", "CLOSED", "STOPPED_OUT"
        finalPnL: v.optional(v.number()), // In dollars (e.g. +$0.50)
        durationSeconds: v.optional(v.number()),
    }).index("by_config", ["configId"])
        .index("by_config_status", ["configId", "status"]),

    // Trading signals (BUY/SELL) - stored separately for clean overlay
    wick_signals: defineTable({
        configId: v.id("wick_config"),
        timestamp: v.number(),
        price: v.number(),
        type: v.union(v.literal("BUY"), v.literal("SELL")),
        zScore: v.number(),
    }).index("by_config_time", ["configId", "timestamp"]),

    // Algorithm logs with full snapshot
    wick_logs: defineTable({
        configId: v.id("wick_config"),
        timestamp: v.number(),
        level: v.union(v.literal("INFO"), v.literal("WARN"), v.literal("ERROR"), v.literal("SIGNAL")),
        message: v.string(),
        
        // Full snapshot of calculated values
        snapshot: v.object({
            price: v.number(),
            median: v.number(),
            mad: v.number(),
            zScore: v.number(),
            velocity: v.number(),
            acceleration: v.number(),
            positionState: v.string(),
            entryPrice: v.optional(v.number()),
            pnlPercent: v.optional(v.number()),
        }),
    }).index("by_config_time", ["configId", "timestamp"]),
});
