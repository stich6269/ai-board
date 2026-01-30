"use node";
import { action } from "./_generated/server";
import ccxt from "ccxt";

export const scanMarkets = action({
    handler: async () => {
        const exchange = new ccxt.hyperliquid({
            enableRateLimit: true,
        });

        try {
            await exchange.loadMarkets();
            const rates = await exchange.fetchFundingRates();

            const results = Object.values(rates).map((rate: any) => ({
                symbol: rate.symbol,
                fundingRate: rate.fundingRate,
                timestamp: rate.timestamp,
                apr: rate.fundingRate * 24 * 365 * 100,
            }));

            const topRates = results
                .filter((r: any) => r.fundingRate !== undefined && r.fundingRate > 0)
                .sort((a: any, b: any) => b.apr - a.apr)
                .slice(0, 50);

            return topRates;

        } catch (error: any) {
            console.error(`Error scanning Hyperliquid:`, error);
            throw new Error(`Failed to scan markets: ${error.message}`);
        }
    },
});
