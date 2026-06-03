export function printHelp() {
  console.log(`
🛡️ Creator YouTube URL Staging Gate CLI - Help Menu

Available Commands:
  help                       Print this help menu and exit
  stage julian <URL>         Manually stage a creator video URL for Julian Goldie
  batch julian               Generate a manual batch staging template for Julian Goldie
  review                     Scan staged URL records and compile outputs/knowledge_harvest/url_staging/reports/url_staging_review_YYYY-MM-DD.md
  transcript-next            Compile outputs/knowledge_harvest/url_staging/reports/transcript_next_steps_YYYY-MM-DD.md
  status                     Print status dashboard of creator URL staging records

Guardrails:
  - YouTube crawling/scraping is DISABLED.
  - Video downloading is BLOCKED.
  - External API calls are BLOCKED.
  - Automatic Obsidian writes are BLOCKED.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('creator-url-staging-help.ts')) {
  printHelp();
}
