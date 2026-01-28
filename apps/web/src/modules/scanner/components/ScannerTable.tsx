import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Opportunity {
    _id: string;
    symbol: string;
    exchangeId: string;
    price: number;
    fundingRate: number;
    apr: number;
    volume24h: number;
    url?: string;
    timestamp: number;
}

type SortKey = "symbol" | "price" | "fundingRate" | "apr" | "volume24h";
type SortDirection = "asc" | "desc";

export default function ScannerTable() {
    const opportunitiesData = useQuery(api.scanner.getOpportunities, {});
    const [sortKey, setSortKey] = useState<SortKey>("apr");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    // Sort opportunities based on current sort state
    const opportunities = useMemo(() => {
        if (!opportunitiesData) return undefined;

        const sorted = [...opportunitiesData].sort((a, b) => {
            let aVal = a[sortKey];
            let bVal = b[sortKey];

            // Handle string comparison for symbol
            if (sortKey === "symbol") {
                return sortDirection === "asc"
                    ? String(aVal).localeCompare(String(bVal))
                    : String(bVal).localeCompare(String(aVal));
            }

            // Numeric comparison
            const numA = Number(aVal);
            const numB = Number(bVal);
            return sortDirection === "asc" ? numA - numB : numB - numA;
        });

        return sorted;
    }, [opportunitiesData, sortKey, sortDirection]);

    // Handle column header click
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            // Toggle direction if same column
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            // New column - default to descending for numbers, ascending for symbol
            setSortKey(key);
            setSortDirection(key === "symbol" ? "asc" : "desc");
        }
    };

    // Render sort icon
    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortKey !== column) {
            return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
        }
        return sortDirection === "asc"
            ? <ArrowUp className="ml-2 h-4 w-4" />
            : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    // Format currency
    const formatCurrency = (value: number) => {
        if (value >= 1_000_000_000) {
            return `$${(value / 1_000_000_000).toFixed(2)}B`;
        } else if (value >= 1_000_000) {
            return `$${(value / 1_000_000).toFixed(2)}M`;
        } else if (value >= 1_000) {
            return `$${(value / 1_000).toFixed(2)}K`;
        }
        return `$${value.toFixed(2)}`;
    };

    // Get latest timestamp from data
    const latestTimestamp = opportunities && opportunities.length > 0
        ? new Date(opportunities[0].timestamp).toLocaleTimeString()
        : null;

    // Loading state
    if (opportunities === undefined) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Funding Rate Opportunities</CardTitle>
                    <CardDescription>Loading market data...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            Funding Rate Opportunities
                        </CardTitle>
                        <CardDescription>
                            Top arbitrage opportunities sorted by annual yield.
                            {latestTimestamp && (
                                <span className="ml-2 text-green-600 font-medium">
                                    • Updated {latestTimestamp}
                                </span>
                            )}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            Live
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead
                                className="cursor-pointer select-none hover:bg-muted/50"
                                onClick={() => handleSort("symbol")}
                            >
                                <div className="flex items-center">
                                    Pair
                                    <SortIcon column="symbol" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="text-right cursor-pointer select-none hover:bg-muted/50"
                                onClick={() => handleSort("price")}
                            >
                                <div className="flex items-center justify-end">
                                    Price
                                    <SortIcon column="price" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="text-right cursor-pointer select-none hover:bg-muted/50"
                                onClick={() => handleSort("fundingRate")}
                            >
                                <div className="flex items-center justify-end">
                                    Funding (8h)
                                    <SortIcon column="fundingRate" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="text-right cursor-pointer select-none hover:bg-muted/50"
                                onClick={() => handleSort("apr")}
                            >
                                <div className="flex items-center justify-end">
                                    APR
                                    <SortIcon column="apr" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="text-right cursor-pointer select-none hover:bg-muted/50"
                                onClick={() => handleSort("volume24h")}
                            >
                                <div className="flex items-center justify-end">
                                    24h Volume
                                    <SortIcon column="volume24h" />
                                </div>
                            </TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {opportunities.map((item: Opportunity) => (
                            <TableRow
                                key={item._id}
                                className={cn(
                                    "transition-colors",
                                    item.apr >= 50 && "bg-green-50 hover:bg-green-100"
                                )}
                            >
                                <TableCell className="font-bold font-mono">{item.symbol}</TableCell>
                                <TableCell className="text-right font-mono">
                                    ${item.price.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: item.price < 1 ? 6 : 2
                                    })}
                                </TableCell>
                                <TableCell className={cn(
                                    "text-right font-mono",
                                    item.fundingRate > 0 ? "text-green-600" : "text-red-600"
                                )}>
                                    {item.fundingRate > 0 ? "+" : ""}{(item.fundingRate * 100).toFixed(4)}%
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge
                                        variant={item.apr >= 50 ? "default" : "secondary"}
                                        className={cn(
                                            "font-mono font-bold",
                                            item.apr >= 50
                                                ? "bg-green-600 hover:bg-green-700"
                                                : item.apr >= 20
                                                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                                    : ""
                                        )}
                                    >
                                        {item.apr.toFixed(2)}%
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground font-mono">
                                    {formatCurrency(item.volume24h)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 h-8"
                                        asChild
                                    >
                                        <a
                                            href={`https://www.bybit.com/trade/usdt/${item.symbol.replace('/', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Trade
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {opportunities.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                                    <div className="flex flex-col items-center gap-2">
                                        <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
                                        <p>Waiting for harvester to populate data...</p>
                                        <p className="text-xs">Run <code className="bg-muted px-1 py-0.5 rounded">npm run harvester</code> in the server folder</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
