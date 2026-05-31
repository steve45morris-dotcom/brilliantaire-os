function main() {
  console.log(`
🌌 Sentinel OS: Voice Loop Dashboard & Human Confirmation UI (Phase N5F)
========================================================================
The Voice Loop Dashboard provides central operators with operational
visibility, status tracking, safety audits, and confirmation dispatches
for the local offline speech-to-text exact-name command routing loop.

Usage:
  npm run narrator-voice-loop-dashboard -- "<command> [arguments]"

Command Menu:
  status                     Show dashboard paths, health flags, and overall queue depths.
  overview                   Show pipeline state map (Mermaid schema) and folder item counts.
  packets                    List recent voice loop packets and their active pipeline locations.
  packet-detail <ID>         Show packet transcript payload, CLI command route, risk, and audit trail.
  pending-confirmations      List all packets currently waiting for human decision triggers.
  safety-status              Audit safety controls (live mic, auto-execute, exact-name command router).
  latest-audit               Print the standard output and standard error logs of the latest run execution.
  export-summary             Write a consolidated telemetry report markdown file to reports directory.
  confirm-prepare <ID>       Delegate preparation step to the Voice Bridge (validate and stage packet).
  confirm-execute <ID>       Delegate manual execution dispatch step to the Voice Bridge.
  reject-packet <ID>         Delegate rejection block command to the Voice Bridge.

Safety Notice:
  The dashboard delegates all actions directly to the Voice Command Approval Bridge.
  Direct execution of shell command strings or fuzzy command aliases is strictly banned.

Example Workflow:
  1. Print safety audit: npm run narrator-voice-loop-dashboard -- "safety-status"
  2. Check queue depth:  npm run narrator-voice-loop-dashboard -- "overview"
  3. List active tasks:  npm run narrator-voice-loop-dashboard -- "pending-confirmations"
  4. Inspect packet ID:  npm run narrator-voice-loop-dashboard -- "packet-detail 2026-05-31_0801"
  5. Stage & Validate:   npm run narrator-voice-loop-dashboard -- "confirm-prepare 2026-05-31_0801"
  6. Dispatch Run:       npm run narrator-voice-loop-dashboard -- "confirm-execute 2026-05-31_0801"
  7. Audit output:       npm run narrator-voice-loop-dashboard -- "latest-audit"
========================================================================
  `);
}

main();
