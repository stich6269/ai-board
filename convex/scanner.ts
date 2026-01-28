import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mutation: Called by Node.js Harvester to update opportunities
export const updateOpportunities = mutation({
    args: {
        data: v.array(v.object({
            symbol: v.string(),
            exchangeId: v.string(),
            price: v.number(),
            fundingRate: v.number(),
            apr: v.number(),
            volume24h: v.number(),
            url: v.optional(v.string()),
            timestamp: v.number(),
        }))
    },
    handler: async (ctx, args) => {
        // 1. Delete old records (Snapshot model - always fresh data)
        const existing = await ctx.db.query("opportunities").collect();
        for (const doc of existing) {
            await ctx.db.delete(doc._id);
        }

        // 2. Insert new batch
        for (const item of args.data) {
            await ctx.db.insert("opportunities", item);
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
