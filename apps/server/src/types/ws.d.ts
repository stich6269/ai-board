declare module 'ws' {
    import { EventEmitter } from 'events';

    class WebSocket extends EventEmitter {
        constructor(url: string, options?: any);
        send(data: string | Buffer): void;
        close(): void;
        on(event: 'open', listener: () => void): this;
        on(event: 'message', listener: (data: Buffer) => void): this;
        on(event: 'error', listener: (error: Error) => void): this;
        on(event: 'close', listener: () => void): this;
    }

    export = WebSocket;
}
