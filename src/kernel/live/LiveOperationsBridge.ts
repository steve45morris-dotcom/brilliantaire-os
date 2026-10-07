import { globalServiceRegistry } from '../registry/ServiceRegistry.js';
import { globalLiveOperationsStore } from './LiveOperationsStore.js';
import { globalSessionTracker } from './SessionTracker.js';
import { globalTaskTracker } from './TaskTracker.js';
import { globalEventStream } from './EventStream.js';
import { globalAttentionEngine } from './AttentionEngine.js';
import { globalEventBus } from '../events/EventBus.js';
import { sanitizeOperationEvent } from './AgentExecutionTelemetry.js';
import { randomUUID } from 'node:crypto';

export class LiveOperationsBridge {
  public registerService(): void {
    globalServiceRegistry.register('LiveOperations', {
      createSession: (id: string, type: 'cli' | 'ui' | 'runtime' | 'background' | 'scheduled', actor?: string) => 
        globalSessionTracker.createSession(id, type, actor),
      emitOperationEvent: (event: any) => {
        if (typeof event?.type === 'string' && event.type.startsWith('capability.verification.')) {
          throw new Error('Capability verification events are guard-owned');
        }
        const sanitizedEvent = sanitizeOperationEvent({ ...event, id: `execution-${randomUUID()}`, timestamp: new Date().toISOString(), source: 'live-operations-service' });
        globalLiveOperationsStore.addEvent(sanitizedEvent);
        globalEventBus.publish('LiveOperationsSnapshotUpdated', { eventId: sanitizedEvent.id });
      },
      getSnapshot: () => ({
        sessions: globalLiveOperationsStore.getSessions(),
        tasks: globalLiveOperationsStore.getTasks(),
        events: globalEventStream.getLiveFeed(),
        attentionItems: globalAttentionEngine.generateAttentionItems(),
        agentExecutions: globalLiveOperationsStore.getAgentExecutionStates()
      }),
      getActiveSessions: () => globalLiveOperationsStore.getSessions().filter(s => s.status === 'active'),
      getRunningTasks: () => globalLiveOperationsStore.getTasks().filter(t => t.status === 'running'),
      getRecentEvents: () => globalEventStream.getLiveFeed(),
      getBlockedTasks: () => globalLiveOperationsStore.getTasks().filter(t => t.status === 'blocked'),
      getErrors: () => globalLiveOperationsStore.getEvents().filter(e => e.severity === 'error'),
      getAttentionItems: () => globalAttentionEngine.generateAttentionItems(),
      getAgentExecutions: () => globalLiveOperationsStore.getAgentExecutionStates(),
      getHealthSignals: () => ({ healthy: true, latencyMs: 5 }),
      closeSession: (id: string, status?: any) => globalSessionTracker.closeSession(id, status)
    });
  }
}

export const globalLiveOperationsBridge = new LiveOperationsBridge();
export default globalLiveOperationsBridge;
