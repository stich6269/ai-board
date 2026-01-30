import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api.js';

const CONVEX_URL = process.env.CONVEX_URL;

if (!CONVEX_URL) {
    throw new Error('CONVEX_URL environment variable is required');
}

export const convexClient = new ConvexHttpClient(CONVEX_URL);

export async function saveWalletToConvex(data: {
    label: string;
    walletAddress: string;
    privateKey: string;
    usdcBalance?: number;
}) {
    return await convexClient.mutation(api.keys.saveWallet, data);
}

// Helper to save scan results to Convex
export async function saveScanResultsToConvex(data: {
    exchangeId: string;
    results: any[];
}) {
    return await convexClient.mutation(api.scanResults.saveScanResults, data);
}

export async function updateOpportunitiesToConvex(data: {
    symbol: string;
    exchangeId: "hyperliquid";
    price: number;
    fundingRate: number;
    apr: number;
    volume24h: number;
    url?: string;
    timestamp: number;
    history?: { rate: number; timestamp: number }[];
    averageApr3d?: number;
    tags?: string[];
    spread?: number;
    isSpotAvailable: boolean;
    spotSymbol?: string;
    perpSymbol?: string;
}[]) {
    return await convexClient.mutation(api.scanner.updateOpportunities, { data });
}

// Helper to update scanner heartbeat info
export async function updateScannerStatusToConvex(data: {
    exchangeId: string;
    instanceId: string;
    lastScanAt: number;
    nextScanAt: number;
    status: string;
    version?: string;
}) {
    return await convexClient.mutation(api.scanner.updateScannerStatus, data);
}

