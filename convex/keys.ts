import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveWallet = mutation({
    args: {
        label: v.string(),
        walletAddress: v.string(),
        privateKey: v.string(),
        usdcBalance: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("exchange_keys")
            .withIndex("by_user", (q) => q.eq("userId", "me"))
            .filter((q) => q.eq(q.field("walletAddress"), args.walletAddress))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                label: args.label,
                privateKey: args.privateKey,
                isValid: true,
                lastChecked: Date.now(),
                usdcBalance: args.usdcBalance,
            });
            return existing._id;
        }

        return await ctx.db.insert("exchange_keys", {
            userId: "me",
            exchangeId: "hyperliquid",
            label: args.label,
            walletAddress: args.walletAddress,
            privateKey: args.privateKey,
            isValid: true,
            lastChecked: Date.now(),
            usdcBalance: args.usdcBalance,
        });
    },
});

export const saveWalletInternal = internalMutation({
    args: {
        userId: v.string(),
        label: v.string(),
        walletAddress: v.string(),
        privateKey: v.string(),
        isValid: v.boolean(),
        usdcBalance: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("exchange_keys", {
            ...args,
            exchangeId: "hyperliquid",
            lastChecked: Date.now(),
        });
    },
});

export const listWallets = query({
    handler: async (ctx) => {
        const wallets = await ctx.db
            .query("exchange_keys")
            .withIndex("by_user", (q) => q.eq("userId", "me"))
            .collect();

        return wallets.map((wallet) => ({
            ...wallet,
            privateKey: `******${wallet.privateKey.slice(-4)}`,
        }));
    },
});

export const getWallet = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("exchange_keys")
            .withIndex("by_user", (q) => q.eq("userId", "me"))
            .first();
    },
});

export const getWalletForWorker = query({
    handler: async (ctx) => {
        const wallet = await ctx.db
            .query("exchange_keys")
            .withIndex("by_user", (q) => q.eq("userId", "me"))
            .first();
        
        // Return full private key for worker use (not masked)
        return wallet;
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
