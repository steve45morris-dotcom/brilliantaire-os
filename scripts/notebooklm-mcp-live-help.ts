function printHelp() {
  console.log("=========================================");
  console.log("🛰️ NOTEBOOKLM MCP LIVE ADAPTER INTEGRATION HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-mcp-live -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help                                                  Print this help guide");
  console.log("  status                                                Print live adapter status summary");
  console.log("  prepare-live-query <query-type>                       Prepare and stage a live query file");
  console.log("                                                        Query Types: source-summary, workflow-extraction");
  console.log("  test-readiness                                        Compile live adapter readiness audit report");
  console.log("  run-live-query <query-type> --confirm                 Execute query against live NotebookLM MCP server");
  console.log("  import-response <response-file>                      Import a manually captured response file");
  console.log("  report                                                Compile overall live adapter operations report");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-mcp-live -- \"status\"");
  console.log("  npm run notebooklm-mcp-live -- \"prepare-live-query source-summary\"");
  console.log("  npm run notebooklm-mcp-live -- \"test-readiness\"");
  console.log("  npm run notebooklm-mcp-live -- \"run-live-query source-summary\" --confirm");
  console.log("  npm run notebooklm-mcp-live -- \"import-response test_inputs/notebooklm_live_response_sample.md\"");
  console.log("  npm run notebooklm-mcp-live -- \"report\"");
  console.log("=========================================");
}

printHelp();
export {};
