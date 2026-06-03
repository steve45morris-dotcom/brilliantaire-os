export function printHelp() {
  console.log(`
🛡️ Workflow Idea Scoring Engine CLI - Help Menu

Available Commands:
  help                             Print this help menu and exit
  extract                          Extract workflow ideas from grounded learning notes
  score                            Create scorecards and rate extracted ideas
  rank                             Compile weighted ranked list of workflow ideas
  recommend                        Group ideas into actionable build recommendations
  summary                          Generate overall statistics summary report
  status                           Query current status of reports and triage categories

Guardrails:
  - External API calls are BLOCKED.
  - Automatic Obsidian writes are BLOCKED.
  - Automatic NEXT_ACTIONS.md writes are BLOCKED.
  - Automatic task creation is BLOCKED.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('workflow-idea-scoring-help.ts')) {
  printHelp();
}
