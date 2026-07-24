# update_goal_status MCP Write Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first write-capable MCP tool, `update_goal_status`, gated by a new role-on-token authorization model, per `docs/superpowers/specs/2026-07-23-mcp-write-tool-update-goal-status-design.md`.

**Architecture:** Stamp a `PermissionRole` onto each `IssuedToken` at issuance time in `MCPAuth`. Add two standalone role-check helpers to `SecurityManager` (`getRequiredRoleForAction`, static `roleSatisfies`) rather than reusing `checkPermission`, which is hard-wired to the single live session and cannot authorize an arbitrary MCP token holder. Wire a new `update_goal_status` tool into `MCPToolRegistry` that checks token validity, then role, then input validity, then goal existence, before calling the existing `GoalManager.updateGoalStatus()`.

**Tech Stack:** TypeScript (NodeNext modules — relative imports use `.js` extensions even in `.ts` source), Vitest (`npm test` / `npx vitest run <file>`), better-sqlite3 (via `src/db.ts`).

## Global Constraints

- Relative imports must use `.js` extensions (NodeNext module resolution) — matches every existing import in these files.
- Role hierarchy weights are fixed: `Administrator: 3, Operator: 2, Viewer: 1` — copy exactly, do not renumber.
- `MCPAuth.isValidToken()` and `SecurityManager.checkPermission()` signatures and behavior must not change — existing read tools and existing tests depend on them as-is.
- `MCPAuth.auditAccess(toolOrResource: string, success: boolean, detail = '')` signature must not change — only the `detail` string content varies at new call sites.
- Tests run against the real `supernova.db` at repo root (no test DB override exists in this codebase) — follow the existing pattern in `src/persistence-verification.test.ts` of creating fresh records per test rather than relying on a clean table.
- No `console.log` in new code (existing `console.log` inside `auditAccess` is pre-existing and untouched).

---

### Task 1: SecurityManager role-check helpers

**Files:**
- Modify: `src/kernel/security/SecurityManager.ts`
- Test: `src/kernel/security/SecurityHardening.test.ts`

**Interfaces:**
- Produces: `SecurityManager.getRequiredRoleForAction(action: string): PermissionRole` (instance method), `static SecurityManager.roleSatisfies(actual: PermissionRole, required: PermissionRole): boolean`, new `actionPolicies` entry `'operator:manage_goals': 'Operator'`.

- [ ] **Step 1: Write the failing tests**

Add this new `describe` block to `src/kernel/security/SecurityHardening.test.ts`, immediately before the final closing `});` of the outer `describe('Security Hardening & Authentication Verification Tests', ...)` block (i.e., right after the existing `describe('MCPAuth.issueToken()', ...)` block ends):

```typescript
  describe('SecurityManager.getRequiredRoleForAction()', () => {
    it('returns the policy role for a known action', () => {
      const sm = new SecurityManager();
      expect(sm.getRequiredRoleForAction('operator:manage_goals')).toBe('Operator');
      expect(sm.getRequiredRoleForAction('operator:manage_tasks')).toBe('Operator');
      expect(sm.getRequiredRoleForAction('admin:system_reset')).toBe('Administrator');
    });

    it('defaults to Administrator for an unknown action', () => {
      const sm = new SecurityManager();
      expect(sm.getRequiredRoleForAction('some:unregistered_action')).toBe('Administrator');
    });
  });

  describe('SecurityManager.roleSatisfies()', () => {
    it('allows a role to satisfy its own tier and lower tiers', () => {
      expect(SecurityManager.roleSatisfies('Administrator', 'Administrator')).toBe(true);
      expect(SecurityManager.roleSatisfies('Administrator', 'Operator')).toBe(true);
      expect(SecurityManager.roleSatisfies('Administrator', 'Viewer')).toBe(true);
      expect(SecurityManager.roleSatisfies('Operator', 'Operator')).toBe(true);
      expect(SecurityManager.roleSatisfies('Operator', 'Viewer')).toBe(true);
      expect(SecurityManager.roleSatisfies('Viewer', 'Viewer')).toBe(true);
    });

    it('denies a role that does not meet a higher tier', () => {
      expect(SecurityManager.roleSatisfies('Operator', 'Administrator')).toBe(false);
      expect(SecurityManager.roleSatisfies('Viewer', 'Operator')).toBe(false);
      expect(SecurityManager.roleSatisfies('Viewer', 'Administrator')).toBe(false);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/kernel/security/SecurityHardening.test.ts`
Expected: FAIL — `sm.getRequiredRoleForAction is not a function` and `SecurityManager.roleSatisfies is not a function`.

