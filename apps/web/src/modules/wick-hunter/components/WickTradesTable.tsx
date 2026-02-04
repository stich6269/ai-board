import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

interface Trade {
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

interface WickTradesTableProps {
    trades: Trade[];
}

export function WickTradesTable({ trades }: WickTradesTableProps) {

    if (!trades || trades.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <Clock className="w-5 h-5 mb-1 opacity-20" />
                <p className="text-sm">No trades recorded yet</p>
            </div>
        );
    }

    return (
        <div className="max-h-96 overflow-y-auto">
            <Table className="w-full">
                <TableHeader>
                    <TableRow className="bg-black/20 border-gray-800">
                        <TableHead className="w-[100px] text-gray-300 p-2">Status</TableHead>
                        <TableHead className="text-gray-300 p-2">Execution Time</TableHead>
                        <TableHead className="text-gray-300 p-2">Symbol</TableHead>
                        <TableHead className="text-right text-gray-300 p-2">Entry</TableHead>
                        <TableHead className="text-right text-gray-300 p-2">Exit</TableHead>
                        <TableHead className="text-right text-gray-300 p-2">Value ($)</TableHead>
                        <TableHead className="text-right text-gray-300 p-2">Result</TableHead>
                        <TableHead className="text-right text-gray-300 p-2">PnL%</TableHead>
                        <TableHead className="text-right text-gray-300 p-2">Time</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {trades.map((trade) => {
                        const isProfit = (trade.finalPnL || 0) > 0;
                        const duration = trade.durationSeconds
                            ? `${Math.floor(trade.durationSeconds / 60)}m ${trade.durationSeconds % 60}s`
                            : '---';
                        const originalValue = trade.buyAmount * trade.buyPrice;
                        const pnlPercent = trade.sellPrice && trade.buyPrice
                            ? ((trade.sellPrice - trade.buyPrice) / trade.buyPrice) * 100
                            : 0;
                        const resultFormatted = trade.finalPnL
                            ? `${trade.finalPnL.toFixed(3)}$`
                            : '---';

                        return (
                            <TableRow key={trade._id} className="hover:bg-gray-800/50 transition-colors border-gray-800">
                                <TableCell className="p-2">
                                    <Badge
                                        variant={trade.status === 'OPEN' ? 'default' : 'secondary'}
                                        className={trade.status === 'OPEN' ? 'bg-blue-600' : 'bg-gray-700'}
                                    >
                                        {trade.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-gray-400 p-2">
                                    {format(trade.buyTime, 'HH:mm:ss')}
                                </TableCell>
                                <TableCell className="font-bold text-white p-2">{trade.symbol}</TableCell>
                                <TableCell className="text-right font-mono text-white p-2">${trade.buyPrice.toFixed(3)}</TableCell>
                                <TableCell className="text-right font-mono text-white p-2">
                                    {trade.sellPrice ? `$${trade.sellPrice.toFixed(3)}` : '---'}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-gray-400 p-2">
                                    ${originalValue.toFixed(2)}
                                </TableCell>
                                <TableCell className={`text-right font-bold font-mono p-2 ${trade.status === 'OPEN' ? 'text-gray-500' : isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                    <div className="flex items-center justify-end gap-1">
                                        {trade.status !== 'OPEN' && (isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />)}
                                        {trade.status === 'OPEN' ? '---' : resultFormatted}
                                    </div>
                                </TableCell>
                                <TableCell className={`text-right font-bold font-mono p-2 ${trade.status === 'OPEN' ? 'text-gray-500' : isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                    {trade.status === 'OPEN' ? '---' : `${pnlPercent > 0 ? '+' : ''}${pnlPercent.toFixed(2)}%`}
                                </TableCell>
                                <TableCell className="text-right text-xs text-gray-400 p-2">
                                    {duration}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

// Export copy function for use in parent component
export const copyTradesToClipboard = async (trades: any[]) => {
    const data = {
        trades: trades.map(trade => ({
            id: trade._id,
            symbol: trade.symbol,
            buyTime: new Date(trade.buyTime).toISOString(),
            buyPrice: trade.buyPrice,
            buyAmount: trade.buyAmount,
            sellTime: trade.sellTime ? new Date(trade.sellTime).toISOString() : null,
            sellPrice: trade.sellPrice || null,
            status: trade.status,
            finalPnL: trade.finalPnL || null,
            durationSeconds: trade.durationSeconds || null
        }))
    };

    try {
        await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
};
