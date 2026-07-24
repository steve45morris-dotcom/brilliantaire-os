# Local Multi-Agent Orchestration System — Architecture Specification

**Status:** Approved with required revisions (Commander decisions locked below). Phase 0–3 scoped for first implementation.

## Governing principle

> Agents may interpret. The harness establishes facts. Commander authorizes state changes.

Every design decision below traces back to this sentence. Where a choice was ambiguous, the harness gets the conservative/authoritative role and the agent gets the interpretive/advisory role.

## 1. System boundaries

**In scope (this spec, full system):** a standalone TypeScript CLI system, invoked via `npx tsx`, that runs as separate OS processes per phase, orchestrates external agent CLIs (Codex, Claude, later Gemini) as subprocesses, captures their output as evidence, independently re-verifies claims, and gates state-changing actions behind interactive Commander approval.

**In scope (this implementation, Phase 0–3 only):** repository snapshot → Auditor invocation → structured claim reconciliation → Commander approval gate. Ends at `approved_claims.json`. No file mutation, no git mutation, anywhere in this implementation.

**Out of scope (deferred to a later spec revision, interfaces only specified here):** Builder (Phase 4), independent build verification (Phase 5), second Commander gate (Phase 6), Publisher (Phase 7).

**Explicitly not used as the orchestration mechanism:** MCP. This system does not run as an MCP server and does not depend on any MCP client being connected. It is invoked directly from a shell.

**Explicitly not coupled:** the application's `SecurityManager` (`Administrator`/`Operator`/`Viewer`) role hierarchy. Per Commander decision #1, orchestration roles are a separate concept with their own capability model. `SecurityManager`'s *evaluation pattern* (a policy map + a hierarchy/grant check function) is reused as a design template; its code and its `PermissionRole` type are not imported or extended.

## 2. Trust boundaries