- [ ] **Step 3: Implement the helpers**

In `src/kernel/security/SecurityManager.ts`, insert a module-level `ROLE_HIERARCHY` constant right after the `timingSafeCompare` function and before `export class SecurityManager {`:

```typescript
const ROLE_HIERARCHY: Record<PermissionRole, number> = {
  'Administrator': 3,
  'Operator': 2,
  'Viewer': 1
};
```

Add the new policy entry to `actionPolicies` (inside the existing object literal):

```typescript
  private actionPolicies: Record<string, PermissionRole> = {
    'mcp:issue_token': 'Operator',
    'admin:system_reset': 'Administrator',
    'admin:configure_secret': 'Administrator',
    'operator:manage_tasks': 'Operator',
    'operator:manage_goals': 'Operator',
    'viewer:read_status': 'Viewer'
  };
```

Replace the body of `checkPermission` to reuse `ROLE_HIERARCHY` instead of its local copy, and add the two new methods immediately after it (still inside the class, before the closing `}`):

```typescript
  public checkPermission(action: string, requiredRole?: PermissionRole): boolean {
    const session = this.getSession();
    if (!session) {
      return false;
    }

    // Wire action into per-action policy lookup
    const minRequiredRole: PermissionRole = requiredRole || this.actionPolicies[action] || 'Administrator';

    const userWeight = ROLE_HIERARCHY[session.role] ?? 0;
    const requiredWeight = ROLE_HIERARCHY[minRequiredRole] ?? 999;

    return userWeight >= requiredWeight;
  }

  /**
   * Public read of the action->role policy map, for callers that need to
   * check a role against a policy without going through a live session
   * (e.g. an MCP token holder that isn't the session owner).
   */
  public getRequiredRoleForAction(action: string): PermissionRole {
    return this.actionPolicies[action] || 'Administrator';
  }

  public static roleSatisfies(actual: PermissionRole, required: PermissionRole): boolean {
    const actualWeight = ROLE_HIERARCHY[actual] ?? 0;
    const requiredWeight = ROLE_HIERARCHY[required] ?? 999;
    return actualWeight >= requiredWeight;
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/kernel/security/SecurityHardening.test.ts`
Expected: PASS — all tests in the file, including the pre-existing ones (unchanged behavior).

- [ ] **Step 5: Commit**

```bash
git add src/kernel/security/SecurityManager.ts src/kernel/security/SecurityHardening.test.ts
git commit -m "feat(security): add getRequiredRoleForAction and roleSatisfies helpers

Enables role checks against the actionPolicies map for callers that
aren't the live SecurityManager session holder (e.g. MCP token
callers). checkPermission() is unchanged and still session-bound."
```

---

### Task 2: MCPAuth token role stamping

**Files:**
- Modify: `src/integrations/openai/mcp/MCPAuth.ts`
- Test: `src/kernel/security/SecurityHardening.test.ts`

**Interfaces:**
- Consumes: `PermissionRole` type from `src/kernel/security/SecurityManager.ts` (Task 1); `globalSecurityManager.getSession()` and `globalSecurityManager.checkPermission()` (existing, unchanged).
- Produces: `IssuedToken.role: PermissionRole`; `MCPAuth.getTokenRole(token?: string): PermissionRole | null`.

- [ ] **Step 1: Write the failing tests**

Add this block to `src/kernel/security/SecurityHardening.test.ts`, inside the existing `describe('MCPAuth.issueToken()', ...)` block, after its last `it(...)`:

```typescript
    it('stamps Administrator role on an env-secret-issued token', () => {
      const token = MCPAuth.issueToken('test-mcp-secret-key-99999')!;
      expect(MCPAuth.getTokenRole(token)).toBe('Administrator');
    });

    it('stamps the session role on a session-derived token (Operator)', () => {
      const session = globalSecurityManager.authenticate('opuser', 'test-operator-secret-key-67890', 'Operator');
      const token = MCPAuth.issueToken(session!.token)!;
      expect(MCPAuth.getTokenRole(token)).toBe('Operator');
      globalSecurityManager.logout();
    });

    it('stamps the session role on a session-derived token (Administrator)', () => {
      const session = globalSecurityManager.authenticate('adminuser', 'test-admin-secret-key-12345', 'Administrator');
      const token = MCPAuth.issueToken(session!.token)!;
      expect(MCPAuth.getTokenRole(token)).toBe('Administrator');
      globalSecurityManager.logout();
    });
```

Add this new `describe` block right after the `describe('MCPAuth.issueToken()', ...)` block closes, still before the outer describe's final `});`:

