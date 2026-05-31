# 🛠️ Command Router Interface

This document specifies the safe execution gateway and router rules for **Brilliantaire OS**.

---

## 1. Purpose of the Command Router

The **Command Router** serves as the single safe entry point to execute scripts and functions across the OS ecosystem. It provides an intermediate translation layer, mapping normalized text strings (inputs) to strictly defined, pre-approved npm scripts.

---

## 2. Safe Execution Policy

To ensure complete control and system safety, the router enforces the following security boundaries:
* **No Arbitrary Shell Command execution:** Direct invocation of commands is prohibited. Child processes are spawned directly using `child_process.spawn` with `shell: false`. No `eval` or shell injection vectors exist.
* **Strict Whitelisting:** Any input that does not match an entry in the pre-approved [config/commands.ts](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/config/commands.ts) registry is immediately blocked, exiting with code 1.
* **Audit Logging:** Every command execution, whether successful, failed, or blocked, is logged with metadata to `outputs/command_logs/command_log_YYYY-MM-DD.md`.
* **Exact-Name Rules:** Medium-risk or High-risk commands containing `requiresExactName: true` cannot be run via aliases. They must be typed exactly to ensure explicit developer intent.
* **High-Risk Confirmation Rule:** Commands with `riskLevel: 'high'` require the explicit addition of the `--confirm` flag (e.g. `npm run command -- "approve-write" --confirm`). Without the flag, execution is blocked.

---

## 3. Allowed Commands Registry

