import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  ALL_CAPABILITIES,
  CAPABILITIES_REQUIRING_APPROVAL,
  type Capability,
} from './capabilities.js';
import { hasCapability, requiresApproval } from './policy.js';
import { ROLE_CAPABILITIES, type OrchestrationRole } from './roles.js';

const AUDITOR_ALLOWED: readonly Capability[] = ['fs:read', 'process:diagnostic', 'git:read'];
const AUDITOR_DENIED_MUTATION_AND_NETWORK: readonly Capability[] = [
  'fs:write',
  'process:build',
  'git:stage',
  'git:commit',
  'git:push',
  'git:pr',
  'network:egress',
];
const APPROVAL_REQUIRED: readonly Capability[] = ['git:commit', 'git:push', 'git:pr'];

function walkTypeScript(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkTypeScript(target);
    return target.endsWith('.ts') ? [target] : [];
  });
}

describe('orchestration capability policy', () => {
  it('grants Auditor only the explicit read/diagnostic capabilities', () => {
    for (const capability of AUDITOR_ALLOWED) {
      expect(hasCapability('Auditor', capability), `Auditor should receive ${capability}`).toBe(true);
    }
    for (const capability of AUDITOR_DENIED_MUTATION_AND_NETWORK) {
      expect(hasCapability('Auditor', capability), `Auditor must be denied ${capability}`).toBe(false);
    }
  });

  it('classifies every capability, so a newly added capability cannot escape the Auditor assertion', () => {
    expect(new Set([...AUDITOR_ALLOWED, ...AUDITOR_DENIED_MUTATION_AND_NETWORK]))
      .toEqual(new Set(ALL_CAPABILITIES));
  });

  it('grants Publisher stage/commit/push/PR but denies filesystem writes', () => {
    for (const capability of ['git:stage', 'git:commit', 'git:push', 'git:pr'] as const) {
      expect(hasCapability('Publisher', capability)).toBe(true);
    }
    expect(hasCapability('Publisher', 'fs:write')).toBe(false);
  });

  it('grants Builder filesystem writes but denies commit and push', () => {
    expect(hasCapability('Builder', 'fs:write')).toBe(true);
    expect(hasCapability('Builder', 'git:commit')).toBe(false);
    expect(hasCapability('Builder', 'git:push')).toBe(false);
  });

  it('requires approval for exactly the three publish capabilities and no others', () => {
    expect(new Set(CAPABILITIES_REQUIRING_APPROVAL)).toEqual(new Set(APPROVAL_REQUIRED));
    for (const capability of ALL_CAPABILITIES) {
      expect(requiresApproval(capability)).toBe(APPROVAL_REQUIRED.includes(capability));
    }
  });

  it('has no current hasApproval call site for any role capability pair', () => {
    const allRolePairs = (Object.keys(ROLE_CAPABILITIES) as OrchestrationRole[])
      .flatMap(role => ROLE_CAPABILITIES[role].map(capability => ({ role, capability })));
    expect(allRolePairs).not.toHaveLength(0);

    const callers = walkTypeScript(path.resolve('orchestrator'))
      .filter(file => !file.endsWith(path.join('permissions', 'policy.ts')))
      .filter(file => /\bhasApproval\s*\(/.test(fs.readFileSync(file, 'utf8')));
    expect(callers).toEqual([]);
  });
});
