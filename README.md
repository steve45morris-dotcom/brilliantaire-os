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
| `task icyflamze-core` | `npm run icyflamze-core -- <CLI_ARGS>` | Run ICYFLAMZE CORE registry & staging actions safely |
| `task icyflamze-core-help` | `npm run icyflamze-core-help` | Print ICYFLAMZE CORE CLI help |
| `task icyflamze-core-ip-bible` | `npm run icyflamze-core-ip-bible -- <CLI_ARGS>` | Run ICYFLAMZE CORE Season 1 IP Bible compilation safely |
| `task icyflamze-core-ip-bible-help` | `npm run icyflamze-core-ip-bible-help` | Print ICYFLAMZE CORE Season 1 IP Bible CLI help |
| `task icyflamze-core-episode-1` | `npm run icyflamze-core-episode-1 -- <CLI_ARGS>` | Run ICYFLAMZE CORE Episode 1 Trailer production package safely |
| `task icyflamze-core-episode-1-help` | `npm run icyflamze-core-episode-1-help` | Print ICYFLAMZE CORE Episode 1 Trailer production package CLI help |
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

## 🧭 Phase 11K: MCP Setup Fix Cycle

The **MCP Setup Fix Cycle** provides a repeatable local check and correction loop to resolve missing environmental variables and incorrect settings, enabling verified path alignment before activating live adapters.

### 🛡️ Safety & Execution Rules
1. **Offline Verification:** No API queries, browser popups, or external OAuth procedures are triggered.
2. **Local Staging:** Checklists and decisions are written strictly to local folders, avoiding repository code files or Obsidian direct writes.

### 💻 Command Examples
* View fix cycle help menu:
  ```bash
  npm run command -- "notebooklm-mcp-fix-cycle-help"
  ```
* Generate fix tasks checklist:
  ```bash
  npm run command -- "notebooklm-mcp-fix-cycle tasks"
  ```
* Compare current readiness score against previous readiness and review scores:
  ```bash
  npm run command -- "notebooklm-mcp-fix-cycle compare"
  ```
* Generate sequential manual runbook for next pass:
  ```bash
  npm run command -- "notebooklm-mcp-fix-cycle next-pass"
  ```
* Print status summary directly to console:
  ```bash
  npm run command -- "notebooklm-mcp-fix-cycle status"
  ```

---

## 🧭 Phase 11L: NotebookLM MCP Local Secrets Staging Guide

The **NotebookLM MCP Local Secrets Staging Guide** establishes a safe, local-only configuration staging and verification checklist to prepare for future activation without committing credentials or triggering live API calls.

### 🛡️ Safety & Execution Rules
1. **Zero Secret Storage:** Private credentials reside strictly offline inside git-ignored files.
2. **Redaction Check Enforced:** Codebase is scanned for suspicious credential patterns.
3. **Readiness Verification:** Local readiness metrics must achieve 100% before transition.

### 💻 Command Examples
* View secrets guide help menu:
  ```bash
  npm run command -- "notebooklm-mcp-local-secrets-help"
  ```
* Generate environment setup guide for .env.local:
  ```bash
  npm run command -- "notebooklm-mcp-local-secrets env-guide"
  ```
* Compile local secret verification checklist:
  ```bash
  npm run command -- "notebooklm-mcp-local-secrets checklist"
  ```
* Verify gitignore entries to prevent leaks:
  ```bash
  npm run command -- "notebooklm-mcp-local-secrets gitignore-check"
  ```
* Generate readiness recheck runbook:
  ```bash
  npm run command -- "notebooklm-mcp-local-secrets readiness-rerun"
  ```
* Run all guides, checklists, and reports:
  ```bash
  npm run command -- "notebooklm-mcp-local-secrets all"
  ```
* Print overall secrets status summary:
  ```bash
  npm run command -- "notebooklm-mcp-local-secrets status"
  ```

---

## 🧭 Phase 11L: Local MCP Setup Verification Loop

The **Local MCP Setup Verification Loop** provides a repeatable validation runbook to confirm all environment variables, gitignore exclusions, and configuration files are properly set up locally without committing keys or running live external queries.

### 🛡️ Safety & Execution Rules
1. **Local-Only Boundary:** Verification tools are strictly diagnostic and never write real secrets or bypass the Safe Command Router.
2. **Dynamic Gating:** Validates score thresholds dynamically from local setup files.
3. **No Live Execution:** All live query commands are blocked during the re-scan.

### 💻 Command Examples
* View verification loop help menu:
  ```bash
  npm run command -- "notebooklm-mcp-verify-loop-help"
  ```
* Run the verification loop command chain:
  ```bash
  npm run command -- "notebooklm-mcp-verify-loop chain"
  ```
* Execute the final eligibility check:
  ```bash
  npm run command -- "notebooklm-mcp-verify-loop final-check"
  ```
* Print overall verification loop status:
  ```bash
  npm run command -- "notebooklm-mcp-verify-loop status"
  ```

---

## 🧭 Phase 11N: NotebookLM MCP Live Adapter Integration

The **NotebookLM MCP Live Adapter Integration** establishes a restricted, read-only live query adapter structure that enforces multi-layered safety gates, manual query staging, readiness gating, and response imports.

### 🛡️ Safety & Execution Rules
1. **Read-Only Restrict:** Only performs read-only query dispatch. Mutating notebooks or uploading files is blocked.
2. **Offline Responses:** Staged results remain locally under the outputs directory and are never written directly to Obsidian.
3. **Manual Trigger Only:** Requires explicit developer `--confirm` flag and exact command name routing.
4. **Safe Fallback Instruction Generator:** If client invocation signatures are unknown or safety gates fail, it outputs manual client instructions instead of calling external systems.

### 💻 Command Examples
* View live adapter help menu:
  ```bash
  npm run command -- "notebooklm-mcp-live-help"
  ```
* Check status of live adapter variables and env states:
  ```bash
  npm run command -- "notebooklm-mcp-live status"
  ```
* Stage prepared live query files:
  ```bash
  npm run command -- "notebooklm-mcp-live prepare-live-query source-summary"
  npm run command -- "notebooklm-mcp-live prepare-live-query workflow-extraction"
  ```
* Run live adapter readiness tests:
  ```bash
  npm run command -- "notebooklm-mcp-live test-readiness"
  ```
* Dispatch live query (high risk confirmation):
  ```bash
  npm run command -- "notebooklm-mcp-live run-live-query source-summary" --confirm
  ```
* Import manually captured response file:
  ```bash
  npm run command -- "notebooklm-mcp-live import-response <path_to_response_file>"
  ```
* Compile live adapter operational metrics report:
  ```bash
  npm run command -- "notebooklm-mcp-live report"
  ```

---

## 🧭 Phase 11O: Live Response Intelligence Processor

The **Live Response Intelligence Processor** is an offline mapping layer that ingests normalized response files and parses them into structured local outputs, citation maps, weak claims reviews, workflow cards, OS module suggestions, and Obsidian-staged note files.

### 🛡️ Safety & Execution Rules
1. **Offline Ingestion Lock:** Operates strictly on local response files. External queries, notebook edits, and source uploads are blocked.
2. **Obsidian Vault Staging:** Note files are staged locally under the outputs directory. Direct vault writes are locked.
3. **Safety Verification:** Rejects response imports that exceed size limits or contain script injections.

### 💻 Command Examples
* View intelligence processor help menu:
  ```bash
  npm run command -- "notebooklm-response-intelligence-help"
  ```
* Extract workflows from latest response:
  ```bash
  npm run command -- "notebooklm-response-intelligence workflows"
  ```
* Map citations and support confidence:
  ```bash
  npm run command -- "notebooklm-response-intelligence citation-map"
  ```
* Identify claims needing verification evidence:
  ```bash
  npm run command -- "notebooklm-response-intelligence weak-claims"
  ```
* Compile OS module implementation recommendations:
  ```bash
  npm run command -- "notebooklm-response-intelligence module-recommendations"
  ```
* Generate prompt pack ideas:
  ```bash
  npm run command -- "notebooklm-response-intelligence prompt-packs"
  ```
* Assemble staged Obsidian ingestion note:
  ```bash
  npm run command -- "notebooklm-response-intelligence obsidian-note"
  ```
* Generate response intelligence summary:
  ```bash
  npm run command -- "notebooklm-response-intelligence summary"
  ```
* Run all intelligence processors in batch:
  ```bash
  npm run command -- "notebooklm-response-intelligence all"
  ```
