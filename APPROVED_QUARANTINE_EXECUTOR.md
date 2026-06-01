# Approved Quarantine Executor Specification

This document defines the architecture, security parameters, execution steps, and verification matrices for Phase 12C of the Brilliantaire OS duplicate cleanup subsystem.

## 1. Purpose
The Approved Quarantine Executor processes candidates marked as eligible for cleanup. It moves approved files from their original locations into a safe, designated quarantine directory. It preserves original metadata and directory structures, generates complete manifests, builds rollback plans, and ensures that **zero permanent deletions or file unlinks occur**.

## 2. Core Guardrails and Safety Boundaries
To enforce maximum data sovereignty and safety, the executor conforms to these boundaries:
* **Quarantine-Only Operation:** The executor's sole write action is to *move* files into a quarantine directory. Permanent deletion (file unlinks) is strictly disabled in config and code.
* **No Touch Protection:** Core configuration, git internals, models, CLI command routers, and system documents matching protected patterns are blocked from execution.
* **Dry-Run Requirement:** A successful dry run must be executed first to generate a simulation report. Live quarantine movement is blocked if no valid dry-run report is found.
* **Explicit Confirmation:** Execution commands must include the `--confirm` parameter. Running without `--confirm` blocks all operations.
* **Metadata & Structure Preservation:** Candidates moved to quarantine are stored preserving their relative sub-path layout under `outputs/cleanup_execution/quarantine/`.
* **Rollback Manifest Generation:** A rollback manifest detailing the original path and a manual restoration plan is compiled for every run, allowing easy reversal.

## 3. Configuration Parameters
Defined in `config/approved-quarantine.ts`:
* `QUARANTINE_ONLY = true`
* `ALLOW_FILE_DELETION = false`
* `ALLOW_PROTECTED_FILE_TOUCH = false`
* `REQUIRE_APPROVAL_LIST = true`
* `REQUIRE_CONFIRM_FLAG = true`
* `REQUIRE_ROLLBACK_MANIFEST = true`
* `REQUIRE_DRY_RUN_FIRST = true`

## 4. Protected Path Registry
The executor bypasses and blocks processing for any target matches against:
* Git structures (`.git/`)
* Packages and dependencies (`node_modules/`)
* Binary Whisper models (`models/`)
* Configuration secrets (`.env`, `.env.local`, `.mcp.local.json`)
* Build definitions (`package.json`, `package-lock.json`, `Taskfile.yml`)
* Safe Command Router configurations (`config/commands.ts`)
* Operating status files (`SYSTEM_STATUS.md`, `PROJECTS.md`, `NEXT_ACTIONS.md`, `README.md`)

## 5. Command Suite
The executor supports these CLI subcommands:
* `dry-run`          : Read the latest approval checklist, simulate movements, and output a dry-run report.
* `execute --confirm` : Verify the prior dry-run report, validate confirmation, and perform the moves.
* `manifest`         : Write a detailed quarantine manifest ledger of moved files with original hashes.
* `rollback-plan`    : Create a manual rollback recovery script mapping files to original directories.
* `status`           : Print status dashboard summarizing latest reports, logs, and execution states.
* `help`             : Print command help menu and instructions.

## 6. Future Deletion Boundary
At this phase, no permanent file deletion tools are implemented. Files moved into quarantine are kept in `outputs/cleanup_execution/quarantine/` for a retention window. Pruning or unlinking remains blocked until downstream validation phases explicitly confirm system stability.

---
*I build before burning.*
