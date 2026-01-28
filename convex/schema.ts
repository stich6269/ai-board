import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    exchange_keys: defineTable({
        userId: v.string(),             // Static "me" for MVP or Clerk ID later
        exchangeId: v.string(),         // Enum: "bybit", "gateio", "binance"
        label: v.string(),              // User-friendly name
        apiKey: v.string(),             // Public Key
        secretKey: v.string(),          // Secret Key
        isValid: v.boolean(),           // Verified via CCXT
        lastChecked: v.optional(v.number()), // Timestamp
    }).index("by_user", ["userId"]),

    scan_results: defineTable({
        exchangeId: v.string(),
        results: v.any(),
        scannedAt: v.number(),
    }).index("by_exchange", ["exchangeId"]),

    // Stores the current best arbitrage opportunities (populated by harvester)
    opportunities: defineTable({
        symbol: v.string(),           // e.g. "BTC/USDT"
        exchangeId: v.string(),       // e.g. "bybit"
        price: v.number(),            // Current price
        fundingRate: v.number(),      // Raw funding rate (e.g. 0.0001)
        apr: v.number(),              // Annualized % (e.g. 10.5)
        volume24h: v.number(),        // To filter out dead coins
        url: v.optional(v.string()),  // Link to trade on exchange
        timestamp: v.number(),        // When this data was fetched
    }).index("by_apr", ["apr"]),
});
