# Brilliantaire OS — Root Repository Audit

**Date:** 2026-10-05 · **Scope:** everything outside `Knowledge Core/` · **Method:** read-only; the repo's own checks (`tsc`, `vitest`, `npm run audit`, `npm run doc-drift`, `npm run bridge-health`, orchestrator phase-0 suite) plus static cross-referencing of `package.json`, `Taskfile.yml`, `config/commands.ts` and `scripts/`.

## Verdict

The code that exists is healthy: typecheck clean, 654 tests passing, every built-in audit green. The problem is the code that doesn't exist. **A third of the command surface is phantom** — 124 of the 356 commands in the Safe Command Router, and 142 of the 389 `npm` scripts, point at files under `scripts/` that have never been committed and are not on disk. The repo's own checks don't catch this because none of them verify that a registered command's target file exists.

## What's green

| Check | Result |
|---|---|
| `tsc --noEmit` (root) | clean |
| `vitest run` (root) | 53 files passed, 4 skipped · 654 tests passed, 23 skipped |
| `orchestrator/vitest.phase0.config.ts` | 2 files, 6 tests passed |
| `npm run audit` | AUDIT PASSED — 9 core files, 10 sandboxed skills |
| `npm run doc-drift` | 8 system indexes OK |
| `npm run bridge-health` | all bridges OK |
| CI (`.github/workflows/ci.yml`) | runs tsc, the P.J.K. registry contract test, and the suite on every PR |

## Findings, ranked

### F1 · High — 124 registered commands and 142 npm scripts route to files that don't exist

- `config/commands.ts` registers 356 commands by `npmScript` name. 124 of those names map, via `package.json`, to a `tsx scripts/<name>.ts` whose file is absent.
- `package.json` has 389 scripts; 142 target missing files. `Taskfile.yml` mirrors them.
- Affected families: the entire `asr-*` offline-ASR gate chain (32 scripts), `grinders-keep-*` (68), `voice-ops-*` (18), the briefing delivery chain (`briefing-audio-playback-review`, `briefing-delivery-package-exporter`, `manual-delivery-handoff`, `delivery-archive-retention`, `voice-ops-release-closure`), `cleanup-gate`, and the 12 "upgrade stack" scripts (`init-upgrade-stack`, `register-skill`, `audit-skills`, `package-workflow`, `run-workflow`, `verify-output`, `create-background-job`, `list-jobs`, `generate-outcome-report`, `generate-memory-summary`, `archive-skill`, `inspect-router-decision`).
- `git log --all` shows **zero history** for these files: they were never committed. `scripts/` is allowlisted in the deny-by-default `.gitignore` and tracked count equals on-disk count (252), so this isn't an ignore problem in this checkout.
- Running one today: `npm run asr-dry-run-transcription-gate-help` → Node uncaught exception (module not found). Through the router, `npm run command -- asr-dry-run-transcription-gate` fails the same way.
- Two possible realities, and only the Commander can say which:
  1. **The files exist on the Mac and were never `git add`ed.** Fix: add them. Worth checking there with `git status --short scripts/ | grep '^??'`.
  2. **They were registered but never written** (documentation and registry entries generated ahead of implementation). Fix: prune the 142 `package.json` entries, the matching `Taskfile.yml` tasks, the 124 `commands.ts` entries, and the `.md` manuals that describe them (`ASR_*`, `GRINDERS_KEEP_*`, `VOICE_OPS_*`, `BRIEFING_*`, `CLEANUP_APPROVAL_GATE.md` etc.).
- Either way, add the missing guard: extend `config/commands.contract.test.ts` to assert that every registered command's `npmScript` resolves to an existing file. That turns this class of drift into a CI failure.

### F2 · High (probable) — `Taskfile.yml` has 34 duplicate task keys

