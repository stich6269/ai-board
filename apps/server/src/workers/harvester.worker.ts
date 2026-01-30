import ccxt, { Exchange, Ticker } from 'ccxt';
import { updateOpportunitiesToConvex, updateScannerStatusToConvex } from '../lib/convexClient.js';

const SCAN_INTERVAL_MS = 60_000;
// FIX: Set this to 0. We will rely on MIN_APR instead.
const MIN_FUNDING_RATE = 0;
const MIN_APR = 8; // Filter out if current APR is below 8%
const MIN_VOLUME_USDC = 50_000;
const MIN_AVERAGE_3D_APR = 8; // Filter out if 3-day average APR is below 8%
const FUNDING_PERIODS_PER_DAY = 24;
const HISTORY_LIMIT_PER_SCAN = 10;
const INSTANCE_ID = `harvester-${Date.now()}`;
const VERSION = '1.0.0';

interface Opportunity {
    symbol: string;
    exchangeId: 'hyperliquid';
    price: number;
    fundingRate: number;
    apr: number;
    volume24h: number;
    timestamp: number;
    url?: string;
    history?: { rate: number; timestamp: number }[];
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
            // 1. Basic Rate Checks
            if (rate.fundingRate === undefined || rate.fundingRate === null) continue;
            
            // FIX: Removed strict MIN_FUNDING_RATE check here. 
            // We calculate APR first, then filter.

            // 2. Ticker Lookup (Robust)
            let perpTicker = tickers[symbol] as Ticker | undefined;
            
            // Fallback: If direct lookup fails, try to find a matching symbol in tickers keys
            if (!perpTicker) {
                // Hyperliquid specific: sometimes funding is 'BTC/USDC:USDC' and ticker is 'BTC/USDC' or vice versa
                const matchingKey = Object.keys(tickers).find(k => k.includes(symbol) || symbol.includes(k));
                if (matchingKey) perpTicker = tickers[matchingKey];
            }

            if (!perpTicker) {
                // console.log(`Skipping ${symbol}: No ticker found`);
                continue;
            }

            // 3. Volume Check
            const volume24h = perpTicker.quoteVolume || perpTicker.baseVolume || 0; // Fallback to baseVolume if quote is missing
            if (volume24h < MIN_VOLUME_USDC) {
                // console.log(`Skipping ${symbol}: Low Volume (${volume24h})`);
                continue;
            }

            // 4. APR Calculation & Check
            const apr = rate.fundingRate * FUNDING_PERIODS_PER_DAY * 365 * 100;
            
            // This is the REAL filter. 
            // If APR is < 10%, we skip. If it's negative, we skip (unless you want negative funding logic).
            if (apr < MIN_APR) {
                // console.log(`Skipping ${symbol}: Low APR (${apr.toFixed(2)}%)`);
                continue;
            }

            const perpPrice = perpTicker.last || perpTicker.close || 0;
            if (perpPrice === 0) continue;

            // 5. Spot / Spread Logic
            const base = exchange.markets[symbol]?.base || symbol.split('/')[0];
            // Try different spot symbol variations just in case
            const spotSymbolCandidates = [`${base}/USDC`, `${base}/USD`]; 
            let spotSymbol = undefined;
            let hasSpot = false;

            for (const s of spotSymbolCandidates) {
                if (exchange.markets[s] && spotMarkets.has(base)) {
                    spotSymbol = s;
                    hasSpot = true;
                    break;
                }
            }

            let spread: number | undefined;
            if (hasSpot && spotSymbol) {
                const spotTicker = tickers[spotSymbol] as Ticker | undefined;
                const spotPrice = spotTicker?.last || spotTicker?.close || 0;
                if (spotPrice > 0) {
                    spread = ((perpPrice - spotPrice) / spotPrice) * 100;
                }
            }

            // Success: Push Opportunity
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
                spotSymbol: spotSymbol,
                perpSymbol: symbol,
            });
        } catch (err) {
            console.warn(`Warning: Failed to process ${symbol}:`, (err as Error).message);
        }
    }

    opportunities.sort((a, b) => b.apr - a.apr);

    const candidates = opportunities.slice(0, HISTORY_LIMIT_PER_SCAN);

    console.log(`🔍 Fetching history for top ${candidates.length} candidates...`);

    for (const opp of candidates) {
        try {
            const history = await exchange.fetchFundingRateHistory(opp.symbol, undefined, 72);
            
            if (history && history.length > 0) {
                opp.history = history.map((h: any) => ({
                    rate: h.fundingRate,
                    timestamp: h.timestamp,
                }));

                const rates = history.map((h: any) => h.fundingRate);
                const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;
                opp.averageApr3d = avgRate * FUNDING_PERIODS_PER_DAY * 365 * 100;
            }
        } catch (err) {
            console.warn(`Could not fetch history for ${opp.symbol}:`, (err as Error).message);
        }
    }

    // Filter out opportunities with 3-day average APR below threshold
    const filteredOpportunities = opportunities.filter(opp => {
        if (opp.averageApr3d === undefined) {
            // Filter out opportunities without history
            console.log(`🚫 Filtering ${opp.symbol}: No 3D history data`);
            return false;
        }
        if (opp.averageApr3d < MIN_AVERAGE_3D_APR) {
            console.log(`🚫 Filtering ${opp.symbol}: 3D avg APR ${opp.averageApr3d.toFixed(2)}% < ${MIN_AVERAGE_3D_APR}%`);
            return false;
        }
        return true;
    });

    console.log(`📊 Filtered ${opportunities.length} → ${filteredOpportunities.length} opportunities (3D avg APR >= ${MIN_AVERAGE_3D_APR}%)`);

    return filteredOpportunities.slice(0, 50);
}

// Global state to control worker
let harvesterShouldRun = true;

export function stopHarvester() {
    console.log('🛑 Stopping harvester...');
    harvesterShouldRun = false;
}

export async function startHarvester() {
    console.log('🚀 Hyperliquid Scanner starting...');
    harvesterShouldRun = true;

    const exchange = new ccxt.hyperliquid({
        enableRateLimit: true,
    });

    console.log('📊 Loading Hyperliquid markets...');
    await exchange.loadMarkets();
    console.log(`✅ Loaded ${Object.keys(exchange.markets).length} markets`);

    while (harvesterShouldRun) {
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
            console.error('❌ Scan error:', (error as Error).message);
        }

        console.log(`⏳ Next scan in ${SCAN_INTERVAL_MS / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, SCAN_INTERVAL_MS));
    }
}
