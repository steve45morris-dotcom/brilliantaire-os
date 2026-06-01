function main() {
  console.log(`
🌌 Sentinel OS: Voice Command Lifecycle Audit Timeline (Phase N5I)
=====================================================================
The Voice Command Lifecycle Auditor scans directories, metadata records,
and logs to build a local timeline of each voice command from ingestion
to execution, logging safety interventions and execution states.

Usage:
  npm run narrator-voice-lifecycle-audit -- "<command> [arguments]"

Command Menu:
  status                               Check watched paths, event counts, and safety metrics.
  scan-events                          Scan all voice pipeline directories and build event index.
  timeline <SESSION_ID>                Display chronological timeline for a single voice session.
  latest-timeline                      Display details of the newest session timeline.
  lifecycle-map                        Display table overview of all sessions and progress stages.
  safety-events                        Display log of safety alerts, blocks, and rejections.
  execution-events                     Display log of successful command executions.
  blocked-events                       Display log of fuzzy or unauthorized routing interventions.
  export-timeline <SESSION_ID>         Export chronological timeline as markdown report.
  export-latest                        Export timeline report for the latest voice session.
  audit-summary                        Export summary metrics across all voice lifecycle events.

Safety Policy:
  This script is strictly READ-ONLY and operates under a no-execution policy.
  Command execution must be manually released via human confirmation bridge.
=====================================================================
  `);
}

main();
