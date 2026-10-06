function main() {
  console.log(`
🌌 Sentinel OS: Delivery Archive & Retention Ledger (Phase N5P)
=====================================================================
Builds a local archive and retention ledger that records manual handoffs,
catalogs delivery packages, preserves chain of custody, and runs policy checks.
Ensures zero auto-distribution (no send, no upload, no publish, no delete).

Usage:
  npm run delivery-archive-retention -- "<command> [arguments]"

Command Menu:
  status                               Show safety flags, approved handoffs, and archive counts.
  scan-handoffs                        List approved handoffs eligible for archiving.
  inspect-handoff <PACKAGE_ID>         Inspect handoff signer, note, manifest files, and eligibility.
  archive-record <PACKAGE_ID>          Create local ledger entry for approved handoff (does not delete package).
  ledger-status <PACKAGE_ID>           Show lifecycle status and chain of custody logs.
  list-archive                         List all registered ledger entries.
  verify-archive <PACKAGE_ID>          Verify manifest files and SHA256 checksums in package.
  retention-review                     List packages near or past warning review threshold dates.
  mark-retention-reviewed <PACKAGE_ID> --signer "<NAME>" --note "<NOTE>"
                                       Log a manual retention policy review (does not delete files).
  export-ledger                        Compile and write unified ledger database JSON/MD exports.
  latest                               Show the most recent ledger entry.
  archive-summary                      Generate global statistics and summaries report.
  archive-log                          Display the last 20 events from the retention log.

Critical Safety Policy:
  - DO NOT automatically delete packages.
  - DO NOT auto-send, auto-upload, auto-publish, or auto-email.
  - DO NOT auto-play audio or execute voice commands.
  - DO NOT modify or alter source package contents.
  - Keep all actions local, manual-first, and auditable.
=====================================================================
  `);
}

main();
