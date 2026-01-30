import { Worker } from 'worker_threads';
import { randomUUID } from 'crypto';
import { createRequire } from 'module';
import path from 'path';

interface PendingRequest {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timestamp: number;
}

export class SigningService {
    private worker: Worker | null = null;
    private pendingRequests: Map<string, PendingRequest> = new Map();
    private privateKey: string;
    private workerPath: string;

    constructor(privateKey: string) {
        this.privateKey = privateKey;
        // Always use the JS worker to avoid loader issues
        this.workerPath = new URL('../workers/signing.worker.js', import.meta.url).pathname;
    }

    public async start() {
        if (this.worker) return;

        // No execArgv needed for .js file in type: module package
        this.worker = new Worker(this.workerPath, {
            workerData: { privateKey: this.privateKey }
        });

        this.worker.on('message', (message: any) => {
            const { id, success, signature, error } = message;
            const request = this.pendingRequests.get(id);

            if (request) {
                if (success) {
                    request.resolve(signature);
                } else {
                    request.reject(new Error(error));
                }
                this.pendingRequests.delete(id);
            }
        });

        this.worker.on('error', (err) => {
            console.error('Signing Worker Error:', err);
            // Optionally restart worker
        });

        this.worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Signing Worker stopped with exit code ${code}`);
            }
            this.worker = null;
        });

        console.log('✅ Signing Service started');
    }

    public async stop() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
    }

    public async signTypeData(domain: any, types: any, value: any): Promise<string> {
        return this.sendRequest('signTypeData', { domain, types, value });
    }

    public async signMessage(message: string | Uint8Array): Promise<string> {
        return this.sendRequest('signMessage', message);
    }

    private sendRequest(type: string, payload: any): Promise<string> {
        if (!this.worker) {
            throw new Error('Signing Service not started');
        }

        const id = randomUUID();
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject, timestamp: Date.now() });
            this.worker!.postMessage({ id, type, payload });

            // Timeout
            setTimeout(() => {
                const req = this.pendingRequests.get(id);
                if (req) {
                    req.reject(new Error('Signing timeout'));
                    this.pendingRequests.delete(id);
                }
            }, 5000);
        });
    }
}
