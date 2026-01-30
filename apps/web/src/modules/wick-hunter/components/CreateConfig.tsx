import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Target } from "lucide-react";

interface CreateConfigProps {
    onCreated: () => void;
}

export function CreateConfig({ onCreated }: CreateConfigProps) {
    const [symbol, setSymbol] = useState("HYPE/USDC:USDC");
    const [buyDip, setBuyDip] = useState(1.5);
    const [takeProfit, setTakeProfit] = useState(1.0);
    const [stopLoss, setStopLoss] = useState(3.0);
    const [investment, setInvestment] = useState(15);
    const [loading, setLoading] = useState(false);

    const createConfig = useMutation(api.wick.createConfig);

    const handleCreate = async () => {
        setLoading(true);
        try {
            await createConfig({
                userId: "default",
                symbol,
                buyDipPercent: buyDip,
                takeProfitPercent: takeProfit,
                stopLossPercent: stopLoss,
                investmentAmount: investment,
            });
            
            // 🚀 Автоматически запускаем Wick Hunter worker
            await fetch('/api/workers/wick-hunter/start', { method: 'POST' });
            
            onCreated();
        } catch (err) {
            console.error("Failed to create config:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Create Wick Hunter
                </CardTitle>
                <CardDescription>
                    Set up a new wick hunting strategy for a trading pair
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        placeholder="HYPE/USDC:USDC"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Buy Dip %</Label>
                        <Input
                            type="number"
                            value={buyDip}
                            onChange={(e) => setBuyDip(parseFloat(e.target.value) || 0)}
                            min={0.5}
                            max={5}
                            step={0.1}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Take Profit %</Label>
                        <Input
                            type="number"
                            value={takeProfit}
                            onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                            min={0.5}
                            max={5}
                            step={0.1}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Stop Loss %</Label>
                        <Input
                            type="number"
                            value={stopLoss}
                            onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                            min={1}
                            max={10}
                            step={0.5}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Investment (USDC)</Label>
                        <Input
                            type="number"
                            value={investment}
                            onChange={(e) => setInvestment(parseFloat(e.target.value) || 0)}
                            min={15}
                            step={1}
                        />
                        <p className="text-xs text-muted-foreground">
                            Amount of USDC to use for each trade (min $15 for Hyperliquid)
                        </p>
                    </div>
                </div>

                <Button 
                    onClick={handleCreate} 
                    disabled={loading || !symbol}
                    className="w-full"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {loading ? "Creating..." : "Create Strategy"}
                </Button>
            </CardContent>
        </Card>
    );
}