Four trust boundaries, each a real OS process boundary (per Commander's "separate process hops" requirement — none of these are function calls within one process):

```
┌─────────────────────────────────────────────────────────────┐
│ Orchestration Harness (this system)                          │
│  — the only thing that writes runs/, raw/, evidence-index,    │
│    state/, reconciliation.json, approved_claims.json          │
│  — the only thing that executes verification instructions     │
│  — the only thing that checks capability grants                │
└───────────────┬─────────────────────────┬─────────────────────┘
                │ execFile (argv, no shell)│ execFile (argv, no shell)
                ▼                          ▼
    ┌───────────────────────┐   ┌───────────────────────┐
    │ Auditor process        │   │ (future) Builder/      │
    │ (Codex CLI, sandboxed:  │   │ Verifier/Publisher     │
    │  read + diagnostic only)│   │ processes               │
    └───────────────────────┘   └───────────────────────┘
                │
                ▼
      ┌───────────────────┐
      │ Commander           │  ← interactive terminal prompt,
      │ (human, Phase 3/6)   │    a separate process hop by
      └───────────────────┘     construction (you re-run the
                                  CLI to answer the gate)
```

**Trust asymmetry, stated explicitly:**
- The Auditor process is **never trusted** for facts — only for claims, which are inert until independently reconciled.
- The harness is **trusted** for facts, because it is the only thing that executes verification instructions and records their real exit codes/output.
- The Commander is **trusted** for authorization — no state-changing capability (`git:commit`, `git:push`, `git:pr`, and in the full system `fs:write` for the Builder) is exercisable without a Commander-approval artifact present in the run directory, in addition to the role's static capability grant.

## 3. Directory structure

```
orchestrator/                          # new — orchestration domain code, zero dependency on src/
  core/
    types.ts                            # RepoSnapshot, RunContext, phase identifiers
    manifest.ts                          # Phase 0 writer
    runPaths.ts                           # runs/<kind>-<timestamp>/ resolution, collision-safe
    repoState.ts                           # capture + compare repo identity, drift detection
  permissions/
    capabilities.ts                       # Capability type, canonical set
    roles.ts                               # OrchestrationRole type, role→capability grants
    policy.ts                               # hasCapability(), requiresApproval(), hasApproval()
  adapters/
    types.ts                                # AgentAdapter interface, AdapterConfig
    codex.ts
    claude.ts
    gemini.ts                                # DEFERRED_ADAPTER stub — throws NotImplemented
    shell.ts                                  # generic shell-command adapter
    registry.ts                               # config-driven lookup, brand-independent of orchestrator core
  evidence/
    capture.ts                                 # the ONLY module permitted to write into raw/
    hashing.ts                                  # sha256 of files, evidence-index.json read/write
    index.ts
  claims/
    schema.ts                                    # Zod: Claim, VerificationInstruction discriminated union
    validate.ts                                   # validates claims.json against schema + executable allowlist
  reconciliation/
    engine.ts                                     # executes one VerificationInstruction, returns a result
    reconcile.ts                                   # Phase 2 — runs engine over all claims, writes reconciliation.json
  gates/
    commanderGate.ts                                # Phase 3 — interactive terminal approval, per-claim-ID
  reporting/
    summarize.ts                                     # reconciliation summary counts for the gate screen
  build/                                               # interfaces only, not implemented this pass
    types.ts
  verify/                                               # interfaces only, not implemented this pass
    types.ts
  publish/                                               # interfaces only, not implemented this pass
    types.ts
config/
  orchestrator-adapters.ts                                # AdapterConfig entries: codex, claude, gemini(deferred), shell
scripts/
  orchestrator-cli.ts                                      # entrypoint: audit | reconcile | gate | status
  orchestrator-cli-help.ts
runs/                                                        # git-ignored, created at runtime
  audit-YYYYMMDD-HHMMSS/
    manifest.json
    state/
      phase-0.json
      phase-1.json
      phase-2.json
    raw/
      codex-session-transcript.txt
      ...
    evidence-index.json
    claims.json
    narrative.md
    reconciliation.json
    approved_claims.json
```

`runs/` is added to `.gitignore` — these are evidence artifacts, not source, and per "never overwrite previous runs" they will accumulate; they don't belong in git history.

## 4. TypeScript interfaces (core contracts)

```typescript
// orchestrator/core/types.ts

export type Phase = 'phase-0' | 'phase-1' | 'phase-2' | 'phase-3';

export interface RepoIdentity {
  repoRoot: string;
  branch: string;
  commit: string;
  remote: string | null;
  workingTreeStatusHash: string;   // sha256 of `git status --porcelain=v1` output
  capturedAt: string;               // ISO 8601
}

export interface RunManifest {
  runId: string;                     // e.g. "audit-20260724-153000"
  runDir: string;                    // absolute path
  repo: RepoIdentity;
  agentRole: 'Auditor';              // literal for this implementation; widened later
  agentModel: string;                // e.g. "codex-cli" — adapter-reported identity
  sandboxMode: 'read-only';          // literal for Auditor in this implementation
  timestamp: string;                  // ISO 8601, manifest write time
}

export interface StateSnapshot {
  phase: Phase;
  repo: RepoIdentity;
  recordedAt: string;
}

export type RepoStateComparisonResult =
  | { status: 'MATCH' }
  | { status: 'DRIFT'; reasons: string[] };  // e.g. ["commit changed: abc123 -> def456"]
```

```typescript
// orchestrator/permissions/capabilities.ts

export type Capability =
  | 'fs:read'
  | 'fs:write'
  | 'process:diagnostic'   // read-only shell diagnostics (git status, ls, grep, wc, comm, diff...)
  | 'process:build'         // running build/test/typecheck/lint targets
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

```typescript
// orchestrator/permissions/roles.ts

import type { Capability } from './capabilities.js';

export type OrchestrationRole = 'Auditor' | 'Builder' | 'Verifier' | 'Publisher';

export const ROLE_CAPABILITIES: Record<OrchestrationRole, readonly Capability[]> = {
  Auditor:   ['fs:read', 'process:diagnostic', 'git:read'],
  Builder:   ['fs:read', 'fs:write', 'process:diagnostic', 'process:build', 'git:read'],
  Verifier:  ['fs:read', 'process:diagnostic', 'process:build', 'git:read'],
  Publisher: ['fs:read', 'git:read', 'git:stage', 'git:commit', 'git:push', 'git:pr'],
};
```

```typescript
// orchestrator/permissions/policy.ts

import type { Capability } from './capabilities.js';
import { ROLE_CAPABILITIES, CAPABILITIES_REQUIRING_APPROVAL, OrchestrationRole } from './roles.js';

export function hasCapability(role: OrchestrationRole, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export function requiresApproval(capability: Capability): boolean {
  return CAPABILITIES_REQUIRING_APPROVAL.includes(capability);
}

// Static grant check only in this implementation; hasApproval() (checking for an
// approval artifact in the run directory) is specified for the full system but has
// no caller in Phase 0-3, since no gated capability is exercised there.
export function hasApproval(_runDir: string, _capability: Capability): boolean {
  throw new Error('Not implemented in Phase 0-3 — no gated capability is exercised by the Auditor.');
}
```

```typescript
// orchestrator/adapters/types.ts

export interface AgentInvocation {
  runDir: string;
  repoRoot: string;
  promptOrInstructionPath: string;   // path to a file containing the task instructions
}

export interface AdapterResult {
  exitCode: number | null;
  outcome: 'success' | 'failure' | 'timeout';
  stdout: string;                     // full captured stdout — harness writes this into raw/
  stderr: string;                     // full captured stderr — harness writes this into raw/
  durationMs: number;
  modelIdentity: string;               // adapter-reported, goes into manifest.agentModel
}

export interface AgentAdapter {
  readonly adapterName: string;         // "codex" | "claude" | "gemini" | "shell"
  readonly executable: string;
  buildArgs(invocation: AgentInvocation): string[];
  readonly cwd: 'repo';                  // constrained — no arbitrary cwd
  buildEnv(): Record<string, string>;
  readonly timeoutMs: number;
  readonly sandboxMode: 'read-only' | 'repo-write' | 'unrestricted';
  run(invocation: AgentInvocation): Promise<AdapterResult>;
}

export class DeferredAdapterError extends Error {
  constructor(adapterName: string) {
    super(`Adapter "${adapterName}" is DEFERRED_ADAPTER — not implemented in this build.`);
  }
}
```

## 5. Verification instruction schema

Replaces `verification: string[]` entirely. Zod-validated discriminated union — **new dependency: `zod`** (justified: it's explicitly the project's own TypeScript-rules-recommended validation approach, and it is a validation library, not an orchestration framework).

```typescript
// orchestrator/claims/schema.ts
import { z } from 'zod';

const ProcessInstruction = z.object({
  type: z.literal('process'),
  executable: z.string(),                       // must be on the role's executable allowlist — see below
  args: z.array(z.string()),
  cwd: z.literal('repo').default('repo'),         // no arbitrary paths — always resolves to repo root
  expected: z.object({ exit_code: z.number().int() }).optional(),
  timeout_ms: z.number().int().positive().max(120000).default(30000),
});

const FileExistsInstruction   = z.object({ type: z.literal('file_exists'),   path: z.string() });
const FileAbsentInstruction   = z.object({ type: z.literal('file_absent'),   path: z.string() });
const FileHashInstruction     = z.object({ type: z.literal('file_hash'),     path: z.string(), algorithm: z.literal('sha256').default('sha256'), expected_hash: z.string().optional() });
const FileContainsInstruction = z.object({ type: z.literal('file_contains'), path: z.string(), pattern: z.string(), is_regex: z.boolean().default(false) });
const GitDiffInstruction      = z.object({ type: z.literal('git_diff'),      args: z.array(z.string()).default([]) });
const GitStatusInstruction    = z.object({ type: z.literal('git_status') });
const TestInstruction         = z.object({ type: z.literal('test'),         target: z.string().optional() });
const TypecheckInstruction    = z.object({ type: z.literal('typecheck') });
const BuildInstruction        = z.object({ type: z.literal('build') });

export const VerificationInstruction = z.discriminatedUnion('type', [
  ProcessInstruction, FileExistsInstruction, FileAbsentInstruction, FileHashInstruction,
  FileContainsInstruction, GitDiffInstruction, GitStatusInstruction, TestInstruction,
  TypecheckInstruction, BuildInstruction,
]);
export type VerificationInstruction = z.infer<typeof VerificationInstruction>;

export const Claim = z.object({
  claim_id: z.string().regex(/^C\d{3,}$/),
  claim: z.string().min(1),
  evidence: z.array(z.string()),             // must reference paths under raw/ — checked separately against evidence-index.json
  verification: z.array(VerificationInstruction).min(1),
});
export type Claim = z.infer<typeof Claim>;

export const ClaimsFile = z.object({ claims: z.array(Claim) });
export type ClaimsFile = z.infer<typeof ClaimsFile>;
```

**Executable allowlist — my addition, flagged for your confirmation.** Schema validity alone ("is this valid JSON shape") is not the same as "is this safe to run." A structurally valid `{"type":"process","executable":"/bin/rm","args":["-rf","."]}` would pass the Zod schema. Phase 2's `validate.ts` therefore also checks `executable` against a role-scoped allowlist before any `process` instruction is accepted:

```typescript
export const AUDITOR_DIAGNOSTIC_ALLOWLIST = [
  'git', 'ls', 'cat', 'wc', 'comm', 'diff', 'grep', 'find', 'shasum', 'sha256sum',
] as const;
```

An instruction whose `executable` is not on this list fails validation with `VERIFICATION_INSTRUCTION_INVALID` before Phase 2 ever attempts to run it — this is enforced at validation time, not execution time, so a bad claim never reaches `execFile`.

**No shell strings, ever.** `type: 'process'` instructions execute via `execFile(executable, args, { cwd, timeout })` — argv array, no `shell: true`, no `exec()`, no `bash -lc`/`sh -c`. This is a hard constraint on `reconciliation/engine.ts`, not a convention — there is exactly one function in the codebase permitted to spawn a process for verification, and it only accepts `(executable: string, args: string[])`.

## 6. Capability model

Covered in §4 (`permissions/`). Summary of the two-stage check every capability-gated action goes through:

1. **Static grant** — `hasCapability(role, capability)`. Fixed per role, defined in code, not runtime-configurable. Denial here means the action is never attempted — the adapter invocation or process spawn is never constructed.
2. **Dynamic approval** (only for `CAPABILITIES_REQUIRING_APPROVAL`) — `hasApproval(runDir, capability)`, checked against the presence of a signed approval artifact in the run directory (`approved_claims.json` for build authorization in the full system; a distinct publish-approval record for Phase 6/7). **Not exercised in Phase 0-3** — the Auditor role never touches a gated capability, so this function exists as a specified contract with no caller yet, and its body is intentionally a `throw` rather than a stub that silently returns `true`, so any accidental future caller fails loudly instead of fake-passing.

## 7. Evidence integrity model

- `orchestrator/evidence/capture.ts` is the **only** module in the codebase with a file-write path targeting `<runDir>/raw/`. No adapter, no claims-validation code, no reconciliation code holds a reference to that directory for writing — only for reading, post-capture.
- Every write into `raw/` is immediately followed by a `sha256` hash of the written file, recorded into `evidence-index.json`:
  ```json
  {
    "raw/codex-session-transcript.txt": { "sha256": "…", "captured_at": "2026-07-24T15:30:02.000Z" }
  }
  ```
- **Integrity re-check, not just write-time recording.** Immediately before Phase 2 (reconciliation) begins, and again immediately before the Phase 3 gate is presented, the harness re-hashes every file physically present in `raw/` and diffs against `evidence-index.json`:
  - A file present in `raw/` but absent from the index → `EVIDENCE_INTEGRITY_VIOLATION` (unexplained file).
  - A file whose hash no longer matches the index → `EVIDENCE_INTEGRITY_VIOLATION` (mutation detected).
  - A file in the index but missing from `raw/` → `EVIDENCE_INTEGRITY_VIOLATION` (deletion detected).
  - Any of the above halts execution; it is not a warning.

## 8. Repository-state transition model

- **`manifest.json` is written once, at Phase 0, and never modified again.** It is the baseline record.
- **State transitions are recorded separately**, under `state/<phase>.json`, each an independent `StateSnapshot`:
  - `state/phase-0.json` — identical `RepoIdentity` to what's embedded in `manifest.json`, kept as a standalone comparison target so nothing ever needs to re-open/re-write `manifest.json`.
  - `state/phase-1.json` — captured immediately after the Auditor process exits, before reconciliation starts.
  - `state/phase-2.json` — captured immediately after reconciliation completes, before the Phase 3 gate is presented.
- **Recheck points, per Commander decision #4** (at minimum, before): audit (this *is* phase-0, the baseline — nothing to compare yet), reconciliation (compare phase-1 snapshot against phase-0 — Auditor is mutation-blocked, so these must be identical), and — specified for the full system, not exercised here — builder execution, build verification, and publication.
- **Comparison function** (`repoState.ts`): compares `branch`, `commit`, `remote`, and `workingTreeStatusHash`. In Phase 0-3, since nothing in this scope is permitted to mutate the repo, **any** difference at any recheck point is drift — there is no "expected change" case to special-case yet (that distinction matters starting at Phase 4, where a commit-hash change *after* the Builder runs is expected and a *pre*-Builder change is still drift — out of scope here, noted for the future spec revision).
- **On drift:** emit `REPOSITORY_STATE_DRIFT` with the specific reasons (e.g. `["commit changed: abc123 -> def456", "working tree status hash changed"]`), write it to the run directory as `state/drift-<phase>.json`, and halt with a non-zero exit code. Never continue silently.

## 9. Agent adapter contract

See §4 `AgentAdapter` interface. Three points not fully captured by the type signature:

- **Config-driven, not hardcoded.** `config/orchestrator-adapters.ts` exports an `AdapterConfig[]` (executable path, default args, timeout, sandbox mode) per adapter name; `adapters/registry.ts` resolves a requested adapter name to its implementation purely by lookup. The orchestrator core never imports `codex.ts` or `claude.ts` directly — only the registry does. Swapping which CLI plays the Auditor role is a config change, not a code change.
- **Codex and Claude only, in this implementation.** Both binaries are confirmed installed (`/usr/local/bin/codex`, `/Users/alexanderanthony/.local/bin/claude`). `gemini.ts` exists as a file (satisfying "implement an adapter interface... support at minimum... Gemini CLI adapter") but its `run()` throws `DeferredAdapterError` unconditionally — it is registered, visible in `orchestrator status`, and explicitly marked `DEFERRED_ADAPTER`, per Commander decision #9. No `bash -lc` is introduced to work around the `gemini` shell alias. Locating the real Gemini binary (or writing a narrowly-scoped safe wrapper) is future work, explicitly deferred, not silently worked around.
- **Claims/narrative file placement, and why raw/ capture works the way it does — a design decision requiring your confirmation.** The Auditor CLI (Codex) is invoked in non-interactive mode with a constructed instruction telling it to (a) investigate using only read/diagnostic operations, and (b) write its two structured outputs to two fixed paths it's told about explicitly: `<runDir>/claims.json` and `<runDir>/narrative.md` — **not** into `raw/`, which the agent is never told exists as a writable location. Separately and unconditionally, the harness captures the *entire* stdout+stderr stream of the Codex process itself (everything the CLI prints, regardless of what Codex did internally) and writes that verbatim transcript into `raw/codex-session-transcript.txt` as the harness's own write, immediately hashed into `evidence-index.json`. This satisfies "raw/ must contain verbatim command output captured by the orchestration harness" using a mechanism that's true by construction (I am capturing the harness's own view of the child process's output stream, not trusting Codex to self-report), independent of whether Codex CLI exposes a more granular per-command transcript format. **I have not yet empirically verified Codex CLI's actual non-interactive/exec-mode flags and output format** — resolving this against real `codex --help` output is the first implementation step in the plan below, and if Codex's non-interactive mode produces additional structured per-tool-call logs, those get captured as additional `raw/*.txt` files rather than replacing the whole-transcript capture.

## 10. Phase 0–3 execution sequence

```
$ npx tsx scripts/orchestrator-cli.ts audit
```

1. **Phase 0 — Repository Snapshot**
   - Resolve repo root (`git rev-parse --show-toplevel`), branch, commit, remote, `git status --porcelain=v1` (hashed).
   - Create `runs/audit-YYYYMMDD-HHMMSS/` — if that exact path exists (practically impossible but checked), append `-2`, `-3`, ... rather than overwrite.
   - Write `manifest.json` and `state/phase-0.json` (identical `RepoIdentity` content, separate files per §8).
   - Exit 0 on success; any failure to resolve git state is a hard stop (no manifest = no run).

2. **Phase 1 — Auditor**
   - Resolve the Auditor adapter from `config/orchestrator-adapters.ts` (default: `codex`).
   - Static capability check: Auditor role has `fs:read`, `process:diagnostic`, `git:read` — no `fs:write`, no git mutation, no `network:egress`. These are enforced by **what the adapter is told and how it's sandboxed at the CLI-flag level** (Codex's own `--sandbox`/approval flags, resolved during implementation), not merely documented.
   - Build the instruction file (task description + explicit output paths for `claims.json`/`narrative.md` + the evidence-rule reminder that `narrative.md` is `UNTRUSTED INTERPRETATION` even to itself).
   - `execFile(codexExecutable, args, { cwd: repoRoot, timeout, env })`.
   - On completion: harness writes `raw/codex-session-transcript.txt` (stdout+stderr, verbatim) and hashes it into `evidence-index.json`.
   - Validate `claims.json` against the Zod schema + executable allowlist (§5). Any invalid claim is rejected with `VERIFICATION_INSTRUCTION_INVALID` (the whole file, not a silent partial acceptance — a claims file with one bad instruction fails Phase 1, it does not proceed with the other claims quietly).
   - Confirm `narrative.md` exists and is clearly labeled — the harness prepends an `UNTRUSTED INTERPRETATION` banner if the agent didn't already include one, so downstream readers can never mistake it for evidence even if the agent forgets the label.
   - Capture `state/phase-1.json`, compare against `state/phase-0.json` (§8) — any drift halts here with `REPOSITORY_STATE_DRIFT`.

3. **Phase 2 — Independent Reconciliation**
   - Re-hash everything in `raw/` against `evidence-index.json` (§7) before proceeding — any mismatch halts with `EVIDENCE_INTEGRITY_VIOLATION`.
   - For each claim, for each `VerificationInstruction`: execute independently via `reconciliation/engine.ts` (harness-owned `execFile`, never the Auditor's process). Record `actual_result`, `exit_code`, and classify against `expected` (if present) into one of the five allowed statuses — no free-form labels, enforced by the Zod-validated output type.
   - Write `reconciliation.json`.
   - Capture `state/phase-2.json`, compare against `state/phase-1.json` — any drift halts here.

4. **Phase 3 — COMMANDER GATE**
   - `npx tsx scripts/orchestrator-cli.ts gate <runId>` (a separate invocation — a real process hop, not a continuation of the `audit` command).
   - Print the reconciliation summary (§ Reporting: total / verified / verified-with-conditions / contradicted / not-verified / not-testable counts).
   - Interactive terminal prompt (Node built-in `readline/promises` — no new dependency): approve all verified, approve selected claim IDs, or reject the audit.
   - Write `approved_claims.json` listing the approved claim IDs and the decision metadata (who/when — `who` is just "Commander" since this is a single-operator local tool, `when` is a real timestamp).
   - This is the terminal state for this implementation. No Builder is invoked.

## 11. Failure states

| State | Trigger | Behavior |
|---|---|---|
| `REPOSITORY_STATE_DRIFT` | Repo identity comparison fails at any recheck point (§8) | Halt, write `state/drift-<phase>.json`, non-zero exit |
| `EVIDENCE_INTEGRITY_VIOLATION` | `raw/` re-hash mismatch, unexplained file, or missing file (§7) | Halt, non-zero exit |
| `ADAPTER_EXECUTION_FAILURE` | Auditor process crashes, times out, or exits non-zero unexpectedly | Halt Phase 1, no `claims.json` is trusted even if partially written |
| `CLAIMS_SCHEMA_INVALID` | `claims.json` fails top-level Zod parse | Halt Phase 1 |
| `VERIFICATION_INSTRUCTION_INVALID` | A claim's verification instruction fails schema validation or fails the executable allowlist check | Halt Phase 1 — the whole claims file is rejected, not filtered down silently |
| `GATE_REJECTED` | Commander selects "reject the audit" at Phase 3 | Clean exit; no `approved_claims.json` is written; run directory is preserved as-is for record-keeping |
| `RUN_COLLISION` | A run directory for the resolved timestamp already exists | Append a numeric suffix rather than overwrite; this should be unreachable in practice (second-resolution timestamps) but is handled, not assumed away |

## 12. Acceptance criteria (Phase 0–3)

1. Running `orchestrator audit` against a real git repository produces a `runs/audit-<ts>/` directory containing `manifest.json`, `state/phase-0.json`, `raw/`, `evidence-index.json`, `claims.json`, `narrative.md`, `state/phase-1.json`, `reconciliation.json`, `state/phase-2.json` — all schema-valid.
2. Running `orchestrator audit` a second time never overwrites the first run's directory.
3. `manifest.json`'s content is byte-identical before and after Phase 1/2 (never re-opened for writing after Phase 0).
4. A claim whose `verification` array contains an instruction with `executable` outside the allowlist is rejected at validation time — `execFile` is never called for it. Verified by a unit test asserting the reconciliation engine received zero invocations for that claim.
5. Every entry in `evidence-index.json` corresponds to a real file in `raw/` with a matching sha256, and vice versa, after Phase 1 completes.
6. Manually editing a file inside a completed run's `raw/` directory and then re-running Phase 2 against that run produces `EVIDENCE_INTEGRITY_VIOLATION`, not a silently-accepted result.
7. Manually checking out a different branch between Phase 1 and Phase 2 produces `REPOSITORY_STATE_DRIFT`, not a silently-continued reconciliation.
8. `reconciliation.json` contains only the five allowed status values — verified by schema, not by convention.
9. `orchestrator gate` presents the correct summary counts, accepts "approve all verified" / "approve selected IDs" / "reject" as the only three decision paths, and `approved_claims.json` only ever contains claim IDs that were actually `VERIFIED` or `VERIFIED_WITH_CONDITIONS` in `reconciliation.json` (the gate cannot approve a `CONTRADICTED` or `NOT_VERIFIED` claim by ID selection — attempting to select one is rejected with a clear message, not silently accepted).
10. No test, no run, no code path in this implementation ever calls `exec()`, passes `shell: true`, or constructs a `bash -lc`/`sh -c` invocation. Enforced by a lint rule or a grep-based test over `orchestrator/` — see test strategy.

## 13. Test strategy

- **Unit tests** (vitest, matching repo convention), one file per module:
  - `capabilities`/`roles`/`policy` — grant matrix is exactly as specified; `Publisher` has no `fs:write`; `Auditor` has no git-mutation capability; `requiresApproval()` returns true only for the three specified capabilities.
  - `claims/schema` — valid claims pass, each of the 9 instruction-type malformations individually fails, an `executable` outside the allowlist fails `validate.ts` even though it'd pass the bare Zod schema.
  - `evidence/hashing` — round-trip write→hash→verify; a tampered file is detected; an unexplained file is detected; a deleted-but-indexed file is detected.
  - `core/repoState` — identical snapshots compare `MATCH`; a changed commit, changed branch, or changed working-tree-status-hash each independently produce `DRIFT` with the correct reason string.
  - `reconciliation/engine` — each of the 9 instruction types executed against small fixture files/repos in a scratch temp directory (never the real repo), correct status classification for exit-code-matches, exit-code-mismatches, and not-testable cases (e.g. a `test`/`build` instruction where the fixture repo has no such script).
- **Static/grep test** — a dedicated test asserts no file under `orchestrator/` contains the strings `exec(`, `shell: true`, `bash -lc`, or `sh -c`, satisfying acceptance criterion #10 mechanically rather than by review alone.
- **Integration test** — the full Phase 0→1→2 flow run against a disposable fixture git repository created in a temp directory for the test (never the real `/Users/alexanderanthony` repo), using the `shell` adapter configured to run a trivial fixed script instead of Codex (so the integration test doesn't require Codex CLI to be installed/network-reachable in CI), asserting the full artifact set from acceptance criterion #1 exists and validates.
- **Phase 3 gate**, being interactive, is tested by injecting a non-interactive decision source for test mode only (e.g. `ORCHESTRATOR_TEST_DECISION` env var read instead of `readline` when set) — clearly documented as test-only, never read in a real Commander-facing invocation path without that env var explicitly set.

## 14. Migration / reuse map

| Existing component | Disposition |
|---|---|
| `src/kernel/security/SecurityManager.ts` (`PermissionRole`, `actionPolicies`, hierarchy check) | **Pattern reused, code not shared.** Per Commander decision #1 — `orchestrator/permissions/` is a fresh, independent implementation of the same shape (policy map + grant check), deliberately not importing `PermissionRole`. |
| `src/kernel/live/TaskTracker.ts` (`execFile` usage) | **Convention followed.** Confirms `execFile` over `exec`/shell strings is already this repo's house style for subprocess safety. |
| `workflows/runs/wf-run-<timestamp>-<rand>.json` | **Convention followed** for the `runs/<kind>-<timestamp>/` structure — validates, doesn't replace. |
| `scripts/audit.ts` (`npm run audit`) | **Pattern followed** for `reconciliation/engine.ts` — `execSync`/`execFile` + real exit-code checking is the one genuinely-functioning verification precedent in the repo. |
| `scripts/*.ts` + `*-help.ts` + `package.json` script entry convention | **Convention followed** for `scripts/orchestrator-cli.ts` / `scripts/orchestrator-cli-help.ts`. |
| `scripts/pipeline-stage-gate.ts`, `scripts/asr-*-gate.ts`, `scripts/grinders-keep-*-gate.ts` | **Not reused — explicitly avoided as an anti-pattern.** These generate templated markdown with hardcoded fictional role names and perform no real verification; they were the closest *name* match but the wrong architecture entirely. |
| `scripts/platform-adapter.ts`, `scripts/agents.ts`, `scripts/gemini-cli.ts` | **Not reused — false positives.** Marketing-content templating, static roster printing, and a Gemini *API* health-check respectively; none execute or adapt an external agent CLI process. |
| `scripts/subagent_orchestrator.py` | **Not reused** — Python, and solves code-synthesis-sandboxing rather than named-CLI routing. Confirms `session_id`/JSON-output/sandbox-dir are pre-existing conventions elsewhere in the repo, informationally. |
| Zod (TypeScript coding-style rule, not yet a dependency) | **Adopted, new dependency.** Matches the project's own stated schema-validation preference. |

## 15. Open items requiring your confirmation before/during implementation

1. **Codex CLI non-interactive invocation shape** — exact flags for sandbox mode, output format, and instruction-passing mechanism will be confirmed empirically against `codex --help` as implementation step 1, per §9. If Codex's actual behavior doesn't fit the "writes claims.json/narrative.md to told paths, harness captures whole-transcript stdout" model, I'll surface the discrepancy before proceeding rather than silently adapting the architecture.
2. **Executable allowlist for `process` verification instructions** (§5) — this is my addition beyond your explicit spec; confirm the proposed list (`git, ls, cat, wc, comm, diff, grep, find, shasum, sha256sum`) is the right scope, or tell me what to add/remove.
