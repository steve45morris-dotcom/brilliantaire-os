function printHelp() {
  console.log(`
🌌 Sentinel OS: Voice Ops Operator Runbook (Phase N5U)
=====================================================================
Compiles and manages the human-readable system operator runbook,
checklists, command indices, troubleshooting matrices, and stop guides.
Ensures local, manual-first tracking without executing pipeline actions.

Usage:
  npm run voice-ops-operator-runbook -- "<command> [arguments]"

Command Menu:
  status                        Show runbook file statuses, safety flags, and source docs.
  generate                      Compile and write the master operator runbook Markdown files.
  command-index                 Generate and print the categorized CLI command index.
  safety-checklist              Generate and print the system safety checklist.
  daily-checklist               Generate and print the daily operator checklist.
  weekly-checklist              Generate and print the weekly operator checklist.
  workflow-map                  Generate and print the step-by-step workflow mappings.
  troubleshooting               Generate and print the known issues troubleshooting matrix.
  emergency-stop                Generate and print the emergency halt stop guide.
  latest                        Print the path and outline of the latest compiled runbook.
  list-runbooks                 List all timestamped compiled runbook files.
  runbook-summary               Generate and print a markdown summary report of the runbooks.
  runbook-log                   Print recent operator runbook activity log events.

Safety Policy:
  - SYSTEM DOCUMENTATION & AUDITING ONLY.
  - DO NOT execute pipeline commands, recorders, ASR, or TTS synthesis.
  - DO NOT run auto-repairs, auto-deletes, or auto-restores.
=====================================================================
`);
}

printHelp();
export {};
