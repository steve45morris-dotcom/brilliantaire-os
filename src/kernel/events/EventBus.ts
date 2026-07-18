import { EventMiddlewareChain, EventMiddlewareFn } from './Middleware.js';

class SimpleEventEmitter {
  private listeners: Record<string, Function[]> = {};

  public on(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  public off(event: string, callback: Function): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== callback);
  }

  public emit(event: string, ...args: any[]): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => {
      try {
        cb(...args);
      } catch (err) {
        console.error('[SimpleEventEmitter] Error in listener callback:', err);
      }
    });
  }
}

export interface KernelEvent {
  type: string;
  timestamp: string;
  payload: any;
}

export type EventCallback = (event: KernelEvent) => void;

export class EventBus {
  private emitter: SimpleEventEmitter;
  private history: KernelEvent[] = [];
  private maxHistory = 100;
  private middlewareChain = new EventMiddlewareChain();

  constructor() {
    this.emitter = new SimpleEventEmitter();
  }

  public use(middleware: EventMiddlewareFn): void {
    this.middlewareChain.use(middleware);
  }

  public publish(type: string, payload: any): void {
    const event: KernelEvent = {
      type,
      timestamp: new Date().toISOString(),
      payload
    };

    this.middlewareChain.execute(event, (evt) => {
      this.history.push(evt);
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }

      this.emitter.emit(type, evt);
      this.emitter.emit('*', evt); // Wildcard listener for monitoring / auditing
    });
  }

  public subscribe(type: string, callback: EventCallback): void {
    this.emitter.on(type, callback);
  }

  public unsubscribe(type: string, callback: EventCallback): void {
    this.emitter.off(type, callback);
  }

  public subscribeAll(callback: EventCallback): void {
    this.emitter.on('*', callback);
  }

  public getHistory(): KernelEvent[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
  }
}

export const globalEventBus = new EventBus();
