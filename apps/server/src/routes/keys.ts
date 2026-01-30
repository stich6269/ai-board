import { Router } from 'express';
import ccxt from 'ccxt';
import { Wallet } from 'ethers';
import { saveWalletToConvex } from '../lib/convexClient.js';

const router = Router();

router.post('/validate', async (req, res) => {
    try {
        const { privateKey, label } = req.body;

        if (!privateKey || !label) {
            return res.status(400).json({
                error: 'Missing required fields: privateKey, label'
            });
        }

        if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
            return res.status(400).json({
                error: 'Invalid private key format. Must be 0x followed by 64 hex characters.'
            });
        }

        const wallet = new Wallet(privateKey);
        const walletAddress = wallet.address;

        const exchange = new ccxt.hyperliquid({
            walletAddress,
            privateKey,
            enableRateLimit: true,
        });

        await exchange.loadMarkets();
        const balance = await exchange.fetchBalance();
        console.log('Full balance response:', JSON.stringify(balance, null, 2));
        const usdcBalance = balance['USDC']?.total || 0;
        console.log('USDC balance extracted:', usdcBalance);

        await saveWalletToConvex({
            label,
            walletAddress,
            privateKey,
            usdcBalance,
        });

        res.json({
            success: true,
            message: 'Wallet validated and saved successfully',
            walletAddress,
            usdcBalance,
        });

    } catch (error: any) {
        console.error('Validation error:', error);

        if (error.message?.includes('invalid private key')) {
            return res.status(400).json({
                error: 'Invalid private key. Please check the format.'
            });
        }

        res.status(500).json({
            error: error.message || 'Validation failed'
        });
    }
});

export default router;
