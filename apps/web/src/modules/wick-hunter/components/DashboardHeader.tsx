import { Button } from "@/components/ui/button";
import { Activity, User, Play, Pause } from "lucide-react";
import { TickerSelector } from "./TickerSelector";

interface DashboardHeaderProps {
    symbol: string;
    isRunning: boolean;
    onToggle: () => void;
    onSymbolChange: (symbol: string) => void;
}

export function DashboardHeader({ 
    symbol, 
    isRunning, 
    onToggle, 
    onSymbolChange
}: DashboardHeaderProps) {
    return (
        <header className="border-b border-gray-800 bg-[#0f0f0f]">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                    <TickerSelector 
                        currentSymbol={symbol} 
                        onSymbolChange={onSymbolChange}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${
                        isRunning 
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                        <Activity className="w-3 h-3" />
                        {isRunning ? 'Online' : 'Standby'}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggle}
                        className={`gap-2 px-3 py-1.5 rounded-md border ${
                            isRunning 
                                ? 'text-green-500 hover:text-green-400 hover:bg-green-500/10 bg-green-500/10 border-green-500/20' 
                                : 'text-gray-400 hover:text-white hover:bg-gray-800 bg-gray-500/10 border-gray-500/20'
                        }`}
                    >
                        {isRunning ? (
                            <Pause className="h-4 w-4" />
                        ) : (
                            <Play className="h-4 w-4 fill-current" />
                        )}
                        <span className="text-sm font-medium">Trade</span>
                    </Button>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-white">John Doe</span>
                            <span className="text-xs text-gray-400">Trader</span>
                        </div>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700">
                            <User className="w-4 h-4 text-gray-300" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
