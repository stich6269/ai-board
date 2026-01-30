import { convexClient } from '../lib/convexClient.js';
import { api } from '../../../../convex/_generated/api.js';
import { WickHunterEngine } from '../modules/wick-hunter/engine.js';

let engine: WickHunterEngine | null = null;
let shouldRun = false;

export async function stopWickHunter() {
    console.log('🛑 Stopping Wick Hunter...');
    shouldRun = false;
    if (engine) {
        await engine.stop();
        engine = null;
    }
}

export async function startWickHunter() {
    console.log('🔪 Wick Hunter starting (New Module)...');
    shouldRun = true;

    try {
        // 1. Get Wallet
        const key = await convexClient.query(api.keys.getWalletForWorker);
        if (!key) {
            console.log("⚠️ No wallet configured for Hyperliquid");
            return;
        }

        let privateKey = key.privateKey;
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
        if (privateKey.startsWith('0x')) privateKey = privateKey.slice(2);

        // 2. Get Config
        const configs = await convexClient.query(api.wick.getConfigs, { userId: "default" });
        if (!configs || configs.length === 0) {
            console.log("⚠️ No Wick Config found");
            return;
        }
        const config = configs[0]; // Assuming single active config for now

        // 3. InitializeEngine
        if (engine) {
            await engine.stop();
        }

        engine = new WickHunterEngine({
            configId: config._id,
            symbol: config.symbol,
            windowSize: config.windowSize || 200,
            zScoreThreshold: config.zScoreThreshold || 3.5,
            takeProfitPercent: config.takeProfitPercent || 2.0,
            stopLossPercent: config.stopLossPercent || 5.0,
            heatmapDecay: 0.1, // Lambda
            walletPrivateKey: privateKey,
            wsUrl: 'wss://api.hyperliquid.xyz/ws',
            investmentAmount: config.investmentAmount,
            maxDcaEntries: config.maxDcaEntries ?? 1,
            dcaZScoreMultiplier: config.dcaZScoreMultiplier || 1.5,
            minMadThreshold: config.minMadThreshold || 0.001,
            minDcaPriceDeviationPercent: config.minDcaPriceDeviationPercent || 0.5,
            softTimeoutMs: config.softTimeoutMs || 30000,
            minZScoreExit: config.minZScoreExit ?? -0.3
        });

        await engine.start();
        console.log('✅ Wick Hunter Engine started');

    } catch (err: any) {
        console.error("❌ Failed to start Wick Hunter:", err.message);
        shouldRun = false;
    }
}
