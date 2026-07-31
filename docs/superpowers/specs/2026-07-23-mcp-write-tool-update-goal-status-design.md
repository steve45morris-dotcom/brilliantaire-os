# MCP Write Tool: `update_goal_status`

## Problem

The MCP tool surface (`src/integrations/openai/mcp/MCPToolRegistry.ts`) currently only exposes
read-only tools (`get_system_health`, `get_workspace_list`, `get_workspace_status`,
`get_project_goals`, `get_executive_brief`, `get_skill_registry`, `get_reports`). Every one of
them is gated by `MCPAuth.isValidToken()` alone — a flat valid/invalid check with no notion of
*who* the caller is or what they're allowed to do.

`GoalManager` (`src/executive/GoalManager.ts`) already has mutation methods —
`addGoal()` and `updateGoalStatus()` — backed by the SQLite persistence layer landed on this
branch, but nothing calls them from MCP. Adding the first write-capable MCP tool requires solving
authorization properly first: a flat valid/invalid token is not sufficient once a tool can change
state, since any client holding *any* valid token would otherwise be able to mutate goals.

`SecurityManager` (`src/kernel/security/SecurityManager.ts`) already models role-based
permissions (`Administrator` / `Operator` / `Viewer`) via an `actionPolicies` map and
`checkPermission()`, including an unused `'operator:manage_tasks': 'Operator'` entry — but
`checkPermission()` is hard-wired to the single live `SecurityManager` session
(`this.getSession()`), not to an arbitrary caller. An MCP client authenticating via a
long-lived MCP token is not necessarily the live session holder, so `checkPermission()` cannot be
reused as-is to authorize MCP write calls.

## Goal

Add one write-capable MCP tool, `update_goal_status`, that lets an authenticated MCP client with
sufficient role transition an existing goal's status — while establishing a reusable
role-on-token pattern so future write tools don't have to re-solve authorization.

## Approaches considered

1. **Stamp role on the MCP token at issuance (chosen).** Extend `IssuedToken` with a `role`
   field, captured from the issuing `SecurityManager` session (or `'Administrator'` for the
   `MCP_SECRET_KEY` env-secret fallback path, which is already the root bootstrap credential).
   Write tools check the stamped role against the existing `actionPolicies` map via new
   standalone helpers. Smallest diff; reuses the policy data already defined; makes every future
   write tool just a policy-key declaration + role check.
2. **Require the live session token directly for writes.** No token role; write handlers call
   `globalSecurityManager.getSession()` directly. Rejected — it would mean only the single active
   interactive session could ever perform a write, breaking the existing pattern where any valid
   MCP token can call read tools independent of a live session.
3. **Scope-based tokens.** Stamp an explicit `scopes: string[]` array on tokens instead of a
   role. Rejected as premature — there is one write action being introduced; a second permission
   model alongside the existing role/policy system is unwarranted complexity (YAGNI).

## Design

### 1. Token role model (`MCPAuth.ts`)

- `IssuedToken` gains `role: PermissionRole` (imported from `SecurityManager.ts`).
- `issueToken(callerTokenOrSecret, ttlMs)` stamps `role` at issuance:
  - Session-derived path → `role = session.role`.
  - `MCP_SECRET_KEY` env-secret fallback path → `role = 'Administrator'`.
- `isValidToken()` is unchanged (still returns boolean) — no behavior change for existing read
  tools.
- New `MCPAuth.getTokenRole(token): PermissionRole | null`:
  - Looks up `activeTokens`, returns the stamped role if present and unexpired.
  - If `token` matches the raw `MCP_SECRET_KEY` directly (the same bypass `isValidToken` already
    allows), returns `'Administrator'`.
  - Otherwise `null`.

### 2. Role-check helpers (`SecurityManager.ts`)

`checkPermission()` stays exactly as-is (still used for live-session checks elsewhere). Two new
standalone pieces are added rather than repurposing it:

- `getRequiredRoleForAction(action: string): PermissionRole` — public read of the existing
  `actionPolicies` map, defaulting to `'Administrator'` (same default `checkPermission` already
  uses).
- `static roleSatisfies(actual: PermissionRole, required: PermissionRole): boolean` — the role
  hierarchy comparison (`Administrator: 3, Operator: 2, Viewer: 1`) extracted from
  `checkPermission()`'s body, made reusable without a live session.

New policy entry: `'operator:manage_goals': 'Operator'`.

### 3. The `update_goal_status` MCP tool (`MCPToolRegistry.ts`)

```
name: 'update_goal_status'
description: 'Update the status of an existing goal. Requires Operator role.'
inputSchema: {
  goalId: { type: 'string' },
  status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
  token: { type: 'string' }
}
required: ['goalId', 'status']
```

Handler:

1. Resolve `authToken = args?.token || token`. If `!MCPAuth.isValidToken(authToken)`:
   audit-deny (`auditAccess('update_goal_status', false, 'Invalid or missing token')`), return
   `{ error: 'Authentication Required.' }`.
2. `const role = MCPAuth.getTokenRole(authToken)`. If `!role`: audit-deny, return
   `{ error: 'Authentication Required.' }` (defensive — shouldn't happen if step 1 passed).
3. `const required = globalSecurityManager.getRequiredRoleForAction('operator:manage_goals')`.
   If `!SecurityManager.roleSatisfies(role, required)`: audit-deny
   (`auditAccess('update_goal_status', false, 'Role ${role} < required ${required}')`), return
   `{ error: 'Insufficient permissions. Operator role required.' }`.
4. Validate `args.status` is one of `'pending' | 'in_progress' | 'completed'` — reject anything
   else with `{ error: 'Invalid status value.' }` (the input schema `enum` documents this for
   well-behaved clients, but the handler must not trust it).
5. Look up the goal via `globalGoalManager.getGoals().find(g => g.id === args.goalId)`. If not
   found, return `{ error: 'Goal not found.' }`. (`GoalManager.updateGoalStatus` silently
   no-ops on an unknown id — the tool must not report success in that case.)
6. Call `globalGoalManager.updateGoalStatus(args.goalId, args.status)`.
7. `auditAccess('update_goal_status', true, `goalId=${args.goalId} status=${goal.status}->${args.status}`)`.
8. Return the updated goal (re-fetched from `getGoals()`) as confirmation.

### 4. Audit trail

`MCPAuth.auditAccess(toolOrResource, success, detail)` is unchanged in signature — write call
sites simply pass a richer `detail` string (old→new status, goal id) than read call sites do.
No change required to the method itself.

## Testing

- Unit tests for `MCPAuth`: token role stamped correctly for session-derived and env-secret
  issuance paths; `getTokenRole` returns the right role / `null` for expired or unknown tokens.
- Unit tests for `SecurityManager`: `getRequiredRoleForAction` default and explicit-policy paths;
  `roleSatisfies` hierarchy comparisons (all 9 role pairs).
- Unit tests for the `update_goal_status` handler: success path (status updated + persisted +
  returned); auth-denied path (invalid token); permission-denied path (Viewer-role token);
  invalid-status path; goal-not-found path.
- Existing read-tool tests must continue passing unmodified (`isValidToken` behavior unchanged).

## Out of scope

- `add_goal` and any TaskTracker/LiveOperationsStore write tools — future work, same pattern.
- Rate limiting or write-specific token TTLs.
- UI/dashboard surfacing of MCP-issued goal changes.
