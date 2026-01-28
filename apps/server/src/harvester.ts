/**
 * Market Scanner Harvester
 * 
 * A standalone script that runs 24/7, fetching public market data from Bybit,
 * calculating annual yields, and pushing the best opportunities into Convex.
 * 
 * Run: npm run harvester
 */

import 'dotenv/config';
import ccxt, { Exchange, Ticker } from 'ccxt';
import { updateOpportunitiesToConvex } from './lib/convexClient.js';

// Configuration
const SCAN_INTERVAL_MS = 60_000; // 60 seconds
const MIN_VOLUME_USDT = 500_000; // Minimum 24h volume in USDT
const MIN_APR = 5; // Minimum APR to include
const FUNDING_PERIODS_PER_DAY = 3; // Bybit has 8-hour funding = 3 per day

interface Opportunity {
    symbol: string;
    exchangeId: string;
    price: number;
    fundingRate: number;
    apr: number;
    volume24h: number;
    url?: string;
    timestamp: number;
}

async function scan(exchange: Exchange): Promise<Opportunity[]> {
    console.log(`[${new Date().toISOString()}] Starting market scan...`);

    // Fetch all tickers and funding rates
    const [tickers, fundingRates] = await Promise.all([
        exchange.fetchTickers(),
        exchange.fetchFundingRates(),
    ]);

    const opportunities: Opportunity[] = [];
    const timestamp = Date.now();

    // Process each funding rate
    for (const [symbol, rate] of Object.entries(fundingRates)) {
        try {
            // Skip if no funding rate data
            if (rate.fundingRate === undefined || rate.fundingRate === null) {
                continue;
            }

            // Get ticker data for this symbol
            const ticker = tickers[symbol] as Ticker | undefined;
            if (!ticker) continue;

            // Filter by volume (quoteVolume is in USDT for USDT pairs)
            const volume24h = ticker.quoteVolume || 0;
            if (volume24h < MIN_VOLUME_USDT) {
                continue;
            }

            // Calculate APR: fundingRate * periods_per_day * 365 * 100
            const apr = Math.abs(rate.fundingRate) * FUNDING_PERIODS_PER_DAY * 365 * 100;

            // Filter by minimum APR
            if (apr < MIN_APR) {
                continue;
            }

            opportunities.push({
                symbol,
                exchangeId: 'bybit',
                price: ticker.last || ticker.close || 0,
                fundingRate: rate.fundingRate,
                apr,
                volume24h,
                timestamp,
            });
        } catch (err) {
            // Skip individual symbol errors
            console.warn(`Warning: Failed to process ${symbol}:`, (err as Error).message);
        }
    }

    // Sort by APR descending
    opportunities.sort((a, b) => b.apr - a.apr);

    // Take top 50 opportunities
    return opportunities.slice(0, 50);
}

async function main() {
    console.log('🚀 Market Scanner Harvester starting...');

    // Initialize Bybit exchange
    const exchange = new ccxt.bybit({
        enableRateLimit: true,
    });

    // Use bytick.com hostname to bypass regional blocks
    exchange.hostname = 'bytick.com';

    // Load markets once at startup
    console.log('📊 Loading Bybit markets...');
    await exchange.loadMarkets();
    console.log(`✅ Loaded ${Object.keys(exchange.markets).length} markets`);

    // Main loop
    while (true) {
        try {
            const opportunities = await scan(exchange);

            if (opportunities.length > 0) {
                // Push to Convex
                await updateOpportunitiesToConvex(opportunities);
                console.log(`✅ Updated ${opportunities.length} opportunities | Top: ${opportunities[0].symbol} @ ${opportunities[0].apr.toFixed(2)}% APR`);
            } else {
                console.log('⚠️ No opportunities found matching criteria');
            }
        } catch (error) {
            // Log error but don't crash - will retry next interval
            console.error('❌ Scan error:', (error as Error).message);
        }

        // Wait before next scan
        console.log(`⏳ Next scan in ${SCAN_INTERVAL_MS / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, SCAN_INTERVAL_MS));
    }
}

// Run the harvester
main().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
