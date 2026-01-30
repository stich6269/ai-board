import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface TickerInfo {
    symbol: string;
    volatility: number;
}

interface TickerSelectorProps {
    currentSymbol: string;
    onSymbolChange: (symbol: string) => void;
}

export function TickerSelector({ currentSymbol, onSymbolChange }: TickerSelectorProps) {
    const [open, setOpen] = useState(false);
    const [tickers, setTickers] = useState<TickerInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTickers();
    }, []);

    const fetchTickers = async () => {
        try {
            setLoading(true);
            const response = await fetch('https://api.hyperliquid.xyz/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'metaAndAssetCtxs' })
            });
            
            const data = await response.json();
            const [meta, assetCtxs] = data;
            
            const tickerList: TickerInfo[] = meta.universe
                .map((asset: any, index: number) => {
                    const ctx = assetCtxs[index];
                    const markPx = parseFloat(ctx?.markPx || '0');
                    const prevDayPx = parseFloat(ctx?.prevDayPx || '0');
                    const volatility = prevDayPx > 0 
                        ? ((markPx - prevDayPx) / prevDayPx) * 100 
                        : 0;
                    
                    return {
                        symbol: asset.name,
                        volatility: volatility
                    };
                })
                .sort((a: TickerInfo, b: TickerInfo) => 
                    Math.abs(b.volatility) - Math.abs(a.volatility)
                );
            
            setTickers(tickerList);
        } catch (error) {
            console.error('Failed to fetch tickers:', error);
            setTickers([{ symbol: currentSymbol, volatility: 0 }]);
        } finally {
            setLoading(false);
        }
    };

    const getVolatilityColor = (vol: number) => {
        const absVol = Math.abs(vol);
        if (absVol > 5) return vol > 0 ? 'text-green-400' : 'text-red-400';
        if (absVol > 2) return vol > 0 ? 'text-green-500' : 'text-red-500';
        return 'text-gray-400';
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className="justify-between text-2xl font-bold hover:bg-transparent hover:text-white px-4 gap-2 pointer-events-auto"
                >
                    <span>{currentSymbol}</span>
                    <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-[#0f0f0f] border-gray-800">
                <Command className="bg-transparent">
                    <CommandInput 
                        placeholder="Search ticker..." 
                        className="text-white"
                    />
                    <CommandList>
                        <CommandEmpty>
                            {loading ? 'Loading tickers...' : 'No ticker found.'}
                        </CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                            {tickers.map((ticker) => (
                                <CommandItem
                                    key={ticker.symbol}
                                    value={ticker.symbol}
                                    onSelect={() => {
                                        if (ticker.symbol !== currentSymbol) {
                                            onSymbolChange(ticker.symbol);
                                        }
                                        setOpen(false);
                                    }}
                                    className="text-white hover:bg-gray-800 cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            currentSymbol === ticker.symbol ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex-1 flex items-center justify-between">
                                        <span className="font-medium">{ticker.symbol}/USDC</span>
                                        <div className="flex items-center gap-1">
                                            <TrendingUp className={cn(
                                                "h-3 w-3",
                                                ticker.volatility >= 0 ? "text-green-500" : "text-red-500 rotate-180"
                                            )} />
                                            <span className={cn(
                                                "text-xs font-mono",
                                                getVolatilityColor(ticker.volatility)
                                            )}>
                                                {ticker.volatility > 0 ? '+' : ''}{ticker.volatility.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
