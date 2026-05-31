# 🌌 Brilliantaire OS

> **Identity Stack:** King on his own board, Knight in the universe's game.  
> **Origin:** Area Boy (Lagos Roots) | **Symbolism:** Mr. 2 Lighter (Survival + Creation)  
> **Mindset:** Brilliantier (Pressure-educated) | **Signature:** *"I build before burning."*  

Tactical execution platform operating with high-leverage local skills and autonomous decision-making loops under the **One System** mesh network.

---

## 🛰️ Phase 3A: Knowledge Ingestion & Obsidian Read-Only Gateway

The **Obsidian Read-Only Gateway** connects `brilliantaire-os` to local Obsidian vaults. It allows the system to recursively parse markdown notes, extract crucial tasks, blocker notes, decisions, and system signals, and compile actionable reports without ever modifying or risking vault data.

### 🔒 Read-Only Safety Rule
**The Gateway is strictly read-only.** It never writes back to your Obsidian vaults. All syncing, snapshotting, and report-generation occur locally within the repository's `outputs/` directory.

---

## 🔒 Phase 3B: Approved Obsidian Write Gateway

The **Approved Obsidian Write Gateway** provides a safe, highly-controlled mechanism to write staging summaries, snapshots, and operational briefs back to the Obsidian vault under a dedicated `brilliantaire-briefs/` subdirectory.

### 🛡️ Safe Write Policy & Staging Verification
1. **No Automatic Sync:** Full automatic bi-directional sync is strictly prohibited to prevent data loss or infinite loops.
2. **Explicit Staging Loop:** Files must first be generated and verified locally in the `outputs/write_staging/` folder.
3. **Approval Handshake:** No write is executed to the Obsidian vault until `npm run approve-write` is run explicitly.
4. **Collision Isolation (No Overwrites):** If a target file already exists in the Obsidian directory, the write script appends a unique UNIX timestamp suffix to prevent overriding existing notes.
5. **Obsidian Folder Isolation:** The gateway is restricted to writing ONLY to the `brilliantaire-briefs/` subfolder (which has dedicated folders: `daily/`, `next-actions/`, `decisions/`, `projects/`, and `logs/`).
6. **Rollback & Logs:** Every write generates timestamped records in both the repository's `outputs/write_logs/` and the vault's `brilliantaire-briefs/logs/`. If a rollback is needed, files can be restored from the staging folder or local repository backups.

---

## 🛠️ CLI Task Runner commands

Manage and execute operations using the following `task` commands:

| Command | Action | Description |
|---|---|---|
| `task init` | `npm install` | Install workspace dependencies |
| `task build` | `npm run build` | Compile TypeScript sources to `dist/` |
| `task audit` | `npm run audit` | Run workspace sanity checks and verify core file presence |
| `task brief` | `npm run brief` | Print a concise operational summary to the terminal |
| `task next` | `npm run next` | Generate a ranked next-action checklist |
| `task ingest` | `npm run ingest` | Recursively scan candidate Obsidian paths for key tags and signals |
| `task sync-status` | `npm run sync-status` | Sync parsed Obsidian snapshot into repository status files |
| `task daily-brief` | `npm run daily-brief` | Generate a daily operating brief markdown report |
| `task agents` | `npm run agents` | Print a clean summary of the active Agent Council |
| `task stage-write` | `npm run stage-write` | Stage markdown files into `write_staging` |
| `task approve-write` | `npm run approve-write` | Write staged files to safe Obsidian directory |
| `task write-log` | `npm run write-log` | Display write history timeline and warnings |
| `task command` | `npm run command -- <CLI_ARGS>` | Execute pre-approved CLI script via the safe command router |
| `task command-help` | `npm run command-help` | Print registry of all allowed command router configurations |
| `task campaign` | `npm run campaign -- <CLI_ARGS>` | Run campaign template actions safely |
| `task campaign-help` | `npm run campaign-help` | Print campaign CLI help |
| `task voice-queue` | `npm run voice-queue` | Process text-based voice commands queue safely |
| `task voice-help` | `npm run voice-help` | Print voice commands mapping table registry |
| `task voice-pending` | `npm run voice-pending` | List voice commands pending confirmation review |
| `task voice-confirm` | `npm run voice-confirm -- <CLI_ARGS>` | Approve and execute a pending voice command |
| `task voice-deny` | `npm run voice-deny -- <CLI_ARGS>` | Deny and discard a pending voice command |
| `task knowledge-harvest-help` | `npm run knowledge-harvest-help` | Print knowledge harvest engine CLI help |
| `task knowledge-harvest` | `npm run knowledge-harvest -- <CLI_ARGS>` | Run knowledge harvest task commands safely |
| `task notebooklm-bridge-help` | `npm run notebooklm-bridge-help` | Print NotebookLM MCP Sidecar Bridge safety manuals |
| `task notebooklm-bridge` | `npm run notebooklm-bridge -- <CLI_ARGS>` | Run NotebookLM MCP Sidecar Bridge tasks safely |

---

## 🤖 Productivity Agent Layer

Brilliantaire OS operates with a lean council of **7 conceptual agents** to segment duties, monitor boundaries, and maintain high-fidelity execution:
1. **OS Architect** — Core blueprints, roadmaps, and validation integrity.
2. **Workflow Auditor** — Space verification, duplication detection, and security sanity checks.
3. **Action Router** — Priority scheduler and status action item sorting.
4. **Knowledge Librarian** — Ingestion compiler and snapshots syncing manager.
5. **Prompt Engineer** — Standard instructions design and model templates compiler.
6. **Build Operator** — Builds compiler, typescript checks, and CLI executors.
7. **Creative Revenue Strategist** — Marketing launches, rollout briefs, and revenue tracker logic.

All roles are documented and mapped to specific owned files in [AGENTS.md](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/AGENTS.md).

---

## 🛠️ Phase 3D: Safe Command Router

The **Safe Command Router** provides a safe execution boundary that translates user inputs into strictly whitelisted commands without exposing the workspace to arbitrary shell execution.

