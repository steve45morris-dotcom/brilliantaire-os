export function printHelp(): void {
  console.log('========================================================================');
  console.log('🛰️  NOTEBOOKLM MCP LIVE ADAPTER - HELP MANUAL');
  console.log('========================================================================');
  console.log('Purpose:');
  console.log('  Scaffolds and dispatches manually approved read-only queries against');
  console.log('  the live NotebookLM MCP server under confirmation-locked gates.');
  console.log('');
  console.log('⚠️  SAFETY RESTRICTIONS:');
  console.log('  - All mutations (creating/deleting notebooks or sources) are BLOCKED.');
  console.log('  - Writing directly to Obsidian is BLOCKED; output stages locally.');
  console.log('  - Execution is BLOCKED if readiness score is below 90% or the local');
  console.log('    readiness gate reports status as not eligible.');
  console.log('');
  console.log('💻 Available CLI Actions:');
  console.log('  - npm run notebooklm-mcp-live-help');
  console.log('    Print this manual.');
  console.log('  - npm run notebooklm-mcp-live -- "prepare source-summary"');
  console.log('    Stages a query payload markdown file for source summary.');
  console.log('  - npm run notebooklm-mcp-live -- "prepare workflow-extraction"');
  console.log('    Stages a query payload markdown file for workflow extraction.');
  console.log('  - npm run notebooklm-mcp-live -- "prepare weak-claims-review"');
  console.log('    Stages a query payload markdown file for weak claims review.');
  console.log('  - npm run notebooklm-mcp-live -- "execute source-summary" --confirm');
  console.log('    Runs the staged read-only query on NotebookLM (requires --confirm flag).');
  console.log('  - npm run notebooklm-mcp-live -- "execute workflow-extraction" --confirm');
  console.log('    Runs the staged read-only query on NotebookLM (requires --confirm flag).');
  console.log('  - npm run notebooklm-mcp-live -- "response-export"');
  console.log('    Generates a staged Obsidian note export in local bridge outputs.');
  console.log('  - npm run notebooklm-mcp-live -- "safety-report"');
  console.log('    Compiles the live adapter safety audit checklist report.');
  console.log('  - npm run notebooklm-mcp-live -- "status"');
  console.log('    Prints current live staging, readiness gate state, and blockers.');
  console.log('========================================================================');
}

if (process.argv[1] && (process.argv[1].endsWith('notebooklm-mcp-live-help.ts') || process.argv[1].endsWith('notebooklm-mcp-live-help.js') || process.argv[1].includes('notebooklm-mcp-live-help'))) {
  printHelp();
}
