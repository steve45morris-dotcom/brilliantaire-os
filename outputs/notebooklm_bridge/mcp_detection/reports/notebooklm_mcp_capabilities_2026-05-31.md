# NotebookLM MCP Capabilities Report

- **Detected Connector Name:** notebooklm, notebooklm-mcp
- **Detected Location:** package.json, Taskfile.yml
- **Report Compiled Date:** 2026-05-31

## Possible Capabilities
- **Offline Config Read:** Safe mapping discovery and directory scans.
- **Manual Staging Ingest:** Read query files and map local copy-pasted results.
- **Command Execution Validation:** Safe command format checks without triggering calls.

## Unknown Capabilities
- **Interactive Prompting:** Web-based prompt generation constraints.
- **Real-time Query Resolution:** NotebookLM does not provide an official API, meaning capabilities depend entirely on custom MCP scrapers or local automation engines.

## Required Manual Setup
- Register MCP Server within Cursor or Claude Desktop app config.
- Verify the correct Node version mapping to run execution CLI scripts.
- Ensure appropriate access tokens or API keys are placed in system profile configurations.

## Risks
- **Resource Collision:** Writing directly to active Obsidian vault directories could cause synchronizer conflicts.
- **Execution Leak:** A malicious answer file could injection scripts if parsed directly by the command router without sandboxing.

## Safe Activation Requirements
- Config `ALLOW_MCP_QUERY_EXECUTION` must be manually enabled by the user.
- Clear signature verification step before parsing or outputting data profiles.

## Recommended Next Phase
- **Phase 11D:** Establish the NotebookLM MCP Adapter executing secure local calls in dry-run mode, matching verified connector properties with zero-auth simulation.