### 🛡️ Safety & Execution Rules
1. **Zero Shell Command execution:** Direct invocation of commands is prohibited. Child processes are spawned directly using `child_process.spawn` with `shell: false`. No `eval` or shell injection vectors exist.
2. **Exact-Name Enforcement:** Pre-approved commands with `requiresExactName: true` (e.g. `ingest`, `sync-status`, `stage-write`, `approve-write`) block aliases. They must be typed exactly.
3. **High-Risk Confirmation Block:** High-risk commands (e.g. `approve-write`) require the `--confirm` flag to run. Without it, execution is safely blocked.
4. **Execution History Logging:** All command results, raw inputs, and execution statuses are appended to markdown logs inside `outputs/command_logs/`.

### 💻 Command Examples
* Run operational brief summary (accepts aliases):
  ```bash
  npm run command -- "report"
  ```
* Run medium-risk scanner (requires exact command name, alias blocked):
  ```bash
  npm run command -- "ingest"
  ```
* Run high-risk approved write (requires exact name and confirmation flag):
  ```bash
  npm run command -- "approve-write" --confirm
  ```
* View all registered router commands:
  ```bash
  npm run command-help
  ```

*Note: This clean command abstraction prepares the system for the hands-free VibeVoice bridge integration.*

---

## 📣 Phase 4A: Campaign Template Engine

The **Campaign Template Engine** compiles structured campaign assets for Tree Groove Records and Icyflamze brands. It operates entirely locally, creating content calendars, execution checklists, prompt logs, Lagos street challenge scripts, and briefs without calling external social APIs.

### 💻 Command Examples
* View campaign commands help:
  ```bash
  npm run campaign-help
  ```
* List registered rollout campaigns:
  ```bash
  npm run campaign -- "list"
  ```
* Generate launch checklist for the "Sporty" release (via the safe router):
  ```bash
  npm run command -- "campaign checklist sporty"
  ```
* Generate Lagos street challenge host interview script (via the safe router):
  ```bash
  npm run command -- "campaign street-script sporty"
  ```

---

## 🎙️ Phase 4B: Voice Command Queue

The **Voice Command Queue** provides a secure buffer separating speech-to-text transcription from active command execution. Normalized commands are stored as static transcripts in `voice_queue/inbox/` and processed sequentially against a mapped voice mapping registry.

### 💻 Command Examples
* View mapped voice phrases table:
  ```bash
  npm run command -- "voice-help"
  ```
* Execute queue scanning manually (medium risk, exact name required):
  ```bash
  npm run command -- "voice-queue"
  ```

---

## 🔒 Phase 4C: Voice Confirmation Layer

The **Voice Confirmation Layer** introduces a manual "Review-and-Release" confirmation workflow. Mapped voice actions flagged with medium-risk or high-risk are held in `voice_queue/pending_confirmation/` as metadata sidecar JSON and transcript files. Developers must explicitly release or reject them.

### 💻 Command Examples
* List all commands pending manual confirmation:
  ```bash
  npm run command -- "voice-pending"
  ```
* Release and execute a pending command (requires exact name and confirmation flag):
  ```bash
  npm run command -- "voice-confirm <pending-id> --confirm"
  ```
* Reject and discard a pending command:
  ```bash
  npm run command -- "voice-deny <pending-id> --reason 'not required'"
  ```

---

## 📂 Expected Outputs

All telemetry and compiler runs output to the local `outputs/` and `voice_queue/` directories:
* **Obsidian Ingestion Reports:**
  * `outputs/obsidian_ingest/ingest_report.json` - Complete parsed file nodes and score metrics.
  * `outputs/obsidian_ingest/ingest_report.md` - Rendered Markdown summary of the top 10 relevant notes.
* **Daily Briefs:**
  * `outputs/daily_briefs/daily_brief_YYYY-MM-DD.md` - Unified Operating report containing active priorities, tech build details, money-making opportunities, and upcoming moves.
* **Backups:**
  * `outputs/backups/*.bak` - Secure snapshot backups of repository markdown files before any status synchronization runs.
* **Campaign Telemetry Outputs:**
  * `outputs/campaigns/briefs/` - Standard campaign briefs markdown files.
  * `outputs/campaigns/content_calendars/` - 3-week multi-platform daily posting grids.
  * `outputs/campaigns/prompt_packs/` - AI generation prompt packs (Sora, Veo, Claude).
  * `outputs/campaigns/checklists/` - Staged checklist steps.
  * `outputs/campaigns/scripts/` - Lagos street interview script markdown files.
* **Voice Confirmation Outputs:**
  * `voice_queue/pending_confirmation/` - Mapped voice commands held for manual review.
  * `voice_queue/confirmed/` - Executed and confirmed voice phrase transcripts.
  * `voice_queue/denied/` - Discarded and denied voice commands transcripts.
  * `outputs/voice_confirmation_logs/` - Release and denial audit trail logs.
* **VibeVoice Ingestion Outputs:**
  * `voice_input/transcripts/` - Local backup archive of successfully ingested raw text transcripts.
  * `outputs/vibevoice_logs/vibevoice_log_YYYY-MM-DD.md` - Ingest log tracking staged and rejected files.
* **Live ASR Bridge Outputs:**
  * `voice_input/live_sessions/` - Archive folders storing successfully imported live ASR transcripts.
  * `voice_input/live_logs/rejected/` - Direct storage of validation rejected files.
  * `outputs/live_asr_logs/live_asr_log_YYYY-MM-DD.md` - Chronological import audit logs.
* **Campaign Scheduler Outputs:**
  * `outputs/campaigns/schedules/` - Staged 21-day timeline schedules.
  * `outputs/campaigns/posting_queue/` - Daily posting queue scripts.
  * `outputs/campaigns/execution_logs/` - Verification posting sheets.
* **Campaign Simulation & Validation Outputs:**
  * `outputs/campaigns/simulations/` - Campaign simulation reports.
  * `outputs/campaigns/validation_reports/` - Validation audit reports.
* **Mesh Telemetry Outputs:**
  * `outputs/mesh_telemetry/snapshots/` - System configuration snapshots.
  * `outputs/mesh_telemetry/reports/` - Unified system telemetry reports and campaign specific metric sheets.

---

## 🎙️ Phase 5A: VibeVoice Transcript Producer

The **VibeVoice Transcript Producer** serves as the ingestion bridge that stages plain text voice transcripts into the safe pipeline without triggering live actions directly from audio inputs.