```typescript
  describe('MCPAuth.getTokenRole()', () => {
    it('returns null for an unknown or missing token', () => {
      expect(MCPAuth.getTokenRole('not-a-real-token')).toBeNull();
      expect(MCPAuth.getTokenRole(undefined)).toBeNull();
    });

    it('returns Administrator when passed the raw env secret directly', () => {
      expect(MCPAuth.getTokenRole('test-mcp-secret-key-99999')).toBe('Administrator');
    });
  });
```

Add `globalSecurityManager` to the existing import from `./SecurityManager.js` at the top of the file (currently `import { SecurityManager, timingSafeCompare } from './SecurityManager.js';`):

```typescript
import { SecurityManager, timingSafeCompare, globalSecurityManager } from './SecurityManager.js';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/kernel/security/SecurityHardening.test.ts`
Expected: FAIL — `MCPAuth.getTokenRole is not a function`, and the stamping tests fail because `IssuedToken` has no `role` to read (once `getTokenRole` exists in step 4 below, these two categories of failure resolve together).

- [ ] **Step 3: Implement role stamping**

In `src/integrations/openai/mcp/MCPAuth.ts`, update the import and `IssuedToken` interface:

```typescript
import crypto from 'node:crypto';
import { globalSecurityManager, PermissionRole } from '../../../kernel/security/SecurityManager.js';

export interface IssuedToken {
  token: string;
  issuedAt: number;
  expiresAt: number;
  role: PermissionRole;
}
```

Replace the body of `issueToken` to stamp the role, and add `getTokenRole` right after `isValidToken`:

```typescript
  public static issueToken(callerTokenOrSecret?: string, ttlMs = 3600000): string | null {
    let authorized = false;
    let role: PermissionRole = 'Administrator';

    // 1. Check if caller has an active SecurityManager session with sufficient role
    const session = globalSecurityManager.getSession();
    if (session && callerTokenOrSecret && timingSafeCompare(session.token, callerTokenOrSecret)) {
      if (globalSecurityManager.checkPermission('mcp:issue_token')) {
        authorized = true;
        role = session.role;
      }
    }

    // 2. Check explicit env secret fallback using timingSafeCompare
    const envSecret = process.env.MCP_SECRET_KEY;
    if (!authorized && envSecret && callerTokenOrSecret && timingSafeCompare(envSecret, callerTokenOrSecret)) {
      authorized = true;
      role = 'Administrator';
    }

    if (!authorized) {
      console.warn('[MCPAuth] Unauthorized attempt to issue runtime MCP token.');
      return null;
    }

    const token = `mcp_rt_${crypto.randomBytes(32).toString('hex')}`;
    const now = Date.now();
    this.activeTokens.set(token, {
      token,
      issuedAt: now,
      expiresAt: now + ttlMs,
      role
    });
    return token;
  }

  public static revokeToken(token: string): void {
    this.activeTokens.delete(token);
  }

  public static isValidToken(token?: string): boolean {
    if (!token) return false;

    // 1. Check dynamic runtime issued tokens with expiration check
    const issued = this.activeTokens.get(token);
    if (issued) {
      if (Date.now() > issued.expiresAt) {
        this.activeTokens.delete(token);
        return false;
      }
      return true;
    }

    // 2. Check env-configured MCP_SECRET_KEY secret if set using timing-safe comparison
    const envSecret = process.env.MCP_SECRET_KEY;
    if (envSecret && envSecret.trim().length > 0 && timingSafeCompare(envSecret, token)) {
      return true;
    }

    return false;
  }

  /**
   * Resolves the role associated with a valid token, for write-tool
   * authorization checks. Mirrors isValidToken's two acceptance paths.
   */
  public static getTokenRole(token?: string): PermissionRole | null {
    if (!token) return null;

    const issued = this.activeTokens.get(token);
    if (issued) {
      if (Date.now() > issued.expiresAt) {
        this.activeTokens.delete(token);
        return null;
      }
      return issued.role;
    }

    const envSecret = process.env.MCP_SECRET_KEY;
    if (envSecret && envSecret.trim().length > 0 && timingSafeCompare(envSecret, token)) {
      return 'Administrator';
    }

    return null;
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/kernel/security/SecurityHardening.test.ts`
Expected: PASS — all tests in the file.

- [ ] **Step 5: Commit**

```bash
git add src/integrations/openai/mcp/MCPAuth.ts src/kernel/security/SecurityHardening.test.ts
git commit -m "feat(mcp): stamp PermissionRole on issued MCP tokens

Session-derived tokens inherit the issuing session's role;
env-secret-issued tokens are stamped Administrator, matching the
existing trust level of that bootstrap credential. Adds
getTokenRole() for write-tool authorization checks."
```

