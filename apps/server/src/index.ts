import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import keysRouter from './routes/keys.js';
import marketsRouter from './routes/markets.js';
import { startHarvester, stopHarvester } from './workers/harvester.worker.js';
import { startLiquidityWorker, stopLiquidityWorker } from './workers/liquidity.worker.js';
import { startWickHunter, stopWickHunter } from './workers/wick-hunter.worker.js';
import * as wsModule from 'ws';
const WebSocketServer = (wsModule as any).WebSocketServer || (wsModule as any).default?.WebSocketServer || (wsModule as any).default || wsModule;
import { telemetry } from './lib/telemetry.js';

// Worker state management
let harvesterRunning = false;
let liquidityWorkerRunning = false;
let wickHunterRunning = false;
let harvesterProcess: any = null;
let liquidityWorkerProcess: any = null;
let wickHunterProcess: any = null;

// Override console methods to add timestamps
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function getTimestamp() {
    return new Date().toISOString().split('T')[1].slice(0, -1);
}

console.log = function (...args) {
    originalLog(`[${getTimestamp()}]`, ...args);
};

console.error = function (...args) {
    originalError(`[${getTimestamp()}]`, ...args);
};

console.warn = function (...args) {
    originalWarn(`[${getTimestamp()}]`, ...args);
};

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

// Initial state
let wss: any = null;
let watcherInterval: NodeJS.Timeout | null = null;
let currentEngineSymbol: string | null = null;

// Graceful shutdown with aggressive fallback
const cleanup = async (signal: string) => {
    console.log(`\n🛑 ${signal} received. Cleaning up...`);

    // Force exit after 1s if cleanup hangs
    const timeout = setTimeout(() => {
        console.warn('⚠️ Cleanup taking too long, forcing exit...');
        process.exit(1);
    }, 1000);

    try {
        if (watcherInterval) clearInterval(watcherInterval);
        if (wss) wss.close();

        // Stop workers in parallel
        await Promise.allSettled([
            stopWickHunter(),
            stopHarvester(),
            stopLiquidityWorker()
        ]);

        console.log('👋 Cleaned up workers and sockets');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during cleanup:', err);
        process.exit(1);
    }
};

// Global signal handlers
process.on('SIGINT', () => cleanup('SIGINT'));
process.on('SIGTERM', () => cleanup('SIGTERM'));

const server = app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔧 Worker control: http://localhost:${PORT}/api/workers/status`);

    // Initialize WebSocket Server
    const WSS_PORT = 3002;
    wss = new WebSocketServer({ port: WSS_PORT });
    console.log(`📡 Telemetry Stream running on ws://localhost:${WSS_PORT}`);

    const clientSubscriptions = new Map<any, string>();

    wss.on('connection', (ws: any) => {
        console.log('⚡ New telemetry client connected');
        ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to Wick Hunter Telemetry' }));

        ws.on('message', (message: Buffer) => {
            try {
                const msg = JSON.parse(message.toString());
                if (msg.type === 'subscribe' && msg.symbol) {
                    clientSubscriptions.set(ws, msg.symbol);
                    console.log(`📡 Client SUBSCRIBED to symbol: ${msg.symbol}`);
                    ws.send(JSON.stringify({ type: 'welcome', symbol: msg.symbol }));
                }
            } catch (e) {
                console.error('❌ WebSocket message parse error:', e);
            }
        });

        ws.on('close', () => {
            clientSubscriptions.delete(ws);
            console.log('🔌 Telemetry client disconnected');
        });
    });

    telemetry.on('tick', (data) => {
        const msg = JSON.stringify({ type: 'tick', data });

        if (Math.random() < 0.05) {
            console.log(`📡 Telemetry BROADCAST: Symbol=${data.symbol} | Price=${data.price} | Clients=${wss.clients.size}`);
        }

        wss.clients.forEach((client: any) => {
            if (client.readyState === 1) {
                const subscribedSymbol = clientSubscriptions.get(client);
                const isMatch = !subscribedSymbol ||
                    data.symbol.toUpperCase().startsWith(subscribedSymbol.toUpperCase()) ||
                    subscribedSymbol.toUpperCase().startsWith(data.symbol.toUpperCase());

                if (isMatch) {
                    client.send(msg);
                }
            }
        });
    });

    watcherInterval = setInterval(async () => {
        try {
            const { ConvexHttpClient } = await import('convex/browser');
            const { api } = await import('../../../convex/_generated/api.js');

            const convexUrl = process.env.CONVEX_URL;
            if (!convexUrl) return;

            const client = new ConvexHttpClient(convexUrl);
            const configs = await client.query(api.wick.getConfigs, { userId: "default" });

            if (configs && configs.length > 0) {
                const runningConfig = configs.find(c => c.isRunning) || configs[0];
                const configSymbol = runningConfig.symbol.split('/')[0];

                if (wickHunterRunning && currentEngineSymbol !== configSymbol) {
                    console.log(`🔄 Active symbol changed: ${currentEngineSymbol || 'Unknown'} → ${configSymbol}, restarting engine...`);
                    await stopWickHunter();
                    wickHunterRunning = false;
                    wickHunterProcess = null;
                    currentEngineSymbol = null;
                }

                if (!wickHunterRunning) {
                    console.log(`🔪 Starting Wick Hunter worker for ${configSymbol}...`);
                    wickHunterRunning = true;
                    startWickHunter().then(() => {
                        wickHunterProcess = { started: Date.now() };
                        currentEngineSymbol = configSymbol;
                        console.log(`✅ Wick Hunter worker started for ${configSymbol}`);
                    }).catch(err => {
                        wickHunterRunning = false;
                        console.error('❌ Failed to start worker (Watcher):', err.message);
                    });
                }
            }
        } catch (err) {
            // Watcher Error
        }
    }, 5000);

    console.log('👀 Config Watcher started (5s interval)');
});

server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please kill the process manually or wait for the cleanup.`);
        process.exit(1);
    } else {
        console.error('❌ Server error:', err);
    }
});