### 🛡️ Safety & Ingestion Rules
1. **Zero Direct Execution:** Transcripts cannot invoke scripts or run commands directly.
2. **Inbox Decoupling:** Transcripts are written exclusively to `voice_input/manual/` and staged to `voice_queue/inbox/` with a `vibevoice_` prefix.
3. **Length and Format Checks:** Inputs must be plain text (.txt), strictly shorter than 500 characters, and non-empty.

### 💻 Command Examples
* View VibeVoice safety menu:
  ```bash
  npm run command -- "vibevoice-help"
  ```
* Ingest and stage manual transcripts (requires exact command name):
  ```bash
  npm run command -- "vibevoice-transcript"
  ```
* Prepare test transcripts in the manual staging folder:
  ```bash
  npm run command -- "vibevoice-test"
  ```

---

## 🎙️ Phase 5B: Live Microphone ASR Bridge

The **Live Microphone ASR Bridge** is the ingestion adapter for live ASR output text, enforcing validation checks before moving them into the VibeVoice queue pipeline.

### 🛡️ Safety & Flow Rules
1. **No Microphone Direct execution:** Audio feeds do not execute OS commands directly.
2. **Decoupled Imports:** Imports transcript `.txt` files from `voice_input/live/` into `voice_input/manual/` for review.
3. **Strict Validation:** Empty or overly long inputs (> 500 characters) are rejected and stored under `voice_input/live_logs/rejected/`.

### 💻 Command Examples
* View Live ASR safety guide:
  ```bash
  npm run command -- "live-asr-help"
  ```
* Import valid transcripts from live directory (requires exact command name):
  ```bash
  npm run command -- "live-asr-import"
  ```
* Prepare test transcripts under live folder:
  ```bash
  npm run command -- "live-asr-test"
  ```
* Check recording device interface info (requires exact command name):
  ```bash
  npm run command -- "live-asr-record"
  ```

---

## 📅 Phase 6A: Campaign Scheduler Draft Engine

The **Campaign Scheduler Draft Engine** converts compiled campaign templates and briefs into local platform timelines, daily queues, and manual execution tracking sheets.

### 🛡️ Safety & Operations Rules
1. **Zero Live Publishing:** Strictly offline local compilation. No connection is made to platform API keys.
2. **Decoupled Processing:** Output scripts stage posting queues for human review.
3. **Safety Locks:** Built-in safeguards check file conflicts and preserve state via timestamp suffixing.

### 💻 Command Examples
* View Campaign Scheduler help menu:
  ```bash
  npm run command -- "campaign-scheduler-help"
  ```
* Compile 21-day Sporty rollout timeline (requires exact command name):
  ```bash
  npm run command -- "campaign-scheduler create sporty"
  ```
* Generate daily posting queue (requires exact command name):
  ```bash
  npm run command -- "campaign-scheduler queue sporty"
  ```
* Check current campaign schedule statuses:
  ```bash
  npm run command -- "campaign-scheduler status sporty"
  ```

---

## 📊 Phase 6B: Campaign Simulation & Mesh Validation

The **Campaign Simulation & Mesh Validation Engine** runs auditing checks against draft campaign files. It calculates platform coverage, CTA integrity, and asset readiness scores before executing tasks.

### 🛡️ Safety & Auditing Rules
1. **Zero API Integration:** The simulator is completely offline.
2. **Strict Score Grading:** Readiness is rated on 6 criteria (each 0 to 100), determining readiness level.
3. **Quarantine checks:** Reports structural checklist failures without modifying original assets.

### 💻 Command Examples
* View Campaign Simulator help menu:
  ```bash
  npm run command -- "campaign-simulate-help"
  ```
* Run full Sporty campaign simulation (requires exact command name):
  ```bash
  npm run command -- "campaign-simulate sporty"
  ```
* Run Sporty checklist validation audits (requires exact command name):
  ```bash
  npm run command -- "campaign-simulate validate sporty"
  ```
* Print latest simulation validation statuses:
  ```bash
  npm run command -- "campaign-simulate status sporty"
  ```

---

## 📊 Phase 7A: Safe Mesh Telemetry Logger

The **Safe Mesh Telemetry Logger** aggregates command history, voice confirmations, simulation audits, and approved write counts into unified telemetry logs.

### 🛡️ Safety & Telemetry Rules
1. **Completely Local:** Never uploads or broadcasts logs over networks.
2. **Read-Only Operations:** Performs audit operations non-destructively.
3. **Verification locks:** Preserves historical telemetry reports using timestamp suffix protections.

### 💻 Command Examples
* View Telemetry help menu:
  ```bash
  npm run command -- "mesh-telemetry-help"
  ```
* Compile current system capabilities snapshot (requires exact command name):
  ```bash
  npm run command -- "mesh-telemetry snapshot"
  ```
* Generate unified system telemetry metrics (requires exact command name):
  ```bash
  npm run command -- "mesh-telemetry report"
  ```
* Generate campaign specific metrics for the Sporty Single (requires exact command name):
  ```bash
  npm run command -- "mesh-telemetry campaign sporty"
  ```
* Check latest telemetry statuses:
  ```bash
  npm run command -- "mesh-telemetry status"
  ```

---

## 📊 Phase 7B: Lightweight Local Dashboard

The **Lightweight Local Dashboard** compiles static status lists and telemetry logs into a read-only Vite React TypeScript client application.

### 🛡️ Safety & Dashboard Rules
1. **Strictly Read-Only:** The dashboard operates 100% on statically exported JSON logs. No execution controls or database mutations exist in the UI.
2. **Offline Boundaries:** Runs entirely locally; does not invoke external metrics APIs.
3. **Double Isolation:** All command tasks are triggered strictly via CLI command router steps.

### 💻 Command Examples
* Export current telemetry variables to JSON (via safe router):
  ```bash
  npm run command -- "dashboard-export"
  ```
* Compile Vite static production bundle (via safe router):
  ```bash
  npm run command -- "dashboard-build"
  ```
* Spin up local Vite preview/development server:
  ```bash
  npm run dashboard:dev
  ```

---

## 🤖 Phase 8A: Local Automation Runner

