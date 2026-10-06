console.log(`
🛡️ Sentinel OS: Operator Certification Ledger (Phase N5W)
=====================================================================
Offline certification engine and evidence audit ledger to track
operator qualification levels. Validates simulation attempt score data,
emergency drill compliance, and logs signed qualifications.

Usage:
  npm run voice-ops-certification-ledger -- "<command> [arguments]"

Command Menu:
  status                        Show paths, thresholds, and certification metrics.
  scan-attempts                 Scan and summarize simulation attempts evidence from N5V.
  inspect-attempt <SIM_ID>      Verify simulation score and safety violations in detail.
  evaluate-operator <NAME>      Dry-run evaluate operator scenarios coverage and score.
  create-certification <NAME> --signer "<SIGNER>" --note "<NOTE>"
                                Issue local operator certificate record (requires evidence).
  certification-status <NAME>   Show certification level, expiry date, and checklists.
  list-certifications           List all registered certification records.
  latest                        Print details of the latest certification record.
  renewal-review                List certifications nearing expiration or expired.
  export-ledger                 Generate JSON and Markdown database ledger compilations.
  certification-summary         Generate a markdown certification summary report.
  certification-log             Print recent certification log events.

Safety Rules:
  - MINIMUM SCORE: 80% average required across scenario drills.
  - EMERGENCY DRILL: Pass verification of emergency_stop_drill is mandatory.
  - NO faking certification. Evidence checks are programmatically enforced.
  - NO live Voice Ops commands, synthesis renders, or ASR processes run.
=====================================================================
`);
