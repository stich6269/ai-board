import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import keysRouter from './routes/keys.js';
import marketsRouter from './routes/markets.js';
import { startHarvester, stopHarvester } from './workers/harvester.worker.js';
import { startLiquidityWorker, stopLiquidityWorker } from './workers/liquidity.worker.js';
import { startWickHunter, stopWickHunter } from './workers/wick-hunter.worker.js';
import { WebSocketServer } from 'ws';
import { telemetry } from './lib/telemetry.js';

// Worker state management
let harvesterRunning = false;
let liquidityWorkerRunning = false;
let wickHunterRunning = false;
let harvesterProcess: any = null;
let liquidityWorkerProcess: any = null;
let wickHunterProcess: any = null;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Worker control routes
app.get('/api/workers/status', (req, res) => {
    try {
        res.json({
            harvester: {
                running: harvesterRunning,
                process: !!harvesterProcess
            },
            liquidityWorker: {
                running: liquidityWorkerRunning,
                process: !!liquidityWorkerProcess
            },
            wickHunter: {
                running: wickHunterRunning,
                process: !!wickHunterProcess
            }
        });
    } catch (err: any) {
        console.error('Status endpoint error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/workers/harvester/start', (req, res) => {
    if (harvesterRunning) {
        return res.json({ success: false, message: 'Harvester already running' });
    }

    harvesterRunning = true;
    startHarvester().then(() => {
        harvesterProcess = { started: Date.now() };
        console.log('✅ Harvester started manually');
    }).catch(err => {
        harvesterRunning = false;
        console.error('❌ Harvester failed to start:', err);
        return res.status(500).json({ success: false, error: err.message });
    });

    res.json({ success: true, message: 'Harvester started' });
});

app.post('/api/workers/harvester/stop', (req, res) => {
    if (!harvesterRunning) {
        return res.json({ success: false, message: 'Harvester not running' });
    }

    stopHarvester();
    harvesterRunning = false;
    harvesterProcess = null;
    console.log('🛑 Harvester stopped manually');
    res.json({ success: true, message: 'Harvester stopped' });
});

app.post('/api/workers/liquidity/start', (req, res) => {
    if (liquidityWorkerRunning) {
        return res.json({ success: false, message: 'Liquidity worker already running' });
    }

    liquidityWorkerRunning = true;
    startLiquidityWorker().then(() => {
        liquidityWorkerProcess = { started: Date.now() };
        console.log('✅ Liquidity worker started manually');
    }).catch(err => {
        liquidityWorkerRunning = false;
        console.error('❌ Liquidity worker failed to start:', err);
        return res.status(500).json({ success: false, error: err.message });
    });

    res.json({ success: true, message: 'Liquidity worker started' });
});

app.post('/api/workers/liquidity/stop', (req, res) => {
    if (!liquidityWorkerRunning) {
        return res.json({ success: false, message: 'Liquidity worker not running' });
    }

    stopLiquidityWorker();
    liquidityWorkerRunning = false;
    liquidityWorkerProcess = null;
    console.log('🛑 Liquidity worker stopped manually');
    res.json({ success: true, message: 'Liquidity worker stopped' });
});

app.post('/api/workers/wick-hunter/start', (req, res) => {
    if (wickHunterRunning) {
        return res.json({ success: false, message: 'Wick Hunter already running' });
    }

    wickHunterRunning = true;
    startWickHunter().then(() => {
        wickHunterProcess = { started: Date.now() };
        console.log('✅ Wick Hunter started manually');
    }).catch(err => {
        wickHunterRunning = false;
        console.error('❌ Wick Hunter failed to start:', err);
        return res.status(500).json({ success: false, error: err.message });
    });

    res.json({ success: true, message: 'Wick Hunter started' });
});

app.post('/api/workers/wick-hunter/stop', (req, res) => {
    if (!wickHunterRunning) {
        return res.json({ success: false, message: 'Wick Hunter not running' });
    }

    stopWickHunter();
    wickHunterRunning = false;
    wickHunterProcess = null;
    console.log('🛑 Wick Hunter stopped manually');
    res.json({ success: true, message: 'Wick Hunter stopped' });
});

// Routes
app.use('/api/keys', keysRouter);
app.use('/api/markets', marketsRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: err.message || 'Internal server error'
    });
});

app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔧 Worker control: http://localhost:${PORT}/api/workers/status`);

    // Start Watcher Loop (Poll every 5s)

    // Initialize WebSocket Server
    const WSS_PORT = 3002;
    const wss = new WebSocketServer({ port: WSS_PORT });
    console.log(`📡 Telemetry Stream running on ws://localhost:${WSS_PORT}`);

    wss.on('connection', (ws: any) => {
        ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to Wick Hunter Telemetry' }));
    });

    telemetry.on('tick', (data) => {
        const msg = JSON.stringify({ type: 'tick', data });
        wss.clients.forEach((client: any) => {
            if (client.readyState === 1) {
                client.send(msg);
            }
        });
    });

    setInterval(async () => {
        try {
            const { ConvexHttpClient } = await import('convex/browser');
            const { api } = await import('../../../convex/_generated/api.js');

            const convexUrl = process.env.CONVEX_URL;
            if (!convexUrl) return;

            const client = new ConvexHttpClient(convexUrl);
            const config = await client.query(api.wick.getConfig, { userId: "default" });

            if (config) {
                // Auto-Start worker if not running
                if (!wickHunterRunning) {
                    console.log('🔪 Starting Wick Hunter worker...');
                    wickHunterRunning = true;
                    startWickHunter().then(() => {
                        wickHunterProcess = { started: Date.now() };
                        console.log('✅ Wick Hunter worker started via Watcher');
                    }).catch(err => {
                        wickHunterRunning = false;
                        console.error('❌ Failed to start worker (Watcher):', err.message);
                    });
                }
                // Note: Worker continues running even when config.isRunning is false
                // Engine checks isRunning before opening positions
            }
        } catch (err) {
            // console.error('Watcher Error:', err);
        }
    }, 5000); // 5 seconds poll

    console.log('👀 Config Watcher started (5s interval)');
});
