import * as fs from 'fs';
import * as path from 'path';

function printHelp() {
  console.log(`
🌌 Sentinel OS: Voice Ops Release Freeze Tag and Recovery Snapshot (Phase N5R)
=====================================================================
Creates a local freeze tag and recovery snapshot system that captures
the current stable Voice Ops release state after N5Q, records metadata,
creates rollback references, and compiles restoration checklists.
Ensures zero runtime mutations (read-only snapshot checks only).

Usage:
  npm run voice-ops-freeze-snapshot -- "<command> [arguments]"

Command Menu:
  status                        Show safety flags, latest freeze tag, and snapshot status.
  scan-release                  Scan N5Q closure, phase status docs, and directories.
  create-freeze-tag             Create metadata-only local release tag record.
  snapshot-manifest             Create JSON/MD manifests of file checksum hashes.
  recovery-checklist            Generate markdown checklist runbook for restoration.
  verify-snapshot               Audit manifest files and check referenced file presence.
  list-snapshots                List existing metadata snapshots.
  latest                        Show the most recent freeze snapshot manifest.
  freeze-summary                Generate global statistics and summaries report.
  freeze-log                    Display the last 20 events from the freeze log.

Critical Safety Policy:
  - LOCAL SNAPSHOTTING AND METADATA TAGGING ONLY.
  - DO NOT run voice commands, record audio, transcribe, or play briefings.
  - DO NOT run git tag push commands or auto-restore files.
  - DO NOT auto-send, auto-upload, auto-publish, or auto-delete anything.
=====================================================================
`);
}

printHelp();
