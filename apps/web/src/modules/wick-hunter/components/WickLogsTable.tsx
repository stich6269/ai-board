import { memo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Info, AlertTriangle, Zap } from "lucide-react";

interface LogSnapshot {
    price: number;
    median: number;
    mad: number;
    zScore: number;
    velocity: number;
    acceleration: number;
    positionState: string;
    entryPrice?: number;
    pnlPercent?: number;
}

interface LogEntry {
    _id: string;
    timestamp: number;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SIGNAL';
    message: string;
    snapshot: LogSnapshot;
}

interface WickLogsTableProps {
    logs: LogEntry[];
}

const levelConfig = {
    INFO: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-600' },
    WARN: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-600' },
    ERROR: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-600' },
    SIGNAL: { icon: Zap, color: 'text-green-400', bg: 'bg-green-600' },
};

// Memoized log row to prevent unnecessary re-renders
const LogRow = memo(({ log }: { log: LogEntry }) => {
    const config = levelConfig[log.level];
    const Icon = config.icon;

    // Format time once per row instead of on every render
    const timeStr = new Date(log.timestamp).toLocaleTimeString();

    // Pre-calculate colors
    const zScoreColor = log.snapshot.zScore < -2 ? 'text-green-400' : log.snapshot.zScore > 2 ? 'text-red-400' : 'text-gray-300';
    const velocityColor = log.snapshot.velocity < 0 ? 'text-red-400' : 'text-green-400';
    const accelColor = log.snapshot.acceleration < 0 ? 'text-red-400' : 'text-green-400';
    const pnlColor = log.snapshot.pnlPercent !== undefined
        ? (log.snapshot.pnlPercent > 0 ? 'text-green-400' : 'text-red-400')
        : 'text-gray-500';
    const pnlText = log.snapshot.pnlPercent !== undefined ? `${log.snapshot.pnlPercent.toFixed(2)}%` : '---';

    return (
        <TableRow className="border-gray-800">
            <TableCell className="p-2">
                <Badge className={`${config.bg} text-white`}>
                    <Icon className="w-3 h-3 mr-1" />
                    {log.level}
                </Badge>
            </TableCell>
            <TableCell className="font-mono text-xs text-gray-400 p-2">
                {timeStr}
            </TableCell>
            <TableCell className={`text-sm p-2 ${config.color}`}>
                {log.message}
            </TableCell>
            <TableCell className="text-right font-mono text-white p-2">
                ${log.snapshot.price.toFixed(3)}
            </TableCell>
            <TableCell className={`text-right font-mono p-2 ${zScoreColor}`}>
                {log.snapshot.zScore.toFixed(2)}
            </TableCell>
            <TableCell className={`text-right font-mono text-xs p-2 ${velocityColor}`}>
                {log.snapshot.velocity.toFixed(2)}
            </TableCell>
            <TableCell className={`text-right font-mono text-xs p-2 ${accelColor}`}>
                {log.snapshot.acceleration.toFixed(2)}
            </TableCell>
            <TableCell className={`text-right font-mono p-2 ${pnlColor}`}>
                {pnlText}
            </TableCell>
        </TableRow>
    );
});

LogRow.displayName = 'LogRow';

export const WickLogsTable = memo(({ logs }: WickLogsTableProps) => {
    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <Info className="w-5 h-5 mb-1 opacity-20" />
                <p className="text-sm">No logs recorded yet</p>
            </div>
        );
    }

    return (
        <div className="max-h-96 overflow-y-auto">
            <Table className="w-full">
                <TableHeader>
                    <TableRow className="bg-black/20 border-gray-800">
                        <TableHead className="w-[80px] text-gray-300 p-2">Level</TableHead>
                        <TableHead className="w-[80px] text-gray-300 p-2">Time</TableHead>
                        <TableHead className="text-gray-300 p-2">Message</TableHead>
                        <TableHead className="text-right text-gray-300 p-2">Price</TableHead>
                        <TableHead className="text-right text-gray-300 p-2">Z-Score</TableHead>
                        <TableHead className="text-right text-gray-300 p-2">Velocity</TableHead>
                        <TableHead className="text-right text-gray-300 p-2">Accel</TableHead>
                        <TableHead className="text-right text-gray-300 p-2">PnL %</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                        <LogRow key={log._id} log={log} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
});

WickLogsTable.displayName = 'WickLogsTable';

// Export copy function for use in parent component
export const copyLogsToClipboard = async (logs: LogEntry[]) => {
    const data = {
        logs: logs.map(log => ({
            id: log._id,
            timestamp: new Date(log.timestamp).toISOString(),
            level: log.level,
            message: log.message,
            snapshot: log.snapshot
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
