import { globalEventBus } from './EventBus.js';
import { TypedEventRegistry, EventType } from './TypedEventRegistry.js';

export class EventPublisher {
  public static publish<K extends EventType>(type: K, payload: any): void {
    const registry = TypedEventRegistry[type];
    if (registry && !registry.validate(payload)) {
      throw new Error(`Invalid payload validation for event type: ${type}. Payload keys: ${Object.keys(payload).join(', ')}`);
    }
    globalEventBus.publish(type, payload);
  }
}
