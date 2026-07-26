import { CAPABILITIES_REQUIRING_APPROVAL, type Capability } from './capabilities.js';
import { ROLE_CAPABILITIES, type OrchestrationRole } from './roles.js';

export function hasCapability(role: OrchestrationRole, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export function requiresApproval(capability: Capability): boolean {
  return CAPABILITIES_REQUIRING_APPROVAL.includes(capability);
}

export function hasApproval(_runDir: string, _capability: Capability): boolean {
  throw new Error('Not implemented in Phase 0-3 — no gated capability is exercised by the Auditor role.');
}
