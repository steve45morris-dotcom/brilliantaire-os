# Local Multi-Agent Orchestration — Phase 0–3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 0 (repository snapshot) → Phase 1 (Auditor via Codex CLI) → Phase 2 (independent reconciliation) → Phase 3 (Commander approval gate), ending at `approved_claims.json`. No file mutation, no git mutation, anywhere in this scope. Builder/Verifier/Publisher are out of scope — only their type interfaces exist (already specified in the design doc, not implemented here).

**Architecture:** Per `docs/superpowers/specs/2026-07-24-agent-orchestration-system-design.md`. New `orchestrator/` directory, zero dependency on `src/`. Orchestration roles (Auditor/Builder/Verifier/Publisher) are a capability-based system independent of `SecurityManager`'s `PermissionRole`. All subprocess execution via `execFile(executable, argv)` — never `exec()`, never `shell: true`, never `bash -lc`/`sh -c`.

**Tech Stack:** TypeScript (NodeNext modules, `.js` extensions on relative imports), Vitest, Node built-in `child_process.execFile`, Node built-in `crypto` (sha256), Node built-in `readline/promises`, `zod` (new dependency).

## Global Constraints

- Relative imports use `.js` extensions (NodeNext), matching every existing file in this repo.
- No `console.log` in library code (`orchestrator/**`); CLI output (`scripts/orchestrator-cli.ts`) is the one place stdout is the point.
- No `exec()`, no `shell: true`, no `bash -lc`, no `sh -c` anywhere under `orchestrator/`. Enforced by a dedicated grep-based test (Task 9).
- `runs/` is added to `.gitignore` — these are runtime evidence artifacts, not source.
- Only `orchestrator/evidence/capture.ts` may open a write handle targeting a path under `<runDir>/raw/`. No other module holds a writable reference to that path.
- `manifest.json` is written exactly once per run, in Phase 0, and never reopened for writing.
- Phase 0 is fail-closed for commit, branch, and `git status --porcelain=v1`. No configured `origin` is valid and records `remote: null`; a configured-but-unreadable origin hard-fails. Do not copy `scripts/generate-evidence.ts:25-28`, which warns and continues without complete repository identity.
- Phase 2 resolves verification targets before execution. A target inside the agent-writable output path is recorded as `SELF_SPECIFIED` and caps the entry at `VERIFIED_WITH_CONDITIONS`.
- Claims carry `depends_on: string[]`; validation rejects unknown IDs. Phase 3 evaluates dependencies recursively against approved claim IDs. `NOT_TESTABLE` requires an agent-supplied claim justification and is excluded from bulk approval.
- `process` verification allowlist: `ls`, `cat`, `wc`, `comm`, `diff`, `grep`, `shasum`, `sha256sum`. Do not allow `git` or `find`; use typed `git_diff` and `git_status` instructions instead.
- Tests never touch the real `/Users/alexanderanthony` repo — fixture repos are created in `os.tmpdir()` per test and cleaned up after.

## Reuse decisions

| Existing artifact | Decision | Recorded reason |
|---|---|---|
| `scripts/subagent_orchestrator.py` | **Supersede** | It synthesizes code at `:162-164`, writes it at `:166-167`, executes it at `:171-180`, and captures child output at `:182-206`. It remains unchanged as a legacy tool because the new harness must never execute synthesized code; its process/session/capture pattern is reference only. |
| `scripts/generate-evidence.ts` | **Extend / port** | Use its timestamped evidence-run, manifest, and log-capture concepts for Phase 0/2. Do not port its warning-and-continue metadata behavior at lines 25-28; incomplete repo state is a hard stop. |
| `PHANTOM_CLAIMS_REGISTER.md` | **Supersede as non-infrastructure** | C4 is ABSENT: it is an agent scratch artifact, not executable structured claim-record infrastructure. Phase 2 remains new work. |

---

### Task 1: Core types, run paths, repo state, and Phase 0 manifest

**Files:**
- Create: `orchestrator/core/types.ts`
- Create: `orchestrator/core/runPaths.ts`
- Create: `orchestrator/core/repoState.ts`
- Create: `orchestrator/core/manifest.ts`
- Test: `orchestrator/core/runPaths.test.ts`
- Test: `orchestrator/core/repoState.test.ts`
- Test: `orchestrator/core/manifest.test.ts`

**Interfaces:**
- Produces: `RepoIdentity`, `RunManifest`, `StateSnapshot`, `RepoStateComparisonResult`, `Phase` types; `createRunDir(kind: string, now?: Date): string`; `captureRepoIdentity(repoRoot: string): Promise<RepoIdentity>` that rejects when commit, branch, porcelain status, or a configured origin URL cannot be captured, but records `remote: null` when no origin exists; `compareRepoIdentity(baseline: RepoIdentity, current: RepoIdentity): RepoStateComparisonResult`; `writePhase0Manifest(repoRoot: string, runKind: string): Promise<{ runDir: string; manifest: RunManifest }>`.

- [ ] **Step 1: Write the failing tests**

`orchestrator/core/runPaths.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRunDir } from './runPaths.js';

describe('createRunDir', () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-runpaths-'));
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('creates a runs/<kind>-<timestamp>/ directory under the given root', () => {
    const now = new Date('2026-07-24T15:30:00.000Z');
    const runDir = createRunDir('audit', now, tmpRoot);
    expect(fs.existsSync(runDir)).toBe(true);
    expect(path.basename(runDir)).toMatch(/^audit-20260724-\d{6}$/);
    expect(path.dirname(runDir)).toBe(path.join(tmpRoot, 'runs'));
  });

  it('never overwrites an existing run directory, appends a numeric suffix instead', () => {
    const now = new Date('2026-07-24T15:30:00.000Z');
    const first = createRunDir('audit', now, tmpRoot);
    const second = createRunDir('audit', now, tmpRoot);
    expect(second).not.toBe(first);
    expect(path.basename(second)).toMatch(/^audit-20260724-\d{6}-2$/);
    expect(fs.existsSync(first)).toBe(true);
    expect(fs.existsSync(second)).toBe(true);
  });
});
```

`orchestrator/core/repoState.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { captureRepoIdentity, compareRepoIdentity } from './repoState.js';

function initFixtureRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-repostate-'));
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  execFileSync('git', ['remote', 'add', 'origin', 'https://example.invalid/orch-fixture.git'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'README.md'), 'hello\n');
  execFileSync('git', ['add', 'README.md'], { cwd: dir });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: dir });
  return dir;
}

describe('captureRepoIdentity / compareRepoIdentity', () => {
  let repo: string;

  beforeEach(() => {
    repo = initFixtureRepo();
  });

  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
  });

  it('captures branch, commit, origin remote, and a clean working-tree status hash', async () => {
    const identity = await captureRepoIdentity(repo);
    expect(identity.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(identity.repoRoot).toBe(repo);
    expect(identity.remote).toBe('https://example.invalid/orch-fixture.git');
    expect(identity.workingTreeStatusHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('records remote null when the fixture has no origin', async () => {
    execFileSync('git', ['remote', 'remove', 'origin'], { cwd: repo });
    const identity = await captureRepoIdentity(repo);
    expect(identity.remote).toBeNull();
  });

  it('compares two identical snapshots as MATCH', async () => {
    const a = await captureRepoIdentity(repo);
    const b = await captureRepoIdentity(repo);
    expect(compareRepoIdentity(a, b)).toEqual({ status: 'MATCH' });
  });

  it('detects a commit change as DRIFT', async () => {
    const before = await captureRepoIdentity(repo);
    fs.writeFileSync(path.join(repo, 'second.md'), 'more\n');
    execFileSync('git', ['add', 'second.md'], { cwd: repo });
    execFileSync('git', ['commit', '-q', '-m', 'second'], { cwd: repo });
    const after = await captureRepoIdentity(repo);
    const result = compareRepoIdentity(before, after);
    expect(result.status).toBe('DRIFT');
    if (result.status === 'DRIFT') {
      expect(result.reasons.some(r => r.includes('commit changed'))).toBe(true);
    }
  });

  it('detects an uncommitted working-tree change as DRIFT even with the same commit', async () => {
    const before = await captureRepoIdentity(repo);
    fs.writeFileSync(path.join(repo, 'README.md'), 'changed\n');
    const after = await captureRepoIdentity(repo);
    const result = compareRepoIdentity(before, after);
    expect(result.status).toBe('DRIFT');
    if (result.status === 'DRIFT') {
      expect(result.reasons.some(r => r.includes('working tree status hash changed'))).toBe(true);
    }
  });
});
```

`orchestrator/core/manifest.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { writePhase0Manifest } from './manifest.js';

describe('writePhase0Manifest', () => {
  let repo: string;

  beforeEach(() => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-manifest-'));
    execFileSync('git', ['init', '-q'], { cwd: repo });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repo });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repo });
    execFileSync('git', ['remote', 'add', 'origin', 'https://example.invalid/orch-fixture.git'], { cwd: repo });
    fs.writeFileSync(path.join(repo, 'README.md'), 'hello\n');
    execFileSync('git', ['add', 'README.md'], { cwd: repo });
    execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repo });
  });

  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
  });

  it('writes manifest.json and state/phase-0.json with matching repo identity', async () => {
    const { runDir, manifest } = await writePhase0Manifest(repo, 'audit');

    const manifestOnDisk = JSON.parse(fs.readFileSync(path.join(runDir, 'manifest.json'), 'utf-8'));
    const phase0OnDisk = JSON.parse(fs.readFileSync(path.join(runDir, 'state', 'phase-0.json'), 'utf-8'));

    expect(manifestOnDisk.repo.commit).toBe(manifest.repo.commit);
    expect(phase0OnDisk.repo.commit).toBe(manifest.repo.commit);
    expect(manifestOnDisk.agentRole).toBe('Auditor');
    expect(manifestOnDisk.sandboxMode).toBe('read-only');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run orchestrator/core/runPaths.test.ts orchestrator/core/repoState.test.ts orchestrator/core/manifest.test.ts`
Expected: FAIL — `Cannot find module './runPaths.js'` (and siblings; none of the three source files exist yet).

- [ ] **Step 3: Implement**

`orchestrator/core/types.ts`:
```typescript
export type Phase = 'phase-0' | 'phase-1' | 'phase-2' | 'phase-3';

export interface RepoIdentity {
  repoRoot: string;
  branch: string;
  commit: string;
  remote: string | null;
  workingTreeStatusHash: string;
  capturedAt: string;
}

export interface RunManifest {
  runId: string;
  runDir: string;
  repo: RepoIdentity;
  agentRole: 'Auditor';
  agentModel: string;
  sandboxMode: 'read-only';
  timestamp: string;
}

export interface StateSnapshot {
  phase: Phase;
  repo: RepoIdentity;
  recordedAt: string;
}

export type RepoStateComparisonResult =
  | { status: 'MATCH' }
  | { status: 'DRIFT'; reasons: string[] };
```

`orchestrator/core/runPaths.ts`:
```typescript
import fs from 'node:fs';
import path from 'node:path';

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

function formatTimestamp(now: Date): string {
  const y = now.getUTCFullYear();
  const mo = pad(now.getUTCMonth() + 1, 2);
  const d = pad(now.getUTCDate(), 2);
  const h = pad(now.getUTCHours(), 2);
  const mi = pad(now.getUTCMinutes(), 2);
  const s = pad(now.getUTCSeconds(), 2);
  return `${y}${mo}${d}-${h}${mi}${s}`;
}

export function createRunDir(kind: string, now: Date = new Date(), repoRoot: string = process.cwd()): string {
  const runsRoot = path.join(repoRoot, 'runs');
  fs.mkdirSync(runsRoot, { recursive: true });

  const base = `${kind}-${formatTimestamp(now)}`;
  let candidate = path.join(runsRoot, base);
  let suffix = 2;
  while (fs.existsSync(candidate)) {
    candidate = path.join(runsRoot, `${base}-${suffix}`);
    suffix += 1;
  }

  fs.mkdirSync(candidate, { recursive: true });
  fs.mkdirSync(path.join(candidate, 'state'), { recursive: true });
  fs.mkdirSync(path.join(candidate, 'raw'), { recursive: true });
  return candidate;
}
```

