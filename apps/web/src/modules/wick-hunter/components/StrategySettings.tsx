import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../convex/_generated/dataModel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Save } from 'lucide-react';

interface StrategySettingsProps {
    config: any;
}

export function StrategySettings({ config }: StrategySettingsProps) {
    const updateConfig = useMutation(api.wick.updateConfig);

    const [localConfig, setLocalConfig] = useState({
        // Entry
        investmentAmount: config.investmentAmount || 10,
        zScoreThreshold: config.zScoreThreshold || 2.0,
        windowSize: config.windowSize || 200,
        minMadThreshold: config.minMadThreshold || 0.001,
        // DCA
        maxDcaEntries: config.maxDcaEntries ?? 2,
        dcaZScoreMultiplier: config.dcaZScoreMultiplier || 1.3,
        minDcaPriceDeviationPercent: config.minDcaPriceDeviationPercent || 0.2,
        // Exit
        stopLossPercent: config.stopLossPercent || 3.0,
        softTimeoutMs: config.softTimeoutMs || 30000,
        minZScoreExit: config.minZScoreExit || 0.1,
    });
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (field: string, value: number | number[]) => {
        const numValue = Array.isArray(value) ? value[0] : value;
        setLocalConfig((prev: any) => ({ ...prev, [field]: numValue }));
        setIsDirty(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateConfig({
                configId: config._id as Id<'wick_config'>,
                investmentAmount: localConfig.investmentAmount,
                zScoreThreshold: localConfig.zScoreThreshold,
                windowSize: localConfig.windowSize,
                minMadThreshold: localConfig.minMadThreshold,
                maxDcaEntries: localConfig.maxDcaEntries,
                dcaZScoreMultiplier: localConfig.dcaZScoreMultiplier,
                minDcaPriceDeviationPercent: localConfig.minDcaPriceDeviationPercent,
                stopLossPercent: localConfig.stopLossPercent,
                softTimeoutMs: localConfig.softTimeoutMs,
                minZScoreExit: localConfig.minZScoreExit,
            });
            setIsDirty(false);
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const [activeSection, setActiveSection] = useState<'entry' | 'dca' | 'exit'>('entry');

    return (
        <div className="h-full bg-[#0f0f0f] border-l border-gray-800 flex flex-col flex-1">
            <div className="p-4 border-b border-gray-800">
                <h3 className="text-sm font-medium text-gray-300">Strategy Settings</h3>
            </div>
            
            <div className="flex-1 flex flex-col">
                <div className="grid grid-cols-3 gap-px bg-gray-800 p-2">
                    <button
                        onClick={() => setActiveSection('entry')}
                        className={`py-2 text-xs font-medium transition-colors ${
                            activeSection === 'entry'
                                ? 'bg-green-600/20 text-green-400'
                                : 'bg-[#0f0f0f] text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Entry
                    </button>
                    <button
                        onClick={() => setActiveSection('dca')}
                        className={`py-2 text-xs font-medium transition-colors ${
                            activeSection === 'dca'
                                ? 'bg-orange-600/20 text-orange-400'
                                : 'bg-[#0f0f0f] text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        DCA
                    </button>
                    <button
                        onClick={() => setActiveSection('exit')}
                        className={`py-2 text-xs font-medium transition-colors ${
                            activeSection === 'exit'
                                ? 'bg-red-600/20 text-red-400'
                                : 'bg-[#0f0f0f] text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Exit
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {activeSection === 'entry' && (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-400">Amount (USDC)</Label>
                                <Input
                                    type="number"
                                    value={localConfig.investmentAmount}
                                    onChange={(e) => handleChange('investmentAmount', parseInt(e.target.value) || 0)}
                                    min={5}
                                    max={100}
                                    step={5}
                                    className="w-full bg-black/50 border-gray-700 text-white text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-gray-400">Z-Score Entry</Label>
                                <Input
                                    type="number"
                                    value={localConfig.zScoreThreshold}
                                    onChange={(e) => handleChange('zScoreThreshold', parseFloat(e.target.value) || 0)}
                                    min={1.0}
                                    max={5.0}
                                    step={0.1}
                                    className="w-full bg-black/50 border-gray-700 text-white text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-gray-400">Window Size</Label>
                                <Input
                                    type="number"
                                    value={localConfig.windowSize}
                                    onChange={(e) => handleChange('windowSize', parseInt(e.target.value) || 0)}
                                    min={50}
                                    max={500}
                                    step={10}
                                    className="w-full bg-black/50 border-gray-700 text-white text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-gray-400">Min Volatility (MAD)</Label>
                                <Input
                                    type="number"
                                    value={localConfig.minMadThreshold}
                                    onChange={(e) => handleChange('minMadThreshold', parseFloat(e.target.value) || 0)}
                                    min={0.0001}
                                    max={0.01}
                                    step={0.0001}
                                    className="w-full bg-black/50 border-gray-700 text-white text-lg"
                                />
                            </div>
                        </div>
                    )}

                    {activeSection === 'dca' && (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-400">Max DCA Entries</Label>
                                <Input
                                    type="number"
                                    value={localConfig.maxDcaEntries}
                                    onChange={(e) => handleChange('maxDcaEntries', parseInt(e.target.value) || 0)}
                                    min={0}
                                    max={5}
                                    step={1}
                                    className="w-full bg-black/50 border-gray-700 text-white text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-gray-400">Signal Multiplier</Label>
                                <Input
                                    type="number"
                                    value={localConfig.dcaZScoreMultiplier}
                                    onChange={(e) => handleChange('dcaZScoreMultiplier', parseFloat(e.target.value) || 0)}
                                    min={1.0}
                                    max={3.0}
                                    step={0.1}
                                    className="w-full bg-black/50 border-gray-700 text-white text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-gray-400">Min Price Step %</Label>
                                <Input
                                    type="number"
                                    value={localConfig.minDcaPriceDeviationPercent}
                                    onChange={(e) => handleChange('minDcaPriceDeviationPercent', parseFloat(e.target.value) || 0)}
                                    min={0.1}
                                    max={1.0}
                                    step={0.1}
                                    className="w-full bg-black/50 border-gray-700 text-white text-lg"
                                />
                            </div>
                        </div>
                    )}

                    {activeSection === 'exit' && (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-400">Soft Timeout (seconds)</Label>
                                <Input
                                    type="number"
                                    value={Math.round(localConfig.softTimeoutMs / 1000)}
                                    onChange={(e) => handleChange('softTimeoutMs', (parseInt(e.target.value) || 0) * 1000)}
                                    min={10}
                                    max={300}
                                    step={10}
                                    className="w-full bg-black/50 border-gray-700 text-white text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-gray-400">Min Z-Score Exit</Label>
                                <Input
                                    type="number"
                                    value={localConfig.minZScoreExit}
                                    onChange={(e) => handleChange('minZScoreExit', parseFloat(e.target.value) || 0)}
                                    min={0.0}
                                    max={1.0}
                                    step={0.1}
                                    className="w-full bg-black/50 border-gray-700 text-white text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-gray-400">Hard Stop Loss %</Label>
                                <Input
                                    type="number"
                                    value={localConfig.stopLossPercent}
                                    onChange={(e) => handleChange('stopLossPercent', parseFloat(e.target.value) || 0)}
                                    min={1.0}
                                    max={10.0}
                                    step={0.5}
                                    className="w-full bg-black/50 border-gray-700 text-white text-lg"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-gray-800">
                {isDirty && (
                    <Button 
                        onClick={handleSave} 
                        className="w-full bg-blue-600 hover:bg-blue-700" 
                        size="sm"
                        disabled={isSaving}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Apply Settings'}
                    </Button>
                )}
            </div>
        </div>
    );
}
