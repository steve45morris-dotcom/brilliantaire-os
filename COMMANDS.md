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