The **Local Automation Runner** executes pre-approved maintenance routines (e.g., `daily-check`, `campaign-check`, `voice-check`) in a controlled, sequential manner.

### 🛡️ Safety & Execution Rules
1. **Command Router Mandate:** Every command is executed by routing through the Safe Command Router (`npm run command -- "<cmd>"`). Direct script invocation is prohibited.
2. **Fail-Fast Mechanics:** The runner halts execution immediately on the first command failure to prevent cascading errors. Succeeding tasks are skipped.
3. **No External Scheduling:** The runner works strictly offline and does not establish external crons or post data online.

### 💻 Command Examples
* Print list of available routines (via safe router):
  ```bash
  npm run command -- "automation-help"
  ```
* Execute daily sanity checks sequence (via safe router, exact name required):
  ```bash
  npm run command -- "automation-runner daily-check"
  ```

---

## 🛰️ Phase 8B: Controlled Background Automation

The **Controlled Background Automation** layer schedules approved local routines (e.g., `daily-check`, `campaign-check`, `voice-check`) via system schedulers (cron, launchd plist) without bypassing Safe Command Router validation boundaries.

### 🛡️ Safety & Execution Rules
1. **Double-Lock Safety:** Global execution toggle `ENABLE_BACKGROUND_AUTOMATION` and individual schedule toggles must be explicitly set to `true` to allow live runs. Default is disabled.
2. **Mandatory Confirmation Flag:** Running live schedules requires the explicit addition of the `--confirm` parameter.
3. **Strict Ingest Scans:** Runs fully local and offline. Direct connection to external APIs, automated social posting, and destructive scripts are disabled.

### 💻 Command Examples
* View background automation safety manuals:
  ```bash
  npm run command -- "background-help"
  ```
* Test simulation dry run for a schedule:
  ```bash
  npm run command -- "background-dry-run morning-daily-check"
  ```
* Execute live schedule routine (requires confirm flag, config must be enabled):
  ```bash
  npm run command -- "background-run morning-daily-check" --confirm
  ```
* Check configuration diagnostic status matrix:
  ```bash
  npm run command -- "background-status"
  ```

---

## 📤 Phase 9A: Platform Output Adapters

The **Platform Output Adapters** prepare structured, local Markdown packages for manual copy-paste posting across various channels (YouTube, TikTok, Instagram, Facebook, WhatsApp) and Obsidian.

### 🛡️ Safety & Execution Rules
1. **Manual-Only Action:** Does not connect to external platform APIs. Does not auto-post, upload files, or schedule external jobs.
2. **Offline Local Generation:** All files are stored under `outputs/platform_adapters/` as clean markdown.
3. **No Overwrites without Suffix:** Prevents accidental data loss by appending a precise timestamp suffix to output filenames if the base target file already exists.

### 💻 Command Examples
* View platform adapter safety manuals:
  ```bash
  npm run command -- "platform-adapter-help"
  ```
* Generate specific platform package (YouTube, TikTok, Instagram, Facebook, WhatsApp, Obsidian):
  ```bash
  npm run command -- "platform-adapter sporty youtube"
  ```
* Generate all platform packages in one execution:
  ```bash
  npm run command -- "platform-adapter sporty all"
  ```
* Check generated packages presence and latest paths:
  ```bash
  npm run command -- "platform-adapter status sporty"
  ```

---

## 🔍 Phase 9B: Decoupled Platform Verification Gates

The **Platform Verification Gates** read, check, and score generated copy-paste packages against whitelisted campaign variables and metadata structures.

### 🛡️ Safety & Execution Rules
1. **Offline Integrity:** All checks are conducted fully locally and offline, ensuring no platform credentials or tokens are ever utilized.
2. **Read-Only Inspection:** Scripts do not modify the original package outputs to preserve manual alignment history.
3. **No Overwrites without Suffix:** Verification reports are saved under `outputs/platform_verification/reports/` and append a timestamp suffix if a report for the current day already exists.

### 💻 Command Examples
* View platform verification safety manuals:
  ```bash
  npm run command -- "platform-verify-help"
  ```
* Verify a specific platform package (YouTube, TikTok, Instagram, Facebook, WhatsApp, Obsidian):
  ```bash
  npm run command -- "platform-verify sporty youtube"
  ```
* Verify all packages and generate a unified summary:
  ```bash
  npm run command -- "platform-verify sporty all"
  ```
* Check verification status matrix:
  ```bash
  npm run command -- "platform-verify status sporty"
  ```

## 📋 Phase 9C: Manual Release Checklist

The **Manual Release Checklist** layer aggregates verified platform packages, verification scores, and assets list into manual posting checklists and step-by-step runbooks.

### 🛡️ Safety & Execution Rules
1. **Manual-Only Boundary:** The OS has zero connection to third-party social media APIs. No automated posting, uploading, or scheduling of live posts is supported.
2. **Offline Running:** Checks local verified assets and writes checklist runbooks locally in `outputs/manual_release/`.
3. **No Overwrite without Suffix:** Prevents file collision by appending timestamp suffixes if checklists or runbooks already exist for the current date.

### 💻 Command Examples
* View manual release safety manuals:
  ```bash
  npm run command -- "manual-release-help"
  ```
* Generate manual release checklist (via safe router):
  ```bash
  npm run command -- "manual-release sporty checklist"
  ```
* Generate step-by-step posting runbook (via safe router):
  ```bash
  npm run command -- "manual-release sporty runbook"
  ```
* Display manual release diagnostics (via safe router):
  ```bash
  npm run command -- "manual-release sporty status"
  ```
* Compile checklist and runbook and print status at once:
  ```bash
  npm run command -- "manual-release sporty all"
  ```

---

## 📊 Phase 10A: Manual Distribution Metrics and Archiving

The **Manual Distribution Metrics and Archiving** layer tracks campaign performance metrics and catalogs all campaign-related files offline. It generates manual metric entry templates, parses platform logs, and indexes local files to aggregate distribution analytics.

### 🛡️ Safety & Execution Rules
1. **Manual-Entry-Only Boundary:** The OS has zero connection to third-party social media APIs. Metric entry files are populated manually by the creator.
2. **No scraping, crawling, or uploading:** The metrics engine functions entirely offline, protecting user data and respecting platform terms of service.
3. **No Overwrite without Suffix:** Appends timestamp suffixes if metric entries, reports, or archive indexes already exist.