`orchestrator/core/repoState.ts`:
```typescript
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import crypto from 'node:crypto';
import type { RepoIdentity, RepoStateComparisonResult } from './types.js';

const execFileAsync = promisify(execFile);

async function git(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
}

export async function captureRepoIdentity(repoRoot: string): Promise<RepoIdentity> {
  const resolvedRoot = await git(['rev-parse', '--show-toplevel'], repoRoot);
  const branch = await git(['rev-parse', '--abbrev-ref', 'HEAD'], repoRoot);
  const commit = await git(['rev-parse', 'HEAD'], repoRoot);

  const remotes = await git(['remote'], repoRoot);
  const remote = remotes.split('\n').includes('origin')
    ? await git(['remote', 'get-url', 'origin'], repoRoot)
    : null;

  const statusOutput = await git(['status', '--porcelain=v1'], repoRoot);
  const workingTreeStatusHash = crypto.createHash('sha256').update(statusOutput).digest('hex');

  return {
    repoRoot: resolvedRoot,
    branch,
    commit,
    remote,
    workingTreeStatusHash,
    capturedAt: new Date().toISOString(),
  };
}

export function compareRepoIdentity(baseline: RepoIdentity, current: RepoIdentity): RepoStateComparisonResult {
  const reasons: string[] = [];

  if (baseline.branch !== current.branch) {
    reasons.push(`branch changed: ${baseline.branch} -> ${current.branch}`);
  }
  if (baseline.commit !== current.commit) {
    reasons.push(`commit changed: ${baseline.commit} -> ${current.commit}`);
  }
  if (baseline.remote !== current.remote) {
    reasons.push(`remote changed: ${baseline.remote ?? 'null'} -> ${current.remote ?? 'null'}`);
  }
  if (baseline.workingTreeStatusHash !== current.workingTreeStatusHash) {
    reasons.push('working tree status hash changed');
  }

  return reasons.length === 0 ? { status: 'MATCH' } : { status: 'DRIFT', reasons };
}
```

`orchestrator/core/manifest.ts`:
```typescript
import fs from 'node:fs';
import path from 'node:path';
import { createRunDir } from './runPaths.js';
import { captureRepoIdentity } from './repoState.js';
import type { RunManifest, StateSnapshot } from './types.js';

export async function writePhase0Manifest(
  repoRoot: string,
  runKind: string
): Promise<{ runDir: string; manifest: RunManifest }> {
  const repo = await captureRepoIdentity(repoRoot);
  const runDir = createRunDir(runKind, new Date(), repo.repoRoot);
  const runId = path.basename(runDir);

  const manifest: RunManifest = {
    runId,
    runDir,
    repo,
    agentRole: 'Auditor',
    agentModel: 'unresolved',
    sandboxMode: 'read-only',
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(path.join(runDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const phase0: StateSnapshot = {
    phase: 'phase-0',
    repo,
    recordedAt: manifest.timestamp,
  };
  fs.writeFileSync(path.join(runDir, 'state', 'phase-0.json'), JSON.stringify(phase0, null, 2));

  return { runDir, manifest };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run orchestrator/core/runPaths.test.ts orchestrator/core/repoState.test.ts orchestrator/core/manifest.test.ts`
Expected: PASS — all tests.

- [ ] **Step 5: Commit**

```bash
git add orchestrator/core/
git commit -m "feat(orchestrator): add Phase 0 core — run paths, repo identity, manifest"
```

---

### Task 2: Orchestration capability model

**Files:**
- Create: `orchestrator/permissions/capabilities.ts`
- Create: `orchestrator/permissions/roles.ts`
- Create: `orchestrator/permissions/policy.ts`
- Test: `orchestrator/permissions/policy.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `Capability`, `OrchestrationRole` types; `ROLE_CAPABILITIES`; `hasCapability(role, capability): boolean`; `requiresApproval(capability): boolean`.

- [ ] **Step 1: Write the failing test**

`orchestrator/permissions/policy.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { hasCapability, requiresApproval } from './policy.js';

describe('hasCapability', () => {
  it('grants Auditor read-only capabilities and denies mutation capabilities', () => {
    expect(hasCapability('Auditor', 'fs:read')).toBe(true);
    expect(hasCapability('Auditor', 'process:diagnostic')).toBe(true);
    expect(hasCapability('Auditor', 'git:read')).toBe(true);
    expect(hasCapability('Auditor', 'fs:write')).toBe(false);
    expect(hasCapability('Auditor', 'git:commit')).toBe(false);
    expect(hasCapability('Auditor', 'git:push')).toBe(false);
    expect(hasCapability('Auditor', 'network:egress')).toBe(false);
  });

  it('grants Publisher git mutation capabilities but not fs:write', () => {
    expect(hasCapability('Publisher', 'git:stage')).toBe(true);
    expect(hasCapability('Publisher', 'git:commit')).toBe(true);
    expect(hasCapability('Publisher', 'git:push')).toBe(true);
    expect(hasCapability('Publisher', 'fs:write')).toBe(false);
  });

  it('grants Builder fs:write but not git mutation', () => {
    expect(hasCapability('Builder', 'fs:write')).toBe(true);
    expect(hasCapability('Builder', 'git:commit')).toBe(false);
    expect(hasCapability('Builder', 'git:push')).toBe(false);
  });
});