| Command | Aliases | Owning Agent | Risk Level | Exact Name Required | Description |
|---|---|---|---|---|---|
| `audit` | `check`, `verify` | Workflow Auditor | Low | No | Runs workspace structural checks and verification checks. |
| `brief` | `report`, `summary` | OS Architect | Low | No | Compiles and prints active projects, priorities, and actions. |
| `next` | `actions`, `next-actions` | Action Router | Low | No | Lists grouped action checklists. |
| `agents` | `council`, `roster` | OS Architect | Low | No | Shows active council properties. |
| `ingest` | `scan-notes`, `obsidian` | Knowledge Librarian | Medium | Yes | Recursively scans Obsidian vault notes (Read-Only). |
| `daily-brief` | `daily`, `today` | Action Router | Low | No | Compiles daily briefs markdown file outputs. |
| `sync-status` | `sync` | Knowledge Librarian | Medium | Yes | Backs up status pages and syncs Obsidian snapshots. |
| `stage-write` | `stage`, `prepare-write` | Knowledge Librarian | Medium | Yes | Stages markdown briefs for approval. |
| `approve-write` | `approve`, `write-to-vault` | Knowledge Librarian | High | Yes | Safely writes staged files into designated Obsidian subdirectories. |
| `write-log` | `logs`, `write-history` | Workflow Auditor | Low | No | Reads and prints recent approved write history. |
| `build` | `compile` | Build Operator | Low | No | Compiles TypeScript workspace. |
| `campaign-help` | `campaign commands`, `campaigns-help` | Creative Revenue Strategist | Low | No | Prints list of available campaign engine tasks. |
| `campaign` | `campaigns` | Creative Revenue Strategist | Medium | Yes | Runs campaign assets compiler (brief, calendar, prompts, checks). |
| `voice-help` | `voice commands`, `voice-list` | Workflow Auditor | Low | No | Prints registry of all allowed voice command phrases. |
| `voice-queue` | `voice` | Build Operator | Medium | Yes | Processes text-based voice command queue inbox files safely. |
| `voice-pending` | `pending voice`, `voice review` | Workflow Auditor | Low | No | Lists voice commands currently pending confirmation. |
| `voice-confirm` | `confirm voice` | Build Operator | High | Yes | Approves and executes a pending voice command. |
| `voice-deny` | `deny voice` | Workflow Auditor | Medium | Yes | Denies and discards a pending voice command. |
| `vibevoice-help` | `vibe help`, `voice bridge help` | Build Operator | Low | No | Prints VibeVoice transcript bridge safety menus. |
| `vibevoice-transcript` | `transcribe voice`, `voice transcript` | Build Operator | Medium | Yes | Scan and ingest manual transcripts into queue inbox. |
| `vibevoice-test` | `voice test` | Workflow Auditor | Low | No | Generate sample test files under manual voice input. |
| `live-asr-help` | `asr help`, `microphone help` | Build Operator | Low | No | Print Live ASR safety menus and command flow. |
| `live-asr-import` | `import voice`, `import asr` | Build Operator | Medium | Yes | Import raw live transcripts from voice_input/live into manual staging. |
| `live-asr-test` | `asr test`, `microphone test` | Workflow Auditor | Low | No | Generate mock ASR transcript inputs under voice_input/live. |
| `live-asr-record` | `record voice`, `microphone record` | Build Operator | Medium | Yes | Microphone recording interface info and staging parameters. |
| `campaign-scheduler-help` | `scheduler help`, `posting help` | Creative Revenue Strategist | Low | No | Print campaign scheduler available tasks and parameters. |
| `campaign-scheduler` | `scheduler`, `posting queue` | Creative Revenue Strategist | Medium | Yes | Run campaign scheduler draft tasks (create, queue, log, status). |
| `campaign-simulate-help` | `simulation help`, `campaign validation help` | Workflow Auditor | Low | No | Print campaign simulation available tasks and parameters. |
| `campaign-simulate` | `simulate campaign`, `validate campaign` | Workflow Auditor | Medium | Yes | Run campaign simulation audits (sporty, validate sporty, status sporty). |
| `mesh-telemetry-help` | `telemetry help`, `mesh help` | Workflow Auditor | Low | No | Print mesh telemetry available tasks and parameters. |
| `mesh-telemetry` | `telemetry`, `mesh` | Workflow Auditor | Medium | Yes | Run system mesh telemetry logging (snapshot, report, campaign sporty, status). |
| `dashboard-export` | `export dashboard`, `dashboard data` | Workflow Auditor | Low | No | Export system status and telemetry metrics to JSON. |
| `dashboard-build` | `build dashboard` | Build Operator | Low | No | Compile the static Vite dashboard production bundle. |
| `automation-help` | `automation list`, `routine help` | Workflow Auditor | Low | No | Print registry of pre-approved local automation routines. |
| `automation-runner` | `run automation`, `routine` | Build Operator | Medium | Yes | Execute a pre-approved local automation routine. |
| `background-help` | `background automation help`, `background help` | Workflow Auditor | Low | No | Print background schedules safety manuals. |
| `background-dry-run` | `background test`, `schedule dry run` | Workflow Auditor | Low | No | Simulate background routine execution. |
| `background-status` | `background status`, `schedule status` | Workflow Auditor | Low | No | Check background schedule diagnostics. |
| `background-run` | `run background`, `schedule run` | Build Operator | High | Yes | Execute a pre-approved background schedule routine. |
| `platform-adapter-help` | `platform help`, `posting package help` | Creative Revenue Strategist | Low | No | Print platform output adapters safety manuals. |
| `platform-adapter` | `platform package`, `posting package` | Creative Revenue Strategist | Medium | Yes | Generate manual platform posting packages. |
| `platform-verify-help` | `platform verification help`, `verify package help` | Workflow Auditor | Low | No | Print platform verification gates safety manuals. |
| `platform-verify` | `verify platform`, `verify package` | Workflow Auditor | Medium | Yes | Verify generated platform packages. |
| `manual-release-help` | `release help`, `manual posting help` | Creative Revenue Strategist | Low | No | Print manual release safety manuals. |
| `manual-release` | `release`, `manual posting` | Creative Revenue Strategist | Medium | Yes | Generate manual release checklists and runbooks. |
| `distribution-metrics-help` | `metrics help`, `distribution help` | Creative Revenue Strategist | Low | No | Print manual distribution metrics safety manuals. |
| `distribution-metrics` | `metrics`, `distribution` | Creative Revenue Strategist | Medium | Yes | Generate manual distribution metrics entry files, reports, and indexes. |
| `knowledge-harvest-help` | `learning help`, `harvest help` | Knowledge Librarian | Low | No | Print commands for Knowledge Harvest Engine. |
| `knowledge-harvest` | `learn`, `harvest` | Knowledge Librarian | Medium | Yes | Run Knowledge Harvest Engine manual URL or transcript commands. |
| `notebooklm-bridge-help` | `notebook help`, `notebooklm help` | Knowledge Librarian | Low | No | Print commands for NotebookLM MCP Sidecar Bridge. |
| `notebooklm-bridge` | `notebooklm`, `notebook bridge` | Knowledge Librarian | Medium | Yes | Execute NotebookLM MCP Sidecar Bridge tasks safely. |
| `notebooklm-mcp-detect-help` | `notebook mcp help`, `mcp notebook help` | Knowledge Librarian | Low | No | Print commands for NotebookLM MCP Adapter Detection. |
| `notebooklm-mcp-detect` | `notebook mcp detect`, `notebooklm mcp` | Knowledge Librarian | Medium | Yes | Execute NotebookLM MCP Adapter Detection scans. |
| `notebooklm-mcp-execute-help` | `notebook execution help`, `mcp execution help` | Knowledge Librarian | Low | No | Print commands for NotebookLM MCP Dry-Run Execution. |
| `notebooklm-mcp-execute` | `notebook execute`, `mcp execute` | Knowledge Librarian | Medium | Yes | Execute NotebookLM MCP Adapter Dry-Run simulations. |
| `notebooklm-mcp-auth-help` | `notebook auth help`, `mcp auth help` | Knowledge Librarian | Low | No | Print commands for NotebookLM MCP Live Authorization Validation. |
| `notebooklm-mcp-auth` | `notebook auth`, `mcp auth` | Knowledge Librarian | Medium | Yes | Execute NotebookLM MCP Live Authorization Validation checks. |
| `list-schedules` | `schedules`, `list schedules` | Workflow Auditor | Low | No | List registered background schedules. |
| `scheduler-health` | `scheduler health`, `health status` | Workflow Auditor | Low | No | Print background scheduler health status analytics. |
| `scheduler-report` | `scheduler report`, `compile report` | Workflow Auditor | Low | No | Generate daily and weekly scheduler performance reports. |
| `narrator-sources` | `narrator source scan`, `narrator scan` | Knowledge Librarian | Low | No | Scan approved sources and generate narrator source snapshot. |
| `narrator-validate` | `validate narrator`, `narrator check` | Workflow Auditor | Low | No | Validate narrator_card.json output structure and safety. |
| `narrator-brief-help` | `narrator brief help`, `brief composer help` | Knowledge Librarian | Low | No | Print help commands for the narrator brief composer. |
| `narrator-brief` | `narrator brief`, `compose narrator` | Knowledge Librarian | Low | No | Compile target-specific operational briefs from system telemetry. |
| `narrator-live-feed-help` | `live narrator help`, `narrator feed help` | Knowledge Librarian | Low | No | Print help commands for narrator live feed controller. |
| `narrator-live-feed` | `narrator feed`, `live narrator` | Knowledge Librarian | Low | No | Compile and aggregate read-only live dashboard feeds and event logs. |
| `narrator-feed-watch` | `watch narrator`, `narrator watcher` | Workflow Auditor | Medium | Yes | Run the local read-only file watcher daemon for narrator feed updates. |

---

## 4. Execution Examples

* Run operational brief summary (accepts aliases):
  ```bash
  npm run command -- "brief"
  # or using alias:
  npm run command -- "report"
  ```
* Run medium-risk scanner (requires exact command name, alias blocked):
  ```bash
  npm run command -- "ingest"
  ```
* Execute high-risk vault write (requires exact name and confirmation flag):
  ```bash
  npm run command -- "approve-write" --confirm
  ```
* Compile Sporty campaign briefs (medium risk, requires exact name):
  ```bash
  npm run command -- "campaign brief sporty"
  ```

*Note: The campaign template engine runs strictly locally. It does not publish, connect to external social media APIs, or trigger automated posts.*

---

## 5. Preparation for Voice Control (VibeVoice Bridge)

By centralizing execution into a normalized command parser, the OS is fully prepared for future voice integration. Once active, the VibeVoice ASR voice bridge can transcribe spoken audio commands (e.g. *"Show daily brief"*), map the normalized text to the Command Router, and execute tasks hands-free safely within pre-defined security boundaries.
