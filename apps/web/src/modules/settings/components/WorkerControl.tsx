import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, RefreshCw, Activity } from "lucide-react";

interface WorkerStatus {
    harvester: { running: boolean; process: boolean };
    liquidityWorker: { running: boolean; process: boolean };
    wickHunter: { running: boolean; process: boolean };
}

export function WorkerControl() {
    const [status, setStatus] = useState<WorkerStatus | null>(null);
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

    // Fetch worker status
    const fetchStatus = async () => {
        try {
            const response = await fetch('/api/workers/status');
            const data = await response.json();
            setStatus(data);
        } catch (err) {
            console.error('Failed to fetch worker status:', err);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000); // Update every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const handleWorkerAction = async (worker: 'harvester' | 'liquidity' | 'wick-hunter', action: 'start' | 'stop') => {
        setLoading(prev => ({ ...prev, [`${worker}-${action}`]: true }));
        
        try {
            const endpoint = `/api/workers/${worker}/${action}`;
            
            const response = await fetch(endpoint, { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                // Refresh status after a short delay
                setTimeout(fetchStatus, 500);
            } else {
                console.error('Failed to ' + action + ' worker:', result.message);
            }
        } catch (err) {
            console.error('Failed to ' + action + ' worker:', err);
        } finally {
            setLoading(prev => ({ ...prev, [`${worker}-${action}`]: false }));
        }
    };

    const WorkerCard = ({ 
        title, 
        description, 
        workerKey, 
        statusKey 
    }: { 
        title: string; 
        description: string; 
        workerKey: 'harvester' | 'liquidity' | 'wick-hunter'; 
        statusKey: 'harvester' | 'liquidityWorker' | 'wickHunter';
    }) => {
        const isRunning = status?.[statusKey]?.running;
        
        return (
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">{title}</CardTitle>
                            <CardDescription className="text-sm">{description}</CardDescription>
                        </div>
                        <Badge variant={isRunning ? "default" : "secondary"} className="gap-2">
                            <Activity className="h-3 w-3" />
                            {isRunning ? "Running" : "Stopped"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={isRunning ? "secondary" : "default"}
                            onClick={() => handleWorkerAction(workerKey, 'start')}
                            disabled={isRunning || loading[`${workerKey}-start`]}
                            className="flex-1"
                        >
                            <Play className="h-4 w-4 mr-1" />
                            Start
                        </Button>
                        <Button
                            size="sm"
                            variant={isRunning ? "destructive" : "secondary"}
                            onClick={() => handleWorkerAction(workerKey, 'stop')}
                            disabled={!isRunning || loading[`${workerKey}-stop`]}
                            className="flex-1"
                        >
                            <Square className="h-4 w-4 mr-1" />
                            Stop
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Worker Control</CardTitle>
                        <CardDescription>
                            Control background workers for scanning and liquidity management.
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchStatus}
                        disabled={loading.refresh}
                    >
                        <RefreshCw className={`h-4 w-4 mr-1 ${loading.refresh ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <WorkerCard
                    title="Harvester"
                    description="Scans markets for funding rate opportunities"
                    workerKey="harvester"
                    statusKey="harvester"
                />
                <WorkerCard
                    title="Liquidity Worker"
                    description="Manages balance and processes trade operations"
                    workerKey="liquidity"
                    statusKey="liquidityWorker"
                />
                <WorkerCard
                    title="Wick Hunter"
                    description="Automated flash crash catcher - catches wicks and sells bounces"
                    workerKey="wick-hunter"
                    statusKey="wickHunter"
                />
                
                <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">
                        <strong>Note:</strong> Workers are disabled by default. Start them manually to begin scanning and balance monitoring.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