### 💻 Command Examples
* View manual distribution metrics safety manuals:
  ```bash
  npm run command -- "distribution-metrics-help"
  ```
* Generate manual metric entry template for YouTube (via safe router):
  ```bash
  npm run command -- "distribution-metrics sporty entry youtube"
  ```
* Compile consolidated distribution report (via safe router):
  ```bash
  npm run command -- "distribution-metrics sporty report"
  ```
* Generate campaign archive index (via safe router):
  ```bash
  npm run command -- "distribution-metrics sporty archive-index"
  ```
* Display manual metrics status checklist (via safe router):
  ```bash
  npm run command -- "distribution-metrics sporty status"
  ```

---

## 🌾 Phase 11A: Knowledge Harvest Engine v1

The **Knowledge Harvest Engine** aggregates video and transcript learning logs from select AI channels offline to generate local Obsidian notes, NotebookLM source packs, and Brilliantaire OS workflow suggestions.

### 🛡️ Safety & Intake Rules
1. **Manual Ingestion Gate:** Strictly offline processing using manually registered YouTube URLs or locally provided transcript files.
2. **Zero Aggressive Crawling:** No automated channel scanning or scraping is performed.
3. **No Copyright Republication:** Keeps transcripts locally in the staging directory and avoids republishing full copies in summarized notes.
4. **Collision Suffixing:** Never overwrites notes, source packs, or workflow ideas without appending a unique UNIX timestamp suffix.

### 💻 Command Examples
* View knowledge harvest help (via safe router):
  ```bash
  npm run command -- "knowledge-harvest-help"
  ```
* Intake manual YouTube URL (via safe router):
  ```bash
  npm run command -- "knowledge-harvest intake-url https://www.youtube.com/@JulianGoldieSEO"
  ```
* Ingest local transcript file (via safe router):
  ```bash
  npm run command -- "knowledge-harvest intake-transcript test_inputs/julian_goldie_sample_transcript.txt"
  ```
* Generate NotebookLM source pack (via safe router):
  ```bash
  npm run command -- "knowledge-harvest source-pack"
  ```
* Generate Brilliantaire OS workflow ideas (via safe router):
  ```bash
  npm run command -- "knowledge-harvest workflow-ideas"
  ```
* Check harvest engine diagnostics (via safe router):
  ```bash
  npm run command -- "knowledge-harvest status"
  ```

---

## 🧠 Phase 11B: Knowledge Harvest Engine v2: NotebookLM MCP Sidecar Bridge

The **NotebookLM MCP Sidecar Bridge** provides a decoupled research staging environment. It drafts query files, imports copied NotebookLM responses, compiles staged Obsidian exports, and extracts operational workflow ideas.

### 🛡️ Safety & Execution Rules
1. **Decoupled Research Boundary:** NotebookLM does not run shell commands or write directly into active OS files.
2. **Obsidian Staging Gating:** Notes generated by the bridge must be reviewed inside `outputs/` and written using the Approved Obsidian Write Gateway.
3. **Copy-Paste Verification:** Ingests manual text files up to `12000` characters, scanning for command injection tokens.
4. **Collision Suffixing:** Appends a UNIX timestamp to avoid overwriting existing query packets or Obsidian exports.

### 💻 Command Examples
* View bridge commands guide (via safe router):
  ```bash
  npm run command -- "notebooklm-bridge-help"
  ```
* Create topic query packet (via safe router):
  ```bash
  npm run command -- "notebooklm-bridge create-query ai-automation"
  ```
* Import NotebookLM answer file (via safe router):
  ```bash
  npm run command -- "notebooklm-bridge add-answer test_inputs/notebooklm_sample_answer.md"
  ```
* Compile staged Obsidian research note (via safe router):
  ```bash
  npm run command -- "notebooklm-bridge export-obsidian"
  ```
* Extract Brilliantaire OS workflow ideas (via safe router):
  ```bash
  npm run command -- "notebooklm-bridge workflow-ideas"
  ```
* Compile harvest notes to source pack guide (via safe router):
  ```bash
  npm run command -- "notebooklm-bridge source-pack"
  ```
* Check bridge execution status (via safe router):
  ```bash
  npm run command -- "notebooklm-bridge status"
  ```

---

## 🔍 Phase 11C: NotebookLM MCP Adapter Detection

The **NotebookLM MCP Adapter Detection** layer checks whether a NotebookLM MCP connector is installed, configured, and reachable on the local system. It only inspects local configuration paths (e.g. `.mcp.json`, `~/.cursor/mcp.json`, `package.json` scripts) and generates local markdown reports, enforcing strict boundaries against query execution or external API calls.

### 🛡️ Safety & Execution Rules
1. **Detection-Only:** Inspects local configuration states without modifying files or initiating external calls.
2. **No-Query Rule:** Does not execute actual NotebookLM research queries.
3. **No External APIs:** No network socket requests or browser automation.
4. **Offline Reports:** Staged reports are generated under `outputs/notebooklm_bridge/mcp_detection/reports/` with timestamp suffixes to prevent overwrites.

### 💻 Command Examples
* View detection help:
  ```bash
  npm run command -- "notebooklm-mcp-detect-help"
  ```
* Scan local configurations:
  ```bash
  npm run command -- "notebooklm-mcp-detect scan"
  ```
* Print detection status:
  ```bash
  npm run command -- "notebooklm-mcp-detect status"
  ```
* Generate capabilities and risks report:
  ```bash
  npm run command -- "notebooklm-mcp-detect capability-report"
  ```

---

## ⚙️ Phase 11D: NotebookLM MCP Adapter Dry-Run Execution

The **NotebookLM MCP Adapter Dry-Run Execution** layer acts as a safe translation and staging bridge. It compiles query payloads from source packs and generates simulated execution (dry-run) reports without sending live external network queries.

### 🛡️ Safety & Execution Rules
1. **Dry-Run Only:** Live queries to NotebookLM are strictly disabled (`ALLOW_LIVE_MCP_EXECUTION: false`).
2. **No External Calls:** No network requests, API queries, or OAuth verification flows.
3. **No Direct Writes:** Stages all reports locally inside `outputs/notebooklm_bridge/mcp_execution/` with timestamp suffixes to avoid overwriting existing data.

