import { globalEventBus, EventCallback } from './EventBus.js';

export class EventSubscriber {
  public static subscribe(type: string, callback: EventCallback): void {
    globalEventBus.subscribe(type, callback);
  }

  public static unsubscribe(type: string, callback: EventCallback): void {
    globalEventBus.unsubscribe(type, callback);
  }

  public static subscribeAll(callback: EventCallback): void {
    globalEventBus.subscribeAll(callback);
  }
}
