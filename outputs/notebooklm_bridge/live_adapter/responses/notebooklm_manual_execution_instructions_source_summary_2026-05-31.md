# NotebookLM MCP Manual Query Execution Instructions

* **Date:** 2026-05-31
* **Query Type:** source-summary

## ⚡ Manual Execution Commands

The live connection interface is staging only. Follow these steps to query NotebookLM MCP locally:

1. Start your local MCP Host or client server using the configured environment command:
   ```bash
   node dist/scripts/notebooklm-bridge.js
   ```

2. Dispatch the prepared query parameters (staged in queries folder) to the active NotebookLM server interface:
   - Target Folder ID: `workspace_abc123`
   - Prompt context: Analyze dry-run payloads.

3. Once NotebookLM generates the answer response, save the raw text locally and import it:
   ```bash
   npm run command -- "notebooklm-mcp-live import-response <path_to_saved_response_file>"
   ```
