import { ConversationContext } from './ConversationContext.js';

export interface UserSession {
  sessionId: string;
  context: ConversationContext;
  lastActive: string;
}

export class SessionManager {
  private sessions: Map<string, UserSession> = new Map();

  public getOrCreateSession(sessionId: string): UserSession {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        context: new ConversationContext(),
        lastActive: new Date().toISOString()
      };
      this.sessions.set(sessionId, session);
    } else {
      session.lastActive = new Date().toISOString();
    }
    return session;
  }

  public getSessions(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  public deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

export const globalSessionManager = new SessionManager();