---

### Task 3: `update_goal_status` MCP tool

**Files:**
- Modify: `src/integrations/openai/mcp/MCPToolRegistry.ts`
- Test: Create `src/integrations/openai/mcp/MCPToolRegistry.test.ts`

**Interfaces:**
- Consumes: `MCPAuth.isValidToken(token?: string): boolean`, `MCPAuth.getTokenRole(token?: string): PermissionRole | null` (Task 2); `SecurityManager.roleSatisfies(actual, required): boolean`, `globalSecurityManager.getRequiredRoleForAction(action: string): PermissionRole` (Task 1); `globalGoalManager.getGoals(): GoalItem[]`, `globalGoalManager.updateGoalStatus(id: string, status: GoalItem['status']): void` (existing, unchanged).
- Produces: `update_goal_status` tool registered in `MCPToolRegistry.tools`, callable via `MCPToolRegistry.executeTool('update_goal_status', args, token)`.

- [ ] **Step 1: Write the failing tests**

Create `src/integrations/openai/mcp/MCPToolRegistry.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPToolRegistry } from './MCPToolRegistry.js';
import { MCPAuth } from './MCPAuth.js';
import { globalGoalManager } from '../../../executive/GoalManager.js';
import { getDB } from '../../../db.js';

describe('MCPToolRegistry: update_goal_status', () => {
  const ORIGINAL_ENV = process.env;
  let adminToken: string;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.MCP_SECRET_KEY = 'test-mcp-secret-key-goalstatus';
    adminToken = MCPAuth.issueToken('test-mcp-secret-key-goalstatus')!;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it('updates an existing goal status and persists it to SQLite', async () => {
    const created = globalGoalManager.addGoal('MCP_TEST_GOAL_SUCCESS', 'Test Project');

    const result = await MCPToolRegistry.executeTool('update_goal_status', {
      goalId: created.id,
      status: 'completed',
      token: adminToken
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe('completed');

    const db = getDB();
    const row = db.prepare('SELECT status FROM executive_goals WHERE id = ?').get(created.id) as { status: string };
    expect(row.status).toBe('completed');
  });

  it('rejects an invalid or missing token', async () => {
    const result = await MCPToolRegistry.executeTool('update_goal_status', {
      goalId: 'goal-1',
      status: 'completed',
      token: 'not-a-real-token'
    });

    expect(result).toEqual({ error: 'Authentication Required.' });
  });

  it('rejects a token with insufficient role', async () => {
    vi.spyOn(MCPAuth, 'getTokenRole').mockReturnValueOnce('Viewer');
    const created = globalGoalManager.addGoal('MCP_TEST_GOAL_PERMS', 'Test Project');

    const result = await MCPToolRegistry.executeTool('update_goal_status', {
      goalId: created.id,
      status: 'completed',
      token: adminToken
    });

    expect(result).toEqual({ error: 'Insufficient permissions. Operator role required.' });
  });

  it('rejects an invalid status value', async () => {
    const created = globalGoalManager.addGoal('MCP_TEST_GOAL_STATUS', 'Test Project');

    const result = await MCPToolRegistry.executeTool('update_goal_status', {
      goalId: created.id,
      status: 'archived',
      token: adminToken
    });

    expect(result).toEqual({ error: 'Invalid status value.' });
  });

  it('returns an error when the goal does not exist', async () => {
    const result = await MCPToolRegistry.executeTool('update_goal_status', {
      goalId: 'goal-does-not-exist',
      status: 'completed',
      token: adminToken
    });

    expect(result).toEqual({ error: 'Goal not found.' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/integrations/openai/mcp/MCPToolRegistry.test.ts`
Expected: FAIL — `Tool "update_goal_status" is not registered in MCP Registry.`

- [ ] **Step 3: Implement the tool**

In `src/integrations/openai/mcp/MCPToolRegistry.ts`, add `globalSecurityManager` and `SecurityManager` to the imports:

```typescript
import { MCPTool } from './MCPTypes.js';
import { MCPAuth } from './MCPAuth.js';
import { globalHealthMonitor } from '../../../kernel/monitoring/HealthMonitor.js';
import { globalWorkspaceRegistry } from '../../../workspaces/WorkspaceRegistry.js';
import fs from 'node:fs';
import { globalGoalManager } from '../../../executive/GoalManager.js';
import { globalLiveOperationsStore } from '../../../kernel/live/LiveOperationsStore.js';
import { globalGraphStore } from '../../../knowledge/GraphStore.js';
import { globalSecurityManager, SecurityManager } from '../../../kernel/security/SecurityManager.js';
```

