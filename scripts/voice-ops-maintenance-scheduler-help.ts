function printHelp() {
  console.log(`
🌌 Sentinel OS: Voice Ops Maintenance Mode Scheduler (Phase N5T)
=====================================================================
Schedules, stages, and audits manual-first recurring maintenance tasks
for Voice Ops health, dashboard refreshes, release closures, and archives.
Stages maintenance jobs into queues but does not execute them automatically.

Usage:
  npm run voice-ops-maintenance-scheduler -- "<command> [arguments]"

Command Menu:
  status                                          Show paths, safety flags, and job metrics.
  create-weekly                                   Stage a weekly maintenance checklist job.
  create-daily                                    Stage a daily lightweight checklist job.
  create-health-check                             Stage a manual post-freeze health check job.
  create-dashboard-refresh                        Stage a manual dashboard refresh & build job.
  create-retention-review                         Stage a manual archive retention review job.
  create-drift-review                             Stage a manual known drift inspection job.
  list-queue                                      List all pending, approved, rejected, and completed jobs.
  inspect <JOB_ID>                                Inspect job steps, recommended commands, and risk level.
  approve <JOB_ID>                                Approve a pending job record for manual execution.
  reject <JOB_ID>                                 Reject a pending job record.
  mark-complete <JOB_ID> --signer "N" --note "M"  Record human completion of a job.
  maintenance-summary                             Write and print a markdown summary of all jobs.
  latest                                          Show the latest maintenance job record.
  scheduler-log                                   Print recent scheduler activity log events.

Safety Rules:
  - LOCAL & MANUAL-FIRST ONLY.
  - DO NOT run recommended commands automatically.
  - DO NOT execute auto-repair, auto-restore, auto-delete, or auto-transcribe operations.
  - DO NOT start recording, rendering TTS, or weakening command gates.
=====================================================================
`);
}

printHelp();
export {};
