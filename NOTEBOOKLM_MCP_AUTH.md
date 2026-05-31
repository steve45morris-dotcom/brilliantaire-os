# 🔐 NotebookLM MCP Live Authorization Validation

## Purpose
The **NotebookLM MCP Live Authorization Validation** layer provides a strict, offline validation protocol to confirm authentication readiness before starting live Model Context Protocol (MCP) query connectors. It inspects configuration profiles for matching environment variables without storing, accessing, or printing secrets.

## Offline Authorization Validation
Validation is executed completely offline. The analyzer scans config paths for defined key names (such as API credential variables) but never validates connection states via OAuth handshakes or external network sockets.

## No-Secret-Printing Rule
Under no circumstances may the values of environment secrets (e.g. passwords, client keys, private tokens) be read, output, printed, or compiled into report assets. All found keys must be logged as `[REDACTED]` or `[PRESENT]` to guarantee security.

## Expected Environment Variables
The validator expects the following variables to define the connector environment:
*   `NOTEBOOKLM_MCP_ENABLED` - Master toggle flag.
*   `NOTEBOOKLM_MCP_SERVER_COMMAND` - Command executing local connector.
*   `NOTEBOOKLM_AUTH_PROFILE` - Configured identity profile reference.
*   `GOOGLE_APPLICATION_CREDENTIALS` - Location of GCP service account keys.
*   `GOOGLE_CLOUD_PROJECT` - Cloud project identifier.
*   `NOTEBOOKLM_WORKSPACE_ID` - Target NotebookLM folder/workspace reference.

## Scope Review Principle
Maintains the principle of **Least Privilege access**:
*   Notebook access must be strictly `Read-Only`.
*   Direct document ingestion must be disabled to prevent database polluting.
*   Prevent write permissions that could alter, delete, or rename NotebookLM notebooks.

## Activation Checklist
Prior to enabling live connectors, developers must verify:
1. All query dry-runs are passing.
2. Safe command router limits remain confirmed.
3. Credentials files are correctly excluded from git history (`.gitignore`).
4. Rolling back triggers are prepared.

## Why Live Execution Remains Disabled
Toggling live execution to active at this stage is blocked to enforce complete validation. This prevents command injections, API token exhaustion, and accidental connections to Google cloud gateways during initial coding and bootstrapping.

## Future Activation Boundary
Live execution adapters can be built in future phases only after this validation report logs `Readiness Score: 100` and all configuration profiles check out clean.
