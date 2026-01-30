"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import ccxt from "ccxt";
import { Wallet } from "ethers";

export const validateAndSaveWallet = action({
    args: {
        privateKey: v.string(),
        label: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            const wallet = new Wallet(args.privateKey);
            const walletAddress = wallet.address;

            const exchange = new ccxt.hyperliquid({
                walletAddress,
                privateKey: args.privateKey,
                enableRateLimit: true,
            });

            await exchange.loadMarkets();
            const balance = await exchange.fetchBalance();
            const usdcBalance = balance['USDC']?.total || 0;

            await ctx.runMutation(internal.keys.saveWalletInternal, {
                userId: "me",
                label: args.label,
                walletAddress,
                privateKey: args.privateKey,
                isValid: true,
                usdcBalance,
            });

            return { success: true, walletAddress, usdcBalance };
        } catch (error: any) {
            console.error("Validation failed:", error);
            return { success: false, error: error.message || "Unknown connection error" };
        }
    },
});
