# NotebookLM MCP Readiness Recheck and Rerun Guide

* **Date:** 2026-06-01

## Verification Commands Registry

| Verification Command | Purpose | Expected Output | Pass Condition | Fail Condition |
|---|---|---|---|---|
| `npm run notebooklm-mcp-auth -- "scan"` | Scans env and configs for variables | Mapped variable keys marked found | All required variables present (Score: 100%) | Score remains < 100% or missing keys |
| `npm run notebooklm-mcp-auth -- "status"` | Prints status reports registry | Overall readiness score summary | Reports exist and score is 100% | Reports missing or validation errors |
| `npm run notebooklm-mcp-harden -- "readiness-recheck"` | Audits checklist safety limits | Checklist status flags updated | All checklist safety items pass | Safety policy violations (e.g. live execution enabled) |
| `npm run notebooklm-mcp-harden -- "status"` | Outputs configuration state summary | Summary of staged templates | All templates exist and checked | Missing templates or scan errors |

## Readiness Increments Explanation
The readiness score starts at `0%` on clean dev repositories. Once local variables are configured in `.env.local` (outside version control), the scan score will increase by 16.6% per mapped variable name found, reaching `100%` when all six required variables are active in your host shell or local configuration path.
