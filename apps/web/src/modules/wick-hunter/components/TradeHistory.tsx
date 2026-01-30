import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { History, TrendingUp, TrendingDown, Copy } from "lucide-react";

interface Round {
    _id: string;
    symbol: string;
    buyTime: number;
    buyPrice: number;
    buyAmount: number;
    sellTime?: number;
    sellPrice?: number;
    status: string;
    finalPnL?: number;
    durationSeconds?: number;
}

interface Stats {
    totalRounds: number;
    totalPnL: number;
    winCount: number;
    lossCount: number;
    winRate: number;
}

interface TradeHistoryProps {
    rounds: Round[];
    stats: Stats;
}

export function TradeHistory({ rounds, stats }: TradeHistoryProps) {
    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins < 60) return `${mins}m ${secs}s`;
        const hours = Math.floor(mins / 60);
        return `${hours}h ${mins % 60}m`;
    };

    const copyToClipboard = async () => {
        const data = {
            stats: stats,
            rounds: rounds.map(round => ({
                id: round._id,
                symbol: round.symbol,
                buyTime: new Date(round.buyTime).toISOString(),
                buyPrice: round.buyPrice,
                buyAmount: round.buyAmount,
                sellTime: round.sellTime ? new Date(round.sellTime).toISOString() : null,
                sellPrice: round.sellPrice || null,
                status: round.status,
                finalPnL: round.finalPnL || null,
                durationSeconds: round.durationSeconds || null
            }))
        };
        
        try {
            await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            // Could add toast notification here
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-purple-600" />
                        Trade History
                    </CardTitle>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={copyToClipboard}
                            className="flex items-center gap-2"
                        >
                            <Copy className="h-4 w-4" />
                            Copy JSON
                        </Button>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Total PnL:</span>
                                <span className={cn(
                                    "font-mono font-bold",
                                    stats.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                    {stats.totalPnL >= 0 ? "+" : ""}${stats.totalPnL.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Win Rate:</span>
                                <span className={cn(
                                    "font-mono font-bold",
                                    stats.winRate >= 50 ? "text-green-600" : "text-red-600"
                                )}>
                                    {stats.winRate.toFixed(0)}%
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-green-600 font-medium">{stats.winCount}W</span>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-red-600 font-medium">{stats.lossCount}L</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="h-96 overflow-y-auto border-t">
                    <Table className="w-full sticky top-0">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Buy Price</TableHead>
                                <TableHead className="text-right">Sell Price</TableHead>
                                <TableHead className="text-right">Duration</TableHead>
                                <TableHead className="text-right">PnL</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rounds.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No trades yet. Start the bot to begin hunting wicks!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rounds.map((round) => (
                                    <TableRow key={round._id}>
                                        <TableCell className="font-mono text-sm">
                                            {new Date(round.buyTime).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="gap-1">
                                                <TrendingUp className="h-3 w-3" />
                                                Long (Wick)
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            ${round.buyPrice.toFixed(4)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {round.sellPrice ? `$${round.sellPrice.toFixed(4)}` : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">
                                            {round.durationSeconds ? formatDuration(round.durationSeconds) : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {round.status === "OPEN" ? (
                                                <Badge variant="secondary">Open</Badge>
                                            ) : (
                                                <div className={cn(
                                                    "font-mono font-bold flex items-center justify-end gap-1",
                                                    (round.finalPnL || 0) >= 0 ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {(round.finalPnL || 0) >= 0 ? (
                                                        <TrendingUp className="h-4 w-4" />
                                                    ) : (
                                                        <TrendingDown className="h-4 w-4" />
                                                    )}
                                                    {(round.finalPnL || 0) >= 0 ? "+" : ""}${(round.finalPnL || 0).toFixed(2)}
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