### 💻 Command Examples
* View execution help:
  ```bash
  npm run command -- "notebooklm-mcp-execute-help"
  ```
* Prepare a query payload (e.g., source-summary):
  ```bash
  npm run command -- "notebooklm-mcp-execute prepare-query source-summary"
  ```
* Simulate dry-run execution (e.g., source-summary):
  ```bash
  npm run command -- "notebooklm-mcp-execute dry-run source-summary"
  ```
* Check execution status and logs:
  ```bash
  npm run command -- "notebooklm-mcp-execute status"
  ```

---

## 🔐 Phase 11E: NotebookLM MCP Live Authorization Validation

The **NotebookLM MCP Live Authorization Validation** layer provides a strict, offline validation protocol. It scans config profiles for expected environment variable names (e.g. `GOOGLE_APPLICATION_CREDENTIALS`, `NOTEBOOKLM_WORKSPACE_ID`) and generates readiness checklists without printing secret values or executing network requests.

### 🛡️ Safety & Execution Rules
1. **Validation-Only:** No active OAuth logins, browser automation, or direct queries to NotebookLM.
2. **No Secret Exposure:** Variable values are never outputted or printed; matching entries are marked as `[REDACTED]` or `[PRESENT]`.
3. **Least Privilege Review:** Analyzes permission scopes to recommend read-only setups and avoid risky write privileges.

### 💻 Command Examples
* View validation help:
  ```bash
  npm run command -- "notebooklm-mcp-auth-help"
  ```
* Run environment variables validation scan:
  ```bash
  npm run command -- "notebooklm-mcp-auth scan"
  ```
* Review permissions scope matrix:
  ```bash
  npm run command -- "notebooklm-mcp-auth scope-review"
  ```
* Generate activation safety checklist:
  ```bash
  npm run command -- "notebooklm-mcp-auth activation-checklist"
  ```
* Print overall authorization status:
  ```bash
  npm run command -- "notebooklm-mcp-auth status"
  ```

---

## 🧭 Phase 11F: NotebookLM MCP Connector Hardening

The **NotebookLM MCP Connector Hardening** layer creates safe environment templates, staged config files, and credential scanning utilities to harden the connector interface before deployment.

### 🛡️ Safety & Execution Rules
1. **Hardening-Only:** All files, templates, and configurations are staging objects; no real secrets are generated or committed.
2. **No Direct Overwrite:** Live Claude or Cursor configuration structures are never modified automatically; configs must be manually copied.
3. **Secret Hygiene Sweep:** Code base is scanned recursively, skipping compiled/untracked artifacts, ensuring no credentials leak.

### 💻 Command Examples
* View hardening help menu:
  ```bash
  npm run command -- "notebooklm-mcp-harden-help"
  ```
* Generate staged environment template:
  ```bash
  npm run command -- "notebooklm-mcp-harden create-env-template"
  ```
* Generate staged MCP configuration JSON:
  ```bash
  npm run command -- "notebooklm-mcp-harden create-mcp-template"
  ```
* Run secret hygiene scanner:
  ```bash
  npm run command -- "notebooklm-mcp-harden secret-hygiene"
  ```
* Run readiness recheck report:
  ```bash
  npm run command -- "notebooklm-mcp-harden readiness-recheck"
  ```
* Print overall configuration status summary:
  ```bash
  npm run command -- "notebooklm-mcp-harden status"
  ```

---

## 🧭 Phase 11G: NotebookLM MCP Manual Setup Instructions

The **NotebookLM MCP Manual Setup Instructions** layer provides step-by-step setup guides, gitignore parameters, sidecar client settings checklists, validation reruns, and deactivation rollback templates.

### 🛡️ Safety & Execution Rules
1. **Manual Actions Boundary:** The application only compiles setup checklists and status briefings. No environment variables are altered automatically, and no live configurations are overwritten.
2. **Git Credentials Isolation:** real variable values are restricted strictly to local `.env.local` files and must never be committed.

### 💻 Command Examples
* View manual setup help menu:
  ```bash
  npm run command -- "notebooklm-mcp-setup-guide-help"
  ```
* Compile manual setup runbook:
  ```bash
  npm run command -- "notebooklm-mcp-setup-guide runbook"
  ```
* Compile .env.local setup guide:
  ```bash
  npm run command -- "notebooklm-mcp-setup-guide env-instructions"
  ```
* Compile MCP config copy checklist:
  ```bash
  npm run command -- "notebooklm-mcp-setup-guide config-copy"
  ```
* Compile validation rerun guide:
  ```bash
  npm run command -- "notebooklm-mcp-setup-guide readiness-rerun"
  ```
* Compile rollback deactivation plan:
  ```bash
  npm run command -- "notebooklm-mcp-setup-guide rollback"
  ```
* Compile all setup documents at once:
  ```bash
  npm run command -- "notebooklm-mcp-setup-guide all"
  ```
* Print overall setup status verification:
  ```bash
  npm run command -- "notebooklm-mcp-setup-guide status"
  ```

---

## 🧭 Phase 11H: MCP Setup Review and Readiness Gate

The **MCP Setup Review and Readiness Gate** layer evaluates local environment variable configurations, sidecar config mappings, and provides active blockers lists and integration eligibility decisions.

### 🛡️ Safety & Execution Rules
1. **Verification-Only:** Strictly offline evaluation; no live connection queries or external APIs are accessed.
2. **Eligibility Score Check:** Enforces a minimum setup score of 90% and zero active blockers before live integration eligibility is approved.

### 💻 Command Examples
* View readiness gate help menu:
  ```bash
  npm run command -- "notebooklm-mcp-readiness-gate-help"
  ```
* Run environment scans:
  ```bash
  npm run command -- "notebooklm-mcp-readiness-gate scan"
  ```
* Compile live integration decision:
  ```bash
  npm run command -- "notebooklm-mcp-readiness-gate decision"
  ```
* Compile current blockers matrix:
  ```bash
  npm run command -- "notebooklm-mcp-readiness-gate blockers"
  ```
