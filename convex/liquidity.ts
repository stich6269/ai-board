import { mutation, action, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const getPendingOps = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("liquidity_ops")
            .withIndex("by_status", (q) => q.eq("status", "PENDING"))
            .collect();
    },
});

export const getOperation = query({
    args: { opId: v.optional(v.id("liquidity_ops")) },
    handler: async (ctx, args) => {
        if (!args.opId) return null;
        return await ctx.db.get(args.opId);
    },
});

export const getWalletBalance = query({
    args: { exchangeId: v.string() },
    handler: async (ctx, args) => {
        const balance = await ctx.db
            .query("balances")
            .withIndex("by_user_exchange", (q) => q.eq("userId", "demo_user").eq("exchangeId", args.exchangeId))
            .first();

        return {
            totalUsdt: balance?.totalUsd || 0,
            availableUsdt: balance?.availableUsd || 0,
        };
    },
});

export const updateBalance = mutation({
    args: {
        exchangeId: v.string(),
        totalUsd: v.number(),
        availableUsd: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("balances")
            .withIndex("by_user_exchange", (q) => q.eq("userId", "demo_user").eq("exchangeId", args.exchangeId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                totalUsd: args.totalUsd,
                availableUsd: args.availableUsd,
                updatedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("balances", {
                userId: "demo_user",
                exchangeId: args.exchangeId,
                totalUsd: args.totalUsd,
                availableUsd: args.availableUsd,
                updatedAt: Date.now(),
            });
        }
    },
});

export const initOperation = mutation({
    args: {
        positionId: v.id("positions"),
        symbol: v.string(),
        totalAmountUsd: v.number(),
    },
    handler: async (ctx, args) => {
        // 1. Validate position exists
        const position = await ctx.db.get(args.positionId);
        if (!position) throw new Error("Position not found");

        // 2. Create Draft Operation
        const opId = await ctx.db.insert("liquidity_ops", {
            positionId: args.positionId,
            userId: position.userId,
            exchangeId: position.exchangeId,
            symbol: args.symbol,

            totalAmountUsd: args.totalAmountUsd,
            spotAmountUsd: 0, // Pending user confirmation
            perpAmountUsd: 0,

            status: "DRAFT",
            logs: ["Initialized draft operation"],
            timestamp: Date.now(),
        });

        return opId;
    },
});

export const confirmOperation = mutation({
    args: {
        opId: v.id("liquidity_ops"),
        spotAmountUsd: v.number(),
        perpAmountUsd: v.number(),
    },
    handler: async (ctx, args) => {
        const op = await ctx.db.get(args.opId);
        if (!op) throw new Error("Operation not found");

        await ctx.db.patch(args.opId, {
            spotAmountUsd: args.spotAmountUsd,
            perpAmountUsd: args.perpAmountUsd,
            status: "PENDING",
            logs: [...op.logs, "User confirmed split. Queueing for engine..."],
        });
    },
});

export const updateOpStatus = mutation({
    args: {
        opId: v.id("liquidity_ops"),
        status: v.string(),
        logs: v.optional(v.array(v.string())),
        error: v.optional(v.string()),
        spotOrderId: v.optional(v.string()),
        perpOrderId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const op = await ctx.db.get(args.opId);
        if (!op) throw new Error("Operation not found");

        const updatePayload: any = {
            status: args.status,
        };

        if (args.logs) updatePayload.logs = args.logs;
        if (args.error) updatePayload.error = args.error;
        if (args.spotOrderId) updatePayload.spotOrderId = args.spotOrderId;
        if (args.perpOrderId) updatePayload.perpOrderId = args.perpOrderId;

        await ctx.db.patch(args.opId, updatePayload);
    },
});
