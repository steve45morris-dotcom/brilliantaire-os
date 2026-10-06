import { globalSessionTracker } from '../../src/kernel/live/SessionTracker.js';
import { globalTaskTracker } from '../../src/kernel/live/TaskTracker.js';
import { globalLiveOperationsStore } from '../../src/kernel/live/LiveOperationsStore.js';

export async function withLiveSession<T>(
  commandName: string,
  fn: () => Promise<T>
): Promise<T> {
  const sessionId = `cli-${Date.now()}`;
  const taskId = `task-${Date.now()}`;

  // Start CLI session
  globalSessionTracker.createSession(sessionId, 'cli', 'Commander');
  globalLiveOperationsStore.addEvent({
    id: `evt-rec-${Date.now()}`,
    type: 'command.received',
    timestamp: new Date().toISOString(),
    source: 'Terminal',
    actor: 'Commander',
    session: sessionId,
    task: taskId,
    severity: 'info',
    message: `Received CLI execution request for "${commandName}"`,
    data: {},
    attention: false
  });

  // Start Task tracker
  globalTaskTracker.startTask(taskId, sessionId, 'command', commandName);
  globalLiveOperationsStore.addEvent({
    id: `evt-disp-${Date.now()}`,
    type: 'command.dispatched',
    timestamp: new Date().toISOString(),
    source: 'Terminal',
    actor: 'Commander',
    session: sessionId,
    task: taskId,
    severity: 'info',
    message: `Dispatched CLI execution task "${commandName}"`,
    data: {},
    attention: false
  });

  try {
    const result = await fn();

    // Complete Task
    globalTaskTracker.completeTask(taskId);
    globalLiveOperationsStore.addEvent({
      id: `evt-comp-${Date.now()}`,
      type: 'command.completed',
      timestamp: new Date().toISOString(),
      source: 'Terminal',
      actor: 'Commander',
      session: sessionId,
      task: taskId,
      severity: 'info',
      message: `Completed CLI execution for "${commandName}" successfully`,
      data: {},
      attention: false
    });

    globalSessionTracker.closeSession(sessionId, 'completed');
    return result;
  } catch (error: any) {
    // Fail Task
    globalTaskTracker.failTask(taskId, error.message || 'Error occurred');
    globalLiveOperationsStore.addEvent({
      id: `evt-fail-${Date.now()}`,
      type: 'command.failed',
      timestamp: new Date().toISOString(),
      source: 'Terminal',
      actor: 'Commander',
      session: sessionId,
      task: taskId,
      severity: 'error',
      message: `Failed CLI execution for "${commandName}". Error: ${error.message}`,
      data: {},
      attention: true,
      error: error.message
    });

    globalSessionTracker.closeSession(sessionId, 'failed');
    throw error;
  }
}
