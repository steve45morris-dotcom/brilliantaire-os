export function printHelp() {
  console.log(`
📖 Knowledge Harvest Source Registry CLI - Help Menu

Available Commands:
  help                    Print this help menu and exit
  add-source julian       Generate a staged approved creator source record for Julian Goldie
  priority-report         Compile reports/source_priority_report_YYYY-MM-DD.md
  transcript-status       Compile reports/transcript_status_report_YYYY-MM-DD.md
  workflow-value          Compile reports/workflow_value_report_YYYY-MM-DD.md
  source-pack-status      Compile reports/source_pack_status_YYYY-MM-DD.md
  status                  Print dashboard status of registry files

Guardrails:
  - Automated channel scraping is DISABLED.
  - Video downloading is BLOCKED.
  - External API calls are BLOCKED.
  - Automatic Obsidian writes are BLOCKED.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('knowledge-source-registry-help.ts')) {
  printHelp();
}
