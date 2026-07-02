import { UUID, Session } from '@icyos/shared';
import { SessionRepository } from '@icyos/database';
export class SessionService {
  constructor(private sessionRepo: SessionRepository) {}
  async startSession(workspaceId: UUID): Promise<Session> {
    return this.sessionRepo.startSession(workspaceId);
  }
  async completeSession(sessionId: UUID, score: number): Promise<boolean> {
    return true;
  }
}
