import ccxt from 'ccxt';
import { convexClient } from '../lib/convexClient.js';
import { api } from '../../../../convex/_generated/api.js';

// Global state to control worker
let liquidityWorkerShouldRun = true;

async function getExchange() {
    try {
        const keys = await convexClient.query(api.keys.listWallets);
        
        if (!keys || keys.length === 0) {
            console.log("⚠️ No wallet configured for Hyperliquid");
            return null;
        }

        const key = keys[0];
        console.log(`✅ Wallet found: ${key.walletAddress.slice(0, 6)}...${key.walletAddress.slice(-4)}`);

        return new ccxt.hyperliquid({
            walletAddress: key.walletAddress,
            privateKey: key.privateKey,
            enableRateLimit: true,
        });
    } catch (err: any) {
        console.error("Failed to get exchange:", err.message);
        return null;
    }
}

async function fetchBalanceLoop() {
    console.log("💰 Balance Monitor Started...");
    while (liquidityWorkerShouldRun) {
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

            await convexClient.mutation(api.liquidity.updateBalance, {
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

async function checkLiquidity(exchange: any, symbol: string, amountUsd: number, side: 'buy' | 'sell') {
    const orderbook = await exchange.fetchOrderBook(symbol);
    const levels = side === 'buy' ? orderbook.asks : orderbook.bids;

    if (!levels || levels.length === 0) {
        return { canTrade: false, entryPrice: 0, worstPrice: 0, accumulatedVolumeUsd: 0 };
    }

    const entryPrice = levels[0][0];
    const maxSlippagePrice = side === 'buy'
        ? entryPrice * 1.01
        : entryPrice * 0.99;

    let accumulatedVolumeUsd = 0;
    let worstPrice = entryPrice;

    for (const level of levels) {
        const price = level[0];
        const amount = level[1];

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
        accumulatedVolumeUsd,
    };
}

async function processOp(exchange: any, op: any) {
    console.log(`\n🔄 Processing Op ${op._id} for ${op.symbol}`);

    const spotSymbol = op.symbol.replace('-PERP', '/USDC');
    const perpSymbol = op.symbol.includes('-PERP') ? op.symbol : `${op.symbol}-PERP`;

    const spotMarket = exchange.markets[spotSymbol];
    const perpMarket = exchange.markets[perpSymbol];

    if (!spotMarket || !perpMarket) {
        console.error(`❌ Markets not found: spot=${!!spotMarket}, perp=${!!perpMarket}`);
        await convexClient.mutation(api.liquidity.updateOpStatus, {
            opId: op._id,
            status: "FAILED",
            error: "Markets not found on Hyperliquid",
        });
        return;
    }

    const spotLiq = await checkLiquidity(exchange, spotSymbol, op.spotAmountUsd, 'buy');
    const perpLiq = await checkLiquidity(exchange, perpSymbol, op.perpAmountUsd, 'sell');

    if (!spotLiq.canTrade || !perpLiq.canTrade) {
        console.error(`❌ Insufficient liquidity: spot=${spotLiq.canTrade}, perp=${perpLiq.canTrade}`);
        await convexClient.mutation(api.liquidity.updateOpStatus, {
            opId: op._id,
            status: "FAILED",
            error: "Insufficient liquidity",
        });
        return;
    }

    console.log(`✅ Liquidity OK | Spot: $${spotLiq.accumulatedVolumeUsd.toFixed(2)} | Perp: $${perpLiq.accumulatedVolumeUsd.toFixed(2)}`);

    try {
        const spotOrder = await exchange.createMarketBuyOrder(spotSymbol, op.spotAmountUsd / spotLiq.entryPrice);
        console.log(`✅ Spot BUY executed: ${spotOrder.id}`);

        const perpOrder = await exchange.createMarketSellOrder(perpSymbol, op.perpAmountUsd / perpLiq.entryPrice);
        console.log(`✅ Perp SELL executed: ${perpOrder.id}`);

        await convexClient.mutation(api.liquidity.updateOpStatus, {
            opId: op._id,
            status: "COMPLETED",
            spotOrderId: spotOrder.id,
            perpOrderId: perpOrder.id,
        });

        console.log(`🎉 Operation ${op._id} completed successfully!`);
    } catch (err: any) {
        console.error(`❌ Order execution failed:`, err.message);

        try {
            const exchange2 = await getExchange();
            if (exchange2) {
                const spotSymbolRollback = spotSymbol.replace('/USDC', '/USDC');
                await exchange2.createMarketSellOrder(spotSymbolRollback, op.spotAmountUsd / spotLiq.entryPrice);
                console.log(`🔄 Rollback: Sold spot position`);
            }
        } catch (rollbackErr: any) {
            console.error(`❌ Rollback failed:`, rollbackErr.message);
        }

        await convexClient.mutation(api.liquidity.updateOpStatus, {
            opId: op._id,
            status: "FAILED",
            error: err.message,
        });
    }
}

async function processOpsLoop() {
    console.log("🔧 Liquidity Ops Processor Started...");
    while (liquidityWorkerShouldRun) {
        try {
            const exchange = await getExchange();
            if (!exchange) {
                console.log("⏳ No exchange, waiting...");
                await new Promise(r => setTimeout(r, 10000));
                continue;
            }

            const pendingOps = await convexClient.query(api.liquidity.getPendingOps);

            if (pendingOps && pendingOps.length > 0) {
                console.log(`📋 Found ${pendingOps.length} pending operations`);
                for (const op of pendingOps) {
                    await processOp(exchange, op);
                }
            }

            await new Promise(r => setTimeout(r, 5000));
        } catch (err: any) {
            console.error("Ops Loop Error:", err.message);
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}

export function stopLiquidityWorker() {
    console.log('🛑 Stopping liquidity worker...');
    liquidityWorkerShouldRun = false;
}

export async function startLiquidityWorker() {
    console.log("💧 Liquidity Worker Started...");
    liquidityWorkerShouldRun = true;
    
    fetchBalanceLoop().catch(err => {
        console.error("Balance loop crashed:", err);
    });

    processOpsLoop().catch(err => {
        console.error("Ops loop crashed:", err);
    });
}