Add the new tool entry to the `tools` Map, immediately after the `'get_reports'` entry (i.e. immediately before the closing `]);` that ends the Map literal):

```typescript
    [
      'update_goal_status',
      {
        name: 'update_goal_status',
        description: 'Update the status of an existing goal. Requires Operator role.',
        inputSchema: {
          type: 'object',
          properties: {
            goalId: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
            token: { type: 'string' }
          },
          required: ['goalId', 'status']
        },
        handler: async (args, token) => {
          const authToken = args?.token || token;

          if (!MCPAuth.isValidToken(authToken)) {
            MCPAuth.auditAccess('update_goal_status', false, 'Invalid or missing token');
            return { error: 'Authentication Required.' };
          }

          const role = MCPAuth.getTokenRole(authToken);
          if (!role) {
            MCPAuth.auditAccess('update_goal_status', false, 'Invalid or missing token');
            return { error: 'Authentication Required.' };
          }

          const requiredRole = globalSecurityManager.getRequiredRoleForAction('operator:manage_goals');
          if (!SecurityManager.roleSatisfies(role, requiredRole)) {
            MCPAuth.auditAccess('update_goal_status', false, `Role ${role} < required ${requiredRole}`);
            return { error: 'Insufficient permissions. Operator role required.' };
          }

          const validStatuses = ['pending', 'in_progress', 'completed'];
          if (!validStatuses.includes(args?.status)) {
            MCPAuth.auditAccess('update_goal_status', false, `Invalid status value: ${args?.status}`);
            return { error: 'Invalid status value.' };
          }

          const goal = globalGoalManager.getGoals().find(g => g.id === args.goalId);
          if (!goal) {
            MCPAuth.auditAccess('update_goal_status', false, `Goal not found: ${args?.goalId}`);
            return { error: 'Goal not found.' };
          }

          const previousStatus = goal.status;
          globalGoalManager.updateGoalStatus(args.goalId, args.status);
          MCPAuth.auditAccess('update_goal_status', true, `goalId=${args.goalId} status=${previousStatus}->${args.status}`);
          return { ...goal };
        }
      }
    ]
```

Note: `goal` is the same object reference held inside `globalGoalManager`'s internal array (`getGoals()` shallow-copies the array but not its items), so after `updateGoalStatus()` runs, `goal.status` already reflects the new value — `{ ...goal }` returns it correctly without a second lookup.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/integrations/openai/mcp/MCPToolRegistry.test.ts`
Expected: PASS — all 5 tests.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS — no regressions in any other test file.

- [ ] **Step 6: Commit**

```bash
git add src/integrations/openai/mcp/MCPToolRegistry.ts src/integrations/openai/mcp/MCPToolRegistry.test.ts
git commit -m "feat(mcp): add update_goal_status write tool

First write-capable MCP tool. Requires Operator role (checked via
MCPAuth.getTokenRole + SecurityManager.roleSatisfies), validates
status against the closed enum, and rejects unknown goal ids rather
than silently no-oping like GoalManager.updateGoalStatus does."
```

## Self-Review Notes

- **Spec coverage:** Token role model → Task 1 + 2. `getRequiredRoleForAction`/`roleSatisfies` → Task 1. `update_goal_status` handler (auth → role → status validation → existence check → mutate → audit → return) → Task 3. Audit detail enrichment → Task 3 (richer `detail` strings at the new call site only, `auditAccess` signature untouched). All spec sections covered.
- **Type consistency:** `PermissionRole` flows from `SecurityManager.ts` (Task 1) → `MCPAuth.ts` `IssuedToken.role` and `getTokenRole()` return type (Task 2) → consumed in `MCPToolRegistry.ts` via `SecurityManager.roleSatisfies` and `getRequiredRoleForAction` (Task 3) — same type, same import path, no renaming across tasks.
- **Known limitation, not a defect:** a Viewer-role MCP token cannot currently be minted through `MCPAuth.issueToken()` (it requires `mcp:issue_token`, an Operator+ action), so the "insufficient role" branch of `update_goal_status` is exercised in Task 3 via `vi.spyOn(MCPAuth, 'getTokenRole')` rather than a real end-to-end Viewer token. The branch itself is real defensive code — this is a testing seam, not a design gap — and `SecurityManager.roleSatisfies` is exhaustively tested at the unit level in Task 1 regardless.
