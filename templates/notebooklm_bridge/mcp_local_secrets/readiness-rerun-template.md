# NotebookLM MCP Readiness Setup Rerun Guide

Use this runbook to trigger all sandbox recheck loops sequentially after you finish editing `.env.local` to verify credentials safety and gate scores.

| Step | Command | Purpose | Expected Result | Pass Condition |
|---|---|---|---|---|
{{RERUN_ROWS}}

> [!WARNING]
> **Safety Warning:** Ensure `ALLOW_LIVE_MCP_EXECUTION` is set to `false` in `config/notebooklm-mcp-readiness-gate.ts` before running these verification gates.
