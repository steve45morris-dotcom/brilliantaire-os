console.log(`
⏳ Sentinel OS: Operator Recertification & Drill Rotation Scheduler (Phase N5X)
=====================================================================
Local scheduled validation check scheduler to coordinate operator
periodic qualifications renewals, kategori mock drills rotations,
and visual checklists verification logs.

Usage:
  npm run voice-ops-recertification-scheduler -- "<command> [arguments]"

Command Menu:
  status                        Show scheduler paths, statistics and boundaries.
  scan-certifications           Read database ledger and summarize validity state.
  inspect-certification <NAME>  Verify target qualification dates and details.
  create-renewal-plan <NAME>    Stage a local recertification renewal plan.
  list-renewal-queue            List planned, approved, complete, or rejected plans.
  inspect-renewal <ID>          Read staged categories and manual steps for a plan.
  approve-renewal <ID>          Approve plan for manual mock simulation drill execution.
  reject-renewal <ID>           Decline and file away a staged plan.
  mark-renewal-complete <ID> --signer "<SIGNER>" --note "<NOTE>"
                                Complete renewal explicitly using passed simulation evidence.
  generate-drill-rotation       Create a monthly drill category weekly rotation block.
  drill-calendar                Save visual markdown calendar of upcoming mock drills.
  renewal-readiness <NAME>      Evaluate if operator has fresh scenario evidence.
  latest                        Check details of latest plan or rotation.
  recertification-summary       Generate markdown compilation summary report.
  recertification-log           Print recent qualification events logs.

Safety Thresholds:
  - WARNING WINDOW: Warning issued if expiry is <= 7 days away.
  - COMPLIANCE COUNT: Minimum 3 fresh passed simulations required for renewal.
  - EMERGENCY DRILL: Pass verification of emergency_stop_drill is mandatory.
  - NO auto-renewing, auto-repairing, or automatic command executes.
=====================================================================
`);
