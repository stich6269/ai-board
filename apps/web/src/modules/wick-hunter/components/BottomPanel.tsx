import { memo, useState } from 'react';
import { WickTradesTable, copyTradesToClipboard } from '@/modules/wick-hunter/components';
import { WickLogsTable, copyLogsToClipboard } from './WickLogsTable';
import { Button } from '@/components/ui/button';
import { X, Copy, Check } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../convex/_generated/dataModel';

interface BottomPanelProps {
    trades: any[];
    openPosition: any;
    slPrice?: number;
    tpPrice?: number;
    currentPrice?: number;
    configId?: Id<'wick_config'>;
    logs?: any[];
}

export const BottomPanel = memo(({ trades, openPosition, slPrice, tpPrice, currentPrice, configId, logs = [] }: BottomPanelProps) => {
    const closePosition = useMutation(api.wick.closePosition);
    const [activeTab, setActiveTab] = useState('history');
    const [copySuccess, setCopySuccess] = useState(false);

    const handleClose = async () => {
        if (!configId) return;
        try {
            await closePosition({ configId });
            console.log('✅ Position close signal sent');
        } catch (error) {
            console.error('❌ Failed to close position:', error);
        }
    };

    const handleCopy = async () => {
        let success = false;
        
        if (activeTab === 'history') {
            success = await copyTradesToClipboard(trades);
        } else if (activeTab === 'logs') {
            success = await copyLogsToClipboard(logs);
        }
        
        if (success) {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    const currentPnL = openPosition && currentPrice
        ? ((currentPrice - openPosition.buyPrice) * openPosition.buyAmount)
        : 0;
    const currentPnLPercent = openPosition
        ? ((currentPrice || 0) - openPosition.buyPrice) / openPosition.buyPrice * 100
        : 0;

    return (
        <div className="border-t border-gray-800 bg-[#0f0f0f]">
            <div className="flex items-center justify-between border-b border-gray-800 bg-transparent">
                <div className="flex justify-start bg-transparent rounded-none h-10 p-0">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 rounded-none border-b-2 transition-colors ${
                            activeTab === 'history'
                                ? 'border-blue-500 bg-transparent text-white'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        Trade History ({trades.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('position')}
                        className={`px-4 rounded-none border-b-2 transition-colors ${
                            activeTab === 'position'
                                ? 'border-blue-500 bg-transparent text-white'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        Open Position {openPosition ? '(1)' : '(0)'}
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-4 rounded-none border-b-2 transition-colors ${
                            activeTab === 'logs'
                                ? 'border-blue-500 bg-transparent text-white'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        Logs ({logs.length})
                    </button>
                </div>
                
                {(activeTab === 'history' || activeTab === 'logs') && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="mr-4 h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                        title={`Copy ${activeTab === 'history' ? 'trades' : 'logs'} to clipboard`}
                    >
                        {copySuccess ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                )}
            </div>
            
            <div className="p-0 m-0">
                {activeTab === 'history' && <WickTradesTable trades={trades} />}
                
                {activeTab === 'position' && (
                    <div className="p-4">
                        {openPosition ? (
                            <div className="flex items-center justify-between bg-black/20 border border-gray-800 rounded-lg p-4">
                                <div className="flex items-center gap-8">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Symbol</span>
                                        <span className="text-sm font-bold text-white">{openPosition.symbol}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Entry</span>
                                        <span className="text-sm font-mono text-white">${openPosition.buyPrice.toFixed(3)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Size</span>
                                        <span className="text-sm font-mono text-white">{openPosition.buyAmount.toFixed(4)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Current</span>
                                        <span className="text-sm font-mono text-white">${currentPrice?.toFixed(3) || '---'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">PnL</span>
                                        <span className={`text-sm font-bold font-mono ${
                                            currentPnL >= 0 ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                            ${currentPnL.toFixed(2)} ({currentPnLPercent >= 0 ? '+' : ''}{currentPnLPercent.toFixed(2)}%)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">SL</span>
                                        <span className="text-sm font-mono text-red-500">${slPrice?.toFixed(3) || '---'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">TP</span>
                                        <span className="text-sm font-mono text-green-500">${tpPrice?.toFixed(3) || '---'}</span>
                                    </div>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleClose}
                                    className="flex items-center gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Close Position
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-32 text-gray-500 border border-dashed border-gray-700 rounded-lg">
                                No open position
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'logs' && <WickLogsTable logs={logs} />}
            </div>
        </div>
    );
});

BottomPanel.displayName = 'BottomPanel';
