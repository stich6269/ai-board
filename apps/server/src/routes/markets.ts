import { Router } from 'express';
import ccxt from 'ccxt';
import { saveScanResultsToConvex } from '../lib/convexClient.js';

const router = Router();

router.post('/scan', async (req, res) => {
    try {
        const exchange = new ccxt.hyperliquid({
            enableRateLimit: true,
        });

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

        await saveScanResultsToConvex({
            exchangeId: 'hyperliquid',
            results: topRates,
        });

        res.json({
            success: true,
            count: topRates.length,
            results: topRates,
        });

    } catch (error: any) {
        console.error('Scan error:', error);
        res.status(500).json({
            error: error.message || 'Market scan failed'
        });
    }
});

export default router;
