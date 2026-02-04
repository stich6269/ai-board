import WebSocket from 'ws';

export interface NetworkConfig {
    wsUrl: string;
    symbol: string;
}

export type TradeData = {
    price: number;
    size: number;
    time: number;
};

export type TradeHandler = (trades: TradeData[]) => void;

export class NetworkLayer {
    private ws: WebSocket | null = null;
    private pingInterval: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;
    private config: NetworkConfig;
    private onTrades: TradeHandler;

    constructor(config: NetworkConfig, onTrades: TradeHandler) {
        this.config = config;
        this.onTrades = onTrades;
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.connect();
    }

    public stop() {
        this.isRunning = false;
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    private connect() {
        if (!this.isRunning) return;

        this.ws = new WebSocket(this.config.wsUrl, {
            perMessageDeflate: false,
            skipUTF8Validation: true,
            handshakeTimeout: 5000
        });

        this.ws.on('open', () => {
            console.log(`🌐 WHE WebSocket CONNECTED to ${this.config.wsUrl}`);
            this.pingInterval = setInterval(() => {
                if (this.ws && (this.ws as any).readyState === 1) {
                    this.ws.send(JSON.stringify({ method: "ping" }));
                }
            }, 30000);
            this.subscribe();
        });

        this.ws.on('message', (data: Buffer) => {
            this.handleMessage(data);
        });

        this.ws.on('error', (err) => {
            console.error('WHE WS Error:', err);
        });

        this.ws.on('close', () => {
            if (this.pingInterval) {
                clearInterval(this.pingInterval);
                this.pingInterval = null;
            }
            if (this.isRunning) {
                console.log('WHE WS Disconnected. Reconnecting...');
                setTimeout(() => this.connect(), 1000);
            }
        });
    }

    private subscribe() {
        if (!this.ws) return;
        const coin = this.config.symbol.split('/')[0];
        const msg = {
            method: "subscribe",
            subscription: { type: "trades", coin: coin }
        };
        console.log(`📡 WHE Subscribing to trades for: ${coin}`);
        this.ws.send(JSON.stringify(msg));
    }

    private handleMessage(data: Buffer) {
        try {
            const msg = JSON.parse(data.toString());

            if (msg.channel === 'subscriptionResponse') {
                console.log(`✅ WHE Subscription confirmed:`, JSON.stringify(msg));
            }

            if (msg.channel === 'trades') {
                const trades: TradeData[] = msg.data.map((trade: any) => ({
                    price: parseFloat(trade.px),
                    size: parseFloat(trade.sz),
                    time: trade.time
                }));
                if (trades.length > 0) {
                    console.log(`📥 WHE Received ${trades.length} trades, price: ${trades[0].price}`);
                }
                this.onTrades(trades);
            }
        } catch (e) {
            console.error('WHE Parse Error:', e);
        }
    }
}
