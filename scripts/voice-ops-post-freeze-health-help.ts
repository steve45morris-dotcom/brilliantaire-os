function printHelp() {
  console.log(`
🌌 Sentinel OS: Voice Ops Post-Freeze Health Monitor (Phase N5S)
=====================================================================
Checks whether the frozen stable Voice Operations release remains intact
and stable after Phase N5R. Monitors checksums, drift, exact-name command
registrations, Vite dashboards, and safety posture configurations.
Enforces strict read-only, non-mutating compliance rules.

Usage:
  npm run voice-ops-post-freeze-health -- "<command> [arguments]"

Command Menu:
  status                        Show safety flags, output paths, and latest check results.
  scan-freeze                   Read manifest, tag, recovery checklist, and closures.
  verify-checksums              Audit manifest checksum references for codebase file drift.
  registry-health               Confirm npm scripts, Taskfile tasks, and exact-name configs.
  dashboard-health              Check production index, telemetry dataset, and panels.
  safety-health                 Verify auto-execute, Cloud APIs, and restores remain disabled.
  drift-report                  Generate a detailed drift analysis report.
  run-health-check              Execute all checks, save report, and refresh telemetry.
  latest                        Print the path and verdict of the latest health report.
  list-reports                  List registered health check diagnostic reports.
  health-summary                Print the content of the latest health report summary.
  health-log                    Display the last 20 events from the health monitor logs.

Safety Compliance Policy:
  - DIAGNOSTIC AND INTEGRITY MONITORING ONLY.
  - DO NOT execute commands, record audio, render TTS, or transcribe.
  - DO NOT run automatic repairs, deletes, or snapshot file restores.
  - DO NOT run remote network syncs or auto-publish code releases.
=====================================================================
`);
}

printHelp();
export {};
