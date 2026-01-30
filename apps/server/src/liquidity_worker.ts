import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api.js";
import 'dotenv/config';
import ccxt from "ccxt";

const CONVEX_URL = process.env.CONVEX_URL || "";
if (!CONVEX_URL) {
    console.error("❌ CONVEX_URL is missing.");
    process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

/**
 * Atomic Liquidity Worker
 * Polls for PENDING operations and executes them safely.
 */
async function run() {
    console.log("💧 Liquidity Worker Started...");

    // Start Balance Loop concurrently
    fetchBalanceLoop().catch(err => console.error("Balance Loop Fatal Error:", err));

    while (true) {
        try {
            const pendingOps = await convex.query(api.liquidity.getPendingOps);

            for (const op of pendingOps) {
                await processOp(op);
            }

            // Sleep 1s
            await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (err) {
            console.error("Worker Loop Error:", err);
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
}

async function getExchange() {
    try {
        console.log(`🔍 Fetching wallet for Hyperliquid...`);
        const wallet = await convex.query(api.keys.getWallet);
        if (!wallet) {
            console.warn(`⚠️ No wallet found in DB`);
            return null;
        }

        console.log(`✅ Wallet found: ${wallet.walletAddress.slice(0, 6)}...${wallet.walletAddress.slice(-4)}`);

        const exchange = new ccxt.hyperliquid({
            walletAddress: wallet.walletAddress,
            privateKey: wallet.privateKey,
            enableRateLimit: true,
        });

        await exchange.loadMarkets();

        return exchange;
    } catch (err: any) {
        console.error(`❌ Error initializing Hyperliquid:`, err.message);
        return null;
    }
}

async function fetchBalanceLoop() {
    console.log("💰 Balance Monitor Started...");
    while (true) {
        try {
            const exchange = await getExchange();
            let total = 0;
            let free = 0;

            if (!exchange) {
                console.log("ℹ️ Using MOCK balance (no wallet).");
                total = 5240.50;
                free = 5240.50;
            } else {
                console.log("📡 Fetching real balance from Hyperliquid...");
                const bal = await exchange.fetchBalance();
                
                console.log("📥 Balance structure analysis:");
                console.log("  - Type of bal:", typeof bal);
                console.log("  - Keys:", Object.keys(bal).join(", "));
                
                if (bal.info && bal.info.balances) {
                    console.log("  - Found info.balances:", bal.info.balances);
                }
                
                if (bal.USDC) {
                    console.log("  - USDC value:", bal.USDC);
                    console.log("  - USDC type:", typeof bal.USDC);
                }
                
                if (bal.total) {
                    console.log("  - Total value:", bal.total);
                }
                
                if (bal.free) {
                    console.log("  - Free value:", bal.free);
                }

                // Parse Hyperliquid balance structure
                // CCXT standardizes to: { USDC: { free, used, total }, free: {...}, used: {...}, total: {...} }
                const balAny = bal as any;
                
                if (balAny.USDC && typeof balAny.USDC === 'object' && 'total' in balAny.USDC) {
                    total = parseFloat(String(balAny.USDC.total || 0));
                    free = parseFloat(String(balAny.USDC.free || 0));
                    console.log(`💰 Parsed from USDC object: Total=${total}, Free=${free}`);
                } else if (balAny.total && typeof balAny.total === 'object' && balAny.total.USDC) {
                    total = parseFloat(String(balAny.total.USDC || 0));
                    free = parseFloat(String(balAny.free?.USDC || balAny.total.USDC || 0));
                    console.log(`💰 Parsed from total.USDC: Total=${total}, Free=${free}`);
                } else if (balAny.info?.balances) {
                    const usdcBalance = balAny.info.balances.find((b: any) => 
                        b.coin === 'USDC' || b.currency === 'USDC' || b.asset === 'USDC'
                    );
                    if (usdcBalance) {
                        total = parseFloat(String(usdcBalance.total || usdcBalance.balance || usdcBalance.amount || 0));
                        free = parseFloat(String(usdcBalance.free || usdcBalance.available || total));
                        console.log(`💰 Parsed from info.balances: Total=${total}, Free=${free}`);
                    }
                } else {
                    console.log("⚠️ Could not parse balance, dumping full structure:");
                    console.log(JSON.stringify(bal, null, 2));
                }

                console.log(`💵 Final Balance: Total=$${total}, Available=$${free}`);
            }

            await convex.mutation(api.liquidity.updateBalance, {
                exchangeId: "hyperliquid",
                totalUsd: total,
                availableUsd: free
            });

            await new Promise(r => setTimeout(r, 60000));
        } catch (err: any) {
            console.error("Balance Fetch Error:", err.message);
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}

/**
 * Check if orderbook has enough liquidity within 1% of best price.
 * Returns { canTrade: boolean, entryPrice: number, worstPrice: number }
 */
async function checkLiquidity(exchange: any, symbol: string, amountUsd: number, side: 'buy' | 'sell') {
    const orderbook = await exchange.fetchOrderBook(symbol);
    const levels = side === 'buy' ? orderbook.asks : orderbook.bids;

    if (!levels || levels.length === 0) {
        return { canTrade: false, entryPrice: 0, worstPrice: 0, reason: "Empty orderbook" };
    }

    const entryPrice = levels[0][0];
    const maxSlippagePrice = side === 'buy'
        ? entryPrice * 1.01  // Max 1% above for buys
        : entryPrice * 0.99; // Max 1% below for sells

    let accumulatedVolumeUsd = 0;
    let worstPrice = entryPrice;

    for (const level of levels) {
        const price = level[0];
        const amount = level[1];

        // Stop if price exceeds 1% slippage
        if (side === 'buy' && price > maxSlippagePrice) break;
        if (side === 'sell' && price < maxSlippagePrice) break;

        accumulatedVolumeUsd += price * amount;
        worstPrice = price;

        if (accumulatedVolumeUsd >= amountUsd) {
            return { canTrade: true, entryPrice, worstPrice, accumulatedVolumeUsd };
        }
    }

    return {
        canTrade: false,
        entryPrice,
        worstPrice,
        reason: `Insufficient liquidity: only $${accumulatedVolumeUsd.toFixed(2)} available within 1%`
    };
}

/**
 * Execute an aggressive limit order (IOC) - behaves like market but with price protection.
 */
async function executeAggressiveLimitOrder(
    exchange: any,
    symbol: string,
    side: 'buy' | 'sell',
    amountUsd: number,
    entryPrice: number,
    isPerp: boolean = false
): Promise<{ orderId: string; filledAmount: number; avgPrice: number }> {
    // Calculate coin amount from USD
    const coinAmount = amountUsd / entryPrice;

    // Set limit price 1% worse than current (aggressive limit)
    const limitPrice = side === 'buy'
        ? entryPrice * 1.01
        : entryPrice * 0.99;

    // For perps, we need to set the position side
    const params: any = {
        timeInForce: 'IOC', // Immediate-or-Cancel
    };

    if (isPerp) {
        // Bybit linear perps
        params.positionIdx = 0; // One-way mode
    }

    const order = await exchange.createOrder(
        symbol,
        'limit',
        side,
        coinAmount,
        limitPrice,
        params
    );

    return {
        orderId: order.id,
        filledAmount: order.filled || coinAmount,
        avgPrice: order.average || entryPrice,
    };
}

async function processOp(op: any) {
    console.log(`Processing Op ${op._id} (${op.symbol})...`);
    const logs: string[] = [];

    // Helper to push logs to Convex
    const flushLogs = async (status: string, error?: string, spotId?: string, perpId?: string) => {
        await convex.mutation(api.liquidity.updateOpStatus, {
            opId: op._id,
            status,
            logs,
            error,
            spotOrderId: spotId,
            perpOrderId: perpId,
        });
    };

    let spotOrderId: string | undefined;
    let spotFilledAmount = 0;
    let spotAvgPrice = 0;

    try {
        await flushLogs("EXECUTING");

        const exchange = await getExchange();
        const isMock = !exchange;

        if (isMock) {
            logs.push("⚠️ No wallet found in database. Running in MOCK Mode.");

            // Mock execution
            logs.push(`[MOCK] Buying Spot: ${op.symbol} for $${op.spotAmountUsd}...`);
            spotOrderId = `mock_spot_${Date.now()}`;
            logs.push(`[MOCK] ✅ Spot Bought: ${spotOrderId}`);
            await flushLogs("EXECUTING", undefined, spotOrderId);

            // Simulate failure for testing
            if (op.totalAmountUsd === 666) {
                throw new Error("Simulated Perp Failure for Testing");
            }

            logs.push(`[MOCK] Shorting Perp: ${op.symbol} for $${op.perpAmountUsd}...`);
            const perpOrderId = `mock_perp_${Date.now()}`;
            logs.push(`[MOCK] ✅ Perp Shorted: ${perpOrderId}`);

            await flushLogs("COMPLETED", undefined, spotOrderId, perpOrderId);
            console.log(`Op ${op._id} COMPLETED (MOCK).`);
            return;
        }

        const base = op.symbol.split('/')[0].split(':')[0];
        const spotSymbol = `${base}/USDC`;
        const perpSymbol = op.symbol;

        logs.push(`🔍 Validating Hyperliquid markets for ${op.symbol}...`);

        if (!exchange.markets[spotSymbol]) {
            throw new Error(`Hyperliquid does not have a SPOT market for ${spotSymbol}. Arbitrage requires both Spot and Perp.`);
        }
        if (!exchange.markets[perpSymbol]) {
            throw new Error(`Hyperliquid does not have a PERP market for ${perpSymbol}.`);
        }

        // --- PRE-FLIGHT: LIQUIDITY CHECK ---
        logs.push(`🔍 Checking Spot liquidity for ${spotSymbol}...`);
        const spotLiq = await checkLiquidity(exchange, spotSymbol, op.spotAmountUsd, 'buy');
        if (!spotLiq.canTrade) {
            throw new Error(`Spot Liquidity Check Failed: ${spotLiq.reason}`);
        }
        logs.push(`✅ Spot liquidity OK: $${op.spotAmountUsd} available within 1%`);

        logs.push(`🔍 Checking Perp liquidity for ${perpSymbol}...`);
        const perpLiq = await checkLiquidity(exchange, perpSymbol, op.perpAmountUsd, 'sell');
        if (!perpLiq.canTrade) {
            throw new Error(`Perp Liquidity Check Failed: ${perpLiq.reason}`);
        }
        logs.push(`✅ Perp liquidity OK: $${op.perpAmountUsd} available within 1%`);
        await flushLogs("EXECUTING");

        // --- LEG 1: BUY SPOT (Aggressive Limit IOC) ---
        logs.push(`📈 Executing Spot Buy: ${spotSymbol} @ ~$${spotLiq.entryPrice.toFixed(4)} (limit +1%)...`);

        const spotResult = await executeAggressiveLimitOrder(
            exchange,
            spotSymbol,
            'buy',
            op.spotAmountUsd,
            spotLiq.entryPrice,
            false
        );
        spotOrderId = spotResult.orderId;
        spotFilledAmount = spotResult.filledAmount;
        spotAvgPrice = spotResult.avgPrice;

        logs.push(`✅ Spot Bought: ${spotOrderId} (${spotFilledAmount.toFixed(6)} @ $${spotAvgPrice.toFixed(4)})`);
        await flushLogs("EXECUTING", undefined, spotOrderId);

        // --- LEG 2: SHORT PERP (Aggressive Limit IOC) ---
        logs.push(`📉 Executing Perp Short: ${perpSymbol} @ ~$${perpLiq.entryPrice.toFixed(4)} (limit -1%)...`);

        const perpResult = await executeAggressiveLimitOrder(
            exchange,
            perpSymbol,
            'sell',
            op.perpAmountUsd,
            perpLiq.entryPrice,
            true
        );
        const perpOrderId = perpResult.orderId;

        logs.push(`✅ Perp Shorted: ${perpOrderId} (${perpResult.filledAmount.toFixed(6)} @ $${perpResult.avgPrice.toFixed(4)})`);

        // --- SUCCESS ---
        await flushLogs("COMPLETED", undefined, spotOrderId, perpOrderId);
        console.log(`Op ${op._id} COMPLETED.`);

    } catch (err: any) {
        console.error(`Op ${op._id} Failed:`, err);
        logs.push(`❌ Error: ${err.message}`);

        // ATOMIC ROLLBACK LOGIC
        // If Spot was bought but Perp failed, we MUST sell the Spot immediately
        if (spotOrderId && spotFilledAmount > 0) {
            logs.push("🚨 CRITICAL: Spot bought but Perp failed. Initiating ATOMIC ROLLBACK...");
            await flushLogs("ROLLBACK_IN_PROGRESS", err.message, spotOrderId);

            try {
                const rollbackExchange = await getExchange();
                if (rollbackExchange) {
                    const spotSymbol = op.symbol.replace(':USDC', '').split(':')[0];
                    logs.push(`📤 Selling ${spotFilledAmount.toFixed(6)} ${spotSymbol} at market...`);

                    const sellOrder = await rollbackExchange.createMarketSellOrder(spotSymbol, spotFilledAmount);
                    logs.push(`✅ Rollback Successful: Sold @ $${sellOrder.average?.toFixed(4) || 'N/A'} (${sellOrder.id})`);
                    await flushLogs("ROLLED_BACK", err.message, spotOrderId);
                } else {
                    throw new Error("Cannot rollback: No wallet connection");
                }
            } catch (rollbackErr: any) {
                logs.push(`💀 FATAL: Rollback Failed! ${rollbackErr.message}`);
                logs.push("⚠️ MANUAL INTERVENTION REQUIRED - You may have unhedged exposure!");
                await flushLogs("FAILED", "MANUAL_INTERVENTION_REQUIRED", spotOrderId);
            }
        } else {
            // Failed before Spot was executed, just mark as failed
            await flushLogs("FAILED", err.message);
        }
    }
}

// Start
run();
