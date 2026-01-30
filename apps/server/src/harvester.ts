/**
 * Hyperliquid Market Scanner
 * 
 * Scans Hyperliquid DEX for funding rate arbitrage opportunities.
 * Hyperliquid uses HOURLY funding (24 periods per day) and USDC as collateral.
 * 
 * Run: npm run harvester
 */

import 'dotenv/config';
import ccxt, { Exchange, Ticker } from 'ccxt';
import { updateOpportunitiesToConvex, updateScannerStatusToConvex } from './lib/convexClient.js';

const VERSION = "2.0.0";
const INSTANCE_ID = Math.random().toString(36).substring(2, 8);
const SCAN_INTERVAL_MS = 60_000;
const MIN_VOLUME_USDC = 100_000;
const MIN_FUNDING_RATE = 0.00005;
const MIN_APR = 10;
const FUNDING_PERIODS_PER_DAY = 24;
const MIN_HISTORY_APR = 15;
const HISTORY_LIMIT_PER_SCAN = 10;

interface HistoryPoint {
    rate: number;
    timestamp: number;
}

interface Opportunity {
    symbol: string;
    exchangeId: "hyperliquid";
    price: number;
    fundingRate: number;
    apr: number;
    volume24h: number;
    url?: string;
    timestamp: number;
    history?: HistoryPoint[];
    averageApr3d?: number;
    tags?: string[];
    spread?: number;
    isSpotAvailable: boolean;
    spotSymbol?: string;
    perpSymbol?: string;
}