* Print overall status review and status summary:
  ```bash
  npm run command -- "notebooklm-mcp-readiness-gate status"
  ```

---

## 🧭 Phase 11I: MCP Local Setup Correction Pack

The **MCP Local Setup Correction Pack** converts readiness gate blockers into explicit manual configuration corrections to perform outside the repository.

### 🛡️ Safety & Execution Rules
1. **Safety Controls Compliance:** Zero plain-text credentials are ever written into version control tracked files.
2. **Local-Only Boundary:** Config files and environment variables maps reside strictly in `.env.local` or `.mcp.local.json`.
3. **No Force Push:** Recovery workflows resolve git push failures safely rather than force-pushing.

### 💻 Command Examples
* View correction pack help instructions:
  ```bash
  npm run command -- "notebooklm-mcp-correction-pack-help"
  ```
* Generate blocker corrections report:
  ```bash
  npm run command -- "notebooklm-mcp-correction-pack blockers"
  ```
* Generate environment key map:
  ```bash
  npm run command -- "notebooklm-mcp-correction-pack env-map"
  ```
* Generate local config checklist:
  ```bash
  npm run command -- "notebooklm-mcp-correction-pack local-config"
  ```
* Generate Git push recovery runbook:
  ```bash
  npm run command -- "notebooklm-mcp-correction-pack git-push-recovery"
  ```
* Generate readiness rerun runbook:
  ```bash
  npm run command -- "notebooklm-mcp-correction-pack readiness-rerun"
  ```
* Generate all correction pack documents:
  ```bash
  npm run command -- "notebooklm-mcp-correction-pack all"
  ```
* Print overall correction status summary:
  ```bash
  npm run command -- "notebooklm-mcp-correction-pack status"
  ```

---

## 🧭 Phase 11J: Manual MCP Setup Completion Review

The **Manual MCP Setup Completion Review** layer performs local checking of operator corrections to determine final eligibility for live integration.

### 🛡️ Safety & Execution Rules
1. **Safety Compliance Check:** Redacts all sensitive variables while executing checks offline.
2. **Review Score:** Live integration is blocked unless review score achieves >= 90% and outstanding config blockers are cleared.

### 💻 Command Examples
* View completion review help instructions:
  ```bash
  npm run command -- "notebooklm-mcp-completion-review-help"
  ```
* Run environment variable presence check:
  ```bash
  npm run command -- "notebooklm-mcp-completion-review env-check"
  ```
* Run manual completion review:
  ```bash
  npm run command -- "notebooklm-mcp-completion-review review"
  ```
* Generate eligibility report:
  ```bash
  npm run command -- "notebooklm-mcp-completion-review eligibility"
  ```
* Generate manual signoff checklist:
  ```bash
  npm run command -- "notebooklm-mcp-completion-review signoff"
  ```
* Print overall status review and status summary:
  ```bash
  npm run command -- "notebooklm-mcp-completion-review status"
  ```

---

## 🧭 Phase 11K: NotebookLM MCP Local Secrets Staging Guide

The **NotebookLM MCP Local Secrets Staging Guide** establishes a safe, local-only configuration staging and verification checklist to prepare for future activation without committing credentials or triggering live API calls.

### 🛡️ Safety & Execution Rules
1. **Zero Secret Storage:** Private credentials reside strictly offline inside git-ignored files.
2. **Redaction Check Enforced:** Codebase is scanned for suspicious credential patterns.
3. **Readiness Verification:** Local readiness metrics must achieve 100% before transition.

### 💻 Command Examples
* View secrets guide help menu:
  ```bash
  npm run command -- "notebooklm-mcp-secrets-help"
  ```
* Create local config template examples:
  ```bash
  npm run command -- "notebooklm-mcp-secrets create-templates"
  ```
* Scan codebase for credential patterns:
  ```bash
  npm run command -- "notebooklm-mcp-secrets redaction-check"
  ```
* Generate local staging readiness report:
  ```bash
  npm run command -- "notebooklm-mcp-secrets readiness"
  ```
* Print overall secrets status summary:
  ```bash
  npm run command -- "notebooklm-mcp-secrets status"
  ```

---

## 🧭 Phase N1: AI Narrator Safety and Source Binding

The **AI Narrator** is a grounded observer layer that reads approved system status logs and telemetry files, translating them into a clear narrative brief for the dashboard and Obsidian vaults.

### 🛡️ Safety & Grounding Rules
1. **Zero Command Execution:** The Narrator does not run commands, call shells, or approve system state modifications.
2. **Output-Only Restrictions:** The Narrator operates strictly in `output_only` mode, meaning it cannot modify any system files except its designated output brief files.
3. **Approved Sources Boundary:** The Narrator can only read files matching the explicit whitelist in `config/narrator-sources.ts`.
4. **Validation Enforced:** Every dashboard narrative card must pass the `narrator-validate` integrity constraints.

### 💻 Command Examples
* Scan approved sources and compile snapshot (via safe router):
  ```bash
  npm run command -- "narrator-sources"
  ```
* Run the validation script on the generated brief (via safe router):
  ```bash
  npm run command -- "narrator-validate"
  ```
* Run narrator manual check (dry run):
  ```bash
  python tools/ai_narrator.py --dry-run
  ```
## 🧭 Phase N2: Narrator Brief Composer

The **Narrator Brief Composer** is a decoupled local templating and generation layer that reads system status inputs and generated narrator cards to produce target-specific operational briefs without executing commands or writing directly to active Obsidian vault directories.

### 🛡️ Safety & Decooupled Rules
1. **Zero Command Execution:** Strictly read-only script. It never executes CLI subprocesses or alters system configurations.
2. **No Direct Obsidian Writes:** Stage-gated files are written exclusively to `outputs/narrator/` directory and must be authorized via the safe write gateway before vault import.
3. **No WebSockets or Live Streams:** Intentionally batch-driven under `output_only` safety mode. State streaming is deferred to Phase N3.
4. **Collision Isolation:** Every generated brief includes a precise YYYY-MM-DD_HHMM timestamp suffix to avoid overwriting previously staged files.

### 💻 Command Examples
* Print the available commands menu:
  ```bash
  npm run command -- "narrator-brief-help"
  ```
* Compile all four brief types at once:
  ```bash
  npm run command -- "narrator-brief all"
  ```