describe('requiresApproval', () => {
  it('requires approval only for git:commit, git:push, git:pr', () => {
    expect(requiresApproval('git:commit')).toBe(true);
    expect(requiresApproval('git:push')).toBe(true);
    expect(requiresApproval('git:pr')).toBe(true);
    expect(requiresApproval('fs:read')).toBe(false);
    expect(requiresApproval('git:read')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run orchestrator/permissions/policy.test.ts`
Expected: FAIL — `Cannot find module './policy.js'`.

- [ ] **Step 3: Implement**

`orchestrator/permissions/capabilities.ts`:
```typescript
export type Capability =
  | 'fs:read'
  | 'fs:write'
  | 'process:diagnostic'
  | 'process:build'
  | 'git:read'
  | 'git:stage'
  | 'git:commit'
  | 'git:push'
  | 'git:pr'
  | 'network:egress';

export const CAPABILITIES_REQUIRING_APPROVAL: readonly Capability[] = [
  'git:commit',
  'git:push',
  'git:pr',
];
```

`orchestrator/permissions/roles.ts`:
```typescript
import type { Capability } from './capabilities.js';

export type OrchestrationRole = 'Auditor' | 'Builder' | 'Verifier' | 'Publisher';

export const ROLE_CAPABILITIES: Record<OrchestrationRole, readonly Capability[]> = {
  Auditor:   ['fs:read', 'process:diagnostic', 'git:read'],
  Builder:   ['fs:read', 'fs:write', 'process:diagnostic', 'process:build', 'git:read'],
  Verifier:  ['fs:read', 'process:diagnostic', 'process:build', 'git:read'],
  Publisher: ['fs:read', 'git:read', 'git:stage', 'git:commit', 'git:push', 'git:pr'],
};
```

`orchestrator/permissions/policy.ts`:
```typescript
import type { Capability } from './capabilities.js';
import { CAPABILITIES_REQUIRING_APPROVAL } from './capabilities.js';
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run orchestrator/permissions/policy.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add orchestrator/permissions/
git commit -m "feat(orchestrator): add capability-based orchestration role model"
```

---

### Task 3: Evidence capture and integrity index

**Files:**
- Create: `orchestrator/evidence/hashing.ts`
- Create: `orchestrator/evidence/capture.ts`
- Test: `orchestrator/evidence/hashing.test.ts`
- Test: `orchestrator/evidence/capture.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `sha256File(path: string): string`; `readEvidenceIndex(runDir): EvidenceIndex`; `writeEvidenceIndex(runDir, index): void`; `captureRawEvidence(runDir: string, relativeName: string, content: string): void` (the only writer into `raw/`); `verifyEvidenceIntegrity(runDir: string): { status: 'MATCH' } | { status: 'VIOLATION'; violations: string[] }`.

- [ ] **Step 1: Write the failing tests**

`orchestrator/evidence/hashing.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { sha256File } from './hashing.js';

describe('sha256File', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-hashing-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('produces a stable sha256 hex digest for identical content', () => {
    const filePath = path.join(tmpDir, 'a.txt');
    fs.writeFileSync(filePath, 'hello world\n');
    const first = sha256File(filePath);
    const second = sha256File(filePath);
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces a different digest when content changes', () => {
    const filePath = path.join(tmpDir, 'a.txt');
    fs.writeFileSync(filePath, 'hello world\n');
    const before = sha256File(filePath);
    fs.writeFileSync(filePath, 'goodbye world\n');
    const after = sha256File(filePath);
    expect(before).not.toBe(after);
  });
});
```

`orchestrator/evidence/capture.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { captureRawEvidence, verifyEvidenceIntegrity, readEvidenceIndex } from './capture.js';

describe('captureRawEvidence / verifyEvidenceIntegrity', () => {
  let runDir: string;

  beforeEach(() => {
    runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-capture-'));
    fs.mkdirSync(path.join(runDir, 'raw'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  it('writes a raw evidence file and records it in evidence-index.json', () => {
    captureRawEvidence(runDir, 'session-transcript.txt', 'line one\nline two\n');
    const onDisk = fs.readFileSync(path.join(runDir, 'raw', 'session-transcript.txt'), 'utf-8');
    expect(onDisk).toBe('line one\nline two\n');

    const index = readEvidenceIndex(runDir);
    expect(index['raw/session-transcript.txt']).toBeDefined();
    expect(index['raw/session-transcript.txt'].sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('reports MATCH when raw/ is untouched after capture', () => {
    captureRawEvidence(runDir, 'a.txt', 'content a');
    captureRawEvidence(runDir, 'b.txt', 'content b');
    expect(verifyEvidenceIntegrity(runDir)).toEqual({ status: 'MATCH' });
  });

  it('detects a mutated raw file', () => {
    captureRawEvidence(runDir, 'a.txt', 'original');
    fs.writeFileSync(path.join(runDir, 'raw', 'a.txt'), 'tampered');
    const result = verifyEvidenceIntegrity(runDir);
    expect(result.status).toBe('VIOLATION');
    if (result.status === 'VIOLATION') {
      expect(result.violations.some(v => v.includes('a.txt'))).toBe(true);
    }
  });

  it('detects an unexplained file added to raw/', () => {
    captureRawEvidence(runDir, 'a.txt', 'original');
    fs.writeFileSync(path.join(runDir, 'raw', 'unexplained.txt'), 'sneaky');
    const result = verifyEvidenceIntegrity(runDir);
    expect(result.status).toBe('VIOLATION');
    if (result.status === 'VIOLATION') {
      expect(result.violations.some(v => v.includes('unexplained.txt'))).toBe(true);
    }
  });

  it('detects a deleted-but-indexed file', () => {
    captureRawEvidence(runDir, 'a.txt', 'original');
    fs.unlinkSync(path.join(runDir, 'raw', 'a.txt'));
    const result = verifyEvidenceIntegrity(runDir);
    expect(result.status).toBe('VIOLATION');
    if (result.status === 'VIOLATION') {
      expect(result.violations.some(v => v.includes('a.txt'))).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run orchestrator/evidence/hashing.test.ts orchestrator/evidence/capture.test.ts`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement**

`orchestrator/evidence/hashing.ts`:
```typescript
import fs from 'node:fs';
import crypto from 'node:crypto';

export function sha256File(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function sha256String(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
}
```

`orchestrator/evidence/capture.ts`:
```typescript
import fs from 'node:fs';
import path from 'node:path';
import { sha256File } from './hashing.js';

export interface EvidenceIndexEntry {
  sha256: string;
  captured_at: string;
}

export type EvidenceIndex = Record<string, EvidenceIndexEntry>;

function indexPath(runDir: string): string {
  return path.join(runDir, 'evidence-index.json');
}

export function readEvidenceIndex(runDir: string): EvidenceIndex {
  const p = indexPath(runDir);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as EvidenceIndex;
}

export function writeEvidenceIndex(runDir: string, index: EvidenceIndex): void {
  fs.writeFileSync(indexPath(runDir), JSON.stringify(index, null, 2));
}

export function captureRawEvidence(runDir: string, relativeName: string, content: string): void {
  const rawDir = path.join(runDir, 'raw');
  fs.mkdirSync(rawDir, { recursive: true });
  const filePath = path.join(rawDir, relativeName);
  fs.writeFileSync(filePath, content);

  const index = readEvidenceIndex(runDir);
  index[`raw/${relativeName}`] = {
    sha256: sha256File(filePath),
    captured_at: new Date().toISOString(),
  };
  writeEvidenceIndex(runDir, index);
}

export function verifyEvidenceIntegrity(
  runDir: string
): { status: 'MATCH' } | { status: 'VIOLATION'; violations: string[] } {
  const rawDir = path.join(runDir, 'raw');
  const index = readEvidenceIndex(runDir);
  const violations: string[] = [];

  const filesOnDisk = fs.existsSync(rawDir) ? fs.readdirSync(rawDir) : [];
  const indexedRelativePaths = new Set(Object.keys(index));

  for (const fileName of filesOnDisk) {
    const relativePath = `raw/${fileName}`;
    if (!indexedRelativePaths.has(relativePath)) {
      violations.push(`unexplained file present in raw/: ${fileName}`);
      continue;
    }
    const actualHash = sha256File(path.join(rawDir, fileName));
    if (actualHash !== index[relativePath].sha256) {
      violations.push(`hash mismatch for ${fileName} — file was modified after capture`);
    }
  }

  const onDiskSet = new Set(filesOnDisk);
  for (const relativePath of indexedRelativePaths) {
    const fileName = relativePath.replace(/^raw\//, '');
    if (!onDiskSet.has(fileName)) {
      violations.push(`indexed file missing from raw/: ${fileName}`);
    }
  }

  return violations.length === 0 ? { status: 'MATCH' } : { status: 'VIOLATION', violations };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run orchestrator/evidence/hashing.test.ts orchestrator/evidence/capture.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add orchestrator/evidence/
git commit -m "feat(orchestrator): add append-only raw evidence capture with integrity index"
```

---

### Task 4: Claim and verification-instruction schema

**Files:**
- Create: `orchestrator/claims/schema.ts`
- Create: `orchestrator/claims/validate.ts`
- Test: `orchestrator/claims/schema.test.ts`
- Test: `orchestrator/claims/validate.test.ts`

**Interfaces:**
- Consumes: nothing new (adds `zod` as a dependency — Step 0 below).
- Produces: `VerificationInstruction`, `Claim`, `ClaimsFile` Zod schemas + inferred types; `validateClaimsFile(raw: unknown): { valid: true; claims: ClaimsFile } | { valid: false; errors: string[] }`; `AUDITOR_DIAGNOSTIC_ALLOWLIST`.

- [ ] **Step 0: Add the zod dependency**

Run: `npm install zod`
Expected: `zod` added to `package.json` dependencies and `package-lock.json` updated.

- [ ] **Step 1: Write the failing tests**

`orchestrator/claims/schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { ClaimsFile } from './schema.js';

describe('ClaimsFile schema', () => {
  it('accepts a well-formed claims file with a process instruction', () => {
    const input = {
      claims: [
        {
          claim_id: 'C001',
          claim: '34 skills are missing',
          evidence: ['raw/skills-diff.txt'],
          verification: [
            { type: 'process', executable: 'comm', args: ['-23', 'expected-skills.txt', 'actual-skills.txt'] },
          ],
        },
      ],
    };
    const result = ClaimsFile.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('accepts each of the 9 instruction types', () => {
    const base = { claim_id: 'C001', claim: 'x', evidence: [] };
    const instructions = [
      { type: 'process', executable: 'cat', args: ['README.md'] },
      { type: 'file_exists', path: 'a.ts' },
      { type: 'file_absent', path: 'b.ts' },
      { type: 'file_hash', path: 'a.ts' },
      { type: 'file_contains', path: 'a.ts', pattern: 'foo' },
      { type: 'git_diff' },
      { type: 'git_status' },
      { type: 'test' },
      { type: 'typecheck' },
      { type: 'build' },
    ];
    for (const instruction of instructions) {
      const result = ClaimsFile.safeParse({ claims: [{ ...base, verification: [instruction] }] });
      expect(result.success, `instruction type ${instruction.type} should be valid`).toBe(true);
    }
  });

  it('rejects a claim_id that does not match the C### pattern', () => {
    const result = ClaimsFile.safeParse({
      claims: [{ claim_id: 'bad-id', claim: 'x', evidence: [], verification: [{ type: 'git_status' }] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown instruction type', () => {
    const result = ClaimsFile.safeParse({
      claims: [{ claim_id: 'C001', claim: 'x', evidence: [], verification: [{ type: 'nonsense' }] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a process instruction with a non-"repo" cwd', () => {
    const result = ClaimsFile.safeParse({
      claims: [{
        claim_id: 'C001', claim: 'x', evidence: [],
        verification: [{ type: 'process', executable: 'cat', args: [], cwd: '/etc' }],
      }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts claim dependencies that use claim IDs', () => {
    const result = ClaimsFile.safeParse({
      claims: [{ claim_id: 'C002', claim: 'x', evidence: [], depends_on: ['C001'], verification: [{ type: 'git_status' }] }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty agent-supplied justification', () => {
    const result = ClaimsFile.safeParse({
      claims: [{ claim_id: 'C001', claim: 'x', evidence: [], justification: '', verification: [{ type: 'git_status' }] }],
    });
    expect(result.success).toBe(false);
  });
});
```

`orchestrator/claims/validate.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { validateClaimsFile } from './validate.js';

describe('validateClaimsFile', () => {
  it('accepts a claim whose process instruction uses an allowlisted executable', () => {
    const result = validateClaimsFile({
      claims: [{
        claim_id: 'C001', claim: 'x', evidence: [],
        verification: [{ type: 'process', executable: 'cat', args: ['README.md'] }],
      }],
    });
    expect(result.valid).toBe(true);
  });

  it('rejects a claim whose process instruction uses a non-allowlisted executable', () => {
    const result = validateClaimsFile({
      claims: [{
        claim_id: 'C001', claim: 'x', evidence: [],
        verification: [{ type: 'process', executable: 'rm', args: ['-rf', '.'] }],
      }],
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some(e => e.includes('rm') && e.includes('allowlist'))).toBe(true);
    }
  });

  it('rejects the whole file, not just the bad claim, when one claim is invalid', () => {
    const result = validateClaimsFile({
      claims: [
        { claim_id: 'C001', claim: 'good', evidence: [], verification: [{ type: 'git_status' }] },
        {
          claim_id: 'C002', claim: 'bad', evidence: [],
          verification: [{ type: 'process', executable: 'curl', args: [] }],
        },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects git and find as process executables', () => {
    for (const executable of ['git', 'find']) {
      const result = validateClaimsFile({
        claims: [{ claim_id: 'C001', claim: 'unsafe generic process', evidence: [], verification: [{ type: 'process', executable, args: [] }] }],
      });
      expect(result.valid).toBe(false);
    }
  });

  it('rejects an unknown dependency ID with a diagnostic', () => {
    const result = validateClaimsFile({
      claims: [{ claim_id: 'C001', claim: 'x', evidence: [], depends_on: ['C999'], verification: [{ type: 'git_status' }] }],
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toContain('claim C001: unknown dependency "C999"');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run orchestrator/claims/schema.test.ts orchestrator/claims/validate.test.ts`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement**

`orchestrator/claims/schema.ts`:
```typescript
import { z } from 'zod';

const ProcessInstruction = z.object({
  type: z.literal('process'),
  executable: z.string(),
  args: z.array(z.string()),
  cwd: z.literal('repo').default('repo'),
  expected: z.object({ exit_code: z.number().int() }).optional(),
  timeout_ms: z.number().int().positive().max(120000).default(30000),
});

const FileExistsInstruction = z.object({ type: z.literal('file_exists'), path: z.string() });
const FileAbsentInstruction = z.object({ type: z.literal('file_absent'), path: z.string() });
const FileHashInstruction = z.object({
  type: z.literal('file_hash'),
  path: z.string(),
  algorithm: z.literal('sha256').default('sha256'),
  expected_hash: z.string().optional(),
});
const FileContainsInstruction = z.object({
  type: z.literal('file_contains'),
  path: z.string(),
  pattern: z.string(),
  is_regex: z.boolean().default(false),
});
const GitDiffInstruction = z.object({ type: z.literal('git_diff'), args: z.array(z.string()).default([]) });
const GitStatusInstruction = z.object({ type: z.literal('git_status') });
const TestInstruction = z.object({ type: z.literal('test'), target: z.string().optional() });
const TypecheckInstruction = z.object({ type: z.literal('typecheck') });
const BuildInstruction = z.object({ type: z.literal('build') });

export const VerificationInstruction = z.discriminatedUnion('type', [
  ProcessInstruction,
  FileExistsInstruction,
  FileAbsentInstruction,
  FileHashInstruction,
  FileContainsInstruction,
  GitDiffInstruction,
  GitStatusInstruction,
  TestInstruction,
  TypecheckInstruction,
  BuildInstruction,
]);
export type VerificationInstruction = z.infer<typeof VerificationInstruction>;

export const Claim = z.object({
  claim_id: z.string().regex(/^C\d{3,}$/),
  claim: z.string().min(1),
  evidence: z.array(z.string()),
  depends_on: z.array(z.string().regex(/^C\d{3,}$/)).default([]),
  justification: z.string().min(1).optional(),
  verification: z.array(VerificationInstruction).min(1),
});
export type Claim = z.infer<typeof Claim>;

export const ClaimsFile = z.object({ claims: z.array(Claim) });
export type ClaimsFile = z.infer<typeof ClaimsFile>;
```

`orchestrator/claims/validate.ts`:
```typescript
import { ClaimsFile, type Claim } from './schema.js';

export const AUDITOR_DIAGNOSTIC_ALLOWLIST = [
  'ls', 'cat', 'wc', 'comm', 'diff', 'grep', 'shasum', 'sha256sum',
] as const;

function checkExecutableAllowlist(claim: Claim): string[] {
  const errors: string[] = [];
  for (const instruction of claim.verification) {
    if (instruction.type === 'process' && !(AUDITOR_DIAGNOSTIC_ALLOWLIST as readonly string[]).includes(instruction.executable)) {
      errors.push(
        `claim ${claim.claim_id}: executable "${instruction.executable}" is not on the diagnostic allowlist`
      );
    }
  }
  return errors;
}

export function validateClaimsFile(
  raw: unknown
): { valid: true; claims: ClaimsFile } | { valid: false; errors: string[] } {
  const parsed = ClaimsFile.safeParse(raw);
  if (!parsed.success) {
    return { valid: false, errors: parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`) };
  }

  const allowlistErrors = parsed.data.claims.flatMap(checkExecutableAllowlist);
  if (allowlistErrors.length > 0) {
    return { valid: false, errors: allowlistErrors };
  }

  const claimIds = new Set(parsed.data.claims.map(claim => claim.claim_id));
  const dependencyErrors = parsed.data.claims.flatMap(claim =>
    claim.depends_on
      .filter(dependencyId => !claimIds.has(dependencyId))
      .map(dependencyId => `claim ${claim.claim_id}: unknown dependency "${dependencyId}"`)
  );
  if (dependencyErrors.length > 0) {
    return { valid: false, errors: dependencyErrors };
  }

  return { valid: true, claims: parsed.data };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run orchestrator/claims/schema.test.ts orchestrator/claims/validate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json orchestrator/claims/
git commit -m "feat(orchestrator): add structured verification-instruction schema with executable allowlist"
```

---

### Task 5: Agent adapter interface, shell adapter, Gemini stub, and registry

**Files:**
- Create: `orchestrator/adapters/types.ts`
- Create: `orchestrator/adapters/shell.ts`
- Create: `orchestrator/adapters/gemini.ts`
- Create: `orchestrator/adapters/registry.ts`
- Create: `config/orchestrator-adapters.ts`
- Test: `orchestrator/adapters/shell.test.ts`
- Test: `orchestrator/adapters/gemini.test.ts`
- Test: `orchestrator/adapters/registry.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `AgentInvocation`, `AdapterResult`, `AgentAdapter` types; `DeferredAdapterError`; `createShellAdapter(config): AgentAdapter`; `createGeminiAdapter(): AgentAdapter`; `resolveAdapter(name: string): AgentAdapter`.

- [ ] **Step 1: Write the failing tests**

`orchestrator/adapters/shell.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createShellAdapter } from './shell.js';

describe('shell adapter', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-shell-adapter-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('runs the configured executable and captures stdout/stderr/exit code', async () => {
    const adapter = createShellAdapter({
      adapterName: 'shell',
      executable: 'node',
      fixedArgs: ['-e', 'console.log("hello from fixture"); process.exit(0);'],
      timeoutMs: 5000,
      sandboxMode: 'read-only',
    });

    const result = await adapter.run({ runDir: tmpDir, repoRoot: tmpDir, promptOrInstructionPath: '' });

    expect(result.outcome).toBe('success');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('hello from fixture');
    expect(adapter.adapterName).toBe('shell');
    expect(adapter.cwd).toBe('repo');
  });

  it('reports failure outcome on non-zero exit code', async () => {
    const adapter = createShellAdapter({
      adapterName: 'shell',
      executable: 'node',
      fixedArgs: ['-e', 'process.exit(1);'],
      timeoutMs: 5000,
      sandboxMode: 'read-only',
    });

    const result = await adapter.run({ runDir: tmpDir, repoRoot: tmpDir, promptOrInstructionPath: '' });
    expect(result.outcome).toBe('failure');
    expect(result.exitCode).toBe(1);
  });

  it('reports timeout outcome when the process exceeds timeoutMs', async () => {
    const adapter = createShellAdapter({
      adapterName: 'shell',
      executable: 'node',
      fixedArgs: ['-e', 'setTimeout(() => {}, 5000);'],
      timeoutMs: 200,
      sandboxMode: 'read-only',
    });

    const result = await adapter.run({ runDir: tmpDir, repoRoot: tmpDir, promptOrInstructionPath: '' });
    expect(result.outcome).toBe('timeout');
  }, 10000);
});
```

`orchestrator/adapters/gemini.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { createGeminiAdapter } from './gemini.js';
import { DeferredAdapterError } from './types.js';

describe('gemini adapter (deferred)', () => {
  it('is registered with adapterName "gemini" but throws DeferredAdapterError on run()', async () => {
    const adapter = createGeminiAdapter();
    expect(adapter.adapterName).toBe('gemini');
    await expect(
      adapter.run({ runDir: '/tmp', repoRoot: '/tmp', promptOrInstructionPath: '' })
    ).rejects.toThrow(DeferredAdapterError);
  });
});
```

`orchestrator/adapters/registry.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { resolveAdapter } from './registry.js';

describe('resolveAdapter', () => {
  it('resolves "shell" and "gemini" by name without the caller importing their implementation modules', () => {
    expect(resolveAdapter('shell').adapterName).toBe('shell');
    expect(resolveAdapter('gemini').adapterName).toBe('gemini');
  });

  it('throws a clear error for an unknown adapter name', () => {
    expect(() => resolveAdapter('nonexistent')).toThrow(/unknown adapter/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run orchestrator/adapters/shell.test.ts orchestrator/adapters/gemini.test.ts orchestrator/adapters/registry.test.ts`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement**

`orchestrator/adapters/types.ts`:
```typescript
export interface AgentInvocation {
  runDir: string;
  repoRoot: string;
  promptOrInstructionPath: string;
}

export interface AdapterResult {
  exitCode: number | null;
  outcome: 'success' | 'failure' | 'timeout';
  stdout: string;
  stderr: string;
  durationMs: number;
  modelIdentity: string;
}

export interface AgentAdapter {
  readonly adapterName: string;
  readonly executable: string;
  buildArgs(invocation: AgentInvocation): string[];
  readonly cwd: 'repo';
  buildEnv(): Record<string, string>;
  readonly timeoutMs: number;
  readonly sandboxMode: 'read-only' | 'repo-write' | 'unrestricted';
  run(invocation: AgentInvocation): Promise<AdapterResult>;
}

export class DeferredAdapterError extends Error {
  constructor(adapterName: string) {
    super(`Adapter "${adapterName}" is DEFERRED_ADAPTER — not implemented in this build.`);
    this.name = 'DeferredAdapterError';
  }
}
```

`orchestrator/adapters/shell.ts`:
```typescript
import { execFile } from 'node:child_process';
import type { AgentAdapter, AgentInvocation, AdapterResult } from './types.js';

export interface ShellAdapterConfig {
  adapterName: string;
  executable: string;
  fixedArgs: string[];
  timeoutMs: number;
  sandboxMode: 'read-only' | 'repo-write' | 'unrestricted';
}

export function createShellAdapter(config: ShellAdapterConfig): AgentAdapter {
  return {
    adapterName: config.adapterName,
    executable: config.executable,
    cwd: 'repo',
    timeoutMs: config.timeoutMs,
    sandboxMode: config.sandboxMode,
    buildArgs(_invocation: AgentInvocation): string[] {
      return config.fixedArgs;
    },
    buildEnv(): Record<string, string> {
      return {};
    },
    run(invocation: AgentInvocation): Promise<AdapterResult> {
      const args = this.buildArgs(invocation);
      const start = Date.now();
      return new Promise(resolve => {
        const child = execFile(
          config.executable,
          args,
          { cwd: invocation.repoRoot, timeout: config.timeoutMs, env: this.buildEnv() },
          (error, stdout, stderr) => {
            const durationMs = Date.now() - start;
            if (error && (error as NodeJS.ErrnoException).killed) {
              resolve({ exitCode: null, outcome: 'timeout', stdout, stderr, durationMs, modelIdentity: config.executable });
              return;
            }
            const exitCode = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
            resolve({
              exitCode,
              outcome: exitCode === 0 ? 'success' : 'failure',
              stdout,
              stderr,
              durationMs,
              modelIdentity: config.executable,
            });
          }
        );
        void child;
      });
    },
  };
}
```

`orchestrator/adapters/gemini.ts`:
```typescript
import type { AgentAdapter, AgentInvocation, AdapterResult } from './types.js';
import { DeferredAdapterError } from './types.js';

export function createGeminiAdapter(): AgentAdapter {
  return {
    adapterName: 'gemini',
    executable: 'gemini',
    cwd: 'repo',
    timeoutMs: 0,
    sandboxMode: 'read-only',
    buildArgs(_invocation: AgentInvocation): string[] {
      throw new DeferredAdapterError('gemini');
    },
    buildEnv(): Record<string, string> {
      return {};
    },
    run(_invocation: AgentInvocation): Promise<AdapterResult> {
      throw new DeferredAdapterError('gemini');
    },
  };
}
```

`config/orchestrator-adapters.ts`:
```typescript
export interface AdapterRegistryConfig {
  name: string;
  kind: 'shell' | 'codex' | 'claude' | 'gemini';
}

export const ADAPTER_REGISTRY_CONFIG: AdapterRegistryConfig[] = [
  { name: 'shell', kind: 'shell' },
  { name: 'gemini', kind: 'gemini' },
];
```

`orchestrator/adapters/registry.ts`:
```typescript
import type { AgentAdapter } from './types.js';
import { createShellAdapter } from './shell.js';
import { createGeminiAdapter } from './gemini.js';
import { ADAPTER_REGISTRY_CONFIG } from '../../config/orchestrator-adapters.js';

export function resolveAdapter(name: string): AgentAdapter {
  const entry = ADAPTER_REGISTRY_CONFIG.find(e => e.name === name);
  if (!entry) {
    throw new Error(`unknown adapter: "${name}"`);
  }

  switch (entry.kind) {
    case 'shell':
      return createShellAdapter({
        adapterName: 'shell',
        executable: 'true',
        fixedArgs: [],
        timeoutMs: 30000,
        sandboxMode: 'read-only',
      });
    case 'gemini':
      return createGeminiAdapter();
    default:
      throw new Error(`adapter kind "${entry.kind}" is not registered yet — see Task 6/7`);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run orchestrator/adapters/shell.test.ts orchestrator/adapters/gemini.test.ts orchestrator/adapters/registry.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add orchestrator/adapters/ config/orchestrator-adapters.ts
git commit -m "feat(orchestrator): add adapter interface, shell adapter, deferred Gemini stub, and registry"
```

---

### Task 6: Codex adapter (Auditor)

**Files:**
- Modify: `orchestrator/adapters/codex.ts` (create)
- Modify: `orchestrator/adapters/registry.ts`
- Modify: `config/orchestrator-adapters.ts`
- Test: `orchestrator/adapters/codex.test.ts`

**Interfaces:**
- Consumes: `AgentAdapter`, `AgentInvocation`, `AdapterResult` from Task 5.
- Produces: `createCodexAdapter(): AgentAdapter`, registered in the adapter registry as `'codex'`.

- [ ] **Step 1: Confirm actual Codex CLI invocation flags**

Run: `codex --help` and, if it exists, `codex exec --help` (or the equivalent non-interactive subcommand — confirm the exact subcommand name from the top-level help output first).

Record the real flags for: non-interactive/"exec" mode, sandbox/approval restriction (must map to "no filesystem writes, no network"), passing a task instruction (file path vs. inline string vs. stdin), and any structured/JSON output mode. **If the real CLI's flags differ from the ones used in Step 3 below, update Step 3 to match the real CLI before proceeding — do not adapt the architecture to fit a guess.**

- [ ] **Step 2: Write the failing test**

`orchestrator/adapters/codex.test.ts` — uses the real installed `codex` binary in a minimal, fast, side-effect-free invocation (asking it to do nothing but exit) rather than a full audit run, to keep the test fast and deterministic:

```typescript
import { describe, it, expect } from 'vitest';
import { createCodexAdapter } from './codex.js';

describe('codex adapter', () => {
  it('reports adapterName "codex" and a read-only sandbox mode', () => {
    const adapter = createCodexAdapter();
    expect(adapter.adapterName).toBe('codex');
    expect(adapter.sandboxMode).toBe('read-only');
  });

  it('constructs argv without any shell-interpreted string', () => {
    const adapter = createCodexAdapter();
    const args = adapter.buildArgs({ runDir: '/tmp/run', repoRoot: '/tmp/repo', promptOrInstructionPath: '/tmp/run/instruction.md' });
    expect(Array.isArray(args)).toBe(true);
    expect(args.every(a => typeof a === 'string')).toBe(true);
  });
});
```

- [ ] **Step 3: Implement, using the flags confirmed in Step 1**

`orchestrator/adapters/codex.ts` (flags below are my best-effort default based on documented Codex CLI conventions as of this plan's writing — **verify against Step 1's actual `codex --help` output before trusting this file**; adjust `buildArgs` to match reality, keep the `execFile`-only, argv-only constraint):

```typescript
import { execFile } from 'node:child_process';
import type { AgentAdapter, AgentInvocation, AdapterResult } from './types.js';

const CODEX_TIMEOUT_MS = 300000;

export function createCodexAdapter(): AgentAdapter {
  return {
    adapterName: 'codex',
    executable: 'codex',
    cwd: 'repo',
    timeoutMs: CODEX_TIMEOUT_MS,
    sandboxMode: 'read-only',
    buildArgs(invocation: AgentInvocation): string[] {
      // VERIFY against `codex --help` / `codex exec --help` before relying on this.
      return [
        'exec',
        '--sandbox', 'read-only',
        '--full-auto',
        '--',
        `Read the task instructions at ${invocation.promptOrInstructionPath} and follow them exactly.`,
      ];
    },
    buildEnv(): Record<string, string> {
      return {};
    },
    run(invocation: AgentInvocation): Promise<AdapterResult> {
      const args = this.buildArgs(invocation);
      const start = Date.now();
      return new Promise(resolve => {
        execFile(
          this.executable,
          args,
          { cwd: invocation.repoRoot, timeout: this.timeoutMs },
          (error, stdout, stderr) => {
            const durationMs = Date.now() - start;
            if (error && (error as NodeJS.ErrnoException).killed) {
              resolve({ exitCode: null, outcome: 'timeout', stdout, stderr, durationMs, modelIdentity: 'codex-cli' });
              return;
            }
            const exitCode = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
            resolve({
              exitCode,
              outcome: exitCode === 0 ? 'success' : 'failure',
              stdout,
              stderr,
              durationMs,
              modelIdentity: 'codex-cli',
            });
          }
        );
      });
    },
  };
}
```

Register it: add `{ name: 'codex', kind: 'codex' }` to `config/orchestrator-adapters.ts`'s array, and add a `case 'codex': return createCodexAdapter();` branch to `orchestrator/adapters/registry.ts` (import `createCodexAdapter` from `./codex.js`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run orchestrator/adapters/codex.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add orchestrator/adapters/codex.ts orchestrator/adapters/registry.ts config/orchestrator-adapters.ts
git commit -m "feat(orchestrator): add Codex CLI adapter for the Auditor role"
```

---

### Task 7: Claude adapter (registered, for future Builder use — not wired into Phase 1)

**Files:**
- Create: `orchestrator/adapters/claude.ts`
- Modify: `orchestrator/adapters/registry.ts`
- Modify: `config/orchestrator-adapters.ts`
- Test: `orchestrator/adapters/claude.test.ts`

**Interfaces:**
- Consumes: `AgentAdapter` from Task 5.
- Produces: `createClaudeAdapter(): AgentAdapter`, registered as `'claude'`. Not invoked by any Phase 0-3 flow — this task exists so the adapter registry has a second real, config-driven CLI adapter (satisfying "models and CLIs must be replaceable" as a proven property, not just a claim) ahead of Phase 4's Builder work.

- [ ] **Step 1: Confirm actual Claude CLI non-interactive flags**

Run: `claude --help`. Record the real flags for non-interactive/print mode, output format, and prompt-passing mechanism.

- [ ] **Step 2: Write the failing test**

`orchestrator/adapters/claude.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { createClaudeAdapter } from './claude.js';

describe('claude adapter', () => {
  it('reports adapterName "claude"', () => {
    const adapter = createClaudeAdapter();
    expect(adapter.adapterName).toBe('claude');
  });

  it('constructs argv without any shell-interpreted string', () => {
    const adapter = createClaudeAdapter();
    const args = adapter.buildArgs({ runDir: '/tmp/run', repoRoot: '/tmp/repo', promptOrInstructionPath: '/tmp/run/instruction.md' });
    expect(args.every(a => typeof a === 'string')).toBe(true);
  });
});
```

- [ ] **Step 3: Implement, using the flags confirmed in Step 1**

`orchestrator/adapters/claude.ts` (best-effort default — **verify against Step 1's real `claude --help` output**):
```typescript
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import type { AgentAdapter, AgentInvocation, AdapterResult } from './types.js';

const CLAUDE_TIMEOUT_MS = 300000;

export function createClaudeAdapter(): AgentAdapter {
  return {
    adapterName: 'claude',
    executable: 'claude',
    cwd: 'repo',
    timeoutMs: CLAUDE_TIMEOUT_MS,
    sandboxMode: 'repo-write',
    buildArgs(invocation: AgentInvocation): string[] {
      // VERIFY against `claude --help` before relying on this.
      const instruction = fs.readFileSync(invocation.promptOrInstructionPath, 'utf-8');
      return ['-p', instruction, '--output-format', 'json'];
    },
    buildEnv(): Record<string, string> {
      return {};
    },
    run(invocation: AgentInvocation): Promise<AdapterResult> {
      const args = this.buildArgs(invocation);
      const start = Date.now();
      return new Promise(resolve => {
        execFile(
          this.executable,
          args,
          { cwd: invocation.repoRoot, timeout: this.timeoutMs },
          (error, stdout, stderr) => {
            const durationMs = Date.now() - start;
            if (error && (error as NodeJS.ErrnoException).killed) {
              resolve({ exitCode: null, outcome: 'timeout', stdout, stderr, durationMs, modelIdentity: 'claude-cli' });
              return;
            }
            const exitCode = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
            resolve({
              exitCode,
              outcome: exitCode === 0 ? 'success' : 'failure',
              stdout,
              stderr,
              durationMs,
              modelIdentity: 'claude-cli',
            });
          }
        );
      });
    },
  };
}
```

Register it the same way as Task 6 (config entry + registry `case 'claude'`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run orchestrator/adapters/claude.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add orchestrator/adapters/claude.ts orchestrator/adapters/registry.ts config/orchestrator-adapters.ts
git commit -m "feat(orchestrator): add Claude CLI adapter, registered for future Builder use"
```

---

### Task 8: Reconciliation engine (executes one verification instruction)

**Files:**
- Create: `orchestrator/reconciliation/engine.ts`
- Test: `orchestrator/reconciliation/engine.test.ts`
- Test: `orchestrator/reconciliation/no-shell.test.ts`

**Interfaces:**
- Consumes: `VerificationInstruction`, `Claim` from Task 4.
- Produces: `executeInstruction(instruction: VerificationInstruction, repoRoot: string): Promise<{ actual_result: string; exit_code: number; status_hint: 'pass' | 'fail' | 'not_testable' }>`.

- [ ] **Step 1: Write the failing tests**

`orchestrator/reconciliation/engine.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { executeInstruction } from './engine.js';

describe('executeInstruction', () => {
  let repo: string;

  beforeEach(() => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-engine-'));
    execFileSync('git', ['init', '-q'], { cwd: repo });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repo });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repo });
    fs.writeFileSync(path.join(repo, 'a.txt'), 'hello world\n');
    execFileSync('git', ['add', 'a.txt'], { cwd: repo });
    execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repo });
  });

  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
  });

  it('process: runs the allowlisted executable and reports exit code + stdout', async () => {
    const result = await executeInstruction({ type: 'process', executable: 'cat', args: ['a.txt'], cwd: 'repo', timeout_ms: 5000 }, repo);
    expect(result.exit_code).toBe(0);
    expect(result.actual_result).toContain('hello world');
    expect(result.status_hint).toBe('pass');
  });

  it('process: a non-zero exit reports status_hint fail when expected exit_code is 0', async () => {
    const result = await executeInstruction({ type: 'process', executable: 'cat', args: ['does-not-exist.txt'], cwd: 'repo', timeout_ms: 5000, expected: { exit_code: 0 } }, repo);
    expect(result.exit_code).not.toBe(0);
    expect(result.status_hint).toBe('fail');
  });

  it('file_exists: passes when the file exists, fails when it does not', async () => {
    const present = await executeInstruction({ type: 'file_exists', path: 'a.txt' }, repo);
    expect(present.status_hint).toBe('pass');
    const missing = await executeInstruction({ type: 'file_exists', path: 'nope.txt' }, repo);
    expect(missing.status_hint).toBe('fail');
  });

  it('file_absent: passes when the file is absent', async () => {
    const result = await executeInstruction({ type: 'file_absent', path: 'nope.txt' }, repo);
    expect(result.status_hint).toBe('pass');
  });

  it('file_contains: passes when the pattern is found', async () => {
    const result = await executeInstruction({ type: 'file_contains', path: 'a.txt', pattern: 'hello', is_regex: false }, repo);
    expect(result.status_hint).toBe('pass');
  });

  it('git_status: reports clean working tree', async () => {
    const result = await executeInstruction({ type: 'git_status' }, repo);
    expect(result.exit_code).toBe(0);
    expect(result.actual_result.trim()).toBe('');
  });

  it('test/typecheck/build: reports not_testable when the repo has no matching npm script', async () => {
    fs.writeFileSync(path.join(repo, 'package.json'), JSON.stringify({ name: 'fixture', scripts: {} }));
    const result = await executeInstruction({ type: 'test' }, repo);
    expect(result.status_hint).toBe('not_testable');
  });
});
```

`orchestrator/reconciliation/no-shell.test.ts` (acceptance criterion #10, satisfied mechanically):
```typescript
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return full.endsWith('.ts') && !full.endsWith('.test.ts') ? [full] : [];
  });
}

describe('orchestrator/ never uses shell-interpreted execution', () => {
  it('contains no exec(, shell: true, bash -lc, or sh -c anywhere under orchestrator/', () => {
    const files = walk(path.resolve('orchestrator'));
    const offenders: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (/\bexec\(/.test(content) || /shell:\s*true/.test(content) || /bash -lc/.test(content) || /\bsh -c\b/.test(content)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run orchestrator/reconciliation/engine.test.ts orchestrator/reconciliation/no-shell.test.ts`
Expected: FAIL — `engine.ts` doesn't exist yet (the no-shell test passes trivially since `orchestrator/` has no violations yet, but the walk target should still resolve — verify it doesn't error).

- [ ] **Step 3: Implement**

`orchestrator/reconciliation/engine.ts`:
```typescript
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import type { VerificationInstruction } from '../claims/schema.js';

const execFileAsync = promisify(execFile);

interface InstructionResult {
  actual_result: string;
  exit_code: number;
  status_hint: 'pass' | 'fail' | 'not_testable';
}

async function runProcess(executable: string, args: string[], cwd: string, timeoutMs: number, expectedExitCode?: number): Promise<InstructionResult> {
  try {
    const { stdout } = await execFileAsync(executable, args, { cwd, timeout: timeoutMs });
    const exitCode = 0;
    return { actual_result: stdout, exit_code: exitCode, status_hint: expectedExitCode === undefined || expectedExitCode === exitCode ? 'pass' : 'fail' };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number };
    const exitCode = typeof err.code === 'number' ? err.code : 1;
    const output = (err.stdout ?? '') + (err.stderr ?? '');
    return { actual_result: output, exit_code: exitCode, status_hint: expectedExitCode === undefined || expectedExitCode === exitCode ? 'pass' : 'fail' };
  }
}

export async function executeInstruction(instruction: VerificationInstruction, repoRoot: string): Promise<InstructionResult> {
  switch (instruction.type) {
    case 'process':
      return runProcess(instruction.executable, instruction.args, repoRoot, instruction.timeout_ms, instruction.expected?.exit_code);

    case 'file_exists': {
      const exists = fs.existsSync(path.join(repoRoot, instruction.path));
      return { actual_result: exists ? 'exists' : 'missing', exit_code: exists ? 0 : 1, status_hint: exists ? 'pass' : 'fail' };
    }

    case 'file_absent': {
      const exists = fs.existsSync(path.join(repoRoot, instruction.path));
      return { actual_result: exists ? 'exists' : 'absent', exit_code: exists ? 1 : 0, status_hint: exists ? 'fail' : 'pass' };
    }

    case 'file_hash': {
      const filePath = path.join(repoRoot, instruction.path);
      if (!fs.existsSync(filePath)) {
        return { actual_result: 'file missing', exit_code: 1, status_hint: 'fail' };
      }
      const crypto = await import('node:crypto');
      const hash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
      if (instruction.expected_hash === undefined) {
        return { actual_result: hash, exit_code: 0, status_hint: 'not_testable' };
      }
      const matches = hash === instruction.expected_hash;
      return { actual_result: hash, exit_code: matches ? 0 : 1, status_hint: matches ? 'pass' : 'fail' };
    }

    case 'file_contains': {
      const filePath = path.join(repoRoot, instruction.path);
      if (!fs.existsSync(filePath)) {
        return { actual_result: 'file missing', exit_code: 1, status_hint: 'fail' };
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      const found = instruction.is_regex ? new RegExp(instruction.pattern).test(content) : content.includes(instruction.pattern);
      return { actual_result: found ? 'pattern found' : 'pattern not found', exit_code: found ? 0 : 1, status_hint: found ? 'pass' : 'fail' };
    }

    case 'git_diff':
      return runProcess('git', ['diff', ...instruction.args], repoRoot, 30000);

    case 'git_status':
      return runProcess('git', ['status', '--porcelain=v1'], repoRoot, 30000, 0);

    case 'test':
    case 'typecheck':
    case 'build': {
      const pkgPath = path.join(repoRoot, 'package.json');
      if (!fs.existsSync(pkgPath)) {
        return { actual_result: 'no package.json in target repo', exit_code: 0, status_hint: 'not_testable' };
      }
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { scripts?: Record<string, string> };
      const scriptName = instruction.type;
      if (!pkg.scripts?.[scriptName]) {
        return { actual_result: `no "${scriptName}" script defined`, exit_code: 0, status_hint: 'not_testable' };
      }
      return runProcess('npm', ['run', scriptName], repoRoot, 120000, 0);
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run orchestrator/reconciliation/engine.test.ts orchestrator/reconciliation/no-shell.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add orchestrator/reconciliation/
git commit -m "feat(orchestrator): add reconciliation engine — independent execution of all 9 verification instruction types"
```

---

### Task 9: Phase 1 orchestration — run the Auditor and validate its output

**Files:**
- Create: `orchestrator/phase1/runAuditor.ts`
- Test: `orchestrator/phase1/runAuditor.test.ts`

**Interfaces:**
- Consumes: `resolveAdapter` (Task 5/6), `captureRawEvidence`/`verifyEvidenceIntegrity` (Task 3), `validateClaimsFile` (Task 4), `captureRepoIdentity`/`compareRepoIdentity` (Task 1).
- Produces: `runAuditorPhase(runDir: string, repoRoot: string, adapterName: string): Promise<Phase1Result>` where `Phase1Result` is a discriminated union of success/failure states including `REPOSITORY_STATE_DRIFT`.

- [ ] **Step 1: Write the failing test**

`orchestrator/phase1/runAuditor.test.ts` — uses the `shell` adapter (Task 5) configured, for this test only, to write a fixed `claims.json`/`narrative.md` pair instead of invoking Codex, so the test doesn't require a real LLM call:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { runAuditorPhase } from './runAuditor.js';

function initFixtureRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-phase1-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'README.md'), 'hello\n');
  execFileSync('git', ['add', 'README.md'], { cwd: dir });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: dir });
  return dir;
}