async function scan(exchange: Exchange): Promise<Opportunity[]> {
    console.log(`[${new Date().toISOString()}] Starting Hyperliquid market scan...`);

    const [tickers, fundingRates] = await Promise.all([
        exchange.fetchTickers(),
        exchange.fetchFundingRates(),
    ]);

    const opportunities: Opportunity[] = [];
    const timestamp = Date.now();

    const spotMarkets = new Set<string>();
    const perpMarkets = new Set<string>();

    for (const [symbol, market] of Object.entries(exchange.markets)) {
        if (market.spot) spotMarkets.add(market.base || '');
        if (market.swap || market.future) perpMarkets.add(market.base || '');
    }

    console.log(`📊 Found ${spotMarkets.size} spot bases, ${perpMarkets.size} perp bases`);

    for (const [symbol, rate] of Object.entries(fundingRates)) {
        try {
            if (rate.fundingRate === undefined || rate.fundingRate === null) continue;
            if (rate.fundingRate < MIN_FUNDING_RATE) continue;

            const perpTicker = tickers[symbol] as Ticker | undefined;
            if (!perpTicker) continue;

            const volume24h = perpTicker.quoteVolume || 0;
            if (volume24h < MIN_VOLUME_USDC) continue;

            const apr = rate.fundingRate * FUNDING_PERIODS_PER_DAY * 365 * 100;
            if (apr < MIN_APR) continue;

            const perpPrice = perpTicker.last || perpTicker.close || 0;
            if (perpPrice === 0) continue;

            const base = exchange.markets[symbol]?.base || symbol.split('/')[0];
            const spotSymbol = `${base}/USDC`;
            const hasSpot = Boolean(spotMarkets.has(base) && exchange.markets[spotSymbol]);

            let spread: number | undefined;
            if (hasSpot) {
                const spotTicker = tickers[spotSymbol] as Ticker | undefined;
                const spotPrice = spotTicker?.last || spotTicker?.close || 0;
                if (spotPrice > 0) {
                    spread = ((perpPrice - spotPrice) / spotPrice) * 100;
                }
            }

            opportunities.push({
                symbol,
                exchangeId: 'hyperliquid',
                price: perpPrice,
                fundingRate: rate.fundingRate,
                apr,
                volume24h,
                timestamp,
                spread,
                isSpotAvailable: hasSpot,
                spotSymbol: hasSpot ? spotSymbol : undefined,
                perpSymbol: symbol,
            });
        } catch (err) {
            console.warn(`Warning: Failed to process ${symbol}:`, (err as Error).message);
        }
    }

    // Sort by APR descending
    opportunities.sort((a, b) => b.apr - a.apr);

    // SMARTER SCAN: Fetch history ONLY for top high-yield candidates
    // We limit to top N to avoid API rate limits
    const candidates = opportunities.slice(0, HISTORY_LIMIT_PER_SCAN);

    console.log(`🔍 Fetching history for top ${candidates.length} candidates...`);

    for (const opp of candidates) {
        try {
            // Only fetch history if APR is significant to save API calls
            if (opp.apr < MIN_HISTORY_APR) continue;

            const history = await exchange.fetchFundingRateHistory(opp.symbol, undefined, 72);

            if (history && history.length > 0) {
                opp.history = history.map(h => ({
                    rate: h.fundingRate,
                    timestamp: h.timestamp || 0,
                }));

                const last3Days = history.slice(-72);
                if (last3Days.length > 0) {
                    const avgRate = last3Days.reduce((sum, h) => sum + h.fundingRate, 0) / last3Days.length;
                    opp.averageApr3d = avgRate * FUNDING_PERIODS_PER_DAY * 365 * 100;

                    // --- STABILITY CHECK ---
                    // "Stability Check" (Scam/Spike detection)
                    // Logic: If current APR is 10x > Avg, and Avg was low (<20%), it's a "Pump Trap".

                    const ratio = opp.averageApr3d > 0.1 ? (opp.apr / opp.averageApr3d) : 100; // Handle near-zero avg

                    // User Rule: if (ratio > 5 && averageApr3d < 20) -> RISKY_SPIKE
                    const isRiskySpike = (ratio > 5) && (opp.averageApr3d < 20);

                    opp.tags = [];
                    if (isRiskySpike) {
                        opp.tags.push("RISKY_SPIKE");
                        console.log(`⚠️ Detected SPIKE: ${opp.symbol} (Ratio: ${ratio.toFixed(1)}x, Avg: ${opp.averageApr3d.toFixed(1)}%)`);
                    } else {
                        opp.tags.push("STABLE");
                    }
                }
            }

            // Nice delay to be gentle on API
            await new Promise(r => setTimeout(r, 100));

        } catch (error) {
            console.warn(`Failed to fetch history for ${opp.symbol}:`, (error as Error).message);
        }
    }

    // Return the full list (top candidates have history, others generally don't)
    return opportunities.slice(0, 50);
}

async function main() {
    console.log('🚀 Hyperliquid Scanner starting...');

    const exchange = new ccxt.hyperliquid({
        enableRateLimit: true,
    });

    console.log('📊 Loading Hyperliquid markets...');
    await exchange.loadMarkets();
    console.log(`✅ Loaded ${Object.keys(exchange.markets).length} markets`);

    while (true) {
        try {
            const lastScanAt = Date.now();
            const nextScanAt = lastScanAt + SCAN_INTERVAL_MS;

            await updateScannerStatusToConvex({
                exchangeId: 'hyperliquid',
                instanceId: INSTANCE_ID,
                lastScanAt,
                nextScanAt,
                status: 'SCANNING',
                version: VERSION,
            });

            const opportunities = await scan(exchange);

            if (opportunities.length > 0) {
                // Push to Convex
                await updateOpportunitiesToConvex(opportunities);
                console.log(`✅ Updated ${opportunities.length} opportunities | Top: ${opportunities[0].symbol} @ ${opportunities[0].apr.toFixed(2)}% APR`);
            } else {
                console.log('⚠️ No opportunities found matching criteria');
            }

            await updateScannerStatusToConvex({
                exchangeId: 'hyperliquid',
                instanceId: INSTANCE_ID,
                lastScanAt,
                nextScanAt,
                status: 'IDLE',
                version: VERSION,
            });

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
