import { UUID, Session } from '@icyos/shared';
import { SessionRepository } from '@icyos/database';
export class SessionService {
  private sessionRepo: SessionRepository;
  constructor(sessionRepo?: SessionRepository) {
    this.sessionRepo = sessionRepo || new SessionRepository();
  }
  async startSession(workspaceId: UUID): Promise<Session> {
    return this.sessionRepo.startSession(workspaceId);
  }
  async completeSession(sessionId: UUID, score: number): Promise<boolean> {
    return true;
  }
}
