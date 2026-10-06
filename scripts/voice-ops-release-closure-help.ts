import * as fs from 'fs';
import * as path from 'path';

function printHelp() {
  console.log(`
🌌 Sentinel OS: Voice Ops Release Closure Audit (Phase N5Q)
=====================================================================
Compiles the full N5A through N5P voice operations chain into a final
local release closure report. Audits completed phases, safety posture,
dashboard build outputs, manifests, checklists, and ledgers.
Ensures zero operational side-effects (read-only command checks only).

Usage:
  npm run voice-ops-release-closure -- "<command> [arguments]"

Command Menu:
  status                        Show closure paths, safety flags, and detected phases.
  scan-phases                   Check N5A - N5P completions in registries and reports.
  artifact-index                List and index all phase deliverables and directories.
  safety-rollup                 Audit exact-name routing, fuzzy blocks, and no-cloud posture.
  command-registry-summary     Summarize command registry families added to date.
  dashboard-summary            Inspect dashboard build state, public JSON, and panel types.
  archive-retention-summary    Compile delivery checklist states and ledger logs.
  generate-report               Compile all metrics and generate the final Closure Report.
  latest                        Print the path and summary of the latest closure report.
  list-reports                  List all generated closure reports.
  verify-closure                Verify required sections exist in the latest report.
  closure-log                   Display the last 20 events from the closure log.

Critical Safety Policy:
  - READ-ONLY/LOCAL AUDITING ONLY.
  - DO NOT execute commands, record audio, transcribe, or play briefings.
  - DO NOT auto-send, auto-upload, auto-publish, or auto-delete anything.
  - Keep all actions offline, auditable, and non-destructive.
=====================================================================
`);
}

printHelp();
