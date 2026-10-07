import { LiveTask } from './LiveOperationsTypes.js';
import { globalLiveOperationsStore } from './LiveOperationsStore.js';
import { globalEventBus } from '../events/EventBus.js';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import { globalAgentExecutionTelemetry } from './AgentExecutionTelemetry.js';

const VOICE_BUFFER = '/Users/alexanderanthony/.agents/voice_buffer.txt';
const SPEAK_SCRIPT = '/Users/alexanderanthony/.agents/speak_serialized.sh';

function speak(msg: string, priority = 'P3'): void {
  const dateStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  try {
    fs.appendFileSync(VOICE_BUFFER, `${dateStr} - ${msg}\n`);
  } catch (e) {
    console.warn(`[VNP Warning] Failed to write to voice buffer: ${(e as Error).message}`);
  }
  
  execFile(SPEAK_SCRIPT, [msg, priority], (err) => {
    if (err) {
      console.warn(`[VNP Error] Speech execution failed: ${err.message}`);
    }
  });
}

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
    this.emitExecution('task.started', task);
    
    // Add task key to session list
    const session = globalLiveOperationsStore.getSession(sessionId);
    if (session) {
      session.activeTaskIds.push(id);
    }

    // Call voice narrative start hook safely
    speak(`Am ready to ignite the lighter. Initializing task: ${name}`, 'P3');

    return task;
  }

  public completeTask(id: string): void {
    const task = globalLiveOperationsStore.getTask(id);
    if (task) {
      task.status = 'completed';
      task.endedAt = new Date().toISOString();
      task.durationMs = Date.now() - new Date(task.startedAt).getTime();
      task.progress = 100;
      globalLiveOperationsStore.addTask(task);
      this.emitExecution('task.completed', task);

      // Call voice narrative completion hook safely
      speak(`Task Complete. ${task.name}. System sovereignty increased by 10 percent.`, 'P2');
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
      globalLiveOperationsStore.addTask(task);
      this.emitExecution('agent.failed', task, { error: reason });

      globalEventBus.publish('LiveOperationsTaskFailed', { taskId: id, reason });

      // Call voice narrative failure hook safely
      speak(`Task ${task.name} failed due to ${reason}`, 'P2');
    }
  }

  public blockTask(id: string, reason: string): void {
    const task = globalLiveOperationsStore.getTask(id);
    if (task) {
      task.status = 'blocked';
      task.attentionRequired = true;
      task.attentionReason = reason;
      globalLiveOperationsStore.addTask(task);
      this.emitExecution('task.blocked', task, { blockedReason: reason });

      globalEventBus.publish('LiveOperationsTaskBlocked', { taskId: id, reason });

      // Call voice narrative blocked hook safely
      speak(`Task ${task.name} is blocked: ${reason}`, 'P2');
    }
  }

  public updateProgress(id: string, progress: number): void {
    const task = globalLiveOperationsStore.getTask(id);
    if (!task || !Number.isFinite(progress) || progress < 0 || progress > 100) return;
    task.progress = progress;
    globalLiveOperationsStore.addTask(task);
    this.emitExecution('task.progress', task, { progress });
  }

  private emitExecution(type: Parameters<typeof globalAgentExecutionTelemetry.record>[0], task: LiveTask, extra: Record<string, unknown> = {}): void {
    const event = globalAgentExecutionTelemetry.record(type, {
      agentId: task.agentId || task.sessionId,
      agentName: task.agentId || task.sessionId,
      missionId: task.workflowId || task.sessionId,
      taskId: task.id,
      taskName: task.name,
      skill: task.skillId,
      ...extra
    });
    globalLiveOperationsStore.addEvent(event);
  }
}

export const globalTaskTracker = new TaskTracker();
