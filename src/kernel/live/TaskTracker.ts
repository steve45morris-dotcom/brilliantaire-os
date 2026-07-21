import { LiveTask } from './LiveOperationsTypes.js';
import { globalLiveOperationsStore } from './LiveOperationsStore.js';
import { globalEventBus } from '../events/EventBus.js';
import { exec } from 'node:child_process';

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

    // Call voice_narrative.sh announce_intent
    const announceScript = '/Users/alexanderanthony/.agents/voice_narrative.sh';
    const cleanName = name.replace(/"/g, '\\"');
    exec(`"${announceScript}" "${cleanName}"`, (err) => {
      if (err) console.warn(`[VNP Error] startTask announce failed: ${err.message}`);
    });

    return task;
  }

  public completeTask(id: string): void {
    const task = globalLiveOperationsStore.getTask(id);
    if (task) {
      task.status = 'completed';
      task.endedAt = new Date().toISOString();
      task.durationMs = Date.now() - new Date(task.startedAt).getTime();
      task.progress = 100;

      // Call voice_narrative.sh announce_completion
      const announceScript = '/Users/alexanderanthony/.agents/voice_narrative.sh';
      const cleanName = task.name.replace(/"/g, '\\"');
      const cmd = `bash -c "source '${announceScript}' && announce_completion '${cleanName}' '10'"`;
      exec(cmd, (err) => {
        if (err) console.warn(`[VNP Error] completeTask announce failed: ${err.message}`);
      });
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

      // Call voice_narrative.sh speak failure
      const announceScript = '/Users/alexanderanthony/.agents/voice_narrative.sh';
      const cleanName = task.name.replace(/"/g, '\\"');
      const cleanReason = reason.replace(/"/g, '\\"');
      const cmd = `bash -c "source '${announceScript}' && speak 'Task ${cleanName} failed due to ${cleanReason}' 'P2'"`;
      exec(cmd, (err) => {
        if (err) console.warn(`[VNP Error] failTask announce failed: ${err.message}`);
      });
    }
  }

  public blockTask(id: string, reason: string): void {
    const task = globalLiveOperationsStore.getTask(id);
    if (task) {
      task.status = 'blocked';
      task.attentionRequired = true;
      task.attentionReason = reason;

      globalEventBus.publish('LiveOperationsTaskBlocked', { taskId: id, reason });

      // Call voice_narrative.sh speak blocked
      const announceScript = '/Users/alexanderanthony/.agents/voice_narrative.sh';
      const cleanName = task.name.replace(/"/g, '\\"');
      const cleanReason = reason.replace(/"/g, '\\"');
      const cmd = `bash -c "source '${announceScript}' && speak 'Task ${cleanName} is blocked: ${cleanReason}' 'P2'"`;
      exec(cmd, (err) => {
        if (err) console.warn(`[VNP Error] blockTask announce failed: ${err.message}`);
      });
    }
  }
}

export const globalTaskTracker = new TaskTracker();
