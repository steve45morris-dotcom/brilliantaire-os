import { LiveTask } from './LiveOperationsTypes.js';
import { globalLiveOperationsStore } from './LiveOperationsStore.js';
import { globalEventBus } from '../events/EventBus.js';

export class TaskTracker {
  public startTask(
    id: string,
    sessionId: string,
    type: LiveTask['type'],
    name: string,
    projectId = 'The One System'
  ): LiveTask {
    const task: LiveTask = {
      id,
      sessionId,
      type,
      name,
      status: 'running',
      projectId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationMs: 0,
      progress: 0,
      attentionRequired: false,
      lastEventId: `evt-${Date.now()}`
    };

    globalLiveOperationsStore.addTask(task);
    
    // Add task key to session list
    const session = globalLiveOperationsStore.getSession(sessionId);
    if (session) {
      session.activeTaskIds.push(id);
    }

    return task;
  }

  public completeTask(id: string): void {
    const task = globalLiveOperationsStore.getTask(id);
    if (task) {
      task.status = 'completed';
      task.endedAt = new Date().toISOString();
      task.durationMs = Date.now() - new Date(task.startedAt).getTime();
      task.progress = 100;
    }
  }

  public failTask(id: string, reason: string): void {
    const task = globalLiveOperationsStore.getTask(id);
    if (task) {
      task.status = 'failed';
      task.endedAt = new Date().toISOString();
      task.durationMs = Date.now() - new Date(task.startedAt).getTime();
      task.attentionRequired = true;
      task.attentionReason = reason;

      globalEventBus.publish('LiveOperationsTaskFailed', { taskId: id, reason });
    }
  }

  public blockTask(id: string, reason: string): void {
    const task = globalLiveOperationsStore.getTask(id);
    if (task) {
      task.status = 'blocked';
      task.attentionRequired = true;
      task.attentionReason = reason;

      globalEventBus.publish('LiveOperationsTaskBlocked', { taskId: id, reason });
    }
  }
}

export const globalTaskTracker = new TaskTracker();