The ASR gate block is pasted twice (roughly lines 614–792 and 992–1160: `asr-model-gate`, `audio-drop-verification`, `asr-dry-run-transcription-gate`, … and their `-help` twins). go-task parses with `yaml.v3`, which rejects duplicate mapping keys, so `task --list` very likely fails to load the file at all. Not verifiable here (`task` isn't installed in this container) — **check on the Mac**. Fix is deleting the second block; the content is identical. The file is 1,998 lines and would be ~1,820 after.

### F3 · Medium — Dashboard build depends on a script outside the repo

`"dashboard:build": "cd dashboard && npm run build && python3 ~/scripts/compile_master_dashboard.py"`. The Python step lives in `~/scripts/`, outside the repository boundary, so the build is not reproducible from a clone. Either move the script into `tools/` or make the step optional. Also: `dashboard/node_modules` is absent here, so the Vite dashboard has not been built in this environment; its deps (React 18, Vite 5) are current enough.

### F4 · Medium — The registry contract test doesn't check what matters most

`config/commands.contract.test.ts` verifies the registry's shape for P.J.K. (which reads `commands.ts` as text). It does not verify that commands are runnable. F1 slipped through for that reason. One assertion closes it.

### F5 · Low — 11 scripts on disk aren't reachable from `package.json`

`approved-quarantine(.ts|-help.ts)`, `design-cli.ts`, `grinders-keep-verification-rerun-planner(.ts|-help.ts)`, `icyflamze-core-episode-1-render-intake-v2.ts`, `orchestrator-cli-help.ts`, `orchestrator-phase0.ts`, `verify_restart_persistence.ts`, `verify_seed_once.ts`, `vnp.ts`. Register the ones that are real, delete the ones that aren't. `…-render-intake-v2.ts` beside a registered `…-render-intake.ts` looks like a superseded copy.

### F6 · Low — Stale directories

Eleven tracked directories haven't changed since July 2026: `brilliantaire-briefs`, `hooks`, `projects` (13 files), `scratch`, `staging`, `test_inputs`, `voice_input` (10), `voice_queue` (18), `voice_sessions` (9), `inputs`, `skills` (14 on disk, 12 tracked). 71 tracked files in total. If they're live fixtures for the voice pipeline, fine; if they're leftovers from the Learning Engine sprint, they're archive candidates. Only the Commander knows.

### F7 · Low — Documentation drift in `CLAUDE.md`

Says "208+ TypeScript CLI scripts". On disk: 252 files in `scripts/` (243 non-test). Says `config/commands.ts` is 3,717 lines — not re-measured here, but worth refreshing in the same edit.

### F8 · Low — Toolchain skew

Root pins `vitest ^1.2.0`; IcyOS is on `^3.2`. Not broken, but two major versions behind the rest of the monorepo and worth aligning when convenient. `openai ^6` and `zod ^4` are current.

### F9 · Info — The repo's own tools dirty the tree

`npm run doc-drift` rewrites `outputs/documentation-drift/latest.json`, which is tracked. Running a read-only check shouldn't produce a diff; either ignore the `latest.json` files under `outputs/` or have the tools write to a timestamped file only.

### F10 · Info — Doc sprawl

60 Markdown files at the repository root. `doc-drift` tracks 8 of them. The 142 phantom scripts each have a manual, so F1's resolution will remove or validate a large slice of this.

## Recommended order

1. **F1 — decide which reality.** On the Mac: `git status --short scripts/ | grep '^??' | wc -l`. If ~142, commit them. If 0, prune. This is the only item that needs a human answer; everything after it is mechanical.
2. **F4 — add the existence assertion** to the contract test in the same PR as the F1 resolution, so it can't recur.
3. **F2 — delete the duplicate Taskfile block** and confirm `task --list` loads.
4. **F5, F7** — register-or-delete the orphans; refresh the CLAUDE.md counts.
5. **F3, F9** — move the dashboard compile script into the repo; stop tracking generated `latest.json`.
6. **F6, F8, F10** — when there's a quiet moment.