describe('runAuditorPhase', () => {
  let repo: string;
  let runDir: string;

  beforeEach(() => {
    repo = initFixtureRepo();
    runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-phase1-run-'));
    fs.mkdirSync(path.join(runDir, 'raw'), { recursive: true });
    fs.mkdirSync(path.join(runDir, 'state'), { recursive: true });

    const claimsPayload = JSON.stringify({
      claims: [{ claim_id: 'C001', claim: 'README.md exists', evidence: [], verification: [{ type: 'file_exists', path: 'README.md' }] }],
    });
    fs.writeFileSync(path.join(runDir, '__fixture_claims.json'), claimsPayload);
    fs.writeFileSync(path.join(runDir, '__fixture_narrative.md'), 'UNTRUSTED INTERPRETATION\n\nThe README exists.\n');
  });

  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  it('produces a valid claims.json, a labeled narrative.md, raw evidence, and a phase-1 state snapshot', async () => {
    const result = await runAuditorPhase(runDir, repo, 'shell', {
      shellFixedArgs: ['-e', `require('fs').copyFileSync('${path.join(runDir, '__fixture_claims.json')}', '${path.join(runDir, 'claims.json')}'); require('fs').copyFileSync('${path.join(runDir, '__fixture_narrative.md')}', '${path.join(runDir, 'narrative.md')}'); console.log('auditor ran');`],
      shellExecutable: 'node',
    });

    expect(result.status).toBe('success');
    expect(fs.existsSync(path.join(runDir, 'claims.json'))).toBe(true);
    expect(fs.readFileSync(path.join(runDir, 'narrative.md'), 'utf-8')).toContain('UNTRUSTED INTERPRETATION');
    expect(fs.existsSync(path.join(runDir, 'raw', 'shell-session-transcript.txt'))).toBe(true);
    expect(fs.existsSync(path.join(runDir, 'state', 'phase-1.json'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run orchestrator/phase1/runAuditor.test.ts`
Expected: FAIL — `runAuditor.ts` doesn't exist.

- [ ] **Step 3: Implement**

`orchestrator/phase1/runAuditor.ts`:
```typescript
import fs from 'node:fs';
import path from 'node:path';
import { resolveAdapter } from '../adapters/registry.js';
import { createShellAdapter } from '../adapters/shell.js';
import { captureRawEvidence } from '../evidence/capture.js';
import { validateClaimsFile } from '../claims/validate.js';
import { captureRepoIdentity, compareRepoIdentity } from '../core/repoState.js';
import type { StateSnapshot } from '../core/types.js';

export type Phase1Result =
  | { status: 'success' }
  | { status: 'ADAPTER_EXECUTION_FAILURE'; detail: string }
  | { status: 'CLAIMS_SCHEMA_INVALID'; errors: string[] }
  | { status: 'NARRATIVE_MISSING' }
  | { status: 'REPOSITORY_STATE_DRIFT'; reasons: string[] };

interface Phase1Overrides {
  shellExecutable?: string;
  shellFixedArgs?: string[];
}

const UNTRUSTED_BANNER = 'UNTRUSTED INTERPRETATION';

export async function runAuditorPhase(
  runDir: string,
  repoRoot: string,
  adapterName: string,
  overrides?: Phase1Overrides
): Promise<Phase1Result> {
  const before = await captureRepoIdentity(repoRoot);

  const adapter = overrides?.shellExecutable
    ? createShellAdapter({
        adapterName,
        executable: overrides.shellExecutable,
        fixedArgs: overrides.shellFixedArgs ?? [],
        timeoutMs: 60000,
        sandboxMode: 'read-only',
      })
    : resolveAdapter(adapterName);

  const instructionPath = path.join(runDir, 'instruction.md');
  fs.writeFileSync(
    instructionPath,
    [
      'You are the Auditor for this repository. Investigate using read-only, diagnostic operations only.',
      `Write your findings as structured claims to: ${path.join(runDir, 'claims.json')}`,
      `Write your narrative interpretation to: ${path.join(runDir, 'narrative.md')} — begin that file with the line "${UNTRUSTED_BANNER}".`,
      'Do not write anywhere else. Do not modify any file in this repository.',
    ].join('\n')
  );

  const result = await adapter.run({ runDir, repoRoot, promptOrInstructionPath: instructionPath });

  captureRawEvidence(runDir, `${adapterName}-session-transcript.txt`, `--- stdout ---\n${result.stdout}\n--- stderr ---\n${result.stderr}\n`);

  if (result.outcome !== 'success') {
    return { status: 'ADAPTER_EXECUTION_FAILURE', detail: `adapter "${adapterName}" outcome: ${result.outcome}, exit code: ${result.exitCode}` };
  }

  const claimsPath = path.join(runDir, 'claims.json');
  if (!fs.existsSync(claimsPath)) {
    return { status: 'CLAIMS_SCHEMA_INVALID', errors: ['claims.json was not produced'] };
  }
  const rawClaims = JSON.parse(fs.readFileSync(claimsPath, 'utf-8'));
  const validation = validateClaimsFile(rawClaims);
  if (!validation.valid) {
    return { status: 'CLAIMS_SCHEMA_INVALID', errors: validation.errors };
  }

  const narrativePath = path.join(runDir, 'narrative.md');
  if (!fs.existsSync(narrativePath)) {
    return { status: 'NARRATIVE_MISSING' };
  }
  const narrativeContent = fs.readFileSync(narrativePath, 'utf-8');
  if (!narrativeContent.startsWith(UNTRUSTED_BANNER)) {
    fs.writeFileSync(narrativePath, `${UNTRUSTED_BANNER}\n\n${narrativeContent}`);
  }

  const after = await captureRepoIdentity(repoRoot);
  const comparison = compareRepoIdentity(before, after);

  const phase1Snapshot: StateSnapshot = { phase: 'phase-1', repo: after, recordedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(runDir, 'state', 'phase-1.json'), JSON.stringify(phase1Snapshot, null, 2));

  if (comparison.status === 'DRIFT') {
    return { status: 'REPOSITORY_STATE_DRIFT', reasons: comparison.reasons };
  }

  return { status: 'success' };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run orchestrator/phase1/runAuditor.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add orchestrator/phase1/
git commit -m "feat(orchestrator): wire Phase 1 — Auditor invocation, evidence capture, claims validation, drift check"
```

---

### Task 10: Phase 2 orchestration — reconciliation and reporting

**Files:**
- Create: `orchestrator/reconciliation/reconcile.ts`
- Create: `orchestrator/reporting/summarize.ts`
- Test: `orchestrator/reconciliation/reconcile.test.ts`
- Test: `orchestrator/reporting/summarize.test.ts`

**Interfaces:**
- Consumes: `executeInstruction` (Task 8), `verifyEvidenceIntegrity` (Task 3), `captureRepoIdentity`/`compareRepoIdentity` (Task 1), `Claim` (Task 4).
- Produces: `runReconciliationPhase(runDir: string, repoRoot: string): Promise<Phase2Result>`; `summarizeReconciliation(results): ReconciliationSummary`.

- [ ] **Step 1: Write the failing tests**

`orchestrator/reconciliation/reconcile.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { runReconciliationPhase } from './reconcile.js';
import { captureRawEvidence } from '../evidence/capture.js';

describe('runReconciliationPhase', () => {
  let repo: string;
  let runDir: string;

  beforeEach(() => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-recon-repo-'));
    execFileSync('git', ['init', '-q'], { cwd: repo });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repo });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repo });
    fs.writeFileSync(path.join(repo, 'README.md'), 'hello\n');
    execFileSync('git', ['add', 'README.md'], { cwd: repo });
    execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repo });

    runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-recon-run-'));
    fs.mkdirSync(path.join(runDir, 'raw'), { recursive: true });
    fs.mkdirSync(path.join(runDir, 'state'), { recursive: true });
    fs.writeFileSync(path.join(runDir, 'state', 'phase-1.json'), JSON.stringify({
      phase: 'phase-1', recordedAt: new Date().toISOString(),
      repo: { repoRoot: repo, branch: 'main', commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo }).toString().trim(), remote: null, workingTreeStatusHash: '', capturedAt: new Date().toISOString() },
    }));
    captureRawEvidence(runDir, 'placeholder.txt', 'evidence');

    fs.writeFileSync(path.join(runDir, 'claims.json'), JSON.stringify({
      claims: [
        { claim_id: 'C001', claim: 'README.md exists', evidence: ['raw/placeholder.txt'], verification: [{ type: 'file_exists', path: 'README.md' }] },
        { claim_id: 'C002', claim: 'nonexistent.txt exists', evidence: [], verification: [{ type: 'file_exists', path: 'nonexistent.txt' }] },
      ],
    }));
  });

  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  it('produces reconciliation.json with correctly classified statuses', async () => {
    const result = await runReconciliationPhase(runDir, repo);
    expect(result.status).toBe('success');

    const reconciliation = JSON.parse(fs.readFileSync(path.join(runDir, 'reconciliation.json'), 'utf-8'));
    const c001 = reconciliation.find((r: any) => r.claim_id === 'C001');
    const c002 = reconciliation.find((r: any) => r.claim_id === 'C002');
    expect(c001.status).toBe('VERIFIED');
    expect(c002.status).toBe('CONTRADICTED');
  });

  it('detects a tampered raw/ file as EVIDENCE_INTEGRITY_VIOLATION before reconciling', async () => {
    fs.writeFileSync(path.join(runDir, 'raw', 'placeholder.txt'), 'tampered');
    const result = await runReconciliationPhase(runDir, repo);
    expect(result.status).toBe('EVIDENCE_INTEGRITY_VIOLATION');
  });

  it('detects repository drift since phase-1 as REPOSITORY_STATE_DRIFT', async () => {
    fs.writeFileSync(path.join(repo, 'new-file.txt'), 'surprise');
    execFileSync('git', ['add', 'new-file.txt'], { cwd: repo });
    execFileSync('git', ['commit', '-q', '-m', 'unexpected change'], { cwd: repo });
    const result = await runReconciliationPhase(runDir, repo);
    expect(result.status).toBe('REPOSITORY_STATE_DRIFT');
  });

  it('caps a claim that targets the agent-writable run output at VERIFIED_WITH_CONDITIONS and marks it SELF_SPECIFIED', async () => {
    fs.writeFileSync(path.join(runDir, 'claims.json'), JSON.stringify({ claims: [{
      claim_id: 'C003', claim: 'agent output exists', evidence: [], depends_on: [],
      verification: [{ type: 'file_exists', path: path.relative(repo, path.join(runDir, 'narrative.md')) }],
    }] }));
    fs.writeFileSync(path.join(runDir, 'narrative.md'), 'agent-created');
    const result = await runReconciliationPhase(runDir, repo);
    expect(result.status).toBe('success');
    const [entry] = JSON.parse(fs.readFileSync(path.join(runDir, 'reconciliation.json'), 'utf-8'));
    expect(entry.self_specified).toBe(true);
    expect(entry.status).toBe('VERIFIED_WITH_CONDITIONS');
  });
});
```

`orchestrator/reporting/summarize.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { summarizeReconciliation } from './summarize.js';

