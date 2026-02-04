import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

export const getConfig = query({
    args: { userId: v.string(), symbol: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (args.symbol) {
            return await ctx.db
                .query("wick_config")
                .withIndex("by_user_symbol", (q) =>
                    q.eq("userId", args.userId).eq("symbol", args.symbol as string)
                )
                .first();
        }
        return await ctx.db
            .query("wick_config")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();
    },
});

export const getConfigs = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("wick_config")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

export const getConfigById = query({
    args: { configId: v.id("wick_config") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.configId);
    },
});

export const getState = query({
    args: { configId: v.id("wick_config") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("wick_state")
            .withIndex("by_config", (q) => q.eq("configId", args.configId))
            .first();
    },
});

export const getRounds = query({
    args: { configId: v.id("wick_config"), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const rounds = await ctx.db
            .query("wick_rounds")
            .withIndex("by_config", (q) => q.eq("configId", args.configId))
            .order("desc")
            .take(args.limit || 500);
        return rounds;
    },
});

export const getOpenRound = query({
    args: { configId: v.id("wick_config") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("wick_rounds")
            .withIndex("by_config_status", (q) =>
                q.eq("configId", args.configId).eq("status", "OPEN")
            )
            .first();
    },
});

export const getRound = query({
    args: { id: v.id("wick_rounds") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getStats = query({
    args: { configId: v.id("wick_config") },
    handler: async (ctx, args) => {
        const config = await ctx.db.get(args.configId);
        const state = await ctx.db
            .query("wick_state")
            .withIndex("by_config", (q) => q.eq("configId", args.configId))
            .first();
        const rounds = await ctx.db
            .query("wick_rounds")
            .withIndex("by_config", (q) => q.eq("configId", args.configId))
            .order("desc")
            .take(100);

        const closedRounds = rounds.filter(r => r.status === "CLOSED" || r.status === "STOPPED_OUT");
        const totalPnL = closedRounds.reduce((sum, r) => sum + (r.finalPnL || 0), 0);
        const winCount = closedRounds.filter(r => (r.finalPnL || 0) > 0).length;
        const lossCount = closedRounds.filter(r => (r.finalPnL || 0) <= 0).length;

        return {
            config,
            state,
            rounds,
            stats: {
                totalRounds: closedRounds.length,
                totalPnL,
                winCount,
                lossCount,
                winRate: closedRounds.length > 0 ? (winCount / closedRounds.length) * 100 : 0,
            },
        };
    },
});

// ============================================
// MUTATIONS - Config Management
// ============================================

export const createConfig = mutation({
    args: {
        userId: v.string(),
        symbol: v.string(),
        buyDipPercent: v.number(),
        takeProfitPercent: v.number(),
        stopLossPercent: v.number(),
        investmentAmount: v.number(),
        zScoreThreshold: v.optional(v.number()),
        minZScoreExit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("wick_config")
            .withIndex("by_user_symbol", (q) =>
                q.eq("userId", args.userId).eq("symbol", args.symbol)
            )
            .first();

        if (existing) {
            throw new Error(`Config for ${args.symbol} already exists`);
        }

        const configId = await ctx.db.insert("wick_config", {
            userId: args.userId,
            symbol: args.symbol,
            isRunning: false,
            buyDipPercent: args.buyDipPercent,
            takeProfitPercent: args.takeProfitPercent,
            stopLossPercent: args.stopLossPercent,
            investmentAmount: args.investmentAmount,
            zScoreThreshold: args.zScoreThreshold || 3.0,
            minZScoreExit: args.minZScoreExit || 0.1,
        });

        await ctx.db.insert("wick_state", {
            configId,
            status: "STOPPED",
            marketPrice: 0,
            updatedAt: Date.now(),
        });

        return configId;
    },
});

export const updateConfig = mutation({
    args: {
        configId: v.id("wick_config"),
        // Entry Strategy
        investmentAmount: v.optional(v.number()),
        zScoreThreshold: v.optional(v.number()),
        windowSize: v.optional(v.number()),
        minMadThreshold: v.optional(v.number()),
        // DCA & Averaging
        maxDcaEntries: v.optional(v.number()),
        dcaZScoreMultiplier: v.optional(v.number()),
        minDcaPriceDeviationPercent: v.optional(v.number()),
        // Exit & Safety
        stopLossPercent: v.optional(v.number()),
        softTimeoutMs: v.optional(v.number()),
        minZScoreExit: v.optional(v.number()),
        chartRetentionMinutes: v.optional(v.number()),
        // Legacy (deprecated)
        buyDipPercent: v.optional(v.number()),
        takeProfitPercent: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { configId, ...updates } = args;
        const filtered = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );
        await ctx.db.patch(configId, filtered);
    },
});

export const toggleBot = mutation({
    args: { configId: v.id("wick_config") },
    handler: async (ctx, args) => {
        const config = await ctx.db.get(args.configId);
        if (!config) throw new Error("Config not found");

        const newIsRunning = !config.isRunning;
        await ctx.db.patch(args.configId, { isRunning: newIsRunning });

        const state = await ctx.db
            .query("wick_state")
            .withIndex("by_config", (q) => q.eq("configId", args.configId))
            .first();

        // Check for open positions when stopping
        const hasOpenPosition = await ctx.db
            .query("wick_rounds")
            .withIndex("by_config", (q) => q.eq("configId", args.configId))
            .filter((q) => q.eq(q.field("status"), "OPEN"))
            .first();

        if (state) {
            // If stopping with open position, trigger panic close
            const newStatus = !newIsRunning && hasOpenPosition
                ? "PANIC_CLOSE"
                : (newIsRunning ? "IDLE" : "STOPPED");

            await ctx.db.patch(state._id, {
                status: newStatus,
                updatedAt: Date.now(),
            });
        }

        return newIsRunning;
    },
});

export const setActiveSymbol = mutation({
    args: {
        userId: v.string(),
        symbol: v.string()
    },
    handler: async (ctx, args) => {
        const allConfigs = await ctx.db
            .query("wick_config")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        let targetConfig = null;
        for (const config of allConfigs) {
            const configSymbol = config.symbol.split('/')[0];
            const isTarget = configSymbol === args.symbol;

            if (isTarget) {
                targetConfig = config;
            } else if (config.isRunning) {
                await ctx.db.patch(config._id, { isRunning: false });
            }
        }

        if (targetConfig) {
            await ctx.db.patch(targetConfig._id, { isRunning: true });
        }

        return { success: true, configId: targetConfig?._id };
    },
});

export const changeSymbol = mutation({
    args: {
        configId: v.id("wick_config"),
        symbol: v.string()
    },
    handler: async (ctx, args) => {
        const config = await ctx.db.get(args.configId);
        if (!config) throw new Error("Config not found");

        // Stop trading if running
        if (config.isRunning) {
            await ctx.db.patch(args.configId, { isRunning: false });
        }

        // Update symbol
        await ctx.db.patch(args.configId, { symbol: args.symbol });

        // Reset state
        const state = await ctx.db
            .query("wick_state")
            .withIndex("by_config", (q) => q.eq("configId", args.configId))
            .first();

        if (state) {
            await ctx.db.patch(state._id, {
                status: "IDLE",
                marketPrice: 0,
                myOrderPrice: undefined,
                distancePercent: undefined,
                entryPrice: undefined,
                targetSellPrice: undefined,
                stopLossPrice: undefined,
                pnlCurrent: undefined,
                buyOrderId: undefined,
                sellOrderId: undefined,
                updatedAt: Date.now(),
            });
        }

        // Clear old signals for this config
        const signals = await ctx.db
            .query("wick_signals")
            .withIndex("by_config_time", (q) => q.eq("configId", args.configId))
            .collect();
        for (const signal of signals) {
            await ctx.db.delete(signal._id);
        }

        // Clear old logs for this config
        const logs = await ctx.db
            .query("wick_logs")
            .withIndex("by_config_time", (q) => q.eq("configId", args.configId))
            .collect();
        for (const log of logs) {
            await ctx.db.delete(log._id);
        }

        return args.symbol;
    },
});

export const deleteConfig = mutation({
    args: { configId: v.id("wick_config") },
    handler: async (ctx, args) => {
        const state = await ctx.db
            .query("wick_state")
            .withIndex("by_config", (q) => q.eq("configId", args.configId))
            .first();
        if (state) await ctx.db.delete(state._id);

        const rounds = await ctx.db
            .query("wick_rounds")
            .withIndex("by_config", (q) => q.eq("configId", args.configId))
            .collect();
        for (const round of rounds) {
            await ctx.db.delete(round._id);
        }

        await ctx.db.delete(args.configId);
    },
});

// ============================================
// MUTATIONS - Engine State Updates
// ============================================

export const updateState = mutation({
    args: {
        configId: v.id("wick_config"),
        status: v.optional(v.string()),
        marketPrice: v.optional(v.number()),
        myOrderPrice: v.optional(v.number()),
        distancePercent: v.optional(v.number()),
        entryPrice: v.optional(v.number()),
        targetSellPrice: v.optional(v.number()),
        stopLossPrice: v.optional(v.number()),
        pnlCurrent: v.optional(v.number()),
        buyOrderId: v.optional(v.string()),
        sellOrderId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { configId, ...updates } = args;
        const filtered = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        const state = await ctx.db
            .query("wick_state")
            .withIndex("by_config", (q) => q.eq("configId", configId))
            .first();

        if (state) {
            await ctx.db.patch(state._id, { ...filtered, updatedAt: Date.now() });
        } else {
            await ctx.db.insert("wick_state", {
                configId,
                status: "IDLE",
                marketPrice: 0,
                ...filtered,
                updatedAt: Date.now(),
            });
        }
    },
});

export const updateVolatility = mutation({
    args: {
        configId: v.id("wick_config"),
        currentVolatility: v.number(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.configId, {
            currentVolatility: args.currentVolatility
        });
    },
});

// ============================================
// MUTATIONS - Round Management
// ============================================

export const openRound = mutation({
    args: {
        configId: v.id("wick_config"),
        symbol: v.string(),
        buyPrice: v.number(),
        buyAmount: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("wick_rounds")
            .withIndex("by_config_status", (q) =>
                q.eq("configId", args.configId).eq("status", "OPEN")
            )
            .first();

        if (existing) {
            throw new Error("A round is already open");
        }

        // Cleanup old rounds (keep only 500 most recent)
        const allRounds = await ctx.db
            .query("wick_rounds")
            .withIndex("by_config", (q) => q.eq("configId", args.configId))
            .order("desc")
            .take(501);

        if (allRounds.length > 500) {
            const oldRounds = allRounds.slice(500);
            for (const round of oldRounds) {
                await ctx.db.delete(round._id);
            }
        }

        return await ctx.db.insert("wick_rounds", {
            configId: args.configId,
            symbol: args.symbol,
            buyTime: Date.now(),
            buyPrice: args.buyPrice,
            buyAmount: args.buyAmount,
            status: "OPEN",
        });
    },
});

export const averagePosition = mutation({
    args: {
        roundId: v.id("wick_rounds"),
        newPrice: v.number(),
        newAmount: v.number(),
    },
    handler: async (ctx, args) => {
        const round = await ctx.db.get(args.roundId);
        if (!round) throw new Error("Round not found");
        if (round.status !== "OPEN") throw new Error("Round is not open");

        // Calculate new averaged entry price
        const totalValue = (round.buyPrice * round.buyAmount) + (args.newPrice * args.newAmount);
        const totalAmount = round.buyAmount + args.newAmount;
        const averagedPrice = totalValue / totalAmount;

        await ctx.db.patch(args.roundId, {
            buyPrice: averagedPrice,
            buyAmount: totalAmount,
        });

        return { averagedPrice, totalAmount };
    },
});

export const closeRound = mutation({
    args: {
        roundId: v.id("wick_rounds"),
        sellPrice: v.number(),
        status: v.union(v.literal("CLOSED"), v.literal("STOPPED_OUT")),
    },
    handler: async (ctx, args) => {
        const round = await ctx.db.get(args.roundId);
        if (!round) throw new Error("Round not found");

        const sellTime = Date.now();
        const durationSeconds = Math.floor((sellTime - round.buyTime) / 1000);
        const finalPnL = (args.sellPrice - round.buyPrice) * round.buyAmount;

        await ctx.db.patch(args.roundId, {
            sellTime,
            sellPrice: args.sellPrice,
            status: args.status,
            finalPnL,
            durationSeconds,
        });

        return { finalPnL, durationSeconds };
    },
});

export const closePosition = mutation({
    args: { configId: v.id("wick_config") },
    handler: async (ctx, args) => {
        const state = await ctx.db
            .query("wick_state")
            .withIndex("by_config", (q) => q.eq("configId", args.configId))
            .first();

        if (state) {
            await ctx.db.patch(state._id, {
                status: "MANUAL_CLOSE",
                updatedAt: Date.now(),
            });
        }

        return { success: true, message: "Position close initiated" };
    },
});

export const panicClose = mutation({
    args: { configId: v.id("wick_config") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.configId, { isRunning: false });

        const state = await ctx.db
            .query("wick_state")
            .withIndex("by_config", (q) => q.eq("configId", args.configId))
            .first();

        if (state) {
            await ctx.db.patch(state._id, {
                status: "PANIC_CLOSE",
                updatedAt: Date.now(),
            });
        }

        return { success: true, message: "Panic close initiated" };
    },
});

// ============================================
// METRICS - Data Pipeline
// ============================================

export const saveSignal = mutation({
    args: {
        configId: v.id("wick_config"),
        timestamp: v.number(),
        price: v.number(),
        type: v.union(v.literal("BUY"), v.literal("SELL")),
        zScore: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("wick_signals")
            .withIndex("by_config_time", (q) =>
                q.eq("configId", args.configId).eq("timestamp", args.timestamp)
            )
            .filter((q) => q.eq(q.field("type"), args.type))
            .first();

        if (!existing) {
            // Cleanup old signals (keep only 500 most recent)
            const allSignals = await ctx.db
                .query("wick_signals")
                .withIndex("by_config_time", (q) => q.eq("configId", args.configId))
                .order("desc")
                .take(501);

            if (allSignals.length > 500) {
                const oldSignals = allSignals.slice(500);
                for (const signal of oldSignals) {
                    await ctx.db.delete(signal._id);
                }
            }

            await ctx.db.insert("wick_signals", args);
        }
    },
});

export const getSignals = query({
    args: {
        configId: v.id("wick_config"),
        since: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const fiveMinutesAgo = args.since || (Date.now() - 5 * 60 * 1000);

        return await ctx.db
            .query("wick_signals")
            .withIndex("by_config_time", (q) => q.eq("configId", args.configId))
            .filter((q) => q.gte(q.field("timestamp"), fiveMinutesAgo))
            .collect();
    },
});

// ============================================
// LOGS - Algorithm Logging
// ============================================

export const saveLog = mutation({
    args: {
        configId: v.id("wick_config"),
        timestamp: v.number(),
        level: v.union(v.literal("INFO"), v.literal("WARN"), v.literal("ERROR"), v.literal("SIGNAL")),
        message: v.string(),
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
    },
    handler: async (ctx, args) => {
        // Cleanup old logs (keep only 500 most recent)
        const allLogs = await ctx.db
            .query("wick_logs")
            .withIndex("by_config_time", (q) => q.eq("configId", args.configId))
            .order("desc")
            .take(501);

        if (allLogs.length > 500) {
            const oldLogs = allLogs.slice(500);
            for (const log of oldLogs) {
                await ctx.db.delete(log._id);
            }
        }

        await ctx.db.insert("wick_logs", args);
    },
});

export const getLogs = query({
    args: {
        configId: v.id("wick_config"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("wick_logs")
            .withIndex("by_config_time", (q) => q.eq("configId", args.configId))
            .order("desc")
            .take(args.limit || 100);
    },
});

export const clearData = mutation({
    args: {
        configId: v.id("wick_config"),
        target: v.union(v.literal("logs"), v.literal("trades"), v.literal("state"), v.literal("all"))
    },
    handler: async (ctx, args) => {
        // 1. Clear Logs & Signals
        if (args.target === "logs" || args.target === "all") {
            const logs = await ctx.db
                .query("wick_logs")
                .withIndex("by_config_time", (q) => q.eq("configId", args.configId))
                .collect();
            for (const log of logs) await ctx.db.delete(log._id);

            const signals = await ctx.db
                .query("wick_signals")
                .withIndex("by_config_time", (q) => q.eq("configId", args.configId))
                .collect();
            for (const signal of signals) await ctx.db.delete(signal._id);
        }

        // 2. Clear Rounds (Trades)
        if (args.target === "trades" || args.target === "all") {
            const rounds = await ctx.db
                .query("wick_rounds")
                .withIndex("by_config", (q) => q.eq("configId", args.configId))
                .collect();
            for (const round of rounds) await ctx.db.delete(round._id);
        }

        // 3. Reset State
        if (args.target === "state" || args.target === "all") {
            const state = await ctx.db
                .query("wick_state")
                .withIndex("by_config", (q) => q.eq("configId", args.configId))
                .first();

            if (state) {
                await ctx.db.patch(state._id, {
                    status: "IDLE",
                    marketPrice: 0,
                    myOrderPrice: undefined,
                    distancePercent: undefined,
                    entryPrice: undefined,
                    targetSellPrice: undefined,
                    stopLossPrice: undefined,
                    pnlCurrent: undefined,
                    buyOrderId: undefined,
                    sellOrderId: undefined,
                    updatedAt: Date.now(),
                });
            }
        }
    },
});