* Generate specific briefs (operator, dashboard, voice, or obsidian):
  ```bash
  npm run command -- "narrator-brief operator"
  npm run command -- "narrator-brief dashboard"
  npm run command -- "narrator-brief voice"
  npm run command -- "narrator-brief obsidian"
  ```
* Print execution status and verify missing inputs:
  ```bash
  npm run command -- "narrator-brief status"
  ```

---

## 📡 Phase N3: Live Dashboard Narration Feed

The **Live Dashboard Narration Feed** is a read-only telemetry consolidation layer that aggregates generated briefs and operating system variables into a single, lightweight status feed JSON.

### 🛡️ Safety & Read-Only Rules
1. **Zero Command Invocation:** The dashboard contains no inputs or buttons capable of executing commands.
2. **Read-Only Storage:** No HTTP POST routes or write gateways are exposed to the browser dashboard.
3. **Watcher Isolation:** The watch daemon checks modifications locally without spawning child processes.
4. **WebSocket Blocked:** WebSocket real-time protocols are disabled (`ENABLE_WEBSOCKET = false`) in favor of secure local interval polling.

### 💻 Command Examples
* View live feed commands menu:
  ```bash
  npm run command -- "narrator-live-feed-help"
  ```
* Generate unified live feed JSON:
  ```bash
  npm run command -- "narrator-live-feed generate"
  ```
* Log telemetry synchronization events:
  ```bash
  npm run command -- "narrator-live-feed event"
  ```
* Verify configuration values and safety gates:
  ```bash
  npm run command -- "narrator-live-feed status"
  ```
* Check files modification and trigger conditional update:
  ```bash
  npm run command -- "narrator-live-feed watch-once"
  ```
* Run local read-only observation watcher daemon (requires exact name):
  ```bash
  npm run command -- "narrator-feed-watch"
  ```

---

## 🎙️ Phase N4: Voice Narration Sync

The **Voice Narration Sync** layer converts compiled voice scripts and live feed metrics into structured, voice-ready packets and Voice Narrative Protocol (VNP) queue files safely staged for review.

### 🛡️ Safety & Execution Rules
1. **Output-Only Compiler:** Only compiles static markdown files to `outputs/narrator/voice_sync/`. No audio synthesis is triggered, and no TTS APIs are contacted.
2. **Zero Command Execution:** Does not run subcommands, system commands, or external network requests.
3. **No Auto-Playback:** Files are flagged for manual review and staged strictly offline.

### 💻 Command Examples
* View voice sync commands menu:
  ```bash
  npm run command -- "narrator-voice-sync-help"
  ```
* Generate voice packet file:
  ```bash
  npm run command -- "narrator-voice-sync packet"
  ```
* Stage manual VNP queue file:
  ```bash
  npm run command -- "narrator-voice-sync queue"
  ```
* Print voice sync status report:
  ```bash
  npm run command -- "narrator-voice-sync status"
  ```
* Compile packet and queue, then print status:
  ```bash
  npm run command -- "narrator-voice-sync all"
  ```

---

## 🎙️ Phase N5A: Local TTS Render Queue

The **Local TTS Render Queue** stages approved voice packets into text-to-speech rendering request markdown files safely offline.

### 🛡️ Safety & Execution Rules
1. **Local-Only Queue:** All requests are staged as files under `outputs/narrator/tts_queue/`. External TTS APIs and direct audio playback are strictly disabled.
2. **Zero Command Subprocess Execution:** Command strings embedded in request payloads are blocked from executing.
3. **Exact-Name Routing Gate:** Operations require exact command name matching (`narrator-tts-queue`) to run, preventing alias execution.

### 💻 Command Examples
* View tts queue help commands menu:
  ```bash
  npm run command -- "narrator-tts-queue-help"
  ```
* Generate a new render request file:
  ```bash
  npm run command -- "narrator-tts-queue request"
  ```
* Approve a render request by request ID (requires exact name router gate):
  ```bash
  npm run command -- "narrator-tts-queue approve <REQUEST_ID>"
  ```
* Reject a render request by request ID (requires exact name router gate):
  ```bash
  npm run command -- "narrator-tts-queue reject <REQUEST_ID>"
  ```
* Print tts queue status report:
  ```bash
  npm run command -- "narrator-tts-queue status"
  ```
* Compile request and print status:
  ```bash
  npm run command -- "narrator-tts-queue all"
  ```

---

## 🎙️ Phase N5B: Local TTS Audio Renderer

The **Local TTS Audio Renderer** converts approved text-to-speech rendering requests into offline audio files using a local speech synthesis engine (Piper) safely.

### 🛡️ Safety & Execution Rules
1. **Approved Request Gate:** Only renders requests in `approved/` folder. Blocks pending or rejected request IDs.
2. **Local-Only Rendering:** All synthesis runs offline using local binaries. External API queries are blocked.
3. **No Direct Audio Playback:** Rendered wave files are stored silently inside `rendered_audio/`. No audio devices are opened.
4. **Exact-Name Routing Gate:** Operations require exact command name matching (`narrator-tts-renderer`) to prevent accidental execution.

### 💻 Command Examples
* View tts renderer help commands menu:
  ```bash
  npm run command -- "narrator-tts-renderer-help"
  ```
* Print tts renderer status report:
  ```bash
  npm run command -- "narrator-tts-renderer status"
  ```
* Simulate rendering of approved request (dry-run):
  ```bash
  npm run command -- "narrator-tts-renderer dry-run <REQUEST_ID>"
  ```
* Render approved request text to audio (requires exact name router gate):
  ```bash
  npm run command -- "narrator-tts-renderer render <REQUEST_ID>"
  ```
* Render all approved requests in batch (requires exact name router gate):
  ```bash
  npm run command -- "narrator-tts-renderer render-all-approved"
  ```

---

## 🚀 Next Phase Recommendation
* **Phase 11L: NotebookLM MCP Live Adapter Integration**
  - Establish live, restricted read-only query adapter operations once safety gates and manual credential setups are signed off.
* **Phase N5C: Local ASR Command Listener**
  - Integrate safe, offline local automatic speech recognition (ASR) daemons to parse manual voice briefs, enabling a complete offline feedback loop.



