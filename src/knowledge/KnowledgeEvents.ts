import { globalEventBus } from '../kernel/events/EventBus.js';

export class KnowledgeEvents {
  public bindEvents(): void {
    globalEventBus.subscribe('NodeCreated', (event) => {
      console.log(`[Knowledge Graph Node Added]: ID ${event.payload.nodeId}`);
    });
  }
}

export const globalKnowledgeEvents = new KnowledgeEvents();
