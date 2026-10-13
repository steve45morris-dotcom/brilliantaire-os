# Attic

Scripts that cannot run from a clean checkout, moved here on 2026-10-13 after the
system audit (`reports/SYSTEM_AUDIT_2026-10-13.md`, section 3.1). Nothing in this
folder is registered, typechecked, tested or run. Each file is kept as it was, so a
`git mv` back to its old path restores it; register it afterwards in `package.json`,
`Taskfile.yml`, `config/commands.ts` and `COMMANDS.md`, and fix what is listed below.

| File | Old path | Why it is here |
|---|---|---|
| `scripts/grinders-keep-decision-synthesis-gate.ts` and `-help.ts` | `scripts/` | Reads ten `templates/grinders-keep-decision-*-template.md` files that were never committed, so every run ends in ENOENT. |
| `scripts/grinders-keep-manual-review-intake-gate.ts` and `-help.ts` | `scripts/` | Reads two `templates/grinders-keep-manual-review-*-template.md` files that were never committed. |
| `scripts/icyflamze-core-episode-1-blocker-resolution-help.ts` and `config/icyflamze-core-episode-1-blocker-resolution.ts` | `scripts/`, `config/` | A help text and a config for a command that was never written. |
| `scripts/run-governance-remediation.ts` | `scripts/` | Reads `governance.issues` from `dashboard/public/dashboard-data.json`, a field the exporter no longer writes, and rewrites `DECISIONS.md` and `GOVERNANCE_*` files from it. |
| `scripts/watch_intake.py` | `scripts/` | Watches `system/intake/pending`, a folder this repository does not have. |
| `scripts/sovereign_scout.py` | `scripts/` | Reads `system/scout_config.json`, which this repository does not have, then clones repositories. |
| `scripts/keep_guardian_alive.sh` | `scripts/` | Supervises `supernova/core/guardian.py`, which does not exist. |
| `scripts/http/discovery.sh`, `health.sh`, `set-arm.sh`, `set-mode.sh` | `scripts/http/` | httpie calls to servers on ports 8000 and 8001 that nothing in this repository runs. |

`scripts/voice_authority.py` was listed with these in the audit note but stays in
`scripts/`: it is a library that `vibevoice_worker.py`, `vibevoice_client.py` and
`scripts/tests/test_voice_authority.py` import, not a command.
