export function printHelp() {
  console.log(`
🛡️ Manual Transcript Intake & Grounding Compiler CLI - Help Menu

Available Commands:
  help                             Print this help menu and exit
  intake <TRANSCRIPT_FILE>         Intake a local text/markdown transcript file manually
  validate                         Validate raw local transcript files and generate report
  map-urls                         Map validated transcripts to staged URL records
  grounded-note                    Generate grounded learning notes summarizing findings
  source-pack                      Compile a NotebookLM-compatible source pack document
  status                           Display status dashboard of raw/processed transcripts

Guardrails:
  - YouTube crawling/scraping is DISABLED.
  - Video downloading is BLOCKED.
  - External API calls are BLOCKED.
  - Automatic Obsidian writes are BLOCKED.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('transcript-intake-help.ts')) {
  printHelp();
}
