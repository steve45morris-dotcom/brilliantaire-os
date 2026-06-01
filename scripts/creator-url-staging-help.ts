export function printHelp() {
  console.log(`
🛡️ Creator YouTube URL Staging Gate CLI - Help Menu

Available Commands:
  help                           Print this help menu and exit
  stage julian <URL>             Manually stage a YouTube video/playlist/channel URL for Julian Goldie
  batch julian                   Generate a manual batch intake template for Julian Goldie
  review                         Compile reports/url_staging_review_YYYY-MM-DD.md
  transcript-next                Compile reports/transcript_next_steps_YYYY-MM-DD.md
  status                         Print dashboard status of URL staging files

Guardrails:
  - Automated channel scraping is DISABLED.
  - Video downloading is BLOCKED.
  - External API calls are BLOCKED.
  - Transcript fetching is BLOCKED.
  - Automatic Obsidian writes are BLOCKED.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('creator-url-staging-help.ts')) {
  printHelp();
}
