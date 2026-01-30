import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const updateOpportunities = mutation({
    args: {
        data: v.array(v.object({
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
        }))
    },
    handler: async (ctx, args) => {
        // 1. Get existing opportunities
        const existing = await ctx.db.query("opportunities").collect();
        const existingMap = new Map(existing.map(o => [`${o.exchangeId}:${o.symbol}`, o]));

        const processedSymbols = new Set<string>();

        // 2. Upsert new batch
        for (const item of args.data) {
            const key = `${item.exchangeId}:${item.symbol}`;
            const existingDoc = existingMap.get(key);

            if (existingDoc) {
                await ctx.db.patch(existingDoc._id, item);
            } else {
                await ctx.db.insert("opportunities", item);
            }
            processedSymbols.add(key);
        }

        // 3. Delete items no longer in the batch
        for (const doc of existing) {
            const key = `${doc.exchangeId}:${doc.symbol}`;
            if (!processedSymbols.has(key)) {
                await ctx.db.delete(doc._id);
            }
        }

        return { updated: args.data.length };
    },
});

// Query: Called by Frontend UI for real-time updates
export const getOpportunities = query({
    args: { minApr: v.optional(v.number()) },
    handler: async (ctx, args) => {
        let opportunities = await ctx.db.query("opportunities").collect();

        // Sort by APR descending (Highest profit first)
        opportunities.sort((a, b) => b.apr - a.apr);

        // Filter by minimum APR if specified
        if (args.minApr !== undefined) {
            opportunities = opportunities.filter(o => o.apr >= args.minApr!);
        }

        return opportunities;
    },
});

// Mutation: Update harvester heartbeat/status
export const updateScannerStatus = mutation({
    args: {
        exchangeId: v.string(),
        instanceId: v.string(),
        lastScanAt: v.number(),
        nextScanAt: v.number(),
        status: v.string(),
        version: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("scanner_status")
            .withIndex("by_exchange", (q) => q.eq("exchangeId", args.exchangeId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                instanceId: args.instanceId,
                lastScanAt: args.lastScanAt,
                nextScanAt: args.nextScanAt,
                status: args.status,
                version: args.version,
            });
        } else {
            await ctx.db.insert("scanner_status", args);
        }
    },
});


// Query: Get current scanner status for the UI
export const getScannerStatus = query({
    args: { exchangeId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("scanner_status")
            .withIndex("by_exchange", (q) => q.eq("exchangeId", args.exchangeId))
            .first();
    },
});

