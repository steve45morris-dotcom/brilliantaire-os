import { globalEventBus } from '../kernel/events/EventBus.js';
import { globalRuntimeLogger } from './RuntimeLogger.js';

export class RuntimeEvents {
  public bindEvents(): void {
    globalEventBus.subscribe('SupernovaPromptReceived', (event) => {
      globalRuntimeLogger.log(`Received user query prompt: "${event.payload.promptText}"`, 'info', 'EventBus');
    });

    globalEventBus.subscribe('ApprovalRequested', (event) => {
      globalRuntimeLogger.log(`Action requires authorization: ApprovalRequest ID ${event.payload.id}`, 'warn', 'EventBus');
    });

    globalEventBus.subscribe('ApprovalGranted', (event) => {
      globalRuntimeLogger.log(`Action approved: Request ID ${event.payload.id}`, 'info', 'EventBus');
    });
  }
}

export const globalRuntimeEvents = new RuntimeEvents();
