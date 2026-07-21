import crypto from 'node:crypto';

export type PermissionRole = 'Administrator' | 'Operator' | 'Viewer';

export interface UserSession {
  username: string;
  role: PermissionRole;
  token: string;
  expiresAt: number;
}

export class SecurityManager {
  private activeSession: UserSession | null = null;
  private sessionStore: Map<string, UserSession> = new Map();

  constructor() {
    // Zero default sessions: initial state is strictly unauthenticated
    this.activeSession = null;
  }

  /**
   * Retrieves current active session. Returns null if unauthenticated or expired.
   */
  public getSession(): UserSession | null {
    if (!this.activeSession) {
      return null;
    }
    if (Date.now() > this.activeSession.expiresAt) {
      this.activeSession = null;
      return null;
    }
    return { ...this.activeSession };
  }

  /**
   * Explicit authentication to produce a UserSession with runtime-generated token and expiry.
   */
  public authenticate(username: string, role: PermissionRole, durationMs = 3600000): UserSession {
    const token = `session_${crypto.randomBytes(24).toString('hex')}`;
    const session: UserSession = {
      username,
      role,
      token,
      expiresAt: Date.now() + durationMs
    };
    this.sessionStore.set(token, session);
    this.activeSession = session;
    return { ...session };
  }

  /**
   * Re-authenticates an active session with a new role upon valid token verification.
   */
  public reauthenticateRole(token: string, newRole: PermissionRole): boolean {
    const session = this.sessionStore.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      return false;
    }
    session.role = newRole;
    if (this.activeSession?.token === token) {
      this.activeSession.role = newRole;
    }
    return true;
  }

  public logout(): void {
    if (this.activeSession) {
      this.sessionStore.delete(this.activeSession.token);
      this.activeSession = null;
    }
  }

  public checkPermission(action: string, requiredRole: PermissionRole): boolean {
    const session = this.getSession();
    if (!session) {
      return false;
    }

    const roleHierarchy: Record<PermissionRole, number> = {
      'Administrator': 3,
      'Operator': 2,
      'Viewer': 1
    };

    const userWeight = roleHierarchy[session.role] ?? 0;
    const requiredWeight = roleHierarchy[requiredRole] ?? 999;

    return userWeight >= requiredWeight;
  }
}

export const globalSecurityManager = new SecurityManager();
