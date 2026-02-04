import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Sparkles, Check, Loader2, BarChart3, Zap } from 'lucide-react';
import { useAIAdvisorStore, AIAdvisorActions } from '../model/store';
import { useAIDataSnapshot } from '../model/hooks';
import { queryGemini } from '../lib/geminiService';
import type { StrategySettings } from '../lib/types';

interface AIAdvisorPanelProps {
    configId?: Id<'wick_config'>;
    config: any;
    trades: any[];
    signals: any[];
    symbol: string;
}

export function AIAdvisorPanel({ configId, config, trades, signals, symbol }: AIAdvisorPanelProps) {
    const updateConfig = useMutation(api.wick.updateConfig);
    const [prompt, setPrompt] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, isLoading } = useAIAdvisorStore();
    const snapshot = useAIDataSnapshot({ config, trades, signals, symbol });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = useCallback(async () => {
        if (!prompt.trim() || isLoading) return;

        const userMessage = {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content: prompt.trim(),
            timestamp: Date.now(),
        };
        AIAdvisorActions.addMessage(userMessage);
        setPrompt('');

        const loadingMessage = {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: '',
            timestamp: Date.now(),
            isLoading: true,
        };
        AIAdvisorActions.addMessage(loadingMessage);
        AIAdvisorActions.setLoading(true);

        try {
            const response = await queryGemini(snapshot, userMessage.content);
            AIAdvisorActions.updateLastMessage({
                content: response.explanation,
                suggestedSettings: response.suggestedSettings,
                isLoading: false,
            });
        } catch (error) {
            AIAdvisorActions.updateLastMessage({
                content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
                isLoading: false,
            });
        } finally {
            AIAdvisorActions.setLoading(false);
        }
    }, [prompt, isLoading, snapshot]);

    const handleApplySettings = useCallback(async (settings: StrategySettings) => {
        try {
            if (!configId) return;
            await updateConfig({
                configId,
                ...settings,
            });
            AIAdvisorActions.markApplied();
        } catch (error) {
            console.error('Failed to apply settings:', error);
        }
    }, [configId, updateConfig]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="w-[350px] h-full flex flex-col bg-[#0a0a0a] border-l border-gray-800">
            <div className="p-3 border-b border-gray-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">AI Advisor</span>
            </div>

            <div className="px-3 py-2 border-b border-gray-800 grid grid-cols-3 gap-2 text-center">
                <div>
                    <div className="text-xs text-gray-500">Z-Score</div>
                    <div className="text-sm font-mono text-white">{config?.zScoreThreshold?.toFixed(1) || '2.0'}</div>
                </div>
                <div>
                    <div className="text-xs text-gray-500">SL %</div>
                    <div className="text-sm font-mono text-white">{config?.stopLossPercent?.toFixed(1) || '3.0'}</div>
                </div>
                <div>
                    <div className="text-xs text-gray-500">Amount</div>
                    <div className="text-sm font-mono text-white">${config?.investmentAmount || 10}</div>
                </div>
            </div>

            <div className="px-3 py-2 border-b border-gray-800 flex gap-2">
                <div className="flex-1 flex items-center gap-1 px-2 py-1 rounded bg-gray-800/50">
                    <BarChart3 className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-gray-400">Trades:</span>
                    <span className="text-xs font-mono text-white">{snapshot.tradesSinceLastApply}</span>
                </div>
                <div className="flex-1 flex items-center gap-1 px-2 py-1 rounded bg-gray-800/50">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-gray-400">Signals:</span>
                    <span className="text-xs font-mono text-white">{snapshot.signalsSinceLastApply}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-xs mt-8">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>Ask AI to optimize your strategy</p>
                        <p className="mt-1 text-gray-600">e.g. "Improve my win rate"</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`${msg.role === 'user'
                            ? 'ml-4 bg-blue-900/50 rounded-xl rounded-br-none'
                            : 'mr-4 bg-gray-800 rounded-xl rounded-bl-none'
                            } p-2`}
                    >
                        {msg.isLoading ? (
                            <div className="flex items-center gap-2 text-gray-400">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="text-xs">Analyzing...</span>
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-gray-200 whitespace-pre-wrap">{msg.content}</p>
                                {msg.suggestedSettings && (
                                    <Button
                                        size="sm"
                                        className="mt-2 w-full h-7 text-xs bg-purple-600 hover:bg-purple-700"
                                        onClick={() => handleApplySettings(msg.suggestedSettings!)}
                                    >
                                        <Check className="w-3 h-3 mr-1" />
                                        Apply Settings
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-gray-800">
                <div className="flex gap-2">
                    <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask AI..."
                        className="flex-1 min-h-[60px] max-h-[80px] text-xs bg-gray-900 border-gray-700 resize-none"
                        disabled={isLoading}
                    />
                    <Button
                        size="sm"
                        className="h-auto bg-purple-600 hover:bg-purple-700"
                        onClick={handleSend}
                        disabled={!prompt.trim() || isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
