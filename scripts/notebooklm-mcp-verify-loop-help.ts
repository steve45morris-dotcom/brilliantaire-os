export function printHelp(): void {
  console.log('========================================================================');
  console.log('🏁 NOTEBOOKLM MCP SETUP VERIFICATION LOOP CONTROLLER');
  console.log('========================================================================');
  console.log('Purpose:');
  console.log('  Reruns all existing safe setup verification scripts to evaluate local');
  console.log('  environment alignment (such as .env.local parameters and gitignore rules)');
  console.log('  and compile a final integration readiness score and eligibility decision.');
  console.log('');
  console.log('⚠️  SAFE CONTROLLERS ONLY:');
  console.log('  - NEVER prints raw secret values or writes credentials to version control.');
  console.log('  - NEVER initiates live MCP query executions or external API connections.');
  console.log('');
  console.log('💻 Available Loop Actions:');
  console.log('  - npm run notebooklm-mcp-verify-loop-help');
  console.log('    Print this policy and execution help menu.');
  console.log('  - npm run notebooklm-mcp-verify-loop -- "chain"');
  console.log('    Executes the suite of safe setup check scripts and logs a chain report.');
  console.log('  - npm run notebooklm-mcp-verify-loop -- "final-check"');
  console.log('    Reads check reports and compiles final Phase 11N adapter eligibility.');
  console.log('  - npm run notebooklm-mcp-verify-loop -- "status"');
  console.log('    Prints current readiness metrics, active blockers, and eligibility.');
  console.log('========================================================================');
}

if (process.argv[1] && (process.argv[1].endsWith('notebooklm-mcp-verify-loop-help.ts') || process.argv[1].endsWith('notebooklm-mcp-verify-loop-help.js') || process.argv[1].includes('notebooklm-mcp-verify-loop-help'))) {
  printHelp();
}
