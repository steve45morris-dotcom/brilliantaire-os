import { LiveSession } from './LiveOperationsTypes.js';
import { globalLiveOperationsStore } from './LiveOperationsStore.js';
import { globalLiveOperationsConfig } from './LiveOperationsConfig.js';
import { globalEventBus } from '../events/EventBus.js';

export class SessionTracker {
  public createSession(
    id: string,
    type: LiveSession['type'],
    actor = 'Commander',
    projectId = 'The One System'
  ): LiveSession {
    const session: LiveSession = {
      id,
      type,
      status: 'active',
      startedAt: new Date().toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
      endedAt: null,
      actor,
      origin: type === 'cli' ? 'Terminal' : 'Dashboard',
      projectId,
      workspaceId: '/Users/alexanderanthony',
      activeTaskIds: [],
      summary: `Active ${type} session created`
    };

    globalLiveOperationsStore.addSession(session);
    globalEventBus.publish('LiveOperationsSnapshotUpdated', { sessionId: id });
    return session;
  }

  public recordHeartbeat(id: string): void {
    const session = globalLiveOperationsStore.getSession(id);
    if (session && session.status === 'active') {
      session.lastHeartbeatAt = new Date().toISOString();
    }
  }

  public expireStaleSessions(): void {
    const now = Date.now();
    const timeout = globalLiveOperationsConfig.sessionTimeoutMs;
    const sessions = globalLiveOperationsStore.getSessions();

    sessions.forEach(session => {
      if (session.status === 'active') {
        const lastHeartbeat = new Date(session.lastHeartbeatAt).getTime();
        if (now - lastHeartbeat > timeout) {
          session.status = 'expired';
          session.endedAt = new Date().toISOString();
          globalEventBus.publish('LiveOperationsSessionExpired', { sessionId: session.id });
        }
      }
    });
  }

  public closeSession(id: string, status: LiveSession['status'] = 'completed'): void {
    const session = globalLiveOperationsStore.getSession(id);
    if (session) {
      session.status = status;
      session.endedAt = new Date().toISOString();
    }
  }
}

export const globalSessionTracker = new SessionTracker();
