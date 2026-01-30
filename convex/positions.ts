import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Hardcoded user ID for MVP
const USER_ID = "demo_user";

export const getMyPositions = query({
    args: {
        status: v.optional(v.string()), // "OPEN" or "CLOSED", or undefined for all
    },
    handler: async (ctx, args) => {
        let q = ctx.db
            .query("positions")
            .withIndex("by_user_status", (q) => q.eq("userId", USER_ID));

        if (args.status) {
            q = q.filter((q) => q.eq(q.field("status"), args.status));
        }

        const positions = await q.collect();

        // Sort: OPEN positions usually strictly by opened time (desc)
        // CLOSED positions by closed time (desc)
        return positions.sort((a, b) => b.timestamps.opened - a.timestamps.opened);
    },
});

export const createPosition = mutation({
    args: {
        symbol: v.string(),
        exchangeId: v.string(),
        investedAmount: v.optional(v.number()),
        entryPriceSpot: v.optional(v.number()),
        entryPricePerp: v.optional(v.number()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const positionId = await ctx.db.insert("positions", {
            userId: USER_ID,
            symbol: args.symbol,
            exchangeId: args.exchangeId,
            direction: "ARBITRAGE_LONG", // Default for now
            status: "OPEN",
            investedAmount: args.investedAmount || 0,
            entryPriceSpot: args.entryPriceSpot,
            entryPricePerp: args.entryPricePerp,
            tradeCount: 0,
            notes: args.notes,
            tags: ["Manual"],
            timestamps: {
                opened: Date.now(),
            },
        });
        return positionId;
    },
});

export const closePosition = mutation({
    args: {
        id: v.id("positions"),
        exitPriceSpot: v.optional(v.number()),
        exitPricePerp: v.optional(v.number()),
        finalPnL: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const position = await ctx.db.get(args.id);
        if (!position) throw new Error("Position not found");

        await ctx.db.patch(args.id, {
            status: "CLOSED",
            exitPriceSpot: args.exitPriceSpot,
            exitPricePerp: args.exitPricePerp,
            finalPnL: args.finalPnL,
            timestamps: {
                ...position.timestamps,
                closed: Date.now(),
            },
        });
    },
});

export const updateNotes = mutation({
    args: {
        id: v.id("positions"),
        notes: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { notes: args.notes });
    },
});
