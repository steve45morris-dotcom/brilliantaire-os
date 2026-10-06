function main() {
  console.log(`
🌌 Sentinel OS: Manual Delivery Checklist & Handoff Log (Phase N5O)
=====================================================================
Builds a safe manual delivery checklist and handoff log system that verifies a local briefing delivery package before human distribution.
Ensures zero auto-distribution (no send, no upload, no publish, no email).

Usage:
  npm run manual-delivery-handoff -- "<command> [arguments]"

Command Menu:
  status                               Show safety flags, package counts, checklist counts, and handoffs.
  scan-packages                        List local delivery packages available from Phase N5N.
  inspect <PACKAGE_ID>                 Inspect package path, manifest status, checksums, and eligibility.
  create-checklist <PACKAGE_ID>        Initialize manual checklist for a package.
  checklist-status <PACKAGE_ID>        Display completion status of required checklist items.
  mark-item <PACKAGE_ID> <ITEM_ID>     Mark a specific checklist item complete.
  approve-handoff <PACKAGE_ID> --signer "<NAME>" --note "<NOTE>"
                                       Approve the handoff of a package (requires all checklist items complete).
  reject-handoff <PACKAGE_ID> --signer "<NAME>" --note "<NOTE>"
                                       Record rejection of handoff (does not delete package files).
  handoff-status <PACKAGE_ID>          Show handoff and checklist status of a single package.
  list-handoffs                        List all historical approved and rejected handoffs.
  latest                               Show the most recent handoff record context.
  handoff-summary                      Generate global statistics and summaries report.
  handoff-log                          Display the last 20 events from the handoff log.

Required Checklist Item IDs:
  - manifest_json_exists
  - manifest_md_exists
  - checksum_verification
  - audio_included
  - daily_report_included
  - briefing_summary_included
  - render_report_included
  - playback_decision_included
  - delivery_notes_reviewed
  - signer_confirmed
  - delivery_method_selected
  - final_review_complete

Critical Safety Policy:
  - DO NOT auto-send, auto-upload, auto-publish, or auto-email.
  - DO NOT auto-play audio or execute voice commands.
  - DO NOT modify or delete source package files.
  - Require absolute checklist completion and signer name before approval.
  - Keep all actions strictly local, manual-first, and auditable.
=====================================================================
  `);
}

main();
