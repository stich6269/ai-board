import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mutation: Save pre-validated key (validation happens client-side)
export const saveKey = mutation({
    args: {
        exchangeId: v.string(),
        apiKey: v.string(),
        secretKey: v.string(),
        label: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("exchange_keys", {
            userId: "me", // Mocked for MVP
            exchangeId: args.exchangeId,
            apiKey: args.apiKey,
            secretKey: args.secretKey,
            label: args.label,
            isValid: true, // Pre-validated client-side
            lastChecked: Date.now(),
        });
    },
});

// Internal Mutation: Only callable by Actions
export const saveKeyToDb = internalMutation({
    args: {
        userId: v.string(),
        exchangeId: v.string(),
        apiKey: v.string(),
        secretKey: v.string(),
        label: v.string(),
        isValid: v.boolean(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("exchange_keys", {
            ...args,
            lastChecked: Date.now(),
        });
    },
});

// Query: List keys with masked secrets
export const listKeys = query({
    handler: async (ctx) => {
        const keys = await ctx.db
            .query("exchange_keys")
            .withIndex("by_user", (q) => q.eq("userId", "me"))
            .collect();

        return keys.map((key) => ({
            ...key,
            secretKey: `******${key.secretKey.slice(-4)}`,
        }));
    },
});

// Mutation: Delete key
export const removeKey = mutation({
    args: { id: v.id("exchange_keys") },
    handler: async (ctx, args) => {
        const key = await ctx.db.get(args.id);
        if (key && key.userId === "me") {
            await ctx.db.delete(args.id);
        }
    },
});
