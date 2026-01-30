export * from "./settings-schema";
export * from "./src/math/two-heaps";
export * from "./src/math/rolling-mad";

export interface MarketOpportunity {
    symbol: string;
    fundingRate: number;
    timestamp: number;
}
