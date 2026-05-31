# ⚙️ NotebookLM MCP Adapter Dry-Run Execution

## Purpose
The **NotebookLM MCP Adapter Dry-Run Execution** layer acts as a safe translation and staging bridge between Brilliantaire OS and local Model Context Protocol (MCP) queries. It compiles query payloads and simulates executions (dry-runs) to ensure formatting is correct and safety rules are checked without running live external calls.

## Safe Execution Rules
1. **Dry-Run Only:** Live queries to NotebookLM notebooks are strictly disabled (`ALLOW_LIVE_MCP_EXECUTION: false`).
2. **No External Calls:** No network requests, API calls, browser automations, or OAuth validation flows may be run.
3. **No Direct Writes:** No changes can be written directly to the active Obsidian vaults or core OS configurations.
4. **Collision Suffixing:** Any output files created are stamped with unix timestamps to prevent overwrites.

## Why Live MCP Execution Is Disabled
Live MCP execution is currently disabled to prevent automated, unverified queries that might leak API tokens, exhaust system tokens, write conflicting data to directories, or parse malicious prompt injections without explicit manual validation.

## Payload Staging Flow
1. **Intake:** The generator reads the latest staged NotebookLM Bridge source pack.
2. **Construction:** A markdown payload file containing structural parameters is assembled and written to `outputs/notebooklm_bridge/mcp_execution/payloads/`.
3. **Validation:** The payload is verified for length limits (max 4000 characters) and command injection tokens.

## Dry-Run Report Flow
1. **Parsing:** The simulator parses the latest constructed query payload.
2. **Evaluation:** Confirms confidence scores and local system configurations.
3. **Simulation:** Generates an offline simulation report under `outputs/notebooklm_bridge/mcp_execution/dry_runs/` outlining structural readiness.

## Safety Flags Configuration
Located in [`config/notebooklm-mcp-execution.ts`](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/config/notebooklm-mcp-execution.ts):
*   `EXECUTION_MODE = "dry-run"`
*   `ALLOW_LIVE_MCP_EXECUTION = false`
*   `ALLOW_EXTERNAL_API_CALLS = false`
*   `ALLOW_BROWSER_AUTOMATION = false`
*   `ALLOW_OBSIDIAN_WRITE = false`

## Future Live Activation Requirements
1. Validate offline adapter stability in this phase (11D).
2. Manually toggle `ALLOW_LIVE_MCP_EXECUTION = true` and `REQUIRE_CONFIRM_FLAG_FOR_LIVE = true`.
3. Configure target NotebookLM MCP server endpoints within local Cursor or Claude config templates.

## How This Connects to NotebookLM MCP Sidecar Bridge
The dry-run adapter sits directly after the sidecar bridge. The bridge stages source packs and queries manually. The execution adapter prepares these staged inputs into structural JSON/Markdown packets and simulates how a local MCP server would execute them.
