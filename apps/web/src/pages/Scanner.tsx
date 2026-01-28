import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Activity, Zap } from "lucide-react";
import ScannerTable from "@/modules/scanner/components/ScannerTable";

export default function Scanner() {
    const opportunities = useQuery(api.scanner.getOpportunities, {});

    // Calculate stats
    const stats = React.useMemo(() => {
        if (!opportunities || opportunities.length === 0) {
            return {
                topApr: null,
                topSymbol: null,
                avgApr: null,
                count: 0,
            };
        }

        const totalApr = opportunities.reduce((sum, o) => sum + o.apr, 0);
        return {
            topApr: opportunities[0].apr,
            topSymbol: opportunities[0].symbol,
            avgApr: totalApr / opportunities.length,
            count: opportunities.length,
        };
    }, [opportunities]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Market Scanner</h1>
                <p className="text-muted-foreground">
                    Real-time funding rate opportunities from Bybit, auto-updated every 60 seconds.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Opportunity</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.topSymbol || "-"}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.topApr ? `${stats.topApr.toFixed(2)}% APR` : "No data"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Best APR</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {stats.topApr ? `${stats.topApr.toFixed(2)}%` : "-"}
                        </div>
                        <p className="text-xs text-muted-foreground">Annualized yield</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average APR</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.avgApr ? `${stats.avgApr.toFixed(2)}%` : "-"}
                        </div>
                        <p className="text-xs text-muted-foreground">Across all opportunities</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.count}</div>
                        <p className="text-xs text-muted-foreground">Matching criteria</p>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <ScannerTable />
        </div>
    );
}
