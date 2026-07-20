import { AttentionItem } from './LiveOperationsTypes.js';
import { globalLiveOperationsStore } from './LiveOperationsStore.js';

export class AttentionEngine {
  public generateAttentionItems(): AttentionItem[] {
    const items: AttentionItem[] = [];
    const tasks = globalLiveOperationsStore.getTasks();
    const sessions = globalLiveOperationsStore.getSessions();

    tasks.forEach(t => {
      if (t.status === 'blocked') {
        items.push({
          id: `att-task-block-${t.id}`,
          type: 'blocked_task',
          title: `Task Blocked: ${t.name}`,
          details: t.attentionReason || 'Task is execution blocked',
          severity: 'high',
          timestamp: new Date().toISOString()
        });
      }
      if (t.status === 'failed') {
        items.push({
          id: `att-task-fail-${t.id}`,
          type: 'error',
          title: `Task Failed: ${t.name}`,
          details: t.attentionReason || 'Task execution failed',
          severity: 'medium',
          timestamp: new Date().toISOString()
        });
      }
    });

    sessions.forEach(s => {
      if (s.status === 'expired') {
        items.push({
          id: `att-sess-exp-${s.id}`,
          type: 'stale_session',
          title: `Session Expired: ${s.id}`,
          details: 'Session exceeded timeout bounds without heartbeat signals',
          severity: 'low',
          timestamp: new Date().toISOString()
        });
      }
    });

    return items;
  }
}

export const globalAttentionEngine = new AttentionEngine();
