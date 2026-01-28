import { Router } from 'express';
import ccxt from 'ccxt';
import { saveScanResultsToConvex } from '../lib/convexClient.js';

const router = Router();

// POST /api/markets/scan
router.post('/scan', async (req, res) => {
    try {
        const { exchangeId } = req.body;

        if (!exchangeId) {
            return res.status(400).json({
                error: 'Missing required field: exchangeId'
            });
        }

        // Instantiate exchange
        const exchangeClass = (ccxt as any)[exchangeId];
        if (!exchangeClass) {
            return res.status(400).json({
                error: `Exchange ${exchangeId} not found`
            });
        }

        const exchange = new exchangeClass();

        // Bybit-specific hostname bypass
        if (exchangeId === 'bybit') {
            exchange.hostname = 'bytick.com';
        }

        // Check if exchange supports funding rates
        if (!exchange.has['fetchFundingRates']) {
            return res.status(400).json({
                error: `Exchange ${exchangeId} does not support funding rates`
            });
        }

        // Load markets and fetch funding rates
        await exchange.loadMarkets();
        const rates = await exchange.fetchFundingRates();

        // Format results
        const results = Object.values(rates).map((rate: any) => ({
            symbol: rate.symbol,
            fundingRate: rate.fundingRate,
            timestamp: rate.timestamp,
            predictedFundingRate: rate.predictedFundingRate,
        }));

        // Sort by absolute funding rate
        const topRates = results
            .filter((r: any) => r.fundingRate !== undefined)
            .sort((a: any, b: any) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate))
            .slice(0, 50);

        // Save to Convex
        await saveScanResultsToConvex({
            exchangeId,
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
