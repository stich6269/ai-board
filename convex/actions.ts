"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import ccxt from "ccxt";

export const validateAndSave = action({
    args: {
        exchangeId: v.string(),
        apiKey: v.string(),
        secretKey: v.string(),
        label: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            // 1. Instantiate Exchange
            // @ts-ignore - ccxt indexing
            const exchangeClass = (ccxt as any)[args.exchangeId];
            if (!exchangeClass) {
                return { success: false, error: `Exchange ${args.exchangeId} not supported` };
            }

            const exchange = new exchangeClass({
                apiKey: args.apiKey,
                secret: args.secretKey,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                },
            });

            // Bybit-specific: Try bypass hostname if blocked
            if (args.exchangeId === 'bybit') {
                exchange.hostname = 'bytick.com';
            }

            // 2. Test Connection
            await exchange.fetchBalance();

            // 3. Save to DB via Internal Mutation
            await ctx.runMutation(internal.keys.saveKeyToDb, {
                userId: "me", // Mocked for MVP
                exchangeId: args.exchangeId,
                apiKey: args.apiKey,
                secretKey: args.secretKey,
                label: args.label,
                isValid: true,
            });

            return { success: true };
        } catch (error: any) {
            console.error("Validation failed:", error);
            return { success: false, error: error.message || "Unknown connection error" };
        }
    },
});
