# 🎙️ VOICE COMMAND RISK REGISTRY

*Generated automatically by Sentinel OS Voice Risk Registry compiler.*
*System Risk Reference:* L0 (Low) to L4 (Critical)

## 🔒 Risk Levels Reference

| Level | Description | Confirmation Required |
| :--- | :--- | :---: |
| **L0** | status, read-only, help | 🟢 NO |
| **L1** | local report generation | 🟢 NO |
| **L2** | local file staging | 🔴 YES |
| **L3** | tunnel, write, confirm, external handoff | 🔴 YES |
| **L4** | destructive, credential, public exposure | 🔴 YES |

## 📋 Command Mappings & Gate Matrix

| Voice Phrase | Mapped Command | Risk | Auto-Execute | Requires Confirm | Owner | Notes |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `show daily brief` | `npm run daily-brief` | **L0** | 🟢 YES | 🟢 NO | Action Router | Displays the summarized daily actions queue. |
| `show next actions` | `npm run next` | **L0** | 🟢 YES | 🟢 NO | Action Router | Prints the ranked task matrix. |
| `show agents` | `npm run agents` | **L0** | 🟢 YES | 🟢 NO | OS Architect | Lists active productivity agent roles. |
| `show campaign help` | `npm run campaign-help` | **L0** | 🟢 YES | 🟢 NO | Creative Revenue Strategist | Prints help instructions for revenue campaigns. |
| `show status` | `npm run status` | **L0** | 🟢 YES | 🟢 NO | OS Architect | Basic system diagnostics readout. |
| `show tunnel status` | `npm run tunnel-status` | **L0** | 🟢 YES | 🟢 NO | Workflow Auditor | Verifies if the public tunnel proxy daemon is running. |
| `run audit` | `npm run audit` | **L1** | 🟢 YES | 🟢 NO | Workflow Auditor | Runs standard TypeScript/ESLint workspace diagnostics. |
| `scan obsidian` | `npm run ingest` | **L2** | 🔴 NO | 🔴 YES | Knowledge Librarian | Ingests Obsidian vault notes in read-only mode. |
| `stage write` | `npm run stage-write` | **L2** | 🔴 NO | 🔴 YES | Knowledge Librarian | Stages markdown files to the write_staging output directory. |
| `run knowledge intake` | `npm run sentinel:knowledge-router` | **L2** | 🔴 NO | 🔴 YES | Knowledge Librarian | Intakes external knowledge resources and stages them. |
| `create sporty brief` | `npm run campaign brief sporty` | **L2** | 🔴 NO | 🔴 YES | Creative Revenue Strategist | Drafts high-contrast campaign brief parameters. |
| `create sporty calendar` | `npm run campaign calendar sporty` | **L2** | 🔴 NO | 🔴 YES | Creative Revenue Strategist | Generates timeline schedules for release rollout. |
| `create sporty street script` | `npm run campaign street-script sporty` | **L2** | 🔴 NO | 🔴 YES | Creative Revenue Strategist | Generates voice script files for Icyflamze release. |
| `create sporty checklist` | `npm run campaign checklist sporty` | **L2** | 🔴 NO | 🔴 YES | Creative Revenue Strategist | Creates task execution checklists for launch. |
| `approve write` | `npm run approve-write` | **L3** | 🔴 NO | 🔴 YES | Knowledge Librarian | Performs actual file writes from staging to the live Obsidian vault. |
| `stop tunnel` | `npm run sentinel:tunnel-log stop` | **L3** | 🟢 YES | 🟢 NO | Workflow Auditor | Allowed without confirmation under VOICE_CAN_STOP_TUNNEL policy to secure public entry points quickly. |
| `start tunnel` | `npm run sentinel:tunnel-log start` | **L3** | 🔴 NO | 🔴 YES | Workflow Auditor | Voice execution is BLOCKED under VOICE_CAN_START_TUNNEL policy. Requires direct CLI/UI confirmation. |
| `run notebooklm bridge` | `npm run notebooklm-bridge` | **L3** | 🔴 NO | 🔴 YES | Knowledge Librarian | Syncs staging notes with NotebookLM MCP gateway. Execution is currently disabled. |

---
*Authorized by Chief Systems Architect under One System Governance Protocol.*