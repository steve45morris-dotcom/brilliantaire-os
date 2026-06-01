# Duplicate Cleanup and Quarantine Specification

This document defines the safety boundaries, duplicate detection rules, stale artifact metrics, and manual review processes for local file curation within Brilliantaire OS under Phase 12A.

## 1. Purpose
The duplicate cleanup and quarantine system scans the local environment for redundant reports, outdated logs, repeated test outputs, and orphan queue packets. It generates structured markdown reports and review lists, organizing candidate files for manual inspection without modifying or deleting any files on the filesystem.

## 2. Security Boundaries

### Scan-Only and No-Deletion Rules
* **Strict Scan-Only:** All operations are read-only. No script, utility, or runner will delete, rename, or modify files.
* **No Source Modification:** Source files under `src/`, `scripts/`, or config paths are never modified or curated.
* **No Arbitrary Shell Execution:** Shell commands or subprocesses are not spawned dynamically during cleanup analysis.
* **No File Writes to Excluded Paths:** All output reports are stored exclusively within the `outputs/cleanup/` directory.

### Allowed Scan Roots
Scanning is restricted strictly to these roots:
* `outputs/`
* `voice_sessions/`
* `templates/`

### Excluded Roots
The system explicitly bypasses the following files, folders, and system logs to prevent secrets leaks and file system pollution:
* `.git/` (git internals)
* `node_modules/` (dependencies)
* `models/` (large ASR or TTS model binaries)
* `.env` / `.env.local` (local secrets)
* `.mcp.local.json` (MCP server integrations)
* `package-lock.json`

## 3. Duplicate Detection Logic
The duplicate detection layer groups file candidates using these indicators:
1. **Basename Match (Timestamp Stripped):** Identifies files with identical names when timestamp suffixes (like `_YYYY-MM-DD` or epoch times) are removed (e.g. `report_2026-06-01.md` and `report.md`).
2. **File Size Match:** Evaluates files sharing the exact size in bytes.
3. **Content Hash Match:** Calculates SHA-256 hashes of same-size file contents to confirm identical data.
4. **Command Output Patterns:** Identifies timestamped variants carrying repeated command output patterns.

## 4. Stale Artifact Checks
Files are evaluated as stale if they meet any of the following metrics:
* **Stale Reports:** Output reports older than 30 days.
* **Stale Dry-Run Outputs:** Dry-run configurations and transcript staging logs older than 30 days.
* **Duplicated Test Outputs:** Temporary test files containing `test` in their name that exist in multiple variants.
* **Orphan Queue Packets:** Metadata records (like `.md` or `.json` in `voice_sessions/session_metadata/`) that do not have matching recording files (e.g., in `voice_sessions/manual_recordings/`).
* **Empty Placeholders:** Reports or outputs with a size of 0 bytes.

## 5. Quarantine Index Behavior
* **Index Only:** No physical files are moved to a quarantine directory. The quarantine index (`outputs/cleanup/quarantine_index/cleanup_quarantine_index_YYYY-MM-DD.md`) acts as a virtual inventory listing candidate files, risks, and clean recommended actions.
* **Manual Review Required:** A final operator review is required before any physical cleanup action is taken.

## 6. CLI Command Suite
Executions are routed through the Safe Command Router:
* `scan`             : Audits allowed roots and writes duplicate variant metrics.
* `stale`            : Scans for outdated dry-runs, empty files, and orphan metadata.
* `quarantine-index` : Structures a virtual index of candidates for review.
* `review-list`      : Groups files into confidence tiers (High/Low/Do-Not-Touch).
* `status`           : Prints a console status dashboard detailing counts and latest report paths.

---
*I build before burning.*
