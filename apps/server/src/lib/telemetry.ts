import { EventEmitter } from 'events';

class TelemetryService extends EventEmitter {
    broadcast(channel: string, data: any) {
        this.emit(channel, data);
    }
}

export const telemetry = new TelemetryService();
