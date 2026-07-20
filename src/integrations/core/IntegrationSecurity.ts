import { IntegrationContract } from './IntegrationTypes.js';

export class IntegrationSecurity {
  public verifyPermissions(integration: IntegrationContract, requiredPermission: string): boolean {
    // Read only permission gate checks
    if (requiredPermission.includes('write')) {
      // UIF is strictly read-only by default
      return false;
    }
    return integration.permissions.includes(requiredPermission);
  }
}

export const globalIntegrationSecurity = new IntegrationSecurity();
