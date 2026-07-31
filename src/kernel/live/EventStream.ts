import { OperationEvent } from './LiveOperationsTypes.js';
import { globalLiveOperationsStore } from './LiveOperationsStore.js';

export class EventStream {
  public getLiveFeed(): OperationEvent[] {
    const events = globalLiveOperationsStore.getEvents();
    // Return recent 15 relevant events
    return events.slice(-15);
  }
}

export const globalEventStream = new EventStream();
