import { globalEventBus } from '../kernel/events/EventBus.js';

export class ExecutiveEvents {
  public bindEvents(): void {
    globalEventBus.subscribe('PriorityCalculated', (event) => {
      console.log(`[Executive Event] Priority recalculated for entity: ${event.payload.entityId}`);
    });
  }
}

export const globalExecutiveEvents = new ExecutiveEvents();
