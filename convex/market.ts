"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import ccxt from "ccxt";

export const scanMarkets = action({
    args: {
        exchangeId: v.string(), // e.g., 'bybit'
    },
    handler: async (_, args) => {
        const exchangeClass = ccxt[args.exchangeId as keyof typeof ccxt] as any;
        if (!exchangeClass) {
            throw new Error(`Exchange ${args.exchangeId} not found`);
        }

        const exchange = new exchangeClass({
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            },
        });

        // Bybit-specific: Try bypass hostname if blocked
        if (args.exchangeId === 'bybit') {
            exchange.hostname = 'bytick.com';
        }

        // Enable funding rates if supported/required, though fetchFundingRates is standard
        if (exchange.has['fetchFundingRates']) {
            try {
                // Load markets first if needed (some exchanges require it)
                await exchange.loadMarkets();

                // specific logic for bybit or general
                // Bybit funding rates
                const rates = await exchange.fetchFundingRates();

                // Format and sort
                // rates is usually a dict by symbol, or list
                // CCXT unifies this, usually returning a dictionary

                const results = Object.values(rates).map((rate: any) => ({
                    symbol: rate.symbol,
                    fundingRate: rate.fundingRate,
                    timestamp: rate.timestamp,
                    predictedFundingRate: rate.predictedFundingRate
                }));

                // Sort by absolute funding rate descending (high arb opportunity)
                // or just positive? "High funding rates" usually implies positive for shorting perps
                const topRates = results
                    .filter((r: any) => r.fundingRate !== undefined)
                    .sort((a: any, b: any) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate))
                    .slice(0, 50); // Top 50

                return topRates;

            } catch (error: any) {
                console.error(`Error scanning ${args.exchangeId}:`, error);
                throw new Error(`Failed to scan markets: ${error.message}`);
            }
        } else {
            throw new Error(`Exchange ${args.exchangeId} does not support fetchFundingRates`);
        }
    },
});
