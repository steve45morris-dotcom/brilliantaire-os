export type PermissionRole = 'Administrator' | 'Operator' | 'Viewer';

export interface UserSession {
  username: string;
  role: PermissionRole;
  token: string;
}

export class SecurityManager {
  private activeSession: UserSession;

  constructor() {
    // Default session context mapping
    this.activeSession = {
      username: 'Icyflamze',
      role: 'Administrator',
      token: 'osk_session_token_icy_2026'
    };
  }

  public getSession(): UserSession {
    return { ...this.activeSession };
  }

  public checkPermission(action: string, requiredRole: PermissionRole): boolean {
    const roleHierarchy: Record<PermissionRole, number> = {
      'Administrator': 3,
      'Operator': 2,
      'Viewer': 1
    };

    const userWeight = roleHierarchy[this.activeSession.role];
    const requiredWeight = roleHierarchy[requiredRole];

    return userWeight >= requiredWeight;
  }

  public switchRole(role: PermissionRole): void {
    this.activeSession.role = role;
  }
}

export const globalSecurityManager = new SecurityManager();