describe('summarizeReconciliation', () => {
  it('counts each status correctly', () => {
    const results = [
      { status: 'VERIFIED' }, { status: 'VERIFIED' }, { status: 'VERIFIED_WITH_CONDITIONS' },
      { status: 'CONTRADICTED' }, { status: 'NOT_VERIFIED' }, { status: 'NOT_TESTABLE' },
    ] as any[];
    const summary = summarizeReconciliation(results);
    expect(summary).toEqual({
      total: 6, verified: 2, verified_with_conditions: 1, contradicted: 1, not_verified: 1, not_testable: 1,
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run orchestrator/reconciliation/reconcile.test.ts orchestrator/reporting/summarize.test.ts`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement**

`orchestrator/reconciliation/reconcile.ts`:
```typescript
import fs from 'node:fs';
import path from 'node:path';
import { executeInstruction } from './engine.js';
import { verifyEvidenceIntegrity } from '../evidence/capture.js';
import { captureRepoIdentity, compareRepoIdentity } from '../core/repoState.js';
import type { ClaimsFile, Claim } from '../claims/schema.js';
import type { StateSnapshot, RepoIdentity } from '../core/types.js';

export type ReconciliationStatus = 'VERIFIED' | 'VERIFIED_WITH_CONDITIONS' | 'NOT_VERIFIED' | 'CONTRADICTED' | 'NOT_TESTABLE';

export interface ReconciliationEntry {
  claim_id: string;
  claim: string;
  depends_on: string[];
  verification_procedure: string;
  expected_result?: string;
  actual_result: string;
  exit_code: number;
  evidence: string[];
  self_specified: boolean;
  resolved_targets: string[];
  justification?: string;
  status: ReconciliationStatus;
}

export type Phase2Result =
  | { status: 'success' }
  | { status: 'EVIDENCE_INTEGRITY_VIOLATION'; violations: string[] }
  | { status: 'REPOSITORY_STATE_DRIFT'; reasons: string[] };

function resolveVerificationTargets(verification: Claim['verification'], repoRoot: string): string[] {
  return verification.flatMap(instruction => {
    if ('path' in instruction) return [path.resolve(repoRoot, instruction.path)];
    return [];
  });
}

function isWithinAgentWritableOutputPath(target: string, runDir: string): boolean {
  const outputRoot = path.resolve(runDir);
  return target === outputRoot || target.startsWith(`${outputRoot}${path.sep}`);
}

function classify(hints: Array<'pass' | 'fail' | 'not_testable'>, selfSpecified: boolean): ReconciliationStatus {
  if (hints.every(h => h === 'not_testable')) return 'NOT_TESTABLE';
  if (selfSpecified && !hints.includes('fail')) return 'VERIFIED_WITH_CONDITIONS';
  if (hints.every(h => h === 'pass')) return 'VERIFIED';
  if (hints.some(h => h === 'pass') && hints.some(h => h === 'not_testable') && !hints.includes('fail')) return 'VERIFIED_WITH_CONDITIONS';
  if (hints.every(h => h === 'fail')) return 'CONTRADICTED';
  return 'NOT_VERIFIED';
}

export async function runReconciliationPhase(runDir: string, repoRoot: string): Promise<Phase2Result> {
  const integrity = verifyEvidenceIntegrity(runDir);
  if (integrity.status === 'VIOLATION') {
    return { status: 'EVIDENCE_INTEGRITY_VIOLATION', violations: integrity.violations };
  }

  const phase1State = JSON.parse(fs.readFileSync(path.join(runDir, 'state', 'phase-1.json'), 'utf-8')) as StateSnapshot;
  const currentIdentity = await captureRepoIdentity(repoRoot);
  const comparison = compareRepoIdentity(phase1State.repo, currentIdentity);
  if (comparison.status === 'DRIFT') {
    return { status: 'REPOSITORY_STATE_DRIFT', reasons: comparison.reasons };
  }

  const claimsFile = JSON.parse(fs.readFileSync(path.join(runDir, 'claims.json'), 'utf-8')) as ClaimsFile;
  const entries: ReconciliationEntry[] = [];

  for (const claim of claimsFile.claims) {
    const hints: Array<'pass' | 'fail' | 'not_testable'> = [];
    const actualResults: string[] = [];
    let lastExitCode = 0;

    const resolvedTargets = resolveVerificationTargets(claim.verification, repoRoot);
    const selfSpecified = resolvedTargets.some(target => isWithinAgentWritableOutputPath(target, runDir));
    for (const instruction of claim.verification) {
      const outcome = await executeInstruction(instruction, repoRoot);
      hints.push(outcome.status_hint);
      actualResults.push(outcome.actual_result);
      lastExitCode = outcome.exit_code;
    }

    entries.push({
      claim_id: claim.claim_id,
      claim: claim.claim,
      depends_on: claim.depends_on,
      verification_procedure: JSON.stringify(claim.verification),
      actual_result: actualResults.join('\n---\n'),
      exit_code: lastExitCode,
      evidence: claim.evidence,
      self_specified: selfSpecified,
      resolved_targets: resolvedTargets,
      justification: hints.every(h => h === 'not_testable') ? claim.justification : undefined,
      status: classify(hints, selfSpecified),
    });
  }

  if (entries.some(entry => entry.status === 'NOT_TESTABLE' && !entry.justification?.trim())) {
    throw new Error('NOT_TESTABLE_WITHOUT_JUSTIFICATION');
  }

  fs.writeFileSync(path.join(runDir, 'reconciliation.json'), JSON.stringify(entries, null, 2));

  const phase2Snapshot: StateSnapshot = { phase: 'phase-2', repo: currentIdentity, recordedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(runDir, 'state', 'phase-2.json'), JSON.stringify(phase2Snapshot, null, 2));

  return { status: 'success' };
}
```

`orchestrator/reporting/summarize.ts`:
```typescript
import type { ReconciliationEntry } from '../reconciliation/reconcile.js';

export interface ReconciliationSummary {
  total: number;
  verified: number;
  verified_with_conditions: number;
  contradicted: number;
  not_verified: number;
  not_testable: number;
}

export function summarizeReconciliation(entries: Pick<ReconciliationEntry, 'status'>[]): ReconciliationSummary {
  return {
    total: entries.length,
    verified: entries.filter(e => e.status === 'VERIFIED').length,
    verified_with_conditions: entries.filter(e => e.status === 'VERIFIED_WITH_CONDITIONS').length,
    contradicted: entries.filter(e => e.status === 'CONTRADICTED').length,
    not_verified: entries.filter(e => e.status === 'NOT_VERIFIED').length,
    not_testable: entries.filter(e => e.status === 'NOT_TESTABLE').length,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run orchestrator/reconciliation/reconcile.test.ts orchestrator/reporting/summarize.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add orchestrator/reconciliation/reconcile.ts orchestrator/reporting/
git commit -m "feat(orchestrator): wire Phase 2 — independent reconciliation with integrity and drift checks"
```

---

### Task 11: Phase 3 — Commander approval gate

**Files:**
- Create: `orchestrator/gates/commanderGate.ts`
- Test: `orchestrator/gates/commanderGate.test.ts`

**Interfaces:**
- Consumes: `ReconciliationEntry`, `summarizeReconciliation` (Task 10).
- Produces: `runCommanderGate(runDir: string, decisionSource?: () => Promise<string>): Promise<GateResult>` where `GateResult` includes the decision and the path to `approved_claims.json` on approval.

- [ ] **Step 1: Write the failing test**

`orchestrator/gates/commanderGate.test.ts` — injects a fixed decision source instead of real `readline`, per the design doc's test-strategy note:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runCommanderGate } from './commanderGate.js';

describe('runCommanderGate', () => {
  let runDir: string;

  beforeEach(() => {
    runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-gate-'));
    fs.writeFileSync(path.join(runDir, 'reconciliation.json'), JSON.stringify([
      { claim_id: 'C001', claim: 'a', depends_on: [], status: 'VERIFIED' },
      { claim_id: 'C002', claim: 'b', depends_on: ['C001'], status: 'VERIFIED_WITH_CONDITIONS' },
      { claim_id: 'C003', claim: 'c', depends_on: [], status: 'CONTRADICTED' },
      { claim_id: 'C004', claim: 'd', depends_on: [], status: 'NOT_TESTABLE', justification: 'fixture has no test script' },
    ]));
  });

  afterEach(() => {
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  it('"approve-all-verified" writes approved_claims.json with only VERIFIED claims', async () => {
    const result = await runCommanderGate(runDir, async () => 'approve-all-verified');
    expect(result.decision).toBe('approve-all-verified');
    const approved = JSON.parse(fs.readFileSync(path.join(runDir, 'approved_claims.json'), 'utf-8'));
    expect(approved.approved_claim_ids.sort()).toEqual(['C001']);
  });

  it('"select:C001" approves only the named claim', async () => {
    const result = await runCommanderGate(runDir, async () => 'select:C001');
    expect(result.decision).toBe('select');
    const approved = JSON.parse(fs.readFileSync(path.join(runDir, 'approved_claims.json'), 'utf-8'));
    expect(approved.approved_claim_ids).toEqual(['C001']);
  });

  it('rejects an attempt to select a CONTRADICTED claim by ID', async () => {
    await expect(runCommanderGate(runDir, async () => 'select:C003')).rejects.toThrow(/CONTRADICTED/);
  });

  it('requires dependencies recursively against selected or already-approved IDs and excludes NOT_TESTABLE from bulk approval', async () => {
    await expect(runCommanderGate(runDir, async () => 'select:C002')).rejects.toThrow(/dependency/i);
    const selected = await runCommanderGate(runDir, async () => 'select:C001,C002');
    expect(selected.approvedClaimIds).toEqual(['C001', 'C002']);
    const result = await runCommanderGate(runDir, async () => 'approve-all-verified');
    expect(result.approvedClaimIds).not.toContain('C004');
  });

  it('"reject" writes no approved_claims.json', async () => {
    const result = await runCommanderGate(runDir, async () => 'reject');
    expect(result.decision).toBe('reject');
    expect(fs.existsSync(path.join(runDir, 'approved_claims.json'))).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run orchestrator/gates/commanderGate.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

`orchestrator/gates/commanderGate.ts`:
```typescript
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { summarizeReconciliation } from '../reporting/summarize.js';
import type { ReconciliationEntry } from '../reconciliation/reconcile.js';

export interface GateResult {
  decision: 'approve-all-verified' | 'select' | 'reject';
  approvedClaimIds: string[];
}

const APPROVABLE_STATUSES = new Set(['VERIFIED']);
const SELECTIVELY_APPROVABLE_STATUSES = new Set(['VERIFIED', 'VERIFIED_WITH_CONDITIONS']);

function dependenciesApprovedRecursively(
  entry: ReconciliationEntry,
  byId: Map<string, ReconciliationEntry>,
  approvedIds: Set<string>,
  visiting = new Set<string>(),
): boolean {
  if (visiting.has(entry.claim_id)) return false;
  const nextVisiting = new Set(visiting).add(entry.claim_id);
  return (entry.depends_on ?? []).every(dependencyId => {
    const dependency = byId.get(dependencyId);
    return dependency !== undefined
      && approvedIds.has(dependencyId)
      && dependenciesApprovedRecursively(dependency, byId, approvedIds, nextVisiting);
  });
}

function loadApprovedClaimIds(runDir: string): Set<string> {
  const approvalPath = path.join(runDir, 'approved_claims.json');
  if (!fs.existsSync(approvalPath)) return new Set();
  const prior = JSON.parse(fs.readFileSync(approvalPath, 'utf-8')) as { approved_claim_ids?: string[] };
  return new Set(prior.approved_claim_ids ?? []);
}

async function defaultDecisionSource(entries: ReconciliationEntry[]): Promise<string> {
  const summary = summarizeReconciliation(entries);
  const rl = readline.createInterface({ input, output });
  try {
    output.write(
      `\nReconciliation summary: ${summary.total} total, ${summary.verified} verified, ` +
      `${summary.verified_with_conditions} verified-with-conditions, ${summary.contradicted} contradicted, ` +
      `${summary.not_verified} not-verified, ${summary.not_testable} not-testable\n\n` +
      `Decisions: "approve-all-verified" | "select:C001,C002" | "reject"\n`
    );
    return await rl.question('Decision: ');
  } finally {
    rl.close();
  }
}

export async function runCommanderGate(
  runDir: string,
  decisionSource: (entries: ReconciliationEntry[]) => Promise<string> = defaultDecisionSource
): Promise<GateResult> {
  const entries = JSON.parse(fs.readFileSync(path.join(runDir, 'reconciliation.json'), 'utf-8')) as ReconciliationEntry[];
  const byId = new Map(entries.map(entry => [entry.claim_id, entry]));
  const alreadyApprovedIds = loadApprovedClaimIds(runDir);
  const rawDecision = (await decisionSource(entries)).trim();

  if (rawDecision === 'reject') {
    return { decision: 'reject', approvedClaimIds: [] };
  }

  if (rawDecision === 'approve-all-verified') {
    const bulkCandidateIds = new Set([
      ...alreadyApprovedIds,
      ...entries.filter(e => APPROVABLE_STATUSES.has(e.status)).map(e => e.claim_id),
    ]);
    const approvedClaimIds = entries
      .filter(e => APPROVABLE_STATUSES.has(e.status))
      .filter(e => dependenciesApprovedRecursively(e, byId, bulkCandidateIds))
      .map(e => e.claim_id);
    const cumulativeApprovedIds = [...new Set([...alreadyApprovedIds, ...approvedClaimIds])];
    fs.writeFileSync(path.join(runDir, 'approved_claims.json'), JSON.stringify({ approved_claim_ids: cumulativeApprovedIds, decided_at: new Date().toISOString() }, null, 2));
    return { decision: 'approve-all-verified', approvedClaimIds: cumulativeApprovedIds };
  }

  if (rawDecision.startsWith('select:')) {
    const requestedIds = rawDecision.slice('select:'.length).split(',').map(id => id.trim()).filter(Boolean);
    for (const id of requestedIds) {
      const entry = entries.find(e => e.claim_id === id);
      if (!entry) {
        throw new Error(`unknown claim_id in selection: ${id}`);
      }
      if (!SELECTIVELY_APPROVABLE_STATUSES.has(entry.status)) {
        throw new Error(`cannot approve claim ${id} — its reconciliation status is ${entry.status}; CONTRADICTED, NOT_VERIFIED, and NOT_TESTABLE have no Phase 0-3 override path`);
      }
      const approvedForDecision = new Set([...alreadyApprovedIds, ...requestedIds]);
      if (!dependenciesApprovedRecursively(entry, byId, approvedForDecision)) {
        throw new Error(`cannot approve claim ${id} — UNSATISFIED_DEPENDENCY`);
      }
    }
    const cumulativeApprovedIds = [...new Set([...alreadyApprovedIds, ...requestedIds])];
    fs.writeFileSync(path.join(runDir, 'approved_claims.json'), JSON.stringify({ approved_claim_ids: cumulativeApprovedIds, decided_at: new Date().toISOString() }, null, 2));
    return { decision: 'select', approvedClaimIds: cumulativeApprovedIds };
  }

  throw new Error(`unrecognized decision: "${rawDecision}"`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run orchestrator/gates/commanderGate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add orchestrator/gates/
git commit -m "feat(orchestrator): add Phase 3 Commander approval gate, per-claim-ID"
```

---

### Task 12: CLI entrypoint, `.gitignore`, and end-to-end integration test

**Files:**
- Create: `scripts/orchestrator-cli.ts`
- Create: `scripts/orchestrator-cli-help.ts`
- Modify: `package.json`
- Modify: `.gitignore`
- Test: `orchestrator/integration/phase0-3.integration.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–11.
- Produces: `npm run orchestrator -- audit|reconcile|gate|status`.

- [ ] **Step 1: Write the failing integration test**

`orchestrator/integration/phase0-3.integration.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { writePhase0Manifest } from '../core/manifest.js';
import { runAuditorPhase } from '../phase1/runAuditor.js';
import { runReconciliationPhase } from '../reconciliation/reconcile.js';
import { runCommanderGate } from '../gates/commanderGate.js';

function initFixtureRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-e2e-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'README.md'), 'hello\n');
  execFileSync('git', ['add', 'README.md'], { cwd: dir });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: dir });
  return dir;
}

describe('Phase 0 -> 1 -> 2 -> 3 end to end', () => {
  let repo: string;

  beforeEach(() => {
    repo = initFixtureRepo();
  });

  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
  });

  it('produces a complete, schema-valid run directory and an approved_claims.json', async () => {
    const { runDir } = await writePhase0Manifest(repo, 'audit');
    expect(fs.existsSync(path.join(runDir, 'manifest.json'))).toBe(true);

    const claimsScript = [
      'const fs = require("fs");',
      `fs.writeFileSync(${JSON.stringify(path.join(runDir, 'claims.json'))}, JSON.stringify({claims:[{claim_id:"C001",claim:"README.md exists",evidence:[],verification:[{type:"file_exists",path:"README.md"}]}]}));`,
      `fs.writeFileSync(${JSON.stringify(path.join(runDir, 'narrative.md'))}, "UNTRUSTED INTERPRETATION\\n\\nREADME looks present.\\n");`,
      'console.log("auditor fixture ran");',
    ].join(' ');

    const phase1 = await runAuditorPhase(runDir, repo, 'shell-fixture', { shellExecutable: 'node', shellFixedArgs: ['-e', claimsScript] });
    expect(phase1.status).toBe('success');

    const phase2 = await runReconciliationPhase(runDir, repo);
    expect(phase2.status).toBe('success');

    const gateResult = await runCommanderGate(runDir, async () => 'approve-all-verified');
    expect(gateResult.decision).toBe('approve-all-verified');
    expect(gateResult.approvedClaimIds).toContain('C001');

    for (const expectedFile of [
      'manifest.json', 'state/phase-0.json', 'state/phase-1.json', 'state/phase-2.json',
      'evidence-index.json', 'claims.json', 'narrative.md', 'reconciliation.json', 'approved_claims.json',
    ]) {
      expect(fs.existsSync(path.join(runDir, expectedFile)), `expected ${expectedFile} to exist`).toBe(true);
    }
  });

  it('never overwrites a prior run when audit is invoked twice', async () => {
    const first = await writePhase0Manifest(repo, 'audit');
    const second = await writePhase0Manifest(repo, 'audit');
    expect(second.runDir).not.toBe(first.runDir);
    expect(fs.existsSync(first.runDir)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the integration test to verify it fails**

Run: `npx vitest run orchestrator/integration/phase0-3.integration.test.ts`
Expected: FAIL only if any prior task's implementation has a defect the unit tests didn't catch — if all of Tasks 1–11 passed their own tests, this should already pass. Run it to confirm before writing the CLI (the CLI itself has no independent logic to test beyond argument dispatch).

- [ ] **Step 3: Implement the CLI entrypoint**

`scripts/orchestrator-cli.ts`:
```typescript
import { writePhase0Manifest } from '../orchestrator/core/manifest.js';
import { runAuditorPhase } from '../orchestrator/phase1/runAuditor.js';
import { runReconciliationPhase } from '../orchestrator/reconciliation/reconcile.js';
import { runCommanderGate } from '../orchestrator/gates/commanderGate.js';

const REPO_ROOT = process.cwd();

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case 'audit': {
      const { runDir } = await writePhase0Manifest(REPO_ROOT, 'audit');
      console.log(`Phase 0 complete: ${runDir}`);
      const phase1 = await runAuditorPhase(runDir, REPO_ROOT, 'codex');
      console.log(`Phase 1 result: ${phase1.status}`);
      if (phase1.status !== 'success') {
        process.exitCode = 1;
        return;
      }
      const phase2 = await runReconciliationPhase(runDir, REPO_ROOT);
      console.log(`Phase 2 result: ${phase2.status}`);
      if (phase2.status !== 'success') {
        process.exitCode = 1;
        return;
      }
      console.log(`Run ready for Commander review: npx tsx scripts/orchestrator-cli.ts gate ${runDir}`);
      break;
    }
    case 'gate': {
      const runDir = rest[0];
      if (!runDir) {
        console.error('Usage: orchestrator gate <runDir>');
        process.exitCode = 1;
        return;
      }
      const result = await runCommanderGate(runDir);
      console.log(`Decision recorded: ${result.decision}`);
      break;
    }
    default: {
      const { printHelp } = await import('./orchestrator-cli-help.js');
      printHelp();
      process.exitCode = command ? 1 : 0;
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
```

`scripts/orchestrator-cli-help.ts`:
```typescript
export function printHelp(): void {
  console.log(`
Usage: npx tsx scripts/orchestrator-cli.ts <command>

Commands:
  audit           Run Phase 0 (snapshot) -> Phase 1 (Auditor) -> Phase 2 (reconciliation)
  gate <runDir>   Run Phase 3 — interactive Commander approval gate for the given run

Builder, Verifier, and Publisher (Phases 4-7) are not implemented yet.
`);
}
```

Add to `package.json` `"scripts"`:
```json
"orchestrator": "tsx scripts/orchestrator-cli.ts"
```

Add to `.gitignore`:
```
runs/
```

- [ ] **Step 4: Run the full orchestrator test suite**

Run: `npx vitest run orchestrator/`
Expected: PASS — all unit and integration tests across every task.

- [ ] **Step 5: Manual smoke test against the real repo (read-only Phase 0 only — do not run Phase 1 against the real Codex CLI without your explicit go-ahead)**

Run: `npx tsx scripts/orchestrator-cli.ts audit` — expect it to reach Phase 0 successfully and then attempt Phase 1 against the real `codex` binary. If Task 6's flags weren't correct for the installed Codex CLI version, this is where that surfaces — stop and fix `orchestrator/adapters/codex.ts` per Task 6 Step 1's guidance rather than proceeding.

- [ ] **Step 6: Commit**

```bash
git add scripts/orchestrator-cli.ts scripts/orchestrator-cli-help.ts package.json .gitignore orchestrator/integration/
git commit -m "feat(orchestrator): add CLI entrypoint, wire audit/gate commands, add end-to-end Phase 0-3 test"
```

## Self-Review Notes

- **Spec coverage:** every numbered section of the design doc (§1 boundaries → §12 acceptance criteria) maps to a task above except Builder/Verifier/Publisher (§4's `build/`, `verify/`, `publish/` type-only directories), which are explicitly out of scope per Commander decision #10 and are not created by this plan — they remain a future plan.
- **Type consistency:** `AgentAdapter`/`AgentInvocation`/`AdapterResult` (Task 5) are the exact shapes consumed unchanged by Tasks 6, 7, and 9. `VerificationInstruction`/`Claim`/`ClaimsFile` (Task 4) are the exact shapes consumed unchanged by Tasks 8, 9, and 10. `ReconciliationEntry` (Task 10) is the exact shape consumed unchanged by Tasks 10's own summarizer and Task 11's gate.
- **Known-uncertain steps flagged, not hidden:** Task 6 Step 1 and Task 7 Step 1 require running `codex --help`/`claude --help` against the real installed binaries and correcting `buildArgs()` if reality differs from the documented-convention defaults I wrote. This is called out explicitly in both tasks and again in Task 12 Step 5's manual smoke test, rather than presented as settled.

### Task 13: Post-implementation review — evidence seal, and closing a `git_diff` write-primitive gap

Applied after Tasks 1–12 were already committed, in response to a second-opinion review of the original spec. Two of the review's four locks were already satisfied by the shipped implementation (harness-captured transcript as canonical evidence over agent self-report; runtime Publisher authority never implemented, so no conflict with development-workflow commits exists). The other two required real changes:

**13a — `git_diff` argument allowlist (closes a live write-primitive, not just a spec gap).**

While verifying the review's "executable + operation + path confinement" lock against the code (not just the spec prose), found that `orchestrator/reconciliation/engine.ts`'s `git_diff` case passed the claim's agent-supplied `args` array straight to `execFile('git', ['diff', ...args], ...)` with no filtering. `git diff --output=<path>` is a real git flag that writes arbitrary file content to a path resolved by git itself — a write primitive inside an instruction type the spec classifies as read-only diagnostic (§2 trust model), and one that never passed through `resolveWithinRepo()` the way path-bearing instructions do.

- **Files:** `orchestrator/claims/validate.ts` (added `GIT_DIFF_SAFE_FLAGS` allowlist + `isSafeGitDiffArg()`, wired into `checkExecutableAllowlist()`), `orchestrator/claims/validate.test.ts` (3 new tests: safe flags accepted, `--output=` rejected, `-O` orderfile-read rejected).
- Enforced at validation time, matching the existing `AUDITOR_DIAGNOSTIC_ALLOWLIST` pattern (§5) — a claim with a disallowed `git_diff` arg fails `CLAIMS_SCHEMA_INVALID`/allowlist validation before Phase 2 ever calls `execFile`.
- Non-flag args (refs, pathspecs) are still permitted freely — they filter what `git diff` shows, they don't change what it can do.

**13b — Evidence seal (spec §7 gap, and the review's Lock 3).**

Spec §7 already specified re-checking evidence integrity "immediately before Phase 2" and "again immediately before the Phase 3 gate is presented," but only the Phase 2 check existed in code — there was no re-check before `runCommanderGate()`. The review's evidence-seal proposal (hash-of-the-index + file count, sealed once at the end of Phase 1) closes both the missing pre-gate check and a category of tamper that a bare re-hash can miss: a file added to `raw/` post-hoc with a correctly-computed index entry passes a per-file hash comparison, since every file on disk still matches its own index entry — only a count/index-hash lock against a point-in-time seal catches it.

- **New file:** `orchestrator/evidence/seal.ts` — `sealEvidence(runDir)` writes `evidence-seal.json` (`evidence_index_sha256` of the canonical sorted-key-JSON index, `sealed_at`, `file_count`); `verifySeal(runDir)` recomputes and compares both, and additionally calls the existing `verifyEvidenceIntegrity()` so seal verification is a strict superset of the old bare integrity check, not a parallel one.
- **Test:** `orchestrator/evidence/seal.test.ts` — 6 tests, including one asserting the seal is order-independent (an index re-serialized in different key order still hashes identically) and one asserting a smuggled-in file with a *correctly computed* hash is still caught (proving the count/index-hash check catches what a per-file check alone would not).
- **Wired in:** `orchestrator/phase1/runAuditor.ts` calls `sealEvidence(runDir)` once, at the end of a successful Phase 1, after all `raw/` capture is finished. `orchestrator/reconciliation/reconcile.ts`'s Phase 2 entry check now calls `verifySeal()` instead of the bare `verifyEvidenceIntegrity()` (same `EVIDENCE_INTEGRITY_VIOLATION` result shape — no caller-visible API change). `orchestrator/gates/commanderGate.ts` now calls `verifySeal()` at the top of `runCommanderGate()`, before reading `reconciliation.json`, and throws `EVIDENCE_INTEGRITY_VIOLATION: ...` on failure — the gate is never presented against unsealed or since-modified evidence.
- **Test fixtures updated:** `orchestrator/reconciliation/reconcile.test.ts` and `orchestrator/gates/commanderGate.test.ts` now seal their fixture evidence in `beforeEach`, since both phases require an existing seal (its absence is itself a violation, not a silent pass) — matching the fail-loud convention used everywhere else in this spec.

Verified: full suite green (`npx vitest run --config orchestrator/vitest.all.config.ts` — 20 files, 79 tests, up from 19/69) including the real Phase 0→1→2→3 integration test exercising the actual `sealEvidence`/`verifySeal` wiring end to end, not just unit-level. `npx tsc --noEmit` clean for `orchestrator/`.
