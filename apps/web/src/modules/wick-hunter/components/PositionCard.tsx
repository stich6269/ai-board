import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp, DollarSign, Clock, Target } from "lucide-react";
import type { Id } from "../../../../../../convex/_generated/dataModel";

interface WickState {
    status: string;
    marketPrice: number;
    entryPrice?: number;
    targetSellPrice?: number;
    stopLossPrice?: number;
    pnlCurrent?: number;
}

interface OpenRound {
    _id: Id<"wick_rounds">;
    buyPrice: number;
    buyAmount: number;
    buyTime: number;
}

interface PositionCardProps {
    configId: Id<"wick_config">;
    state: WickState | null;
    openRound: OpenRound | null;
    symbol: string;
}

export function PositionCard({ configId, state, openRound, symbol }: PositionCardProps) {
    const [loading, setLoading] = useState(false);
    const panicClose = useMutation(api.wick.panicClose);

    const isInPosition = state?.status === "FILLED_BUY" || 
                         state?.status === "MONITORING_EXIT" || 
                         state?.status === "PLACING_SELL";

    if (!isInPosition || !openRound) {
        return null;
    }

    const handlePanicClose = async () => {
        if (!confirm("Are you sure you want to PANIC CLOSE? This will sell at market price immediately.")) {
            return;
        }
        
        setLoading(true);
        try {
            await panicClose({ configId });
        } catch (err) {
            console.error("Failed to panic close:", err);
        } finally {
            setLoading(false);
        }
    };

    const pnl = state?.pnlCurrent || 0;
    const pnlPercent = state?.entryPrice 
        ? ((state.marketPrice - state.entryPrice) / state.entryPrice) * 100 
        : 0;
    const duration = Math.floor((Date.now() - openRound.buyTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    return (
        <Card className="border-2 border-blue-500 bg-blue-50/50">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                        <TrendingUp className="h-5 w-5" />
                        Active Position
                    </CardTitle>
                    <Badge className="bg-blue-600">
                        {symbol}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Entry Price
                        </div>
                        <div className="font-mono font-bold">
                            ${state?.entryPrice?.toFixed(4)}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Amount
                        </div>
                        <div className="font-mono font-bold">
                            {openRound.buyAmount.toFixed(4)}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Duration
                        </div>
                        <div className="font-mono font-bold">
                            {minutes}m {seconds}s
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Current PnL</div>
                        <div className={cn(
                            "font-mono font-bold text-lg",
                            pnl >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                            {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)} ({pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%)
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        <span className="text-green-600 font-medium">TP: ${state?.targetSellPrice?.toFixed(4)}</span>
                        {" | "}
                        <span className="text-red-600 font-medium">SL: ${state?.stopLossPrice?.toFixed(4)}</span>
                    </div>

                    <Button
                        variant="destructive"
                        size="lg"
                        onClick={handlePanicClose}
                        disabled={loading}
                        className="font-bold"
                    >
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        PANIC SELL
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
