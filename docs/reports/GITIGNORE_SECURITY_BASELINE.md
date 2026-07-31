# .gitignore Security Baseline

Date: 2026-07-20
File changed: `/Users/alexanderanthony/.gitignore` (working-tree edit only — not staged, not committed, per instructions).

## Pre-edit state

The pre-existing `.gitignore` (44 lines) covered build/cache basics for a normal project (`node_modules/`, `dist/`, `.DS_Store`, `*.log`, `.env*`, `__pycache__/`, `.pytest_cache/`, `*.bak`, `*.tmp`, etc.) but had **zero entries scoped to home-directory content** — expected, since it reads like a `.gitignore` written for a conventional project root, not a `$HOME`-rooted one.

## Verification performed before editing

For every path about to be added, ran `git ls-files -- '<path>' '<path>/'` to confirm zero currently-tracked content, so the new rules cannot silently orphan or hide already-committed files (gitignore never un-tracks existing files, but it does hide *new* untracked files under a matched path from `git status`, which is the failure mode being guarded against here).

| Path | Tracked files before edit | Included in new block? |
|---|---:|---|
| `.ssh/` | 0 | Yes |
| `.aws/` | 0 | Yes |
| `.gnupg/` | 0 | Yes |
| `.kube/` | 0 | Yes |
| `.docker/` | 0 | Yes |
| `.git-credentials` | 0 | Yes |
| `.netrc` | 0 | Yes |
| `.npmrc` | 0 | Yes |
| `.pypirc` | 0 | Yes |
| `Library/` | 0 | Yes |
| `Applications/` | 0 | Yes |
| `Desktop/` | 0 | Yes |
| `Downloads/` | 0 | Yes |
| `Movies/` | 0 | Yes |
| `Music/` | 0 | Yes |
| `Pictures/` | 0 | Yes |
| `Public/` | 0 | Yes |
| `.cache/` | 0 | Yes |
| `.npm/` | 0 | Yes |
| `.pnpm-store/` | 0 | Yes |
| `.yarn/` | 0 | Yes |
| `.local/` | 0 | Yes |
| `.vscode/` | 0 | Yes |
| `.idea/` | 0 | Yes |
| **`Documents/`** | **10** | **No — deliberately excluded** |

## One deviation from the suggested block: `Documents/`

The task's suggested minimal block lists `Documents/` under "OS and user-local data." That's wrong for this specific repo: `Documents/` has 10 legitimately tracked files, all under `Documents/Codex/2026-06-02/do-a-full-system-update-and-2/` — a voice-bridge daemon payload (`voice_vibe.py`, `vibevoice_worker.py`, tests, a launchd plist) that was committed to `feature/frontend-design-guardian` via commit `9d33b07`.

Adding `Documents/` to `.gitignore` would not un-track those 10 files, but it would silently hide any *new* file added anywhere under `Documents/` from `git status` and future `git add` — exactly the "ignoring a legitimate tracked project directory because its name matches a generic home folder" failure mode the task instructions explicitly warned against. Left out; noted inline in `.gitignore` itself so a future editor doesn't re-add it without knowing why.

## `.env*` — no change needed

The existing `.gitignore` already has `.env*` (line 5) and `.env.local` (line 6), which cover `.env` and every `.env.<suffix>` variant. The suggested block's `.env` / `.env.*` / `!.env.example` lines were not re-added — they'd be redundant with the existing pattern.

**Side observation (not fixed, out of scope for this pass):** the existing `.env*` pattern also currently swallows `.env.example`, `.env.notebooklm.example`, and `.env.schema` — files that read as intentional documentation/templates, not secrets, and are arguably meant to be tracked. All three are currently untracked and ignored by the pre-existing pattern (confirmed via `git check-ignore -v`), unrelated to this security pass. Flagged for a separate, deliberate `.gitignore` cleanup — not touched here since it's a pre-existing project-config choice, not a credential-exposure risk.

## Applied diff (conceptual — file was edited via targeted insertion, not full rewrite)

```gitignore
# --- Security containment: home-root repository boundary (added 2026-07-20) ---
# This repository is intentionally rooted at $HOME (see docs/reports/HOME_ROOT_REPOSITORY_RISK.md).
# Every path below was verified via `git ls-files` to have zero currently-tracked
# content before being added — see docs/reports/GITIGNORE_SECURITY_BASELINE.md.

# Credentials — must never be tracked
.ssh/
.aws/
.gnupg/
.kube/
.docker/
.git-credentials
.netrc
.npmrc
.pypirc

# OS and user-local data
# NOTE: Documents/ is deliberately NOT listed here. It has 10 legitimately
# tracked files (Documents/Codex/.../voice_bridge/*). Ignoring it would
# silently hide any new file added under Documents/ from `git status`.
Library/
Applications/
Desktop/
Downloads/
Movies/
Music/
Pictures/
Public/

# Common local caches and tooling
.cache/
.npm/
.pnpm-store/
.yarn/
.local/
.vscode/
.idea/
```

## Post-edit verification (Phase 6 conflict check)

Re-ran the same `git ls-files` check against every newly-added pattern after the edit: **zero conflicts** — no pattern in the new block matches any currently-tracked file. `Documents/` confirmed still unignored with its 10 tracked files intact. `git diff --cached --stat` confirmed empty (nothing staged). `git status --porcelain -- .gitignore` shows exactly one line, ` M .gitignore` — the only change in this pass.

## Not yet protected (residual gaps, explicitly out of scope for this pass)

- `.config/` — exists, 0 tracked, **not** added to the new block (it's broad enough to potentially house legitimate future tool config; recommend a narrower, explicit look before blanket-ignoring — e.g. `.config/gh/`, `.config/gcloud/` specifically, rather than the whole tree).
- `.zsh_history` — exists, untracked, unignored. A single high-value file (shell history can contain pasted secrets/tokens from command-line usage). Not in the task's suggested block; flagged here as a recommended follow-up addition.
- The ~68 legitimate separate-project nested repos (`Projects/`, `Developer/`, `Backend Services/`, `Landing Page Sites/`, `codex-workspace/`) — deliberately not touched; see `HOME_ROOT_REPOSITORY_RISK.md`.
