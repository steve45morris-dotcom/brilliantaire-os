function main() {
  console.log(`
🌌 Sentinel OS: Voice Ops Daily Report Generator (Phase N5J)
=====================================================================
The Voice Ops Daily Report Generator aggregates local voice pipeline activity,
ASR transcription logs, safety blocks, and approvals to compile operating summaries.

Usage:
  npm run narrator-voice-ops-daily-report -- "<command> [arguments]"

Command Menu:
  status                               Check watched directories, status flags, and report paths.
  generate                             Generate a Markdown report summarizing today's voice loop ops.
  generate-date <YYYY-MM-DD>           Generate a report for a specific calendar date YYYY-MM-DD.
  latest                               Print the absolute path and details of the newest daily report.
  list-reports                         List recent daily operating report files.
  safety-summary                       Display the current date's security blocks and rejections.
  command-summary                      Display details of voice commands (staged, approved, executed).
  session-summary                      Display details of all voice recording sessions for today.
  export-dashboard-snapshot            Compile and write a small telemetry JSON snapshot for Vite UI.
  report-log                           Print the execution event logs for report compilation.

Safety Policy:
  This generator is READ-ONLY. It compiles reports but does not approve, transcribe,
  record, or run any Command Router execution steps automatically.
=====================================================================
  `);
}

main();
