import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api.js';

const CONVEX_URL = process.env.CONVEX_URL;

if (!CONVEX_URL) {
    throw new Error('CONVEX_URL environment variable is required');
}

export const convexClient = new ConvexHttpClient(CONVEX_URL);

// Helper to save validated key to Convex
export async function saveKeyToConvex(data: {
    exchangeId: string;
    apiKey: string;
    secretKey: string;
    label: string;
}) {
    return await convexClient.mutation(api.keys.saveKey, data);
}

// Helper to save scan results to Convex
export async function saveScanResultsToConvex(data: {
    exchangeId: string;
    results: any[];
}) {
    return await convexClient.mutation(api.scanResults.saveScanResults, data);
}

// Helper to update opportunities (called by harvester)
export async function updateOpportunitiesToConvex(data: {
    symbol: string;
    exchangeId: string;
    price: number;
    fundingRate: number;
    apr: number;
    volume24h: number;
    url?: string;
    timestamp: number;
}[]) {
    return await convexClient.mutation(api.scanner.updateOpportunities, { data });
}

