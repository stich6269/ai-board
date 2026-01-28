import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mutation: Save scan results from backend
export const saveScanResults = mutation({
    args: {
        exchangeId: v.string(),
        results: v.any(),
    },
    handler: async (ctx, args) => {
        // Store scan results in database
        await ctx.db.insert("scan_results", {
            exchangeId: args.exchangeId,
            results: args.results,
            scannedAt: Date.now(),
        });
    },
});

// Query: Get latest scan results
export const getScanResults = query({
    args: {
        exchangeId: v.string(),
    },
    handler: async (ctx, args) => {
        const result = await ctx.db
            .query("scan_results")
            .filter((q) => q.eq(q.field("exchangeId"), args.exchangeId))
            .order("desc")
            .first();

        return result?.results || [];
    },
});