* Print review status audit log summary:
  ```bash
  npm run command -- "notebooklm-response-intelligence status"
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

## 🎙️ Phase N5C: Local TTS Model Autoinstaller & Audio Cache Manager

The **Local TTS Model & Cache Manager** handles secure, offline registration, verification, and cleanup of the speech synthesis engine (Piper), voice models, config files, and audio cache assets.

### 🛡️ Safety & Execution Rules
1. **Offline-First / No Network:** Automatic downloads are disabled (`ALLOW_EXTERNAL_DOWNLOADS = false`). All assets must be manually staged and registered.
2. **No Execution on Verify/Register:** Binary files are verified strictly via SHA256 checksum calculations and whitelist rules. They are never executed during registration.
3. **Sandbox Isolation:** Models, configs, and binaries are stored inside separate folders under `outputs/narrator/tts_queue/`.
4. **Cache Clean Integrity:** The cleanup operation targets only files inside `rendered_audio/` cache. Manifests, models, binaries, and request files are never touched.
5. **Exact-Name Routing Gate:** Commands require exact matching (`narrator-tts-models`).

### 💻 Command Examples
* View model manager help commands:
  ```bash
  npm run command -- "narrator-tts-models-help"
  ```
* Print model manager status report:
  ```bash
  npm run command -- "narrator-tts-models status"
  ```
* Scan assets for unregistered or unsafe files:
  ```bash
  npm run command -- "narrator-tts-models scan"
  ```
* Verify registered SHA256 checksums:
  ```bash
  npm run command -- "narrator-tts-models verify"
  ```
* Register a local Piper binary:
  ```bash
  npm run command -- "narrator-tts-models register-binary <LOCAL_PATH>"
  ```
* Register local voice model and config files:
  ```bash
  npm run command -- "narrator-tts-models register-model <MODEL_PATH> <CONFIG_PATH>"
  ```
* View audio cache statistics:
  ```bash
  npm run command -- "narrator-tts-models cache-status"
  ```
* Dry-run audio cache cleanup simulation:
  ```bash
  npm run command -- "narrator-tts-models cache-clean-dry-run"
  ```
* Execute audio cache cleanup:
  ```bash
  npm run command -- "narrator-tts-models cache-clean-approved"
  ```

## 🧭 Phase N5D: Local ASR Command Listener

The **Local ASR Command Listener** provides safe, offline automatic speech recognition (ASR) to transcribe local audio command briefings, staging them as VNP command packets requiring manual verification before execution.

### 🛡️ Safety & Execution Rules
1. **Local-Only Transcription:** External cloud speech-to-text APIs are strictly disabled (`CLOUD_ASR_ENABLED = false`).
2. **Offline-First Intake:** Audio files must be placed within `outputs/narrator/asr/input_audio/` before scan or transcription.
3. **No Automatic Execution:** Transcribed commands are staged as packets and require manual approval. Execution is completely blocked.
4. **Exact-Name Routing Gate:** Operations require exact command matching (`narrator-asr-listener`).

### 💻 Command Examples
* View ASR help menu:
  ```bash
  npm run command -- "narrator-asr-listener-help"
  ```
* Print ASR status and queue counts:
  ```bash
  npm run command -- "narrator-asr-listener status"
  ```
* Scan intake directory for compatible audio:
  ```bash
  npm run command -- "narrator-asr-listener scan-inputs"
  ```
* Transcribe a staged audio file:
  ```bash
  npm run command -- "narrator-asr-listener transcribe outputs/narrator/tts_queue/rendered_audio/narrator_audio_2026-05-31_0801.mp3"
  ```
* Stage a VNP command packet:
  ```bash
  npm run command -- "narrator-asr-listener stage-command <TRANSCRIPT_ID>"
  ```
* Review proposed command details:
  ```bash
  npm run command -- "narrator-asr-listener review <TRANSCRIPT_ID>"
  ```
* Approve command packet (stages for manual CLI run):
  ```bash
  npm run command -- "narrator-asr-listener approve <TRANSCRIPT_ID>"
  ```
* Reject command packet:
  ```bash
  npm run command -- "narrator-asr-listener reject <TRANSCRIPT_ID>"
  ```
* Check queue metrics:
  ```bash
  npm run command -- "narrator-asr-listener queue-status"
  ```

## 🧭 Phase N5D.1: Local ASR Backend & Model Manager

The **Local ASR Backend & Model Manager** handles secure, offline registration, verification, and integrity auditing of local Whisper binaries and GGML models.

### 🛡️ Safety & Execution Rules
1. **Manual Staging Required:** Automatic internet downloads of binary executables are disabled.
2. **Checksum Verification:** Registered backend binaries and models are checked strictly via SHA256 checksums inside the `asr-checksum-manifest.json`.
3. **No Execution on Register:** Assets are read and verified but are never executed during registration.
4. **Exact-Name Routing Gate:** Operations require exact command matching (`narrator-asr-backend`).

### 💻 Command Examples
* View ASR backend help menu:
  ```bash
  npm run command -- "narrator-asr-backend-help"
  ```
* Print backend registration status report:
  ```bash
  npm run command -- "narrator-asr-backend status"
  ```
* Scan backend folder for unregistered assets:
  ```bash
  npm run command -- "narrator-asr-backend scan"
  ```
* Register a compiled local Whisper CLI backend binary to `bin/whisper`:
  ```bash
  npm run command -- "narrator-asr-backend register-backend <LOCAL_PATH>"
  ```
* Register a ggml model file to `local_assets/whisper_models/ggml-base.en.bin`:
  ```bash
  npm run command -- "narrator-asr-backend register-model <LOCAL_PATH>"
  ```
* Verify registered SHA256 checksums:
  ```bash
  npm run command -- "narrator-asr-backend verify"
  ```

---

## 🧭 Phase N5E: Voice Command Approval Bridge

The **Voice Command Approval Bridge** acts as an offline manual gate that validates and stages approved ASR packets, allowing controlled dispatch through the exact-name command router.

### 🛡️ Safety & Execution Rules
1. **Manual Run Gate:** Approved packets are never auto-executed; they require explicit operator validation, preparation, and execution steps.
2. **Strict Allowlist:** Executes only pre-approved exact-name script router actions. Bans shell operators, piping, and command injection.
3. **Freshness Checks:** Blocks validation for packets older than 24 hours.

### 💻 Command Examples
* View bridge help:
  ```bash
  npm run command -- "narrator-voice-bridge-help"
  ```
* Check queue status and safety:
  ```bash
  npm run command -- "narrator-voice-bridge status"
  ```
* Scan approved packets:
  ```bash
  npm run command -- "narrator-voice-bridge scan-approved"
  ```
* Inspect approved command details:
  ```bash
  npm run command -- "narrator-voice-bridge inspect <PACKET_ID>"
  ```
* Run validation checks:
  ```bash
  npm run command -- "narrator-voice-bridge validate <PACKET_ID>"
  ```
* Stage to ready queue:
  ```bash
  npm run command -- "narrator-voice-bridge prepare <PACKET_ID>"
  ```
* Check bridge queues depth:
  ```bash
  npm run command -- "narrator-voice-bridge bridge-queue-status"
  ```
* Execute prepared exact-name command:
  ```bash
  npm run command -- "narrator-voice-bridge execute-approved <PACKET_ID>"
  ```
* View execution audit log logs:
  ```bash
  npm run command -- "narrator-voice-bridge audit-log"
  ```

---

## 🧭 Phase N5F: Voice Loop Dashboard & Human Confirmation UI

The **Voice Loop Dashboard & Human Confirmation UI** provides central operators with status, overview, recent packets details, safety parameter validation audits, and manual run delegation triggers for local voice loop packets.

### 🛡️ Safety & Execution Rules
1. **Manual Checkpoint:** The dashboard functions only as a manual checkpoint. Always-on voice loop automation or live recording streams are blocked.
2. **Action Delegation:** For safety and modular checks, confirmation dispatches (prepare, execute, reject) are delegated back to the Voice Command Approval Bridge CLI.
3. **Audit Trails:** Every dispatcher trigger and delegation status updates are recorded in logs under `outputs/narrator/voice_loop_dashboard/logs/`.

### 💻 Command Examples
* View dashboard help menu:
  ```bash
  npm run command -- "narrator-voice-loop-dashboard-help"
  ```
* Show dashboard health and counts:
  ```bash
  npm run command -- "narrator-voice-loop-dashboard status"
  ```
* Print voice loop pipeline overview (Mermaid schema):
  ```bash
  npm run command -- "narrator-voice-loop-dashboard overview"
  ```
* List recent voice loop packets:
  ```bash
  npm run command -- "narrator-voice-loop-dashboard packets"
  ```
* Inspect packet execution detail:
  ```bash
  npm run command -- "narrator-voice-loop-dashboard packet-detail <PACKET_ID>"
  ```
* List packets waiting for operator confirm:
  ```bash
  npm run command -- "narrator-voice-loop-dashboard pending-confirmations"
  ```
* Run safety parameters configuration audit:
  ```bash
  npm run command -- "narrator-voice-loop-dashboard safety-status"
  ```
* Print stdout/stderr logs of the latest run execution:
  ```bash
  npm run command -- "narrator-voice-loop-dashboard latest-audit"
  ```
* Export markdown telemetry report:
  ```bash
  npm run command -- "narrator-voice-loop-dashboard export-summary"
  ```
* Delegate validation and staging to voice bridge:
  ```bash
  npm run command -- "narrator-voice-loop-dashboard confirm-prepare <PACKET_ID>"
  ```
* Delegate execution dispatch to voice bridge:
  ```bash
  npm run command -- "narrator-voice-loop-dashboard confirm-execute <PACKET_ID>"
  ```
* Delegate blocking rejection to voice bridge:
  ```bash
  npm run command -- "narrator-voice-loop-dashboard reject-packet <PACKET_ID>"
  ```

---

## 🧭 Phase N5G: Local Voice Session Recorder

The **Local Voice Session Recorder** handles offline session audio recording, metadata tracking, and ASR staging queues under strict local constraints.

### 🛡️ Safety & Execution Rules
1. **Manual Ingestion Gate:** Background listening or always-on microphone streaming is completely blocked.
2. **Double Recording Block:** The recorder creates a local lockfile (`recording.pid`) during capture to prevent overlapping recording processes.
3. **Exact-Name Routing Gate:** CLI triggers require exact naming (`narrator-voice-session-recorder`).

### 💻 Command Examples
* Show help menu:
  ```bash
  npm run command -- "narrator-voice-session-recorder-help"
  ```
* Check session recorder status:
  ```bash
  npm run command -- "narrator-voice-session-recorder status"
  ```
* Start a new recording session:
  ```bash
  npm run command -- "narrator-voice-session-recorder start-session <SESSION_NAME>"
  ```
* Stop the active recording session:
  ```bash
  npm run command -- "narrator-voice-session-recorder stop-session"
  ```
* Stage a recording for ASR:
  ```bash
  npm run command -- "narrator-voice-session-recorder stage-for-asr <SESSION_ID>"
  ```

---

## 🧭 Phase N5H: Voice Session to ASR Pipeline Orchestrator

The **Voice Session to ASR Pipeline Orchestrator** connects completed voice recordings to Whisper offline transcription, staging packet validation, and operator approval flows.

### 🛡️ Safety & Execution Rules
1. **Approval Boundaries:** The orchestrator stops at ASR approval; actual command executions are strictly bypassed and handled downstream.
2. **Duplicate Dispatch Lock:** Duplicate copies to the ASR queue are blocked via checksum or path uniqueness locks.
3. **Exact-Name Gating:** Fuzzy naming patterns or shortcuts are blocked at execution boundaries.

### 💻 Command Examples
* View orchestrator help:
  ```bash
  npm run command -- "narrator-voice-asr-orchestrator-help"
  ```
* View queue states and metrics:
  ```bash
  npm run command -- "narrator-voice-asr-orchestrator status"
  ```
* Dispatch a session to ASR:
  ```bash
  npm run command -- "narrator-voice-asr-orchestrator dispatch-asr <SESSION_ID>"
  ```
* Run transcription delegator:
  ```bash
  npm run command -- "narrator-voice-asr-orchestrator transcribe-session <SESSION_ID>"
  ```
* Stage transcript as VNP command:
  ```bash
  npm run command -- "narrator-voice-asr-orchestrator stage-transcript <SESSION_ID>"
  ```
* Approve command packet:
  ```bash
  npm run command -- "narrator-voice-asr-orchestrator approve-session-command <SESSION_ID>"
  ```

---

## 🧭 Phase N5I: Voice Command Lifecycle Audit Timeline

The **Voice Command Lifecycle Auditor** indexes files, metadata, and log logs to trace each voice command lifecycle from microphone recording ingestion to Whisper transcription, staging, approval, and execution status.

### 🛡️ Safety & Execution Rules
1. **Read-First Auditor:** Purely read-only; does not write or modify source artifacts.
2. **No Command Execution:** The auditor contains no script execution routes.
3. **Anomaly Alerts:** Automatically parses and flags blocked fuzzy attempts, blocked injections, or duplicate dispatches.

### 💻 Command Examples
* View lifecycle audit help:
  ```bash
  npm run command -- "narrator-voice-lifecycle-audit-help"
  ```
* Show auditor status and monitored paths:
  ```bash
  npm run command -- "narrator-voice-lifecycle-audit status"
  ```
* Scan pipeline directories and rebuild events cache:
  ```bash
  npm run command -- "narrator-voice-lifecycle-audit scan-events"
  ```
* Display timeline transition graph for a session:
  ```bash
  npm run command -- "narrator-voice-lifecycle-audit timeline <SESSION_ID>"
  ```
* Display overview mapping table of all session states:
  ```bash
  npm run command -- "narrator-voice-lifecycle-audit lifecycle-map"
  ```
* List safety warnings and blocked actions:
  ```bash
  npm run command -- "narrator-voice-lifecycle-audit safety-events"
  ```
* List successful executions:
  ```bash
  npm run command -- "narrator-voice-lifecycle-audit execution-events"
  ```
* List fuzzy routing blocks:
  ```bash
  npm run command -- "narrator-voice-lifecycle-audit blocked-events"
  ```
* Export latest session report:
  ```bash
  npm run command -- "narrator-voice-lifecycle-audit export-latest"
  ```
* Compile global audit summary:
  ```bash
  npm run command -- "narrator-voice-lifecycle-audit audit-summary"
  ```

---

## 🧭 Phase N5J: Voice Ops Daily Report Generator

The **Voice Ops Daily Report Generator** aggregates local voice pipeline activity, ASR transcription logs, safety blocks, and approvals to compile operating summaries for the current day or a specified calendar period.

### 🛡️ Safety & Execution Rules
1. **Read-Only Reporting:** Purely read-only; does not write or modify source artifacts (except compiling daily report files, logs, and dashboard JSON snapshots).
2. **Strict Exact-Name Routing:** All router commands require exact name matching; no aliases or fuzzy names are allowed.
3. **Redacted Previews:** Previews transcript strings for review but never executes them.

### 💻 Command Examples
* View daily report generator help:
  ```bash
  npm run command -- "narrator-voice-ops-daily-report-help"
  ```
* Check watched paths, report directory, safety flags, and latest report:
  ```bash
  npm run command -- "narrator-voice-ops-daily-report status"
  ```
* Generate today's markdown report:
  ```bash
  npm run command -- "narrator-voice-ops-daily-report generate"
  ```
* Generate a report for a specific calendar date YYYY-MM-DD:
  ```bash
  npm run command -- "narrator-voice-ops-daily-report generate-date YYYY-MM-DD"
  ```
* Print the path and content of the latest compiled report:
  ```bash
  npm run command -- "narrator-voice-ops-daily-report latest"
  ```
* List recent daily reports generated:
  ```bash
  npm run command -- "narrator-voice-ops-daily-report list-reports"
  ```
* Display safety violations and blocked attempts:
  ```bash
  npm run command -- "narrator-voice-ops-daily-report safety-summary"
  ```
* Display command staging, approval, and execution summary:
  ```bash
  npm run command -- "narrator-voice-ops-daily-report command-summary"
  ```
* Display voice recording session pipeline summary:
  ```bash
  npm run command -- "narrator-voice-ops-daily-report session-summary"
  ```
* Export small telemetry JSON snapshot for dashboard integration:
  ```bash
  npm run command -- "narrator-voice-ops-daily-report export-dashboard-snapshot"
  ```
* Print report generator compilation logs:
  ```bash
  npm run command -- "narrator-voice-ops-daily-report report-log"
  ```

---

## 🧭 Phase N5K: Voice Ops Scheduled Briefing Queue

The **Voice Ops Scheduled Briefing Queue** stages daily or manual briefing jobs from the Voice Ops report system into a controlled queue, requiring manual confirmation for approval and TTS request generation.

### 🛡️ Safety & Execution Rules
1. **Manual Gate Check**: Staging a job does not automatically generate audio, start recordings, or execute voice commands.
2. **Explicit Approval Gate**: An item in the queue must be explicitly transitioned to `approved` status before a TTS request can be compiled.
3. **No Automatic synthesis**: The `generate-tts-request` command only creates a TTS rendering queue request. The actual synthesis is deferred to the TTS Approval and Renderer Flow (N5A/N5B).
4. **Strict Exact-Name Routing**: All router commands require exact name matching; no aliases or fuzzy names are allowed.

### 💻 Command Examples
* View scheduled briefing help:
  ```bash
  npm run command -- "voice-ops-scheduled-briefing-help"
  ```
* Check queue health, safety flags, and pending count:
  ```bash
  npm run command -- "voice-ops-scheduled-briefing status"
  ```
* Stage today's daily briefing:
  ```bash
  npm run command -- "voice-ops-scheduled-briefing create-daily"
  ```
* Stage a briefing from a specific date report:
  ```bash
  npm run command -- "voice-ops-scheduled-briefing create-date YYYY-MM-DD"
  ```
* List all queued jobs:
  ```bash
  npm run command -- "voice-ops-scheduled-briefing list-queue"
  ```
* Inspect a specific briefing item's metadata and summary text:
  ```bash
  npm run command -- "voice-ops-scheduled-briefing inspect <BRIEFING_ID>"
  ```
* Approve a pending briefing item:
  ```bash
  npm run command -- "voice-ops-scheduled-briefing approve <BRIEFING_ID>"
  ```
* Reject a pending briefing item:
  ```bash
  npm run command -- "voice-ops-scheduled-briefing reject <BRIEFING_ID>"
  ```
* Generate a TTS render request for an approved briefing:
  ```bash
  npm run command -- "voice-ops-scheduled-briefing generate-tts-request <BRIEFING_ID>"
  ```
* Generate briefing queue metrics report summary:
  ```bash
  npm run command -- "voice-ops-scheduled-briefing queue-summary"
  ```
* View the latest briefing item details:
  ```bash
  npm run command -- "voice-ops-scheduled-briefing latest"
  ```
* Print recent briefing events:
  ```bash
  npm run command -- "voice-ops-scheduled-briefing briefing-log"
  ```

---

## 🧭 Phase N5L: Briefing TTS Render Approval Flow

The **Briefing TTS Render Approval Flow** processes and validates briefing TTS render requests from the scheduled briefing queue, submits them to the main TTS queue, and handles manual approval and local Piper rendering.

### 🛡️ Safety & Execution Rules
1. **Manual Approval Gate**: Staging or submitting requests to the queue does not trigger automatic audio generation. Synthesis is blocked until the operator manually approves the request.
2. **Offline Local Synthesis**: All voice rendering is handled locally via the Piper TTS engine using registered offline model assets. External Cloud TTS APIs are disabled.
3. **No Automatic Playback**: Rendered audio remains silent and local. No player subprocesses are executed.

### 💻 Command Examples
* View briefing TTS render approval help:
  ```bash
  npm run command -- "briefing-tts-render-approval-help"
  ```
* Check flow safety flags, paths, and status counters:
  ```bash
  npm run command -- "briefing-tts-render-approval status"
  ```
* Scan generated briefing TTS request packets:
  ```bash
  npm run command -- "briefing-tts-render-approval scan-tts-requests"
  ```
* Inspect details of a specific briefing TTS request:
  ```bash
  npm run command -- "briefing-tts-render-approval inspect briefing_YYYY-MM-DD"
  ```
* Validate briefing approval status, text length, and formatting:
  ```bash
  npm run command -- "briefing-tts-render-approval validate briefing_YYYY-MM-DD"
  ```
* Submit the briefing TTS request to the Narrator TTS queue:
  ```bash
  npm run command -- "briefing-tts-render-approval submit-to-tts-queue briefing_YYYY-MM-DD"
  ```
* Authorize a submitted request for rendering:
  ```bash
  npm run command -- "briefing-tts-render-approval approve-tts-request briefing_YYYY-MM-DD"
  ```
* Render the approved request to local audio using Piper:
  ```bash
  npm run command -- "briefing-tts-render-approval render-approved briefing_YYYY-MM-DD"
  ```
* Track the trace state of a briefing rendering item:
  ```bash
  npm run command -- "briefing-tts-render-approval render-status briefing_YYYY-MM-DD"
  ```
* Compile queue performance metrics into a markdown report:
  ```bash
  npm run command -- "briefing-tts-render-approval queue-summary"
  ```
* Print recent briefing rendering event logs:
  ```bash
  npm run command -- "briefing-tts-render-approval render-log"
  ```

---

## 🧭 Phase N5M: Briefing Audio Playback Review Gate

The **Briefing Audio Playback Review Gate** provides a safe, offline, local-first review workflow for rendered briefing audio files. It allows operators to inspect audio metadata, register files in the review queue, mark them as human-reviewed, and manually approve or reject them.

### 🛡️ Safety & Execution Rules
1. **No Autoplay Policy**: Audio files are never played automatically during scanning, enqueuing, or inspection. All media player subprocess launches are strictly blocked.
2. **Offline Integrity**: Staged audio remains local and is never uploaded, published, or broadcast to cloud endpoints.
3. **Approval Dependency**: Audio files cannot be approved unless they have first been flagged as reviewed via the `mark-reviewed` command.
4. **Reversible Rejections**: Rejecting an audio file flags it as rejected in the logs but does not delete the source file by default.

### 💻 Command Examples
* View review gate help menu:
  ```bash
  npm run command -- "briefing-audio-playback-review-help"
  ```
* Check safety flags, paths, and review state counters:
  ```bash
  npm run command -- "briefing-audio-playback-review status"
  ```
* Scan and list discovered rendered audio files:
  ```bash
  npm run command -- "briefing-audio-playback-review scan-rendered"
  ```
* Inspect metadata details of a specific audio file:
  ```bash
  npm run command -- "briefing-audio-playback-review inspect briefing_YYYY-MM-DD"
  ```
* Register an audio file into the review queue:
  ```bash
  npm run command -- "briefing-audio-playback-review queue-review briefing_YYYY-MM-DD"
  ```
* Flag enqueued audio as reviewed by the operator:
  ```bash
  npm run command -- "briefing-audio-playback-review mark-reviewed briefing_YYYY-MM-DD"
  ```
* Approve reviewed audio:
  ```bash
  npm run command -- "briefing-audio-playback-review approve-audio briefing_YYYY-MM-DD"
  ```
* Reject enqueued audio:
  ```bash
  npm run command -- "briefing-audio-playback-review reject-audio briefing_YYYY-MM-DD"
  ```
* View the detailed review status of an item:
  ```bash
  npm run command -- "briefing-audio-playback-review review-status briefing_YYYY-MM-DD"
  ```
* Compile review statistics into a markdown report:
  ```bash
  npm run command -- "briefing-audio-playback-review review-summary"
  ```
* Show recent review gate logs:
  ```bash
  npm run command -- "briefing-audio-playback-review review-log"
  ```

---

## 🧭 Phase N5N: Briefing Delivery Package Exporter

The **Briefing Delivery Package Exporter** is a safe, offline local packaging service. It is designed to package approved briefing audio, source daily reports, playback review reports, manifests, and manual delivery notes into a standardized delivery folder.

### 🛡️ Safety Boundaries & Gate Rules
1. **No Automated Delivery**: The exporter is configured strictly for local archiving and staging. It will not send, upload, publish, or email packages automatically.
2. **Approved Audio Enforcement**: The exporter requires that an audio file be marked as approved via Phase N5M review gate before a delivery package can be created.
3. **Idempotency & Duplicate Protection**: Duplicate package creation attempts are blocked to prevent data collision.
4. **Integrity Validation**: SHA256 cryptographic checksums are computed for all files within the delivery folder and verified against a generated package manifest.

### 💻 Command Examples
* View delivery exporter help menu:
  ```bash
  npm run command -- "briefing-delivery-package-exporter-help"
  ```
* Check safety flags, paths, and packaging state counters:
  ```bash
  npm run command -- "briefing-delivery-package-exporter status"
  ```
* Scan and list approved briefing audio files available for packaging:
  ```bash
  npm run command -- "briefing-delivery-package-exporter scan-approved-audio"
  ```
* Inspect metadata and check packaging eligibility:
  ```bash
  npm run command -- "briefing-delivery-package-exporter inspect briefing_YYYY-MM-DD"
  ```
* Create local delivery package folder:
  ```bash
  npm run command -- "briefing-delivery-package-exporter create-package briefing_YYYY-MM-DD"
  ```
* View lifecycle status and details of a package:
  ```bash
  npm run command -- "briefing-delivery-package-exporter package-status delivery_package_briefing_YYYY-MM-DD"
  ```
* List all generated package directories:
  ```bash
  npm run command -- "briefing-delivery-package-exporter list-packages"
  ```
* Print the latest package info:
  ```bash
  npm run command -- "briefing-delivery-package-exporter latest"
  ```
* Verify file integrity and checksums of a package:
  ```bash
  npm run command -- "briefing-delivery-package-exporter verify-package delivery_package_briefing_YYYY-MM-DD"
  ```
* Print package manifest content:
  ```bash
  npm run command -- "briefing-delivery-package-exporter export-manifest delivery_package_briefing_YYYY-MM-DD"
  ```
* Compile delivery statistics into a report:
  ```bash
  npm run command -- "briefing-delivery-package-exporter delivery-summary"
  ```
* Show recent exporter log events:
  ```bash
  npm run command -- "briefing-delivery-package-exporter exporter-log"
  ```

---

## 🧭 Phase N5O: Manual Delivery Checklist and Handoff Log

The **Manual Delivery Checklist and Handoff Log** is a human verification gate. It requires that a local delivery package be inspected, checked off against a 12-item compliance list, and signed off with the human signer's name and note before the package is eligible for manual distribution.

### 🛡️ Safety Boundaries & Gate Rules
1. **Zero Auto-Distribution**: The handoff script records handoffs locally. It will not send, upload, publish, email, or auto-open external sharing applications.
2. **Checksum Integrity Enforcement**: All checklist validation procedures require that SHA256 checksums match the package manifest file.
3. **Checklist Sign-Off Verification**: A package handoff cannot be approved until all 12 checklist verification items are marked complete.
4. **Non-Destructive Logging**: Handoff rejections are recorded in a separate rejected log folder without deleting or modifying any package files.

### 💻 Command Examples
* View manual handoff help menu:
  ```bash
  npm run command -- "manual-delivery-handoff-help"
  ```
* Check safety flags, package counts, checklist counts, and handoffs:
  ```bash
  npm run command -- "manual-delivery-handoff status"
  ```
* List local delivery packages available from Phase N5N:
  ```bash
  npm run command -- "manual-delivery-handoff scan-packages"
  ```
* Inspect package path, manifest status, checksums, and eligibility:
  ```bash
  npm run command -- "manual-delivery-handoff inspect delivery_package_briefing_YYYY-MM-DD"
  ```
* Initialize a manual checklist for a package:
  ```bash
  npm run command -- "manual-delivery-handoff create-checklist delivery_package_briefing_YYYY-MM-DD"
  ```
* Display completion status of required checklist items:
  ```bash
  npm run command -- "manual-delivery-handoff checklist-status delivery_package_briefing_YYYY-MM-DD"
  ```
* Mark a specific checklist item complete:
  ```bash
  npm run command -- "manual-delivery-handoff mark-item delivery_package_briefing_YYYY-MM-DD <ITEM_ID>"
  ```
* Approve the handoff of a package (requires checklist completion):
  ```bash
  npm run command -- "manual-delivery-handoff approve-handoff delivery_package_briefing_YYYY-MM-DD --signer \"<NAME>\" --note \"<NOTE>\""
  ```
* Record rejection of a handoff:
  ```bash
  npm run command -- "manual-delivery-handoff reject-handoff delivery_package_briefing_YYYY-MM-DD --signer \"<NAME>\" --note \"<NOTE>\""
  ```
* Show handoff and checklist status of a single package:
  ```bash
  npm run command -- "manual-delivery-handoff handoff-status delivery_package_briefing_YYYY-MM-DD"
  ```
* List all historical approved and rejected handoffs:
  ```bash
  npm run command -- "manual-delivery-handoff list-handoffs"
  ```
* Show the most recent handoff record context:
  ```bash
  npm run command -- "manual-delivery-handoff latest"
  ```
* Generate global statistics and summaries report:
  ```bash
  npm run command -- "manual-delivery-handoff handoff-summary"
  ```
* Display the last 20 events from the handoff log:
  ```bash
  npm run command -- "manual-delivery-handoff handoff-log"
  ```

---

## 🧭 Phase N5P: Delivery Archive and Retention Ledger

The **Delivery Archive and Retention Ledger** system registers approved manual handoff records, builds a local archive index, traces chain of custody trails, verifies cryptographic file checksums over time, and generates retention policy warning audits without deleting files automatically.

### 🛡️ Safety Boundaries & Gate Rules
1. **Zero Auto-Deletion**: The archiving script compiles reviews and recommendations but must never delete any files. Deletions remain strictly manual-first.
2. **Local Preservation**: Archived packages are recorded as metadata-first ledger items, preserving the original folder contents without alterations.
3. **No Automatic Distribution**: Auto-send, auto-upload, and auto-publish configurations remain disabled to maintain system sovereignty.
4. **Handoff Approval Enforce**: Packages are blocked from archiving unless they have passed the handoff checklist gate.

### 💻 Command Examples
* View archive manager help menu:
  ```bash
  npm run command -- "delivery-archive-retention-help"
  ```
* Check safety flags, approved handoffs, and archive counts:
  ```bash
  npm run command -- "delivery-archive-retention status"
  ```
* List approved handoff records available for archiving:
  ```bash
  npm run command -- "delivery-archive-retention scan-handoffs"
  ```
* Inspect approved handoff metadata and verify archive eligibility:
  ```bash
  npm run command -- "delivery-archive-retention inspect-handoff delivery_package_briefing_YYYY-MM-DD"
  ```
* Ingest an approved handoff into the retention ledger:
  ```bash
  npm run command -- "delivery-archive-retention archive-record delivery_package_briefing_YYYY-MM-DD"
  ```
* View lifecycle status and custody history of an archived package:
  ```bash
  npm run command -- "delivery-archive-retention ledger-status delivery_package_briefing_YYYY-MM-DD"
  ```
* List all registered ledger records:
  ```bash
  npm run command -- "delivery-archive-retention list-archive"
  ```
* Verify manifest references and file checksums for an archive entry:
  ```bash
  npm run command -- "delivery-archive-retention verify-archive delivery_package_briefing_YYYY-MM-DD"
  ```
* Scan for packages approaching or exceeding policy retention warning limits:
  ```bash
  npm run command -- "delivery-archive-retention retention-review"
  ```
* Log a manual retention extension audit review:
  ```bash
  npm run command -- "delivery-archive-retention mark-retention-reviewed delivery_package_briefing_YYYY-MM-DD --signer \"<NAME>\" --note \"<NOTE>\""
  ```
* Compile and write unified ledger data exports:
  ```bash
  npm run command -- "delivery-archive-retention export-ledger"
  ```
* Print the latest archive ledger entry:
  ```bash
  npm run command -- "delivery-archive-retention latest"
  ```
* Compile stats and generate archiving summary report:
  ```bash
  npm run command -- "delivery-archive-retention archive-summary"
  ```
* Display the last 20 events from the retention log:
  ```bash
  npm run command -- "delivery-archive-retention archive-log"
  ```

---

## 🧭 Phase N5Q: Voice Ops Release Closure Report

The **Voice Ops Release Closure Report** compiles completion logs, indexes deliverables, and audits system safety parameters across the entire voice pipeline (N5A through N5P).

### CLI Command List
* Show help menu:
  ```bash
  npm run command -- "voice-ops-release-closure-help"
  ```
* Show closure status, safety flags, and detected phases:
  ```bash
  npm run command -- "voice-ops-release-closure status"
  ```
* Scan registries for phase completions:
  ```bash
  npm run command -- "voice-ops-release-closure scan-phases"
  ```
* Index deliverables:
  ```bash
  npm run command -- "voice-ops-release-closure artifact-index"
  ```
* Audit safety parameters:
  ```bash
  npm run command -- "voice-ops-release-closure safety-rollup"
  ```
* Compile CLI commands:
  ```bash
  npm run command -- "voice-ops-release-closure command-registry-summary"
  ```
* Summarize dashboard build:
  ```bash
  npm run command -- "voice-ops-release-closure dashboard-summary"
  ```
* Summarize archive ledger metrics:
  ```bash
  npm run command -- "voice-ops-release-closure archive-retention-summary"
  ```
* Generate final release closure report:
  ```bash
  npm run command -- "voice-ops-release-closure generate-report"
  ```
* Show latest report:
  ```bash
  npm run command -- "voice-ops-release-closure latest"
  ```
* List generated closure reports:
  ```bash
  npm run command -- "voice-ops-release-closure list-reports"
  ```
* Verify section presence:
  ```bash
  npm run command -- "voice-ops-release-closure verify-closure"
  ```
* View last 20 closure events:
  ```bash
  npm run command -- "voice-ops-release-closure closure-log"
  ```

---

## 🧭 Phase N5R: Voice Ops Freeze Tag and Recovery Snapshot

The **Voice Ops Freeze Tag and Recovery Snapshot** system captures the current stable Voice Ops release state, creates local freeze tags, maps snapshot manifests of source scripts and deliverables with SHA256 checksums, and compiles recovery checklists for restoration.

### CLI Command List
* Show help menu:
  ```bash
  npm run command -- "voice-ops-freeze-snapshot-help"
  ```
* Show snapshot status, safety flags, and detected snapshot info:
  ```bash
  npm run command -- "voice-ops-freeze-snapshot status"
  ```
* Scan release state:
  ```bash
  npm run command -- "voice-ops-freeze-snapshot scan-release"
  ```
* Create local freeze tag record:
  ```bash
  npm run command -- "voice-ops-freeze-snapshot create-freeze-tag"
  ```
* Export MD and JSON snapshot manifests:
  ```bash
  npm run command -- "voice-ops-freeze-snapshot snapshot-manifest"
  ```
* Generate markdown recovery checklist:
  ```bash
  npm run command -- "voice-ops-freeze-snapshot recovery-checklist"
  ```
* Verify snapshot manifest files and integrity:
  ```bash
  npm run command -- "voice-ops-freeze-snapshot verify-snapshot"
  ```
* List existing snapshots:
  ```bash
  npm run command -- "voice-ops-freeze-snapshot list-snapshots"
  ```
* Show the latest freeze snapshot:
  ```bash
  npm run command -- "voice-ops-freeze-snapshot latest"
  ```
* Generate global statistics and summaries report:
  ```bash
  npm run command -- "voice-ops-freeze-snapshot freeze-summary"
  ```
* View recent freeze events:
  ```bash
  npm run command -- "voice-ops-freeze-snapshot freeze-log"
  ```

---

## 🧭 Phase N5S: Voice Ops Post-Freeze Health Monitor

The **Voice Ops Post-Freeze Health Monitor** checks whether the frozen stable Voice Ops release remains intact and functional. It monitors checksums, drift, exact-name command registries, Vite dashboard integrations, and safety configurations.

### CLI Command List
* Show help menu:
  ```bash
  npm run command -- "voice-ops-post-freeze-health-help"
  ```
* Show health status, safety flags, and latest diagnostic verdict:
  ```bash
  npm run command -- "voice-ops-post-freeze-health status"
  ```
* Scan freeze snapshot files presence:
  ```bash
  npm run command -- "voice-ops-post-freeze-health scan-freeze"
  ```
* Audit reference checksum matches for codebase file drift:
  ```bash
  npm run command -- "voice-ops-post-freeze-health verify-checksums"
  ```
* Verify npm scripts, Taskfile tasks, and exact-name configs:
  ```bash
  npm run command -- "voice-ops-post-freeze-health registry-health"
  ```
* Check dashboard bundle index, telemetry dataset, and panels:
  ```bash
  npm run command -- "voice-ops-post-freeze-health dashboard-health"
  ```
* Verify safety config flags and no-restore/no-execute locks:
  ```bash
  npm run command -- "voice-ops-post-freeze-health safety-health"
  ```
* Generate a detailed drift analysis report:
  ```bash
  npm run command -- "voice-ops-post-freeze-health drift-report"
  ```
* Run all health diagnostics checks and save the full markdown report:
  ```bash
  npm run command -- "voice-ops-post-freeze-health run-health-check"
  ```
* Print path of the latest health report:
  ```bash
  npm run command -- "voice-ops-post-freeze-health latest"
  ```
* List registered health diagnostic reports:
  ```bash
  npm run command -- "voice-ops-post-freeze-health list-reports"
  ```
* Print latest health report summary:
  ```bash
  npm run command -- "voice-ops-post-freeze-health health-summary"
  ```
* View recent health monitor logged events:
  ```bash
  npm run command -- "voice-ops-post-freeze-health health-log"
  ```

---

## 🧭 Phase N5T: Voice Ops Maintenance Mode Scheduler

The **Voice Ops Maintenance Mode Scheduler** stages manual-first recurring maintenance tasks for post-freeze health checkups, dashboard telemetry rebuilds, release closure reviews, and archive ledgers. It creates checklists and recommends troubleshooting commands but never runs them automatically, preserving strict post-freeze security boundaries.

### CLI Command List
* Show help menu:
  ```bash
  npm run command -- "voice-ops-maintenance-scheduler-help"
  ```
* Show scheduler status, paths, safety flags, and queue metrics:
  ```bash
  npm run command -- "voice-ops-maintenance-scheduler status"
  ```
* Stage a weekly maintenance checklist job:
  ```bash
  npm run command -- "voice-ops-maintenance-scheduler create-weekly"
  ```
* Stage a daily lightweight checklist job:
  ```bash
  npm run command -- "voice-ops-maintenance-scheduler create-daily"
  ```
* Stage a manual post-freeze health check job:
  ```bash
  npm run command -- "voice-ops-maintenance-scheduler create-health-check"
  ```
* Stage a manual dashboard refresh & build job:
  ```bash
  npm run command -- "voice-ops-maintenance-scheduler create-dashboard-refresh"
  ```
* Stage a manual archive retention review job:
  ```bash
  npm run command -- "voice-ops-maintenance-scheduler create-retention-review"
  ```
* Stage a manual known drift inspection job:
  ```bash
  npm run command -- "voice-ops-maintenance-scheduler create-drift-review"
  ```
* List all pending, approved, rejected, and completed jobs:
  ```bash
  npm run command -- "voice-ops-maintenance-scheduler list-queue"
  ```
* Inspect job details, recommended commands, and risk level:
  ```bash
  npm run command -- "voice-ops-maintenance-scheduler inspect <JOB_ID>"
  ```
* Approve a pending job for manual execution:
  ```bash
  npm run command -- "voice-ops-maintenance-scheduler approve <JOB_ID>"
  ```
* Reject a pending job:
  ```bash
  npm run command -- "voice-ops-maintenance-scheduler reject <JOB_ID>"
  ```
* Sign off and record human completion of a job:
  ```bash
  npm run command -- "voice-ops-maintenance-scheduler mark-complete <JOB_ID> --signer \"<NAME>\" --note \"<NOTE>\""
  ```
* Compile and write a markdown summary report of all jobs:
  ```bash
  npm run command -- "voice-ops-maintenance-scheduler maintenance-summary"
  ```
* Print path/contents of the latest job:
  ```bash
  npm run command -- "voice-ops-maintenance-scheduler latest"
  ```
* Print recent scheduler activity log events:
  ```bash
  npm run command -- "voice-ops-maintenance-scheduler scheduler-log"
  ```

---

## 🧭 Phase N5U: Voice Ops Operator Runbook

The **Voice Ops Operator Runbook** compiles system purpose, operational boundaries, daily and weekly verification checklists, workflow mappings, and emergency stop guidelines into a unified local reference system. It provides operator-facing reference utilities and prints procedurals but never interacts with or executes pipeline actions.

### CLI Command List
* Show help menu:
  ```bash
  npm run command -- "voice-ops-operator-runbook-help"
  ```
* Show runbook paths, sources, and safety configurations:
  ```bash
  npm run command -- "voice-ops-operator-runbook status"
  ```
* Compile and write the full master operator runbook:
  ```bash
  npm run command -- "voice-ops-operator-runbook generate"
  ```
* Print and save the grouped CLI command index:
  ```bash
  npm run command -- "voice-ops-operator-runbook command-index"
  ```
* Print and save the core safety guidelines:
  ```bash
  npm run command -- "voice-ops-operator-runbook safety-checklist"
  ```
* Print and save the daily operator routine checklist:
  ```bash
  npm run command -- "voice-ops-operator-runbook daily-checklist"
  ```
* Print and save the weekly operator audit checklist:
  ```bash
  npm run command -- "voice-ops-operator-runbook weekly-checklist"
  ```
* Print and save the step-by-step workflow maps:
  ```bash
  npm run command -- "voice-ops-operator-runbook workflow-map"
  ```
* Print and save the troubleshooting response matrix:
  ```bash
  npm run command -- "voice-ops-operator-runbook troubleshooting"
  ```
* Print and save the emergency stop protocol guide:
  ```bash
  npm run command -- "voice-ops-operator-runbook emergency-stop"
  ```
* Print outline of the latest generated runbook:
  ```bash
  npm run command -- "voice-ops-operator-runbook latest"
  ```
* List all compiled runbooks:
  ```bash
  npm run command -- "voice-ops-operator-runbook list-runbooks"
  ```
* Generate and print a runbook summary report:
  ```bash
  npm run command -- "voice-ops-operator-runbook runbook-summary"
  ```
* Print recent runbook activity log events:
  ```bash
  npm run command -- "voice-ops-operator-runbook runbook-log"
  ```

---

## 🧭 Phase N5V: Voice Ops Operator Training Simulation Pack

The **Voice Ops Operator Training Simulation Pack** provides automated mock scenarios to certify voice operations crew. It tracks scenarios like system drift, exact-name command bypass attempts, and emergency shutdown drills.

### 💻 Command Examples
* View training simulation help:
  ```bash
  npm run command -- "voice-ops-training-simulation-help"
  ```
* Run training status checks:
  ```bash
  npm run command -- "voice-ops-training-simulation status"
  ```

---

## 🧭 Phase N5W: Operator Certification Ledger

The **Operator Certification Ledger** registers certification credentials, safety grades, scenario completion score sheets, and issues tamper-proof local safety certificates.

### 💻 Command Examples
* View certification help menu:
  ```bash
  npm run command -- "voice-ops-certification-ledger-help"
  ```
* List safety certificates:
  ```bash
  npm run command -- "voice-ops-certification-ledger status"
  ```

---

## 🧭 Phase N5X: Operator Recertification and Drill Rotation Scheduler

The **Operator Recertification and Drill Rotation Scheduler** tracks expiry dates, schedules drill rotations across categories, stages renewal plans, and compiles compliance metrics.

### 💻 Command Examples
* View recertification help menu:
  ```bash
  npm run command -- "voice-ops-recertification-scheduler-help"
  ```
* Check recertification scheduler status:
  ```bash
  npm run command -- "voice-ops-recertification-scheduler status"
  ```

---

## 🧭 Phase N5Y: Voice Ops Final System Index

The **Voice Ops Final System Index** compiles the master index mapping modules, commands, reports, dashboard panels, and safety policies from N5A through N5X.

### 💻 Command Examples
* View system index help menu:
  ```bash
  npm run command -- "voice-ops-final-system-index-help"
  ```
* Check system index status:
  ```bash
  npm run command -- "voice-ops-final-system-index status"
  ```
* Generate master index files:
  ```bash
  npm run command -- "voice-ops-final-system-index generate-index"
  ```

---

## 🧭 Phase N5Z: Final Voice Ops Acceptance Packet

The **Final Voice Ops Acceptance Packet** builds, validates, and signs off on the Voice Ops chain (N5A through N5Y) locally and offline.

### 💻 Command Examples
* View acceptance help menu:
  ```bash
  npm run command -- "voice-ops-final-acceptance-help"
  ```
* Check acceptance status:
  ```bash
  npm run command -- "voice-ops-final-acceptance status"
  ```
* Generate final acceptance packet:
  ```bash
  npm run command -- "voice-ops-final-acceptance generate-packet"
  ```

---

## 🧭 Phase 11M: NotebookLM MCP Live Adapter Integration

The **NotebookLM MCP Live Adapter Integration** establishes a safe, offline-gated live query preparation, query execution, and manual answers staging runbooks.

### 🛡️ Safety & Execution Rules
1. **Restricted Execution:** No active network queries or server connections are run automatically.
2. **Offline Fallback:** If live adapter is not authorized, falls back to manual answers files.

### 💻 Command Examples
* View live adapter help menu:
  ```bash
  npm run command -- "notebooklm-mcp-live-help"
  ```
* View live adapter status:
  ```bash
  npm run command -- "notebooklm-mcp-live status"
  ```

---

## 🧭 Phase 11N: Live Response Intelligence Processor

The **Live Response Intelligence Processor** is a safe, local, offline layer designed to ingest normalized NotebookLM response markdown files and convert them into structured, actionable intelligence cards, maps, suggestions, and staged notes.

### 🛡️ Safety & Execution Rules
1. **Response-Only Processing:** This script only reads local, pre-saved response files.
2. **No Direct Obsidian Writes:** Staged markdown notes are written under `outputs/notebooklm_bridge/response_intelligence/` for manual review first.
3. **No External APIs:** The processor must never make external API calls.
4. **Exact-Name Execution Gateway:** Enforces exact-name matching. Execution via registered aliases (such as "response intelligence") is blocked at runtime.

### 💻 Command Examples
* View response intelligence help menu:
  ```bash
  npm run command -- "notebooklm-response-intelligence-help"
  ```
* Run all processors sequentially:
  ```bash
  npm run command -- "notebooklm-response-intelligence all"
  ```
* Print processor file path status summaries:
  ```bash
  npm run command -- "notebooklm-response-intelligence status"
  ```

---

## 🧭 Phase 11O: Grounded Intelligence Index Graph

The **Grounded Intelligence Index Graph** compiles and links all response intelligence outputs (citation maps, workflows, weak claims, module recommendations, prompt pack ideas, and staged Obsidian notes) into a unified, traceable local network graph.

### 🛡️ Safety & Execution Rules
1. **Local-Only Graph:** Node relations are built entirely offline from local Markdown outputs.
2. **No Vector DB Writes:** No external vector database or indexer (like Pinecone or Chroma) is called yet.
3. **No External APIs:** No embedding generation APIs or external network calls are allowed.
4. **No Obsidian Writes:** Staged Markdown graphs are kept under `outputs/` for review first.
5. **Timestamp Suffix Preservation:** Existing graph files are never overwritten without a timestamp suffix.
6. **Exact-Name Execution Gateway:** Enforces exact-name matching. Execution via registered aliases is blocked at runtime.

### 💻 Command Examples
* View grounded index help menu:
  ```bash
  npm run command -- "notebooklm-grounded-index-graph-help"
  ```
* Compile graph files:
  ```bash
  npm run command -- "notebooklm-grounded-index-graph build"
  ```
* Compile graph files in dry-run simulation mode:
  ```bash
  npm run command -- "notebooklm-grounded-index-graph build --dry-run"
  ```
* Generate graph statistics report:
  ```bash
  npm run command -- "notebooklm-grounded-index-graph report"
  ```
* Inspect latest graph structure:
  ```bash
  npm run command -- "notebooklm-grounded-index-graph inspect latest"
  ```

---

## 🧭 Phase 11M: NotebookLM MCP Live Adapter Integration

The **NotebookLM MCP Live Adapter Integration** establishes a safe, offline-gated live query preparation, query execution, and manual answers staging runbooks.

### 🛡️ Safety & Execution Rules
1. **Restricted Execution:** No active network queries or server connections are run automatically.
2. **Offline Fallback:** If live adapter is not authorized, falls back to manual answers files.

### 💻 Command Examples
* View live adapter help menu:
  ```bash
  npm run command -- "notebooklm-mcp-live-help"
  ```
* View live adapter status:
  ```bash
  npm run command -- "notebooklm-mcp-live status"
  ```

---

## 🧭 Phase 11N: Live Response Intelligence Processor

The **Live Response Intelligence Processor** is a safe, local, offline layer designed to ingest normalized NotebookLM response markdown files and convert them into structured, actionable intelligence cards, maps, suggestions, and staged notes.

### 🛡️ Safety & Execution Rules
1. **Response-Only Processing:** This script only reads local, pre-saved response files.
2. **No Direct Obsidian Writes:** Staged markdown notes are written under `outputs/notebooklm_bridge/response_intelligence/` for manual review first.
3. **No External APIs:** The processor must never make external API calls.
4. **Exact-Name Execution Gateway:** Enforces exact-name matching. Execution via registered aliases (such as "response intelligence") is blocked at runtime.

### 💻 Command Examples
* View response intelligence help menu:
  ```bash
  npm run command -- "notebooklm-response-intelligence-help"
  ```
* Run all processors sequentially:
  ```bash
  npm run command -- "notebooklm-response-intelligence all"
  ```
* Print processor file path status summaries:
  ```bash
  npm run command -- "notebooklm-response-intelligence status"
  ```

---

## 🧭 Phase 11P-A: Obsidian Intelligence Dashboard Sync

The **Obsidian Intelligence Dashboard Sync** reads the grounded index graph and populates 7 interconnected, local-first markdown dashboards. These dashboards contain checklists, metadata fields, and Obsidian backlinks to help developers audit claims and recommendations before compiling narrator files.

### 🛡️ Safety & Execution Rules
1. **Staged-Only Mode:** All files are staged under the repository's output directory. Auto-writing directly to Obsidian vaults remains off by default.
2. **Backlink Integrity:** Wikilinks use standard Obsidian backlinks `[[note-name]]` referencing local markdown nodes.

### 💻 Command Examples
* View dashboard sync help:
  ```bash
  npm run command -- "notebooklm-obsidian-dashboard-sync-help"
  ```
* Populate Obsidian dashboards:
  ```bash
  npm run command -- "notebooklm-obsidian-dashboard-sync"
  ```

---

## 🧭 Phase 11P-B: Grounded Narrator Review Queue

The **Grounded Narrator Review Queue** compiles safe, citation-aware narration briefs from Obsidian dashboards and index graphs. It acts as a safety validation layer that filters out weak claims or uncited topics.

### 🛡️ Safety & Execution Rules
1. **Review-Only Mode:** Narrator briefs are compiled with review checklists and default to `approved_for_voice: false`. No audio files are generated.
2. **No TTS Generation:** Outbound TTS API requests and Piper audio synthesizer execution are strictly disabled.

### 💻 Command Examples
* View review queue compiler help:
  ```bash
  npm run command -- "grounded-narrator-review-queue-help"
  ```
* Compile narration candidate queue:
  ```bash
  npm run command -- "grounded-narrator-review-queue"
  ```

---

## 🧭 Phase R2: Git Asset Guard and Pre-Push Safety Audit

The **Git Asset Guard and Pre-Push Safety Audit** prevents future repository instability by scanning, auditing, and reporting forbidden folders, extensions, sensitive files, large files, and merge conflict markers locally before pushing to remote origin.

### 🛡️ Safety & Execution Rules
1. **No Local Deletions:** Violations are scanned and reported but never deleted from the working tree automatically.
2. **No Force Pushes:** Bypassing repository safety standards via force push is strictly prohibited.
3. **Safe Command Gate:** Direct interaction with audits remains structured under the Safe Command Router.

### 💻 Command Examples
* View policy details and safe commands:
  ```bash
  npm run command -- "git-asset-help"
  ```
* Scan the repository for tracking violations:
  ```bash
  npm run command -- "git-asset-audit"
  ```
* Run the sequential pre-push safety pipeline:
  ```bash
  npm run command -- "git-prepush-check"
  ```

---

## 🧭 Phase 11Q: Voice-Safe Narration Approval Gate

The **Voice-Safe Narration Approval Gate** enforces a strict validation layer that prevents unapproved, weak, uncited, risky, or review-required narrator blocks from passing into any TTS or voice generation workflow. No block can proceed without manual operator sign-off and explicit verification.

### 🛡️ Safety & Execution Rules
1. **Validation-Only Mode:** Script checks and staging only. No audio files are generated, and no TTS services are invoked.
2. **Fail Closed Policy:** Missing properties, unapproved review flags, weak claims, or uncited topics are automatically rejected.
3. **Local Staging:** Approved and rejected manifests are stored locally under structured directories.

### 💻 Command Examples
* View approval gate help menu:
  ```bash
  npm run command -- "voice-safe-narration-approval-gate-help"
  ```
* Execute validation and compile manifests:
  ```bash
  npm run command -- "voice-safe-narration-approval-gate"
  ```
* Execute validation with test approval override for a block:
  ```bash
  npm run command -- "voice-safe-narration-approval-gate check --test-approve narrator_block_3"
  ```
* Run a validation simulation in dry-run mode:
  ```bash
  npm run command -- "voice-safe-narration-approval-gate check --dry-run"
  ```

---


## 🧭 Phase R4: Pre-Push Hook Installer

The **Pre-Push Hook Installer** establishes a local Git hook that intercepts push operations and runs compiler checks, integrity audits, and asset guards sequentially before pushing, ensuring remote origin remains clean and compiling.

### 🛡️ Safety & Execution Rules
1. **Local-Only Hook:** Only the installer and templates are tracked. The live hook `.git/hooks/pre-push` remains local-only.
2. **Safe Backup Handling:** Existing hooks are backed up to prevent configuration loss.
3. **Disable-Safe Architecture:** The hook can be easily disabled/uninstalled without deleting backup configurations.

### 💻 Command Examples
* View hook helper menu and commands:
  ```bash
  npm run command -- "git-hook-help"
  ```
* Install pre-push safety hook locally:
  ```bash
  npm run command -- "git-hook-install"
  ```
* Inspect pre-push hook configuration status:
  ```bash
  npm run command -- "git-hook-status"
  ```
* Uninstall and disable pre-push safety hook:
  ```bash
  npm run command -- "git-hook-uninstall"
  ```

---

## 🧭 Phase 11R: TTS-Ready Narration Export Queue

The **TTS-Ready Narration Export Queue** processes approved blocks from the approval gate manifest and formats them into a clean, offline TTS-ready export format, calculating duration estimates and formatting spec sheets without calling external services.

### 🛡️ Safety & Execution Rules
1. **Export-Only Mode:** Script checks and staging only. No outbound audio generation is allowed.
2. **Fail Closed Policy:** Rejects blocks with missing parameters or risk tiers exceeding safe thresholds.
3. **Local Spec Alignment:** Outputs plain-text script blocks, JSON logs, and voice metadata specs locally.

### 💻 Command Examples
* View export queue help menu:
  ```bash
  npm run command -- "tts-ready-narration-export-queue-help"
  ```
* Execute export and generate manifests:
  ```bash
  npm run command -- "tts-ready-narration-export-queue"
  ```
* Execute export simulation in dry-run mode:
  ```bash
  npm run command -- "tts-ready-narration-export-queue check --dry-run"
  ```

---


## 🧭 Phase 11S: Offline TTS Dry-Run Renderer

The **Offline TTS Dry-Run Renderer** simulates the complete offline TTS rendering lifecycle (including sentence-boundary chunking, voice routing based on suggested tone, duration estimation, narrator metadata validation, queue readiness, and output manifest generation) without generating audio files, invoking voice engines, or calling external APIs.

### 🛡️ Safety & Execution Rules
1. **Simulation-Only Mode:** Script checks and chunk/routing simulations only. No outbound audio generation is allowed.
2. **Fail Closed Policy:** Rejects blocks with missing parameters or risk tiers exceeding safe thresholds.
3. **Local Spec Staging:** Outputs plain-text script blocks chunks, JSON manifests, voice routing specs, timing estimates, and risk checklist files under `outputs/grounded_narrator/tts_dry_run/`.
4. **Requires Exact Name:** Aliases are rejected under strict Command Router policy.

### 💻 Command Examples
* View dry-run renderer help menu:
  ```bash
  npm run command -- "offline-tts-dry-run-renderer-help"
  ```
* Run offline dry-run simulation:
  ```bash
  npm run command -- "offline-tts-dry-run-renderer"
  ```

---

## 🧭 Phase 11T: Offline TTS Render Approval Switch

The **Offline TTS Render Approval Switch** creates a human-controlled switch that allows selected dry-run-approved blocks to move from simulation into actual offline TTS rendering, while keeping audio generation disabled by default.

### 🛡️ Safety & Execution Rules
1. **Approval-Switch Mode:** Gates real synthesis processes by checking user-approved export tokens.
2. **Fail Closed Policy:** Non-approved blocks remain in staged simulation state indefinitely.
3. **Local Control Only:** Runs completely offline without cloud calls.

---

## 🧭 Phase 11U: Local Offline TTS Voice Model Placement and Activation Check

The **Local Offline TTS Voice Model Placement and Activation Check** provides a manual model staging verification layer. It audits directory configurations, matching configuration JSON files, and environment variable flags to ensure all speech assets are fully validated before offline voice synthesis.

### 🛡️ Safety & Execution Rules
1. **Activation-Check Only:** Validates staged file layouts and config prefixes. Spawning audio rendering compilers or running speech modules is disabled.
2. **No Audio Generation:** Blocks audio generation and wave output.
3. **No Model Download:** Blocks automatic network requests or model fetches.
4. **No External APIs:** Speech rendering queries are held offline.

### 💻 Command Examples
* View model activation help menu:
  ```bash
  npm run command -- "tts-model-activation-help"
  ```
* Generate manual model placement guide:
  ```bash
  npm run command -- "tts-model-activation placement-guide"
  ```
* Run model folder scanning audit:
  ```bash
  npm run command -- "tts-model-activation scan"
  ```
* Run voice model configuration pairing check:
  ```bash
  npm run command -- "tts-model-activation pairing-check"
  ```
* Run multi-layer activation readiness compilation:
  ```bash
  npm run command -- "tts-model-activation activation-readiness"
  ```
* Check activation status:
  ```bash
  npm run command -- "tts-model-activation status"
  ```

---

## 🧭 Phase 11V: Offline TTS Model Acquisition Guide and Placement Assistant

The **Offline TTS Model Acquisition Guide and Placement Assistant** provides manual staging guidelines, model directory inventory scanning, pairing audits, and next-step roadmap compilations.

### 🛡️ Safety & Execution Rules
1. **Acquisition-Guide Only:** Spawning automatic curl/wget downloads, calling external APIs, writing configuration settings, or starting audio synthesizers is strictly disabled.
2. **Manual Download Reminder:** Guide outlines manual browser steps to fetch required files without executing terminal compiler steps.
3. **Large Binary Untracked Warning:** Emphasizes policies to prevent committing large binary `.onnx` model weights to Git repositories.

### 💻 Command Examples
* View model acquisition help menu:
  ```bash
  npm run command -- "tts-model-acquisition-help"
  ```
* Generate manual model acquisition guide:
  ```bash
  npm run command -- "tts-model-acquisition guide"
  ```
* Generate cataloged folder inventory list:
  ```bash
  npm run command -- "tts-model-acquisition inventory"
  ```
* Verify voice config file pairing compatibility:
  ```bash
  npm run command -- "tts-model-acquisition verify-placement"
  ```
* Generate next required manual step roadmap:
  ```bash
  npm run command -- "tts-model-acquisition next-step"
  ```
* Check acquisition status:
  ```bash
  npm run command -- "tts-model-acquisition status"
  ```

---

## 🧭 Phase 11W: Offline Voice Session Recorder

The **Offline Voice Session Recorder** provides a safe sandbox scaffold to initialize new drop sessions, configure metadata specifications, audit inventory folder, and check voice staging eligibility before future Whisper ASR operations.

### 🛡️ Safety & Execution Rules
1. **Scaffold-Only Operations:** Microphone capture, speaker modules, TTS compilers, and ASR runs are strictly blocked.
2. **Manual Drop Protocol:** Guide details instructions for copying external wave files into `manual_recordings/` and renaming them to match metadata session IDs.
3. **Staging Validation Audits:** Verifies format compliance, logs blockers, and stages eligible files for future translation without invoking process executables.

### 💻 Command Examples
* View voice recorder help menu:
  ```bash
  npm run command -- "voice-session-recorder-help"
  ```
* Generate manual recording guide:
  ```bash
  npm run command -- "voice-session-recorder guide"
  ```
* Create new staging metadata session:
  ```bash
  npm run command -- "voice-session-recorder create-session narrator briefing"
  ```
* Scan manual recordings directory inventory:
  ```bash
  npm run command -- "voice-session-recorder scan-recordings"
  ```
* Run compatibility review check:
  ```bash
  npm run command -- "voice-session-recorder review"
  ```
* Create transcription staging record:
  ```bash
  npm run command -- "voice-session-recorder stage-transcription"
  ```
* Check session recorder status:
  ```bash
  npm run command -- "voice-session-recorder status"
  ```

---

## 🧭 Phase 11X: Local Offline ASR Orchestrator

The **Local Offline ASR Orchestrator** provides a safe sandbox scaffold to check speech recognition readiness, prepare job packets detailing target configurations, perform simulated dry-run previews, and stage empty transcript placeholder files before deploying regional models.

### 🛡️ Safety & Execution Rules
1. **Orchestration-Only Scaffold:** Audio translation engines (Whisper / GGML) are completely blocked. No waveform decoding or speech-to-text extraction is conducted.
2. **Safety Gates Enforced:** No commands are spawned to external APIs, and no shell scripts invoke local execution binaries.
3. **Staging Flow:** Readiness reviews check for Whisper `.bin` files and manual staged `.wav` audio, compiling dry-run simulation checklists and transcript placeholders safely.

### 💻 Command Examples
* View ASR help menu:
  ```bash
  npm run command -- "asr-orchestrator-help"
  ```
* Run local system readiness audit:
  ```bash
  npm run command -- "asr-orchestrator readiness"
  ```
* Initialize new staging job packet:
  ```bash
  npm run command -- "asr-orchestrator create-job"
  ```
* Simulate dry-run execution checks:
  ```bash
  npm run command -- "asr-orchestrator dry-run"
  ```
* Create transcript staging placeholder:
  ```bash
  npm run command -- "asr-orchestrator stage-transcript"
  ```
* View orchestrator status dashboard:
  ```bash
  npm run command -- "asr-orchestrator status"
  ```

---

## 🧭 Phase 11Y: Offline ASR Model Acquisition Guide and Checksum Gate

The **ASR Model Gate** provides a manual model acquisition, inventory reporting, cryptographic hashing validation (using Node crypto SHA256), and readiness gate evaluation pipeline designed to verify offline Whisper models before unlocking offline transcription.

### 🛡️ Safety & Execution Rules
1. **Manual Model Placement:** Automated network model downloads, remote APIs, and curl queries are completely blocked. Files must be staged manually.
2. **Safe Hashes Verification:** Generates cryptographic SHA256 checks locally to warn operators against running unverified model files.
3. **Execution Flag Lockout:** Unlocks ASR execution only when the operator manually sets the `ASR_EXECUTION_ENABLED=true` environment flag alongside successful model checks.

### 💻 Command Examples
* View model gate help menu:
  ```bash
  npm run command -- "asr-model-gate-help"
  ```
* Generate manual model acquisition guide:
  ```bash
  npm run command -- "asr-model-gate guide"
  ```
* Scan models folder inventory:
  ```bash
  npm run command -- "asr-model-gate inventory"
  ```
* Calculate model cryptographic SHA256 checksums:
  ```bash
  npm run command -- "asr-model-gate checksum"
  ```
* Audit readiness gate parameters:
  ```bash
  npm run command -- "asr-model-gate readiness"
  ```
* Print gate status dashboard:
  ```bash
  npm run command -- "asr-model-gate status"
  ```

---

## 🧭 Phase 11Z: Manual Audio Drop Verification and Cleanup

The **Manual Audio Drop Verification** layer provides a local validation suite for dropped audio command files. It inventories audio sizes and formats, maps files to voice session metadata, quarantines unsupported/oversized items, and compiles cleanup status reports prior to downstream staging.

### 🛡️ Safety & Execution Rules
1. **Validation-Only Focus:** Waveform transcription, local ASR/Whisper libraries, and external API requests are completely bypassed.
2. **Preservation Guarantee:** Original files are never deleted or renamed automatically (`ALLOW_AUDIO_DELETION = false`).
3. **Quarantine Isolation:** Unsupported format files and oversized payloads exceeding 100MB are safely copied to a dedicated quarantine directory.

### 💻 Command Examples
* Print help menu:
  ```bash
  npm run command -- "audio-drop-verification-help"
  ```
* Scan manual drops directory:
  ```bash
  npm run command -- "audio-drop-verification inventory"
  ```
* Match audio drops to session metadata:
  ```bash
  npm run command -- "audio-drop-verification match-sessions"
  ```
* Perform quarantine isolation:
  ```bash
  npm run command -- "audio-drop-verification quarantine-check"
  ```
* Compile cleanup report:
  ```bash
  npm run command -- "audio-drop-verification cleanup-report"
  ```
* View switch status dashboard:
  ```bash
  npm run command -- "audio-drop-verification status"
  ```

---

## 🧭 Phase 11Z-Alt: Offline ASR Dry-Run Transcription Readiness Gate

The **Offline ASR Dry-Run Transcription Readiness Gate** verifies whether the local ASR environment is ready for offline transcription by auditing model integrity (sizes, extensions, SHA256 hashes), inspecting approved local audio inputs, generating simulated routing tables, and outputting dry-run manifests without invoking Whisper models or translating waveforms.

### 🛡️ Safety & Execution Rules
1. **Zero ASR Execution:** Verification scripts strictly ensure that `ALLOW_ASR_EXECUTION = false` is active.
2. **Zero Audio Transcription:** Transcription library loading is disabled via `ALLOW_AUDIO_TRANSCRIPTION = false`.
3. **Zero Model Downloads:** Automated network calls are completely disabled via `ALLOW_MODEL_DOWNLOAD = false`.
4. **Zero External API Calls:** System telemetry blocks external endpoints via `ALLOW_EXTERNAL_API_CALLS = false`.
5. **Exact-Name Command Routing:** Strict commands are routed directly via their exact name only; unapproved command aliases are automatically blocked.

### 💻 Command Examples
* View dry-run transcription gate help menu:
  ```bash
  npm run command -- "asr-dry-run-transcription-gate-help"
  ```
* Run offline dry-run gate:
  ```bash
  npm run command -- "asr-dry-run-transcription-gate"
  ```

---

## 🧭 Phase 11Z-B: ASR Model Manifest Preparation Gate

The **ASR Model Manifest Preparation Gate** sets up offline ASR schemas and placement assets without running transcription. It initializes approved input audio directories (e.g. `recordings/`, `inputAudio/`, `outputs/asr_inputs/`), populates templates for `asr-checksum-manifest.json` with recommended model SHA256 hashes, and outputs placement guides detailing safe model acquisitions.

### 🛡️ Safety & Execution Rules
1. **Zero Transcription:** Audio waveforms are never loaded, inspected, or converted to text.
2. **Zero Auto-Fetch:** System strictly blocks Hugging Face, OpenAI, curl downloads, and remote queries.
3. **Fail-Closed Gate:** Gate checks verify structural parameters, failing closed if manifest fields are missing.

### 💻 Command Examples
* View preparation gate help menu:
  ```bash
  npm run command -- "asr-model-manifest-preparation-gate-help"
  ```
* Run manifest preparation gate:
  ```bash
  npm run command -- "asr-model-manifest-preparation-gate"
  ```

---

## 🧭 Phase 11Z-C: ASR Checksum Manifest Validation Gate

The **ASR Checksum Manifest Validation Gate** cross-audits root and official checksum manifests, checking required properties, verifying local model files presence, performing Node crypto SHA256 matches, and outputting validation report logs and summaries.

### 🛡️ Safety & Execution Rules
1. **Zero Model Downloads:** Cryptographic hashes are validated purely locally.
2. **Zero ASR Executions:** Speech libraries are never initialized.
3. **Double Manifest Audit:** Compares both repo-root and narrator outputs directories for conflicts.

### 💻 Command Examples
* View checksum manifest validation gate help menu:
  ```bash
  npm run command -- "asr-checksum-manifest-validation-gate-help"
  ```
* Run manifest validation gate:
  ```bash
  npm run command -- "asr-checksum-manifest-validation-gate"
  ```

---

## 🧭 Phase 11Z-D: ASR Audio Input Staging Validation Gate

The **ASR Audio Input Staging Validation Gate** validates staged local audio files for extension, size, metadata, naming safety, and routing eligibility without transcribing them.

### 🛡️ Safety & Execution Rules
1. **Zero Transcription:** Audio waveforms are never loaded, inspected, or converted to text.
2. **Strict Folder Boundaries:** Only recording directories recordings/, inputAudio/, and outputs/asr_inputs/ are crawled.
3. **Exact Name Required:** medium-risk command requires its exact name, aliases are blocked.
4. **Model Trust Check:** Resolves model validation status dynamically and defaults routes to blocked if model trust fails.

### 💻 Command Examples
* View audio staging gate help menu:
  ```bash
  npm run command -- "asr-audio-input-staging-validation-gate-help"
  ```
* Run audio staging gate:
  ```bash
  npm run command -- "asr-audio-input-staging-validation-gate"
  ```

---

## 🧭 Phase 11Z-E: ASR Readiness Join Gate

The **ASR Readiness Join Gate** integrates model cryptographic validation signals (Phase 11Z-C) and audio staging validation signals (Phase 11Z-D) into a unified JSON manifest. It evaluates the joined checklist against strict dry-run criteria and maps route eligibility under offline-first constraints.

### 🛡️ Safety & Execution Rules
1. **Zero Transcription:** Waveforms are never processed or text output generated.
2. **Unified Evaluation:** Evaluates status to dry_run_ready only if cryptographic model checks and audio staging validations both succeed.
3. **Restricted Route Prev:** Routes default to blocked and blocker checklists are compiled if model trust or audio staging fails.

### 💻 Command Examples
* View join readiness gate help menu:
  ```bash
  npm run command -- "asr-readiness-join-gate-help"
  ```
* Run join readiness gate:
  ```bash
  npm run command -- "asr-readiness-join-gate"
  ```

## 🧭 Phase 11Z-F: ASR Manual Asset Intake Checklist

The **ASR Manual Asset Intake Checklist** compiles detailed checklists (such as model placements, checksum entry, audio staging directories) and blocker resolutions, mapping out a strict re-run sequence for developers to manually stage required files offline.

### 🛡️ Safety & Execution Rules
1. **Zero Automation:** Does not run automated downloads, speech rendering, or transcribing loops.
2. **Offline-First:** All assets must be manually staged, cryptographic checksum hashes computed locally, and verification manifest values filled by operator.
3. **Fail-Closed Evaluation:** Reminders block transitions to execution-ready states.

### 💻 Command Examples
* View manual checklist help menu:
  ```bash
  npm run command -- "asr-manual-asset-intake-checklist-help"
  ```
* Run manual checklist compiler:
  ```bash
  npm run command -- "asr-manual-asset-intake-checklist"
  ```

## 🧭 Phase 11Z-F2: ASR Manual Asset Presence Preflight

The **ASR Manual Asset Presence Preflight** acts as a lightweight preflight gate checking whether required Whisper model binaries (`ggml-base.en.bin` and `ggml-tiny.bin`) and at least one approved local audio file are staged in appropriate directories before attempting full revalidation.

### 🛡️ Safety & Execution Rules
1. **No Checksums Computed:** Cryptographic hashes (SHA256) are not verified in this preflight phase to preserve low latency. That responsibility remains owned by Phase 11Z-C.
2. **Zero ASR Invocations:** Under no circumstances does this gate execute Whisper, transcribe audio inputs, or perform any network API requests or downloads.
3. **Safety Isolation:** Manifest validation errors or staging directory absences automatically force a blocked status.

### 💻 Command Examples
* View preflight help menu:
  ```bash
  npm run command -- "asr-manual-asset-presence-preflight-help"
  ```
* Run preflight validation:
  ```bash
  npm run command -- "asr-manual-asset-presence-preflight"
  ```

## 🧭 Phase 11Z-G: ASR Manual Asset Revalidation Pass

The **ASR Manual Asset Revalidation Pass** aggregates and consolidates outputs from prior offline ASR validation gates (checksum manifest, audio staging, readiness join, and presence preflight) to determine if the pipeline is structurally ready to transition into a dry-run offline state.

### 🛡️ Safety & Execution Rules
1. **Aggregator Only:** Reads gate output manifests and disk configurations without performing transcription, model downloads, or external network requests.
2. **Safety Defaults:** Automatically defaults to a blocked status if any binaries are missing, checksum matches are zero, or manifest files are incomplete.
3. **No Execution:** Never compiles or routes actual transcription requests in this phase.

### 💻 Command Examples
* View revalidation pass help menu:
  ```bash
  npm run command -- "asr-manual-asset-revalidation-pass-help"
  ```
* Run manual asset revalidation pass:
  ```bash
  npm run command -- "asr-manual-asset-revalidation-pass"
  ```

---

## 🧭 Phase 11Z-H: ASR Asset Acquisition Ledger

The **ASR Asset Acquisition Ledger** creates a local-first human asset tracking ledger for manual Whisper model acquisition, checksum recording, audio staging configurations, and validation readiness parameters before any future ASR execution approval switch is considered.

### 🛡️ Safety & Execution Rules
1. **Ledger Tracking Only:** Compiles local tracking and handoff templates without running transcription, performing model downloads, or executing external API calls.
2. **Safety Defaults:** Automatically checks for the expected binaries, updates manifests, and reports staging gaps as LOCKED if assets are missing.
3. **No Execution:** Speech transcription engines and Whisper executables remain offline.

### 💻 Command Examples
* View acquisition ledger help menu:
  ```bash
  npm run command -- "asr-asset-acquisition-ledger-help"
  ```
* Run asset acquisition ledger generator:
  ```bash
  npm run command -- "asr-asset-acquisition-ledger"
  ```

---

## 🧭 Phase 11Z-I: Human-Staged Asset Verification Pass

The **Human-Staged Asset Verification Pass** cross-validates manual Whisper model binary staging under `models/asr/whisper/`, manifest cryptographic checks, and staged audio inputs against actual disk state offline.

### 🛡️ Safety & Execution Rules
1. **Verification Only:** Performs passive inspections without running ASR or downloading files.
2. **Fail Closed:** Defaults to blocked if required files are missing or mismatching.

### 💻 Command Examples
* Run human staged verification check:
  ```bash
  npm run command -- "asr-human-staged-asset-verification-pass"
  ```

---

## 🧭 Phase 11Z-J: ASR Gate Rerun Orchestrator

The **ASR Gate Rerun Orchestrator** sequentially triggers the chain of offline validation gates to evaluate join readiness.

### 💻 Command Examples
* Run gate rerun orchestrator:
  ```bash
  npm run command -- "asr-gate-rerun-orchestrator"
  ```

---

## 🧭 Phase 11Z-K: ASR Manual Asset Staging Operator Packet

Generates operator instruction packets guiding manual placement of Whisper binaries, shasum capture commands, and manifest updates specifications.

### 💻 Command Examples
* Generate operator staging packet:
  ```bash
  npm run command -- "asr-manual-asset-staging-operator-packet"
  ```

---

## 🧭 Phase 11Z-L: Operator Packet Completion Audit

Audits whether the human operator has completed the manual staging tasks from Phase 11Z-K (model placement, manifest update, audio staging) before rerun validations are unblocked.

### 💻 Command Examples
* Run completion audit check:
  ```bash
  npm run command -- "asr-operator-packet-completion-audit"
  ```

---

## 🧭 Phase 11Z-M: Verification Rerun Trigger Packet

Generates the final local-first rerun trigger packet for the full ASR validation chain after operator packet completion is confirmed.

### 🛡️ Safety & Execution Rules
1. **Trigger Packet Only:** Performs read-only staging completeness checks without executing model downloads, auto-modifying manifests, running ASR, or transcribing audio files.
2. **Fail Closed:** Reports `rerun_trigger_status: 'blocked'` if any validation prerequisites are missing or mismatched, preventing gate execution.
3. **Phase 12A Lock:** Enforces that Phase 12A remains strictly locked.

### 💻 Command Examples
* View verification trigger packet help manual:
  ```bash
  npm run command -- "asr-verification-rerun-trigger-packet-help"
  ```
* Generate verification rerun trigger packet:
  ```bash
  npm run command -- "asr-verification-rerun-trigger-packet"
  ```

---

## 🧭 Phase 11Z-N: Validation Chain Execution Report

Validates and compiles a report showing whether the system reaches `dry_run_ready` without enabling transcription by running or reading outputs from the full ASR validation chain.

### 🛡️ Safety & Execution Rules
1. **Validation Gates Only:** Passive verification of ASR gate manifests without calling Whisper or mutating models/audio.
2. **Fail Closed:** Reports `validation_chain_status: 'blocked'` and outputs a blocker-only report if any gate is incomplete, model files are missing, or safety checks fail.
3. **No Execution:** Speech transcription engines and Whisper executables remain offline.

### 💻 Command Examples
* View validation chain execution report help manual:
  ```bash
  npm run command -- "asr-validation-chain-execution-report-help"
  ```
* Run validation chain execution report:
  ```bash
  npm run command -- "asr-validation-chain-execution-report"
  ```

---

## 🚀 Next Phase Recommendation

* **Phase 12A: Offline ASR Execution Approval Switch**
  - Create a human-controlled approval switch for selected local audio files to move toward real offline ASR transcription once validation_chain_status equals dry_run_ready.

---

## 🛡️ Phase 12A: Duplicate Cleanup Staging Gate

The **Duplicate Cleanup Staging Gate** provides a secure gating mechanism for staging duplicate brief cleanups and assessing project directory registry drift, operating with strict dry-run, quarantine-first, and restore policies under the Workflow Auditor.

### 🔒 Guardrails Summary
1. **Staging Only:** Direct file deletion is disabled by default.
2. **Blocked rm Commands:** System deletes are blocked; copies are made to quarantine first.
3. **Rollback Shell Script:** Generation of fully commented `.sh` scripts to reverse any executed quarantine event.
4. **Registry Drift Audit:** Identifies and classifies unregistered directories in `Projects/` and `TreeGrooveProjects/` without auto-editing.

### 💻 Command Examples
* View cleanup gate help menu:
  ```bash
  npm run command -- "cleanup-gate-help"
  ```
* Run duplicates scan in targeted folders:
  ```bash
  npm run command -- "cleanup-gate scan-duplicates"
  ```
* Stage duplicate briefs quarantine plan:
  ```bash
  npm run command -- "cleanup-gate stage-quarantine"
  ```
* Generate safe restore script:
  ```bash
  npm run command -- "cleanup-gate restore-plan"
  ```
* Scan for Projects matrix drift:
  ```bash
  npm run command -- "cleanup-gate project-drift"
  ```
* Display status dashboard:
  ```bash
  npm run command -- "cleanup-gate status"
  ```

---

## 🛡️ Phase 12B: Approved Quarantine Execution Gate

The **Approved Quarantine Execution Gate** provides an approval-based execution mechanism to safely move duplicate briefs from source directories into quarantine (`outputs/cleanup/quarantine/`). It enforces dry-runs, requires explicit confirmation flags, performs integrity checksum validation, and outputs a commented rollback mapping script.

### 🔒 Guardrails Summary
1. **Approval Enforcement:** Operations require explicit confirmation via the `--confirm` flag.
2. **Move Containment:** Files are moved into quarantine; no permanent deletion or `rm` commands are permitted.
3. **Checksum Verification:** MD5 hashes are computed before and after moves to ensure zero data corruption.
4. **Restore Map Rollback:** A detailed rollback shell script is created to move files back to original directories.

### 💻 Command Examples
* View quarantine executor help:
  ```bash
  npm run command -- "quarantine-executor-help"
  ```
* Preview potential quarantine moves:
  ```bash
  npm run command -- "quarantine-executor dry-run"
  ```
* Execute the approved quarantine (requires confirmation):
  ```bash
  npm run command -- "quarantine-executor execute-approved" --confirm
  ```
* Verify checksums of quarantined files:
  ```bash
  npm run command -- "quarantine-executor checksum"
  ```
* Generate restore map:
  ```bash
  npm run command -- "quarantine-executor restore-map"
  ```
* Display status dashboard:
  ```bash
  npm run command -- "quarantine-executor status"
  ```

---

## 🛡️ Phase 12C: Project Registry Drift Review

The **Project Registry Drift Review** provides a local project registry drift review system. It scans unregistered directories, scores their activity and importance, and generates staged `PROJECTS.md` candidate matrix proposals for manual review.

### 🔒 Guardrails Summary
1. **Review-Only Safety:** All files generated are read-only candidate staging reports; the system prevents writing directly to `PROJECTS.md`.
2. **Move Containment:** Moving, archiving, or deleting folders is completely disabled.
3. **No Target Process Executions:** No external commands or scripts are run inside scanned project directories.
4. **No Router Bypassing:** All operations pass through the exact-name Command Router.

### 💻 Command Examples
* Print help menu:
  ```bash
  npm run command -- "project-registry-review-help"
  ```
* Classify unregistered folders:
  ```bash
  npm run command -- "project-registry-review classify"
  ```
* Generate staged entries:
  ```bash
  npm run command -- "project-registry-review staged-entries"
  ```
* Generate summary report:
  ```bash
  npm run command -- "project-registry-review summary"
  ```
* Generate action plan:
  ```bash
  npm run command -- "project-registry-review action-plan"
  ```
* Display status dashboard:
  ```bash
  npm run command -- "project-registry-review status"
  ```

---

## 🛡️ Phase 12D: Staged Registry Appending Gate

The **Staged Registry Appending Gate** provides a safe approved registry append system. It reads staged project registry candidate entries and appends selected approved entries to `PROJECTS.md` without overwriting existing data.

### 🔒 Guardrails Summary
1. **No Overwrites:** All writes strictly append staging entries; the system forbids overwriting or editing existing registry rows.
2. **Mandatory Backups:** A backup of `PROJECTS.md` is generated automatically before any write operation.
3. **No Duplicate Rows:** The script skips candidates with names or paths already present in `PROJECTS.md`.
4. **Approval Enforcement:** Writing requires explicit `--confirm` command flags.
5. **No File System/Process Run Drift:** No folders are moved, deleted, or executed inside target project directories.

### 💻 Command Examples
* Print help menu:
  ```bash
  npm run command -- "project-registry-append-gate-help"
  ```
* Preview safe and duplicate entries:
  ```bash
  npm run command -- "project-registry-append-gate preview"
  ```
* Backup and append approved entries (requires confirmation):
  ```bash
  npm run command -- "project-registry-append-gate append-approved" --confirm
  ```
* View append status:
  ```bash
  npm run command -- "project-registry-append-gate status"
  ```

---

## 🛡️ Phase 12E: Registry Health Monitor

The **Registry Health Monitor** provides post-append registry verification, candidate review audits, and quarantine telemetry indicators without carrying out any modifications or deletions.

### 🔒 Guardrails Summary
1. **Read-Only Operations:** The script strictly audits, scans, and monitors without editing `PROJECTS.md`, deleting files, or moving folders.
2. **Command Router Protection:** Explicit commands are routed through the Safe Command Router, ensuring execution permissions are respected.
3. **No Dynamic Auto-Modifications:** Does not automatically repair or rewrite structure layout lines; errors are logged for manual resolution.
4. **Permanent File Preservation:** Quarantined duplicates are kept for observation without deletion capabilities.

### 💻 Command Examples
* Print help menu:
  ```bash
  npm run command -- "project-registry-health-monitor-help"
  ```
* Audit PROJECTS.md matrix integrity:
  ```bash
  npm run command -- "project-registry-health-monitor verify-projects"
  ```
* Review skipped candidate profiles:
  ```bash
  npm run command -- "project-registry-health-monitor skipped-candidates"
  ```
* Monitor quarantine duplicate parameters:
  ```bash
  npm run command -- "project-registry-health-monitor quarantine-status"
  ```
* Generate unified health report:
  ```bash
  npm run command -- "project-registry-health-monitor health-report"
  ```
* Print health status summary console dashboard:
  ```bash
  npm run command -- "project-registry-health-monitor status"
  ```

---

## 🛡️ Phase 12B: Grinders Keep Core Brief Engine Plus

The **Grinders Keep Core Brief Engine Plus** is a local-first creative R&D engine designed to synthesize daily creative briefs, lesson topics, gaps, build suggestions, money moves, Google Ultra tool opportunities, content drafts, and consensus packets. It enforces strict safety parameters, requiring human verification and approval for all recommended builds and workflows.

### 🔒 Guardrails Summary
1. **Local-First Verification:** Strictly no external API calls, Google tools direct execution, or remote uploads.
2. **No Hype Rule:** Every build recommendation requires at least one reason to pause or postpone building.
3. **Kill List Enforcement:** Every brief contains a recommendation of a feature/action to archive or delete.
4. **Smallest Useful Version:** Enforces MVP descriptions across all suggestions to prevent over-complexity.
5. **Money Confidence Scoring:** Every monetizable idea must include a confidence rating (1-10) and explanation.
6. **Commander Approval Required:** Operations compile staged outputs only; no auto-execution or auto-builds.

### 💻 Command Examples
* Print Grinders Keep help:
  ```bash
  npm run command -- "grinders-keep-daily-brief-help"
  ```
* Generate unified Daily Brief report:
  ```bash
  npm run command -- "grinders-keep-daily-brief"
  ```
* Run v0.1 Adaptive Learning Loop logic:
  ```bash
  npm run command -- "grinders-keep-adaptive-loop"
  ```
* Run Vault Awareness scan:
  ```bash
  npm run command -- "grinders-keep-vault-awareness"
  ```
* Generate smart content drafts:
  ```bash
  npm run command -- "grinders-keep-content-drafts"
  ```
* Stage multi-model agent consensus review template:
  ```bash
  npm run command -- "grinders-keep-consensus-packet"
  ```
* Run Gap Hunter scanner sweep:
  ```bash
  npm run command -- "grinders-keep-gap-hunter"
  ```
* Print Gap Hunter help menu:
  ```bash
  npm run command -- "grinders-keep-gap-hunter-help"
  ```
* Run Adaptive Learning Deepener sweep:
  ```bash
  npm run command -- "grinders-keep-adaptive-learning-deepener"
  ```
* Print Adaptive Learning Deepener help menu:
  ```bash
  npm run command -- "grinders-keep-adaptive-learning-deepener-help"
  ```
* Run Content Drafting Lab Deepener sweep:
  ```bash
  npm run command -- "grinders-keep-content-drafting-lab-deepener"
  ```
* Print Content Drafting Lab Deepener help menu:
  ```bash
  npm run command -- "grinders-keep-content-drafting-lab-deepener-help"
  ```
* Run Consensus Review Packet Deepener sweep:
  ```bash
  npm run command -- "grinders-keep-consensus-review-packet-deepener"
  ```
* Print Consensus Review Packet Deepener help menu:
  ```bash
  npm run command -- "grinders-keep-consensus-review-packet-deepener-help"
  ```
* Run Manual Review Intake Gate sweep:
  ```bash
  npm run command -- "grinders-keep-manual-review-intake-gate"
  ```
* Print Manual Review Intake Gate help menu:
  ```bash
  npm run command -- "grinders-keep-manual-review-intake-gate-help"
  ```
* Run Decision Synthesis Gate sweep:
  ```bash
  npm run command -- "grinders-keep-decision-synthesis-gate"
  ```
* Print Decision Synthesis Gate help menu:
  ```bash
  npm run command -- "grinders-keep-decision-synthesis-gate-help"
  ```
* Run Execution Approval Queue sweep:
  ```bash
  npm run command -- "grinders-keep-execution-approval-queue"
  ```
* Print Execution Approval Queue help menu:
  ```bash
  npm run command -- "grinders-keep-execution-approval-queue-help"
  ```
* Run Final Human Launch Switch sweep:
  ```bash
  npm run command -- "grinders-keep-final-human-launch-switch"
  ```
* Print Final Human Launch Switch help menu:
  ```bash
  npm run command -- "grinders-keep-final-human-launch-switch-help"
  ```


---

## 🛡️ Phase 12F: Duplicate Registry Entry Resolution Gate

The **Duplicate Registry Entry Resolution Gate** provides a safe duplicate entry resolution system. It reads the registry integrity report findings, detects duplicate project name and path records in `PROJECTS.md`, stages merge/remove recommendations in a staged plan, backs up `PROJECTS.md` with a timestamp, and applies only approved line-by-line duplicate entry resolution removals.

### 🔒 Guardrails Summary
1. **No Directory Alteration:** The system never deletes or moves project folders or files.
2. **Mandatory Backups:** PROJECTS.md is backed up under a timestamp before any modification write occurs.
3. **Approval Switch Gate:** Applying changes requires the explicit addition of the `--confirm` command flag.
4. **Non-Destructive Line Patching:** Resolves only duplicate rows, leaving section headings, comments, and unrelated project notes unchanged.
5. **Rollback Availability:** Clear restore paths are logged for simple cp-based recovery if needed.

### 💻 Command Examples
* Print duplicate resolution gate help:
  ```bash
  npm run command -- "project-registry-duplicate-resolution-help"
  ```
* Scan for duplicate entries:
  ```bash
  npm run command -- "project-registry-duplicate-resolution scan"
  ```
* Stage duplicate resolution plan:
  ```bash
  npm run command -- "project-registry-duplicate-resolution stage-resolution"
  ```
* Apply approved resolutions (requires confirmation):
  ```bash
  npm run command -- "project-registry-duplicate-resolution apply-approved" --confirm
  ```
* Display status dashboard:
  ```bash
  npm run command -- "project-registry-duplicate-resolution status"
  ```



---

## 🛡️ Phase 12G: Quarantine Deletion Readiness Staging Gate

The **Quarantine Deletion Readiness Staging Gate** provides a read-only validation check of the quarantine status. It checks quarantined duplicate files, restore map coverage, checksum reports, and monitoring age before any future pruning or deletion is considered.

### 🔒 Guardrails Summary
1. **Read-Only Operation:** No permanent deletion, unlinking, moving, or mutating of quarantined files is allowed.
2. **Safety Gates Enforced:** Validates restore script existence and coverage, checksum reports matching, and minimum monitoring period age (7 days).
3. **No PROJECTS.md Modifications:** The registry file is never modified or appended to.
4. **No Shell Escapes:** Arbitrary shell command execution, external API calls, and automated dependency downloads are blocked.
5. **Exact Command Matching:** The command router enforces the exact command name check and blocks aliases.

### 💻 Command Examples
* Print deletion readiness gate help:
  ```bash
  npm run command -- "quarantine-deletion-readiness-help"
  ```
* Scan quarantine directory and manifests:
  ```bash
  npm run command -- "quarantine-deletion-readiness scan"
  ```
* Validate restore map coverage:
  ```bash
  npm run command -- "quarantine-deletion-readiness restore-check"
  ```
* Calculate quarantine monitoring elapsed age:
  ```bash
  npm run command -- "quarantine-deletion-readiness age-check"
  ```
* Compile unified deletion readiness report:
  ```bash
  npm run command -- "quarantine-deletion-readiness readiness-report"
  ```
* Generate future deletion safety checklist:
  ```bash
  npm run command -- "quarantine-deletion-readiness future-checklist"
  ```
* Display status dashboard:
  ```bash
  npm run command -- "quarantine-deletion-readiness status"
  ```

---

## 🛡️ Phase 12H: Quarantine Monitoring Continuation

The **Quarantine Monitoring Continuation** establishes a safe monitoring continuation layer. It keeps tracking quarantined duplicate files until the monitoring period passes, refreshes readiness reports, and blocks pruning while deletion eligibility remains false.

### 🔒 Guardrails Summary
1. **Continuation Monitoring:** Regularly tracks quarantined duplicate briefs, checksum verification parameters, and readiness logs.
2. **Strict Operation Block:** Files cannot be deleted, unlinked, or moved. Pruning commands remain completely blocked.
3. **Registry Isolation:** The central registry file `PROJECTS.md` remains unmodified.
4. **Command Gating:** The command router enforces the exact command name check and blocks aliases.

### 💻 Command Examples
* Print monitoring continuation help:
  ```bash
  npm run command -- "quarantine-monitoring-help"
  ```
* Capture quarantine status snapshot:
  ```bash
  npm run command -- "quarantine-monitoring snapshot"
  ```
* Update tracking elapsed age and generate continuation report:
  ```bash
  npm run command -- "quarantine-monitoring continuation-report"
  ```
* Document pruning operation safety blocks:
  ```bash
  npm run command -- "quarantine-monitoring pruning-block"
  ```
* Display next check command guides:
  ```bash
  npm run command -- "quarantine-monitoring next-check"
  ```
* Display status dashboard:
  ```bash
  npm run command -- "quarantine-monitoring status"
  ```

---

## 🛡️ Phase 12I: Maintenance Daily Check Integrator

The **Maintenance Daily Check Integrator** expands the approved local daily check routine to include registry health and quarantine monitoring checks. It aggregates telemetry from all read-only safety gates, generating status reports without mutating the workspace or deleting any files.

### 🔒 Guardrails Summary
1. **Read-Only Verification:** File deletion, unlinking, and quarantine mutation are completely blocked.
2. **Safe Registry Checks:** Inspects `PROJECTS.md` for duplicate names or paths without modifying the project matrix.
3. **No Report Overwrites:** Reports are saved with timestamp suffixes if a file with the target filename already exists.
4. **Router Compliance:** Restricts command execution through the Safe Command Router under exact matching rules.

### 💻 Command Examples
* Print maintenance daily check help:
  ```bash
  npm run command -- "maintenance-check-help"
  ```
* View current health and cleanup metrics dashboard:
  ```bash
  npm run command -- "maintenance-check status"
  ```
* Compile quarantine cleanup status report:
  ```bash
  npm run command -- "maintenance-check cleanup-status"
  ```
* Verify projects registry matrix integrity:
  ```bash
  npm run command -- "maintenance-check registry-status"
  ```
* Generate full workspace maintenance report:
  ```bash
  npm run command -- "maintenance-check full-report"
  ```

---

## 🛡️ Phase 12J: Continued Maintenance Observation

The **Continued Maintenance Observation** layer establishes a safe monitoring window countdown and expiration watch. It reads current health and cleanup logs, dynamically updates the elapsed age, and logs upcoming validation criteria while pruning execution remains blocked.

### 🔒 Guardrails Summary
1. **Observation Only:** Deletions, file unlinking, and quarantine mutations remain strictly disabled.
2. **Dynamic Countdown:** Automatically computes elapsed and remaining days from baseline manifests.
3. **Maturity Projection:** Tracks earliest expiration watch date (`2026-06-08`) and outputs step-by-step recheck commands.
4. **Command Routing:** Operates under strict exact-name command router rules.

### 💻 Command Examples
* Print maintenance observation help menu:
  ```bash
  npm run command -- "maintenance-observation-help"
  ```
* Capture current reports status snapshot:
  ```bash
  npm run command -- "maintenance-observation snapshot"
  ```
* Generate quarantine countdown status:
  ```bash
  npm run command -- "maintenance-observation countdown"
  ```
* Compile maintenance observation report:
  ```bash
  npm run command -- "maintenance-observation observation-report"
  ```
* Generate quarantine expiration watch details:
  ```bash
  npm run command -- "maintenance-observation expiration-watch"
  ```
* Display observation status summary:
  ```bash
  npm run command -- "maintenance-observation status"
  ```

---

## 🛡️ Phase 12A: Duplicate Cleanup Quarantine

The **Duplicate Cleanup Quarantine** creates a safe local duplicate and stale artifact cleanup system that scans generated outputs, detects duplicate timestamp variants, identifies stale reports, and stages cleanup recommendations without deleting files.

### 🔒 Guardrails Summary
1. **Strict Scan-Only:** Direct file deletion is disabled by default.
2. **Blocked rm Commands:** System deletes are blocked; copies are made to quarantine index first.
3. **No Source Modification:** Source files under `src/`, `scripts/`, or config paths are never modified or curated.
4. **Command Gating:** The command router enforces the exact command name check and blocks aliases.

### 💻 Command Examples
* View duplicate cleanup help:
  ```bash
  npm run command -- "duplicate-cleanup-help"
  ```
* Run duplicate scan in targeted folders:
  ```bash
  npm run command -- "duplicate-cleanup" -- "scan"
  ```
* Identify stale reports, empty files, and orphan packets:
  ```bash
  npm run command -- "duplicate-cleanup" -- "stale"
  ```
* Generate quarantine index:
  ```bash
  npm run command -- "duplicate-cleanup" -- "quarantine-index"
  ```
* Generate cleanup review list:
  ```bash
  npm run command -- "duplicate-cleanup" -- "review-list"
  ```
* Print status metrics:
  ```bash
  npm run command -- "duplicate-cleanup" -- "status"
  ```

---

## 🛡️ Phase 12B: Cleanup Approval Gate

The **Cleanup Approval Gate** reads duplicate cleanup reports and builds manual approval check matrices to verify eligible quarantine files, protecting git files, models, credentials, and configurations.

### 🔒 Guardrails Summary
1. **Gate-Only Verification:** File movement and file deletion commands are completely disabled.
2. **Standard File Protections:** Standard system assets, CLI commands, and registries are protected under strict do-not-touch rules.
3. **Manual Checklists:** Generates human-signoff lists detailing candidates, reasons, confidence categories, and risk notes.
4. **Command Routing Gating:** Enforces exact script name commands and blocks aliases.

### 💻 Command Examples
* View cleanup approval gate help menu:
  ```bash
  npm run command -- "cleanup-approval-help"
  ```
* Classify duplicate report candidates:
  ```bash
  npm run command -- "cleanup-approval" -- "classify"
  ```
* Build manual approval checklist:
  ```bash
  npm run command -- "cleanup-approval" -- "approval-list"
  ```
* Compile do-not-touch targets registry:
  ```bash
  npm run command -- "cleanup-approval" -- "do-not-touch"
  ```
* Aggregates metrics and checks readiness:
  ```bash
  npm run command -- "cleanup-approval" -- "summary"
  ```
* Display status dashboard metrics:
  ```bash
  npm run command -- "cleanup-approval" -- "status"
  ```

---

## 🛡️ Phase 12J: Grinders Keep Execution Approval Queue

The **Grinders Keep Execution Approval Queue** is a local-first staging queue that takes human-approved decisions from Phase 12I and converts them into safe, non-destructive execution tickets. It ensures absolute control by staging actions instead of running them automatically.

### 🔒 Guardrails Summary
1. **Local-First Verification:** Strictly no external API calls, Google tools execution, or publishing.
2. **Staging Only:** Creates execution tickets; does not execute commands or mutate registry files.
3. **No Inventions:** Rejects mock approvals and enforces validation from real decision_synthesis/ data.
4. **Command Routing Gating:** Enforces exact-name routing for medium-risk scripts and blocks aliases.

### 💻 Command Examples
* View queue help menu:
  ```bash
  npm run command -- "grinders-keep-execution-approval-queue-help"
  ```
* Process execution approval queue sweep:
  ```bash
  npm run command -- "grinders-keep-execution-approval-queue"
  ```

---

## 🛡️ Phase 12K: Grinders Keep Final Human Launch Switch

The **Grinders Keep Final Human Launch Switch** is the final human-controlled gateway that validates launch eligibility of execution tickets from Phase 12J, marks eligible ones as ready for manual execution, and compiles manual command sheets. It enforces strict safety parameters by staging manual instruction sheets and prohibiting any automatic command execution.

### 🔒 Guardrails Summary
1. **Local-First Constraints:** No external API calls, model calls, or automated tools execution.
2. **Execution Disabled:** Stages manual command instructions; does not execute any command.
3. **No Inventions:** Restricts data validation to real local inputs; if missing, marks as missing/unavailable.
4. **Command Routing Gating:** Requires exact-name command routing match. Aliases are blocked.

### 💻 Command Examples
* View launch switch help menu:
  ```bash
  npm run command -- "grinders-keep-final-human-launch-switch-help"
  ```
* Run final launch switch validation sweep:
  ```bash
  npm run command -- "grinders-keep-final-human-launch-switch"
  ```

---

## 🛡️ Phase 12L: Grinders Keep Post-Launch Review Ledger

The **Grinders Keep Post-Launch Review Ledger** is a local review ledger that records what Commander manually executed after Phase 12K, captures outcomes, verifies output files where possible, and feeds telemetry back into Grinders Keep without running commands automatically.

### 🔒 Guardrails Summary
1. **Local-First Constraints:** No external API calls, model calls, automated tools execution, or builds.
2. **Read-Only / Local Only:** Does not mutate source reports, publish, upload, or delete files.
3. **No Inventions:** Restricts post-launch validation to real local inputs; if missing, reports that no records were found.
4. **Command Routing Gating:** Requires exact-name command routing match. Aliases are blocked.

### 💻 Command Examples
* View post-launch review ledger help menu:
  ```bash
  npm run command -- "grinders-keep-post-launch-review-ledger-help"
  ```
* Run post-launch review ledger sweep:
  ```bash
  npm run command -- "grinders-keep-post-launch-review-ledger"
  ```

---

## 🛡️ Phase 12M: Grinders Keep Continuous Improvement Loop

The **Grinders Keep Continuous Improvement Loop** is a local improvement loop that reads post-launch ledger outcomes, recurring blockers, adaptive learning patterns, execution blockers, manual review intake status, decision synthesis status, and launch switch telemetry to recommend safe process improvements without applying them automatically.

### 🔒 Guardrails Summary
1. **Local-First Constraints:** No external API calls, model calls, automated tools execution, or builds.
2. **Read-Only / Local Only:** Does not mutate source reports, publish, upload, or delete files.
3. **No Inventions:** Proposes upgrades based strictly on real observed data/telemetry.
4. **Command Routing Gating:** Requires exact-name command routing match. Aliases are blocked.

### 💻 Command Examples
* View continuous improvement loop help menu:
  ```bash
  npm run command -- "grinders-keep-continuous-improvement-loop-help"
  ```
* Run continuous improvement loop:
  ```bash
  npm run command -- "grinders-keep-continuous-improvement-loop"
  ```

---

## 🛡️ Phase 12N: Grinders Keep Evidence Collection Queue

The **Grinders Keep Evidence Collection Queue** stages manual collection tasks for the Commander when evidence files, review packets, screenshots, outcome notes, or monetization proof is missing.

### 🔒 Guardrails Summary
1. **Local-First Constraints:** No external API calls, model calls, automated tools execution, uploads, or publishing.
2. **Read-Only / Local Only:** Proposes collection tasks based strictly on real observed folder states; does not automate collection.
3. **No Inventions:** Marks missing items as unavailable instead of inventing mock results.
4. **Command Routing Gating:** Requires exact-name command routing match. Aliases are blocked.

### 💻 Command Examples
* View evidence collection queue help menu:
  ```bash
  npm run command -- "grinders-keep-evidence-collection-queue-help"
  ```
* Run evidence collection queue:
  ```bash
  npm run command -- "grinders-keep-evidence-collection-queue"
  ```

---

## 🛡️ Phase 12O: Grinders Keep Evidence Intake Validator

The **Grinders Keep Evidence Intake Validator** scans the folders containing evidence manually collected by the Commander, checks metadata constraints, validates file integrity, ranks evidence strength on a scorecard, and prepares downstream review, decision, and launch feeds without moving files or calling APIs automatically.

### 🔒 Guardrails Summary
1. **Local-First Constraints:** No external API calls, model calls, automated tools execution, uploads, or publishing.
2. **Read-Only / Local Only:** Stages validated evidence results for downstream ingestion; does not automate downstream feed routing.
3. **No Inventions:** Marks missing metadata or files clearly and requires human validation.
4. **Command Routing Gating:** Requires exact-name command routing match. Aliases are blocked.

### 💻 Command Examples
* View evidence intake validator help menu:
  ```bash
  npm run command -- "grinders-keep-evidence-intake-validator-help"
  ```
* Run evidence intake validator:
  ```bash
  npm run command -- "grinders-keep-evidence-intake-validator"
  ```

---

## 🛡️ Phase 12P: Grinders Keep Downstream Feed Router

The **Grinders Keep Downstream Feed Router** discovers validated evidence from Phase 12O and stages routing configurations for downstream target phases (Manual Review, Decision Synthesis, Continuous Improvement, Launch Readiness) without copying or moving files or executing actions automatically.

### 🔒 Guardrails Summary
1. **Local-First Constraints:** No external API calls, model calls, automated tools execution, uploads, or publishing.
2. **Staged-Only Constraints:** No file copying, moving, renaming, or deletion. Generates route manifests and logs only.
3. **No Inventions:** Scans only real validation manifest inputs and marks missing fields as blocked routes.
4. **Safety Locked:** auto_route_allowed is always false, ensuring the Commander retains full manual routing approval.

### 💻 Command Examples
* View downstream feed router help menu:
  ```bash
  npm run command -- "grinders-keep-downstream-feed-router-help"
  ```
* Run downstream feed router:
  ```bash
  npm run command -- "grinders-keep-downstream-feed-router"
  ```

---

## 🛡️ Phase 12Q: Grinders Keep Manual Evidence Action Board

The **Grinders Keep Manual Evidence Action Board** compiles concrete, prioritized Commander checklists of missing evidence, reports, and blocked routes, helping identify exactly what files need to be manually collected, pasted, or verified next.

### 🔒 Guardrails Summary
1. **Local-First Constraints:** No external API calls, model calls, automated tools execution, uploads, or publishing.
2. **Staged-Only Constraints:** No file copying, moving, renaming, or deletion. Generates action checklists, manifests, and scorecards only.
3. **No Inventions:** Scans only real local validation inputs and folders and marks missing items as unavailable instead of inventing mock results.
4. **Safety Locked:** automatic_collection_allowed is always false, ensuring the Commander executes all collection steps manually.

### 💻 Command Examples
* View manual evidence action board help menu:
  ```bash
  npm run command -- "grinders-keep-manual-evidence-action-board-help"
  ```
* Run manual evidence action board:
  ```bash
  npm run command -- "grinders-keep-manual-evidence-action-board"
  ```

---

## 🛡️ Phase 12R: Grinders Keep Evidence Completion Tracker

The **Grinders Keep Evidence Completion Tracker** audits the local filesystem to check if required manual evidence files exist, validating format compatibility, checking sizes, and computing SHA-256 metadata to generate tracker reports, completion scorecards, validator feeds, and manifests for the downstream validator.

### 🔒 Guardrails Summary
1. **Local-First Constraints:** No external API queries, model calls, automated tools execution, uploads, or publishing.
2. **Read-Only Constraints:** No file copying, moving, renaming, deletion, or creation of evidence. Updates only completion tracker outputs and frontpage metadata.
3. **No Inventions:** Scans only real local folders and files, computing actual sizes and checksums, and failing closed if data is ambiguous.
4. **Safety Locked:** auto_feed_allowed is always false, ensuring the Commander approves all ingested items.

### 💻 Command Examples
* View evidence completion tracker help menu:
  ```bash
  npm run command -- "grinders-keep-evidence-completion-tracker-help"
  ```
* Run evidence completion tracker:
  ```bash
  npm run command -- "grinders-keep-evidence-completion-tracker"
  ```

---

## 🛡️ Phase 12S: Grinders Keep Evidence Revalidation Trigger

The **Grinders Keep Evidence Revalidation Trigger** processes validator-ready feeds from Phase 12R and stages revalidation plans and command sheets for Phase 12O (Intake Validator) without running the validator or executing commands automatically.

### 🔒 Guardrails Summary
1. **Local-First Constraints:** No external API queries, model calls, automated tools execution, uploads, or publishing.
2. **Read-Only Constraints:** No file copying, moving, renaming, deletion, or creation of evidence. Writes only revalidation outputs and frontpage metadata.
3. **No Inventions:** Scans only real validator-ready feed items and completion manifests, listing blocked targets for missing elements.
4. **Safety Gated:** revalidation_allowed and command_execution_allowed are locked to false.

### 💻 Command Examples
* View evidence revalidation trigger help menu:
  ```bash
  npm run command -- "grinders-keep-evidence-revalidation-trigger-help"
  ```
* Run evidence revalidation trigger:
  ```bash
  npm run command -- "grinders-keep-evidence-revalidation-trigger"
  ```

---

## 🛡️ Phase 12T: Grinders Keep Evidence Loop Closure Auditor

The **Grinders Keep Evidence Loop Closure Auditor** evaluates whether the complete evidence revalidation loop is functioning end-to-end (from collection queue to revalidation trigger) and generates closure readiness scorecards without executing any phase automatically.

### 🔒 Guardrails Summary
1. **Local-First Constraints:** No external API queries, model calls, automated tools execution, uploads, or publishing.
2. **Read-Only Constraints:** No file copying, moving, renaming, deletion, or creation of evidence. Writes only loop closure auditor outputs and frontpage metadata.
3. **No Inventions:** Audits real local data and reports missing files/gaps clearly without generating mock traces or inventing approvals.
4. **Safety Gated:** auto_execution_allowed is locked to false.

### 💻 Command Examples
* View evidence loop closure auditor help menu:
  ```bash
  npm run command -- "grinders-keep-evidence-loop-closure-auditor-help"
  ```
* Run evidence loop closure auditor:
  ```bash
  npm run command -- "grinders-keep-evidence-loop-closure-auditor"
  ```

---

## 🛡️ Phase 12U: Grinders Keep Evidence Pack Builder

The **Grinders Keep Evidence Pack Builder** compiles all unresolved evidence tasks, missing proofs, and blocked loop traces, then packages them into a single consolidated Commander-facing evidence collection packet to unblock loop closure.

### 🔒 Guardrails Summary
1. **Local-First Constraints:** No external API queries, automated model calls, publishing, or uploading.
2. **Read-Only Constraints:** Gathers unresolved tasks and writes pack outputs without creating or modifying evidence files.
3. **Safety Gated:** evidence_creation_allowed and command_execution_allowed are locked to false.

### 💻 Command Examples
* View evidence pack builder help menu:
  ```bash
  npm run command -- "grinders-keep-evidence-pack-builder-help"
  ```
* Run evidence pack builder:
  ```bash
  npm run command -- "grinders-keep-evidence-pack-builder"
  ```

---

## 📥 Phase 12V: Grinders Keep Evidence Pack Completion Importer

The **Grinders Keep Evidence Pack Completion Importer** scans target folders for manually placed evidence completions from Phase 12U. It stages ready items for tracker sync, registers blocked imports, computes scorecards, and logs results without copy, move, or delete mutations.

### 🔒 Guardrails Summary
1. **Local-First Constraints:** No external API queries, automated model calls, or publishing.
2. **Read-Only Scans:** Strictly scans target paths for manually gathered evidence. Does not copy, move, delete, or validate the files' internal content.
3. **Safety Gated:** `evidence_creation_allowed`, `file_move_allowed`, `file_copy_allowed`, and `auto_feed_allowed` are strictly locked to `false`.

### 💻 Command Examples
* View completion importer help menu:
  ```bash
  npm run command -- "grinders-keep-evidence-pack-completion-importer-help"
  ```
* Run completion importer:
  ```bash
  npm run command -- "grinders-keep-evidence-pack-completion-importer"
  ```

---


## 📖 Phase 13A: Knowledge Harvest Source Expansion

The **Knowledge Harvest Source Expansion** implements a local, manual-first creator source registry and reporting layer under the Knowledge Librarian. It organizes approved creators, topic categories, priority labels, transcript statuses, NotebookLM staging, and OS workflow idea value scoring.

### 🔒 Guardrails Summary
1. **Manual-First Registry:** Direct channel scraping and video downloading are strictly disabled.
2. **Offline Local-First Routing:** Bypasses external APIs and prevents direct Obsidian write mutations.
3. **Registry-Only Constraints:** Focuses exclusively on staging metadata, value scores, and status reports.
4. **Command Routing Gating:** Enforces exact-name routing for medium-risk scripts and blocks aliases.

### 💻 Command Examples
* View registry help menu:
  ```bash
  npm run command -- "knowledge-source-registry-help"
  ```
* Generate Julian Goldie staged source record:
  ```bash
  npm run command -- "knowledge-source-registry" -- "add-source julian"
  ```
* Compile source priority report:
  ```bash
  npm run command -- "knowledge-source-registry" -- "priority-report"
  ```
* Compile transcript status report:
  ```bash
  npm run command -- "knowledge-source-registry" -- "transcript-status"
  ```
* Compile workflow value report:
  ```bash
  npm run command -- "knowledge-source-registry" -- "workflow-value"
  ```
* Compile source pack status report:
  ```bash
  npm run command -- "knowledge-source-registry" -- "source-pack-status"
  ```
* Query current registry status dashboard:
  ```bash
  npm run command -- "knowledge-source-registry" -- "status"
  ```

---

## 📖 Phase 13B: Creator YouTube URL Staging Gate

The **Creator YouTube URL Staging Gate** implements a safe, manual-first staging system for approved creators. It allows the operator to manually stage creator video, playlist, or channel URLs for later transcript processing, NotebookLM routing, and workflow idea extraction without scraping, downloading, or calling external APIs.

### 🔒 Guardrails Summary
1. **URL Staging Only:** Scrapers, crawlers, APIs, and video downloading are disabled.
2. **Approved Creators only:** restricts intake to approved profiles (like Julian Goldie).
3. **Manual Review Required:** Staged records are organized into status reports for operator review.
4. **Command Routing Gating:** Enforces exact-name routing for medium-risk scripts and blocks aliases.

### 💻 Command Examples
* View staging help menu:
  ```bash
  npm run command -- "creator-url-staging-help"
  ```
* Stage a specific URL manually:
  ```bash
  npm run command -- "creator-url-staging" -- "stage julian <URL>"
  ```
* Generate a batch template:
  ```bash
  npm run command -- "creator-url-staging" -- "batch julian"
  ```
* Compile review report:
  ```bash
  npm run command -- "creator-url-staging" -- "review"
  ```
* Compile transcript next-steps report:
  ```bash
  npm run command -- "creator-url-staging" -- "transcript-next"
  ```
* Query current staging status dashboard:
  ```bash
  npm run command -- "creator-url-staging" -- "status"
  ```

---

## 📖 Phase 13C: Manual Transcript Intake & Grounding Compiler

The **Manual Transcript Intake & Grounding Compiler** implements a safe local pipeline for processing operator-provided transcript files. It validates formatting, matches transcripts to staged creator URL records, compiles grounded learning notes, and packages NotebookLM-compatible source packs.

### 🔒 Guardrails Summary
1. **Manual Ingest Only:** Automated YouTube fetching and crawling are disabled.
2. **Size Validation:** Enforces character limits (`MAX_TRANSCRIPT_CHARS = 60000`).
3. **Citation & Grounding:** Generates structured learning notes mapping claims back to source records.
4. **Command Routing Gating:** Enforces exact-name command routing rules and blocks aliases.

### 💻 Command Examples
* View help menu:
  ```bash
  npm run command -- "transcript-intake-help"
  ```
* Intake a local transcript file:
  ```bash
  npm run command -- "transcript-intake" -- "intake test_inputs/julian_transcript_sample.txt"
  ```
* Run raw transcript validation checks:
  ```bash
  npm run command -- "transcript-intake" -- "validate"
  ```
* Match transcripts to staged URL records:
  ```bash
  npm run command -- "transcript-intake" -- "map-urls"
  ```
* Compile grounded learning notes:
  ```bash
  npm run command -- "transcript-intake" -- "grounded-note"
  ```
* Compile NotebookLM-compatible source packs:
  ```bash
  npm run command -- "transcript-intake" -- "source-pack"
  ```
* Query intake status dashboard:
  ```bash
  npm run command -- "transcript-intake" -- "status"
  ```

---

## 📖 Phase 13D: Workflow Idea Scoring Engine

The **Workflow Idea Scoring Engine** parses grounded learning notes and NotebookLM source packs, extracts potential workflow ideas, rates them across a 10-dimension scorecard, and ranks them to output a weighted build recommendation.

### 🔒 Guardrails Summary
1. **SCORING_ONLY:** Strictly document-based scoring. External API calls, tasks, and Obsidian writes are blocked.
2. **Weighted Scoring Criteria:** Rates ideas on fit, icy relevance, revenue, speed, difficulty, risk, reusability, automation, and audience.
3. **Exact Command Name Routing:** Blocked command aliases to ensure router safety.

### 💻 Command Examples
* View help menu:
  ```bash
  npm run command -- "workflow-idea-scoring-help"
  ```
* Extract workflow ideas:
  ```bash
  npm run command -- "workflow-idea-scoring" -- "extract"
  ```
* Generate scorecards:
  ```bash
  npm run command -- "workflow-idea-scoring" -- "score"
  ```
* Rank ideas:
  ```bash
  npm run command -- "workflow-idea-scoring" -- "rank"
  ```
* Generate build recommendations:
  ```bash
  npm run command -- "workflow-idea-scoring" -- "recommend"
  ```

---

## 📖 Phase 13E: Pipeline Integration Stage Gate

The **Pipeline Integration Stage Gate** compiles the top build recommendation from Phase 13D, maps target system dependencies, assigns council agents, compiles code specification prompts, and packages a structured checkbook for manual operator approval before execution.

### 🔒 Guardrails Summary
1. **STAGE_GATE_ONLY:** Safe document staging only. Command and script execution are strictly disabled.
2. **Dependency Mapping:** Traces target modules, routing, I/O rules, and safety gates.
3. **Agent Mapping:** Integrates OS council agents (Librarian, Auditor, Architect, Build Operator, etc.) and reviews roles.
4. **Manual Approval Checkbook:** Collects references, risks, checklists, and final decisions into a staged file.

### 💻 Command Examples
* View help menu:
  ```bash
  npm run command -- "pipeline-stage-gate-help"
  ```
* Stage build proposal:
  ```bash
  npm run command -- "pipeline-stage-gate" -- "proposal"
  ```
* Generate dependency map:
  ```bash
  npm run command -- "pipeline-stage-gate" -- "dependency-map"
  ```
* Map agent responsibilities:
  ```bash
  npm run command -- "pipeline-stage-gate" -- "agent-map"
  ```
* Stage implementation prompt:
  ```bash
  npm run command -- "pipeline-stage-gate" -- "implementation-prompt"
  ```
* Package approval checklist:
  ```bash
  npm run command -- "pipeline-stage-gate" -- "approval-package"
  ```
* Review stage gate status:
  ```bash
  npm run command -- "pipeline-stage-gate" -- "status"
  ```

---

## 📖 Phase 13F: Pipeline Proposal Approval Router

The **Pipeline Proposal Approval Router** reads the latest pipeline approval package from Phase 13E, validates whether the recommendation is `approve`, creates an approved implementation packet, and prepares a manual execution brief to guide developers safely through the manual implementation execution phase.

### 🔒 Guardrails Summary
1. **APPROVAL_ROUTER_ONLY:** Operates strictly as a documentation and validation router. No script or command execution is allowed.
2. **Approval Checks:** Enforces validation of recommended decisions, ensuring only authorized tasks are routed.
3. **Staged Implementation Packets:** Stages full implementation specifications including scores, safety rules, assigned agents, and manual confirm instructions.
4. **Manual Execution Brief:** Establishes a manual verification gate with detailed not-allowed rules and prompt references.

### 💻 Command Examples
* View help menu:
  ```bash
  npm run command -- "pipeline-approval-router-help"
  ```
* Validate approval package:
  ```bash
  npm run command -- "pipeline-approval-router" -- "validate"
  ```
* Generate approved implementation packet:
  ```bash
  npm run command -- "pipeline-approval-router" -- "approve-packet"
  ```
* Generate manual execution brief:
  ```bash
  npm run command -- "pipeline-approval-router" -- "manual-brief"
  ```
* Check approval router status:
  ```bash
  npm run command -- "pipeline-approval-router" -- "status"
  ```

---

## 📖 Phase 13G: Manual Implementation Packet Compiler

The **Manual Implementation Packet Compiler** reads the approved implementation packet and manual execution brief, then compiles a final one-time manual build prompt, implementation compliance checklist, boundary safety review, and final handoff report. This ensures all safety rules and structures are fully resolved before any manual build tasks commence.

### 🔒 Guardrails Summary
1. **PACKET_COMPILER_ONLY:** Safe compile-time staging only. No local execution or script runner triggers are allowed.
2. **Implementation Compliance Checklist:** Audits components, files lists, and confirmation steps.
3. **Safety Review Audit:** Formulates explicit blocked and allowed parameters to prevent security collisions.
4. **Final Handoff Report:** Packages the final prompt, compliance checklist, and risk metrics for human confirmation.

### 💻 Command Examples
* View help menu:
  ```bash
  npm run command -- "manual-implementation-packet-help"
  ```
* Compile final manual build prompt:
  ```bash
  npm run command -- "manual-implementation-packet" -- "compile-prompt"
  ```
* Generate compliance checklist:
  ```bash
  npm run command -- "manual-implementation-packet" -- "checklist"
  ```
* Generate safety review:
  ```bash
  npm run command -- "manual-implementation-packet" -- "safety-review"
  ```
* Generate final handoff bundle:
  ```bash
  npm run command -- "manual-implementation-packet" -- "handoff"
  ```
* Check compiler status:
  ```bash
  npm run command -- "manual-implementation-packet" -- "status"
  ```

---

## 📖 Phase 14A: ICYFLAMZE CORE Project Registry & Obsidian Sync Gate

The **ICYFLAMZE CORE Project Registry & Obsidian Sync Gate** integrates the ICYFLAMZE CORE universe (under the Street Scholar Futurism niche) into the Brilliantaire OS active capability registry. It establishes localized templates, a command router interface, and a safe staging layer for manual validation before copying files to active Obsidian vaults.

### 🔒 Guardrails Summary
1. **PROJECT_REGISTRY_ONLY:** Local registry and report generation only. Direct Obsidian writes are strictly disabled by default (`ALLOW_OBSIDIAN_DIRECT_WRITE = false`).
2. **Staging Gateway:** Staging files must be generated and verified locally in the `outputs/icyflamze_core/obsidian_staging/` and `outputs/write_staging/` directories.
3. **No Deletions or Overwrites:** Prevents deleting or overriding files without timestamp date suffixes.
4. **No External APIs:** No external API requests, scraping, or automated publishing are executed.

### 💻 Command Examples
* View help menu:
  ```bash
  npm run command -- "icyflamze-core-help"
  ```
* Generate project registry markdown:
  ```bash
  npm run command -- "icyflamze-core" -- "registry"
  ```
* Stage Obsidian notes for manual write:
  ```bash
  npm run command -- "icyflamze-core" -- "obsidian-stage"
  ```
* Generate Season 1 summary report:
  ```bash
  npm run command -- "icyflamze-core" -- "season-summary"
  ```
* Generate integration sync status report:
  ```bash
  npm run command -- "icyflamze-core" -- "sync-report"
  ```
* Check compiler status:
  ```bash
  npm run command -- "icyflamze-core" -- "status"
  ```

---

## 📖 Phase 14B: ICYFLAMZE CORE Season 1 IP Bible

The **Season 1 IP Bible** establishes the definitive narrative, character, visual, symbolic, and marketing rollout properties for the `ICYFLAMZE CORE: Rise of the Street Scholar` universe under the Street Scholar Futurism niche.

### 🔒 Guardrails Summary
1. **IP_BIBLE_ONLY:** Local file compilation only. Direct Obsidian writes are strictly disabled (`ALLOW_OBSIDIAN_DIRECT_WRITE = false`).
2. **Offline Compile Gate:** No automated image generations or external API queries are initiated (`ALLOW_IMAGE_GENERATION = false`, `ALLOW_EXTERNAL_API_CALLS = false`).
3. **Command Router Verification:** Execution is strictly gated under pre-approved Command Router configurations with exact command matching.

### 💻 Command Examples
* View help menu:
  ```bash
  npm run command -- "icyflamze-core-ip-bible-help"
  ```
* Generate IP Bible document:
  ```bash
  npm run command -- "icyflamze-core-ip-bible" -- "bible"
  ```
* Generate character profile:
  ```bash
  npm run command -- "icyflamze-core-ip-bible" -- "character"
  ```
* Generate episode arc mapping:
  ```bash
  npm run command -- "icyflamze-core-ip-bible" -- "episodes"
  ```
* Generate visual style rules:
  ```bash
  npm run command -- "icyflamze-core-ip-bible" -- "visuals"
  ```
* Generate symbol system guidelines:
  ```bash
  npm run command -- "icyflamze-core-ip-bible" -- "symbols"
  ```
* Generate voiceover scripts:
  ```bash
  npm run command -- "icyflamze-core-ip-bible" -- "voiceover"
  ```
* Generate music release strategy:
  ```bash
  npm run command -- "icyflamze-core-ip-bible" -- "music-tie-ins"
  ```
* Generate marketing rollout plan:
  ```bash
  npm run command -- "icyflamze-core-ip-bible" -- "rollout"
  ```
* Stage Obsidian staging note:
  ```bash
  npm run command -- "icyflamze-core-ip-bible" -- "obsidian-stage"
  ```
* Compile compilation audit report:
  ```bash
  npm run command -- "icyflamze-core-ip-bible" -- "report"
  ```
* Display latest compiled output paths:
  ```bash
  npm run command -- "icyflamze-core-ip-bible" -- "status"
  ```

---

## 📖 Phase 14C: Episode 1 Trailer Package Production

The **Episode 1 Trailer Package Production** compiles all physical production blueprints, shot lists, audio cues, copy-paste AI text prompts (Sora/Veo/Runway/Midjourney compatible), social captions, and rollout checklists for Episode 1: *The Core Wakes*.

### 🔒 Guardrails Summary
1. **EPISODE_PACKAGE_ONLY:** Local file compilation only. Direct Obsidian writes are strictly disabled (`ALLOW_OBSIDIAN_DIRECT_WRITE = false`).
2. **No-Generation Boundary:** No automated audio rendering, image generations, or video compile calls are executed (`ALLOW_IMAGE_GENERATION = false`, `ALLOW_AUDIO_GENERATION = false`, `ALLOW_VIDEO_GENERATION = false`).
3. **Command Router Gating:** All subcommands run under strict command router configurations with exact matching.

### 💻 Command Examples
* View help menu:
  ```bash
  npm run command -- "icyflamze-core-episode-1-help"
  ```
* Generate trailer script:
  ```bash
  npm run command -- "icyflamze-core-episode-1" -- "trailer-script"
  ```
* Generate 30-second voiceover guide:
  ```bash
  npm run command -- "icyflamze-core-episode-1" -- "voiceover"
  ```
* Generate 15-second teaser:
  ```bash
  npm run command -- "icyflamze-core-episode-1" -- "teaser"
  ```
* Generate cinematography shot list:
  ```bash
  npm run command -- "icyflamze-core-episode-1" -- "shot-list"
  ```
* Generate image prompt pack:
  ```bash
  npm run command -- "icyflamze-core-episode-1" -- "image-prompts"
  ```
* Generate animation prompt pack:
  ```bash
  npm run command -- "icyflamze-core-episode-1" -- "animation-prompts"
  ```
* Generate audio direction:
  ```bash
  npm run command -- "icyflamze-core-episode-1" -- "audio-direction"
  ```
* Generate cover art direction:
  ```bash
  npm run command -- "icyflamze-core-episode-1" -- "cover-art"
  ```
* Generate social captions:
  ```bash
  npm run command -- "icyflamze-core-episode-1" -- "captions"
  ```
* Generate marketing rollout checklist:
  ```bash
  npm run command -- "icyflamze-core-episode-1" -- "rollout"
  ```
* Stage Obsidian staging note:
  ```bash
  npm run command -- "icyflamze-core-episode-1" -- "obsidian-stage"
  ```
* Compile package generation report:
  ```bash
  npm run command -- "icyflamze-core-episode-1" -- "report"
  ```
* Display latest compiled output paths:
  ```bash
  npm run command -- "icyflamze-core-episode-1" -- "status"
  ```










