import { Router } from 'express';
import ccxt from 'ccxt';
import { saveKeyToConvex } from '../lib/convexClient.js';

const router = Router();

// POST /api/keys/validate
router.post('/validate', async (req, res) => {
    try {
        const { exchangeId, apiKey, secretKey, label } = req.body;

        // Validate input
        if (!exchangeId || !apiKey || !secretKey || !label) {
            return res.status(400).json({
                error: 'Missing required fields: exchangeId, apiKey, secretKey, label'
            });
        }

        // Instantiate exchange
        const exchangeClass = (ccxt as any)[exchangeId];
        if (!exchangeClass) {
            return res.status(400).json({
                error: `Exchange ${exchangeId} not supported`
            });
        }

        const exchange = new exchangeClass({
            apiKey,
            secret: secretKey,
        });

        // Bybit-specific hostname bypass
        if (exchangeId === 'bybit') {
            exchange.hostname = 'bytick.com';
        }

        // Test connection
        await exchange.fetchBalance();

        // Save to Convex
        await saveKeyToConvex({
            exchangeId,
            apiKey,
            secretKey,
            label,
        });

        res.json({
            success: true,
            message: 'API key validated and saved successfully'
        });

    } catch (error: any) {
        console.error('Validation error:', error);

        // User-friendly error messages
        if (error.message?.includes('403')) {
            return res.status(403).json({
                error: 'API access forbidden. Please check your API key permissions.'
            });
        }

        if (error.message?.includes('401') || error.message?.includes('authentication')) {
            return res.status(401).json({
                error: 'Invalid API credentials. Please check your API key and secret.'
            });
        }

        res.status(500).json({
            error: error.message || 'Validation failed'
        });
    }
});

export default router;
