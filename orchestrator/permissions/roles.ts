import type { Capability } from './capabilities.js';

export type OrchestrationRole = 'Auditor' | 'Builder' | 'Verifier' | 'Publisher';

export const ROLE_CAPABILITIES: Record<OrchestrationRole, readonly Capability[]> = {
  Auditor: ['fs:read', 'process:diagnostic', 'git:read'],
  Builder: ['fs:read', 'fs:write', 'process:diagnostic', 'process:build', 'git:read'],
  Verifier: ['fs:read', 'process:diagnostic', 'process:build', 'git:read'],
  Publisher: ['fs:read', 'git:read', 'git:stage', 'git:commit', 'git:push', 'git:pr'],
};
