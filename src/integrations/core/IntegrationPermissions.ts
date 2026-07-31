import { IntegrationContract } from './IntegrationTypes.js';

export enum PermissionLevel {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

const WRITE_KEYWORDS = ['write', 'delete', 'admin', 'create', 'update', 'remove'];

export class IntegrationPermissions {
  /**
   * Returns true only for read-level actions.
   * All write/delete/admin actions are blocked by default (read-only framework).
   */
  public checkPermission(integration: IntegrationContract, action: string): boolean {
    if (this.requiresApproval(action)) {
      this.auditLog(integration.id, action, false);
      return false;
    }
    const granted = integration.permissions.includes(action) || integration.permissions.includes('read');
    this.auditLog(integration.id, action, granted);
    return granted;
  }

  public requiresApproval(action: string): boolean {
    const act = action.toLowerCase();
    return WRITE_KEYWORDS.some(keyword => act.includes(keyword));
  }

  public auditLog(integrationId: string, action: string, granted: boolean): void {
    const timestamp = new Date().toISOString();
    console.log(`[AUDIT][${timestamp}] integration=${integrationId} action=${action} granted=${granted}`);
  }
}

export const globalIntegrationPermissions = new IntegrationPermissions();

