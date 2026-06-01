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
* **Exact-Name Rules:** Medium-risk or High-risk commands containing `requiresExactName: true` cannot be run via aliases. They must be typed exactly to ensure explicit developer intent. For example, `notebooklm-response-intelligence` and `notebooklm-grounded-index-graph` enforce exact-name matching, and running them via their registered aliases (e.g., `response intelligence` or `intelligence graph`) is blocked at runtime.
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
| `notebooklm-mcp-harden-help` | `notebook hardening help`, `mcp hardening help` | Knowledge Librarian | Low | No | Print commands for NotebookLM MCP Connector Hardening. |
| `notebooklm-mcp-harden` | `notebook harden`, `mcp harden` | Knowledge Librarian | Medium | Yes | Execute NotebookLM MCP Connector Hardening checks. |
| `notebooklm-mcp-setup-guide-help` | `notebook setup help`, `mcp setup help` | Knowledge Librarian | Low | No | Print commands for NotebookLM MCP Manual Setup Instructions. |
| `notebooklm-mcp-setup-guide` | `notebook setup`, `mcp setup` | Knowledge Librarian | Medium | Yes | Execute NotebookLM MCP Manual Setup Instructions checks. |
| `notebooklm-mcp-readiness-gate-help` | `notebook readiness help`, `mcp readiness help` | Knowledge Librarian | Low | No | Print commands for NotebookLM MCP Setup Review and Readiness Gate. |
| `notebooklm-mcp-readiness-gate` | `notebook readiness`, `mcp readiness` | Knowledge Librarian | Medium | Yes | Execute NotebookLM MCP Setup Review and Readiness Gate checks. |
| `notebooklm-mcp-correction-pack-help` | `notebook correction help`, `mcp correction help` | Knowledge Librarian | Low | No | Print commands for NotebookLM MCP Local Setup Correction Pack. |
| `notebooklm-mcp-correction-pack` | `notebook correction`, `mcp correction` | Knowledge Librarian | Medium | Yes | Execute NotebookLM MCP Local Setup Correction Pack checks. |
| `notebooklm-mcp-completion-review-help` | `notebook completion help`, `mcp completion help` | Knowledge Librarian | Low | No | Print commands for NotebookLM MCP Manual Setup Completion Review. |
| `notebooklm-mcp-completion-review` | `notebook completion`, `mcp completion` | Knowledge Librarian | Medium | Yes | Execute NotebookLM MCP Manual Setup Completion Review checks. |
| `notebooklm-mcp-fix-cycle-help` | `notebook fix help`, `mcp fix help` | Knowledge Librarian | Low | No | Print commands for NotebookLM MCP Setup Fix Cycle. |
| `notebooklm-mcp-fix-cycle` | `notebook fix`, `mcp fix` | Knowledge Librarian | Medium | Yes | Execute NotebookLM MCP Setup Fix Cycle checks. |
| `notebooklm-mcp-verify-loop-help` | `notebook verify help`, `mcp verify help` | Knowledge Librarian | Low | No | Print commands for NotebookLM MCP Setup Verification Loop. |
| `notebooklm-mcp-verify-loop` | `notebook verify`, `mcp verify` | Knowledge Librarian | Medium | Yes | Execute NotebookLM MCP Setup Verification Loop checks. |
| `notebooklm-mcp-secrets-help` | `notebook secrets help`, `mcp secrets help` | Knowledge Librarian | Low | No | Print commands for NotebookLM MCP Local Secrets Staging Guide. |
| `notebooklm-mcp-secrets` | `notebook secrets`, `mcp secrets` | Knowledge Librarian | Medium | Yes | Execute NotebookLM MCP Local Secrets Staging Guide checks. |
| `notebooklm-mcp-local-secrets-help` | `notebook secrets help`, `mcp secrets help` | Knowledge Librarian | Low | No | Print commands for NotebookLM MCP Local Secrets Staging Guide. |
| `notebooklm-mcp-local-secrets` | `notebook secrets`, `mcp secrets` | Knowledge Librarian | Medium | Yes | Execute NotebookLM MCP Local Secrets Staging Guide checks. |
| `notebooklm-mcp-live-help` | `notebook live help`, `mcp live help` | Knowledge Librarian | Low | No | Print commands for NotebookLM MCP Live Adapter Integration. |
| `notebooklm-mcp-live` | `notebook live`, `mcp live` | Knowledge Librarian | Medium | Yes | Execute NotebookLM MCP Live Adapter Integration checks. |
| `notebooklm-response-intelligence-help` | `response intelligence help`, `notebook response help` | Knowledge Librarian | Low | No | Print commands for NotebookLM response intelligence processor. |
| `notebooklm-response-intelligence` | `response intelligence`, `notebook intelligence` | Knowledge Librarian | Medium | Yes | Process NotebookLM responses into staged local intelligence files. |
| `notebooklm-grounded-index-graph-help` | `graph help`, `grounded help`, `notebook graph help` | Knowledge Librarian | Low | No | Print help menu for grounded intelligence graph index. |
| `notebooklm-grounded-index-graph` | `intelligence graph`, `grounded graph`, `notebook graph` | Knowledge Librarian | Medium | Yes | Compile response intelligence files into grounded index graphs. |
| `notebooklm-obsidian-dashboard-sync-help` | `sync help`, `dashboard help` | Knowledge Librarian | Low | No | Print help menu for Obsidian intelligence dashboard sync compiler. |
| `notebooklm-obsidian-dashboard-sync` | `obsidian dashboard`, `dashboard sync` | Knowledge Librarian | Medium | Yes | Populate local Obsidian-ready dashboard markdown files from index graph. |
| `grounded-narrator-review-queue-help` | `narrator queue help`, `narrator brief help` | Knowledge Librarian | Low | No | Print help menu for grounded narrator review queue compiler. |
| `grounded-narrator-review-queue` | `narrator queue`, `review queue` | Knowledge Librarian | Medium | Yes | Compile review-safe narrator briefs and priority lists from dashboards. |
| `voice-safe-narration-approval-gate-help` | `approval gate help`, `voice approval help` | Workflow Auditor | Low | No | Print help menu for voice-safe narration approval gate processor. |
| `voice-safe-narration-approval-gate` | `approval gate`, `voice approval` | Workflow Auditor | Medium | Yes | Scan review queues and compile safe approved/rejected narration manifests. |
| `tts-ready-narration-export-queue-help` | `tts export help`, `export queue help` | Workflow Auditor | Low | No | Print help menu for TTS-ready narration export queue processor. |
| `tts-ready-narration-export-queue` | `tts export`, `export queue` | Workflow Auditor | Medium | Yes | Scan approval manifests and compile clean offline TTS-ready export queues. |
| `grounded-narrator-review-help` | `narrator review help`, `grounded narrator help` | Knowledge Librarian | Low | No | Print help menu for grounded narrator review queue. |
| `grounded-narrator-review` | `narrator review`, `grounded narrator` | Knowledge Librarian | Medium | Yes | Compile local review queue and stage briefs from grounded index graphs. |
| `tts-brief-composer-help` | `tts composer help`, `narrator script help` | Knowledge Librarian | Low | No | Print help menu for offline TTS brief composer. |
| `tts-brief-composer` | `tts composer`, `narrator script` | Knowledge Librarian | Medium | Yes | Read narrator briefs and compile scripts or packets safely offline. |
| `tts-queue-validator-help` | `tts validation help`, `audio queue help` | Build Operator | Low | No | Print help menu for offline TTS queue validator. |
| `tts-queue-validator` | `tts validator`, `audio queue` | Build Operator | Medium | Yes | Verify staged script assets and check TTS generation parameters. |
| `tts-synthesizer-help` | `tts synth help`, `audio synth help` | Build Operator | Low | No | Print help menu for offline local TTS audio synthesizer scaffold. |
| `tts-synthesizer` | `tts synth`, `audio synth` | Build Operator | Medium | Yes | Dry-run validate and scaffold Piper offline local TTS audio generation settings. |
| `tts-model-gate-help` | `model gate help`, `tts model help` | Build Operator | Low | No | Print help menu for offline TTS model readiness gate. |
| `tts-model-gate` | `model gate`, `tts model` | Build Operator | Medium | Yes | Verify local model placements, configurations, and overrides safety. |
| `tts-model-activation-help` | `model activation help`, `tts activation help` | Build Operator | Low | No | Print help menu for offline TTS model activation checks. |
| `tts-model-activation` | `model activation`, `tts activation` | Build Operator | Medium | Yes | Verify manually placed voice files matching config pairs and engine readiness. |
| `tts-model-acquisition-help` | `model acquisition help`, `tts model guide` | Build Operator | Low | No | Print help menu for offline TTS model manual acquisition guides. |
| `tts-model-acquisition` | `model acquisition`, `tts acquisition` | Build Operator | Medium | Yes | Verify model staging checklists manual download instructions and directory inventory. |
| `voice-session-recorder-help` | `voice session help`, `recorder help` | Build Operator | Low | No | Print help menu for offline narrator voice capture staging. |
| `voice-session-recorder` | `voice session`, `recorder` | Build Operator | Medium | Yes | Scaffold manual recording sessions metadata drop checks and reviews. |
| `asr-orchestrator-help` | `asr help`, `whisper help` | Build Operator | Low | No | Print help menu for offline ASR orchestrator safety limits. |
| `asr-orchestrator` | `asr`, `whisper` | Build Operator | Medium | Yes | Verify ASR readiness, prepare job packets, and dry-run Whisper simulations. |
| `asr-model-gate-help` | `asr model help`, `whisper model help` | Build Operator | Low | No | Print help menu for offline ASR model gate safety limits. |
| `asr-model-gate` | `asr model`, `whisper model` | Build Operator | Medium | Yes | Verify local model files manually placed, directory inventories, and cryptographic checksum reviews. |
| `audio-drop-verification-help` | `audio drop help`, `recording check help` | Build Operator | Low | No | Print help menu for offline audio drop verification and cleanup safety limits. |
| `audio-drop-verification` | `audio drop`, `recording check` | Build Operator | Medium | Yes | Validate manually dropped audio files, match sessions, and quarantine unsupported items. |
| `asr-dry-run-transcription-gate-help` | `asr dry run help`, `whisper dry run help` | Build Operator | Low | No | Print help menu for offline ASR dry-run transcription gate. |
| `asr-dry-run-transcription-gate` | `asr dry run`, `whisper dry run` | Build Operator | Medium | Yes | Verify local model presence, inspect staged audio, and map simulated routes without executing transcription. |
| `asr-model-manifest-preparation-gate-help` | `asr manifest help`, `whisper manifest help` | Build Operator | Low | No | Print help menu for offline ASR model manifest preparation gate. |
| `asr-model-manifest-preparation-gate` | `asr manifest`, `whisper manifest` | Build Operator | Medium | Yes | Prepare offline ASR model placement structures, checksum templates, and validators. |
| `asr-checksum-manifest-validation-gate-help` | `asr checksum help`, `whisper checksum help` | Build Operator | Low | No | Print help menu for offline ASR checksum manifest validation gate. |
| `asr-checksum-manifest-validation-gate` | `asr checksum`, `whisper checksum` | Build Operator | Medium | Yes | Validate offline ASR model placement schemas, checksum details, and sizes. |
| `asr-audio-input-staging-validation-gate-help` | `asr audio help`, `whisper audio help` | Build Operator | Low | No | Print help menu for offline ASR audio input staging validation gate. |
| `asr-audio-input-staging-validation-gate` | `asr audio`, `whisper audio` | Build Operator | Medium | Yes | Validate offline ASR local staged audio input files and route previews. |
| `asr-readiness-join-gate-help` | `asr readiness help`, `whisper readiness help` | Build Operator | Low | No | Print help menu for the offline ASR readiness join gate. |
| `asr-readiness-join-gate` | `asr readiness`, `whisper readiness` | Build Operator | Medium | Yes | Integrate offline ASR checksum models and audio input signals into unified readiness manifest. |
| `asr-manual-asset-intake-checklist-help` | `asr intake help`, `whisper intake help` | Build Operator | Low | No | Print help menu for the offline ASR manual asset intake checklist generator. |
| `asr-manual-asset-intake-checklist` | `asr intake`, `whisper intake` | Build Operator | Medium | Yes | Generate manual asset intake checklists, manifest instructions, and validation rerun sequences. |
| `asr-manual-asset-presence-preflight-help` | `asr preflight help`, `whisper preflight help` | Build Operator | Low | Yes | Print help menu for the offline ASR manual asset presence preflight check. |
| `asr-manual-asset-presence-preflight` | `asr preflight`, `whisper preflight` | Build Operator | Medium | Yes | Perform manual asset presence preflight check for offline ASR models and audio inputs. |
| `git-asset-help` | `git asset help`, `repo asset help` | Build Operator | Low | No | Print help menu and policies for Git Asset Guard. |
| `git-asset-audit` | `asset audit`, `repo audit` | Build Operator | Low | No | Run Git Asset Guard scan and policy compliance check. |
| `git-prepush-check` | `prepush check`, `push check` | Build Operator | Low | No | Run prepush TypeScript compiler compile, systems audit, and Git asset checks sequentially. |
| `git-hook-help` | `hook help`, `prepush hook help` | Build Operator | Low | No | Print help menu and policies for Git hooks. |
| `git-hook-status` | `hook status`, `prepush hook status` | Build Operator | Low | No | Audit local Git pre-push hook configuration status. |
| `git-hook-install` | `install hook`, `install prepush hook` | Build Operator | Medium | Yes | Install local Git pre-push hook. |
| `git-hook-uninstall` | `uninstall hook`, `disable prepush hook` | Build Operator | Medium | Yes | Disable local Git pre-push hook. |
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
| `narrator-voice-sync-help` | `narrator voice help`, `voice sync help` | Knowledge Librarian | Low | No | Print help commands for the narrator voice sync controller. |
| `narrator-voice-sync` | `narrator voice`, `sync narrator voice` | Knowledge Librarian | Low | No | Compile voice-ready packets and stage manual VNP voice queue entries. |
| `narrator-tts-queue-help` | `tts queue help`, `narrator tts help` | Knowledge Librarian | Low | No | Print help commands for the narrator tts queue controller. |
| `narrator-tts-queue` | `narrator tts`, `tts queue` | Knowledge Librarian | Medium | Yes | Stage and manage local offline text-to-speech rendering requests. |
| `narrator-tts-renderer-help` | `tts renderer help`, `narrator tts renderer help` | Knowledge Librarian | Low | No | Print help commands for the narrator tts renderer controller. |
| `narrator-tts-renderer` | `narrator tts renderer`, `tts renderer` | Knowledge Librarian | Medium | Yes | Dry-run and compile approved text-to-speech requests to offline audio. |
| `narrator-tts-models-help` | `tts models help`, `narrator tts models help` | Knowledge Librarian | Low | No | Print help commands for the narrator tts model and cache manager. |
| `narrator-tts-models` | `narrator tts models`, `tts models` | Knowledge Librarian | Medium | Yes | Register, verify, and clean up offline speech synthesis assets and cache. |
| `narrator-asr-listener-help` | `asr listener help`, `narrator asr help` | Knowledge Librarian | Low | No | Print help commands for the narrator local ASR command listener. |
| `narrator-asr-listener` | `narrator asr`, `asr listener` | Knowledge Librarian | Medium | Yes | Stage and manage local offline speech-to-text transcription and VNP command packets. |
| `narrator-asr-backend-help` | `asr backend help`, `narrator asr backend help` | Knowledge Librarian | Low | No | Print help commands for the narrator local ASR backend manager. |
| `narrator-asr-backend` | `narrator asr backend`, `asr backend` | Knowledge Librarian | Medium | Yes | Register and verify local ASR binaries and models offline. |
| `narrator-voice-bridge-help` | `voice bridge help`, `narrator voice bridge help` | Knowledge Librarian | Low | No | Print help command menu for the narrator voice command approval bridge. |
| `narrator-voice-bridge` | `voice bridge`, `narrator voice bridge`, `narrator bridge` | Knowledge Librarian | Medium | Yes | Manual approval, validation, staging, and execution bridge for ASR command packets. |
| `narrator-voice-loop-dashboard-help` | `voice loop dashboard help`, `narrator voice loop dashboard help` | Knowledge Librarian | Low | No | Print help command menu for the voice loop dashboard and confirmation UI. |
| `narrator-voice-loop-dashboard` | `voice loop dashboard`, `narrator voice loop dashboard`, `voice loop` | Knowledge Librarian | Medium | Yes | Interactive dashboard and confirmation UI for ASR and Voice Bridge pipelines. |
| `narrator-voice-session-recorder-help` | `voice session recorder help`, `narrator voice session recorder help` | Knowledge Librarian | Low | No | Print help command menu for the narrator voice session recorder. |
| `narrator-voice-session-recorder` | `voice session recorder`, `narrator voice session recorder` | Knowledge Librarian | Medium | Yes | Local offline voice session recorder status, start, stop, and stage commands. |
| `narrator-voice-ops-daily-report` | `voice ops daily report`, `narrator voice ops daily report` | Knowledge Librarian | Medium | Yes | Summarize the day's local voice sessions, ASR transcripts, staged packets, approvals, bridge executions, rejections, blocked attempts, safety events, and dashboard status. |
| `cleanup-gate-help` | `cleanup help`, `duplicate cleanup help` | Workflow Auditor | Low | No | Print help command menu for the duplicate cleanup staging gate. |
| `cleanup-gate` | `cleanup`, `duplicate cleanup` | Workflow Auditor | Medium | Yes | Stage duplicate briefs cleanup plans and scan project registry drift. |
| `quarantine-executor-help` | `quarantine help`, `cleanup quarantine help` | Workflow Auditor | Low | No | Print help command menu for the approved quarantine executor. |
| `quarantine-executor` | `quarantine`, `cleanup quarantine` | Workflow Auditor | High | Yes | Move staged duplicate files into quarantine and verify checksums. |
| `narrator-voice-asr-orchestrator-help` | `voice asr orchestrator help`, `narrator voice asr orchestrator help` | Knowledge Librarian | Low | No | Print help command menu for the narrator voice ASR orchestrator. |
| `narrator-voice-asr-orchestrator` | `voice asr orchestrator`, `narrator voice asr orchestrator` | Knowledge Librarian | Medium | Yes | Local offline voice session to ASR queue dispatch and approval orchestrator. |
| `narrator-voice-lifecycle-audit-help` | `voice lifecycle audit help`, `narrator voice lifecycle audit help` | Knowledge Librarian | Low | No | Print help command menu for the narrator voice session lifecycle auditor. |
| `narrator-voice-lifecycle-audit` | `voice lifecycle audit`, `narrator voice lifecycle audit` | Knowledge Librarian | Medium | Yes | Chronological timeline mapping of voice session recordings, ASR events, and bridge actions. |
| `narrator-voice-ops-daily-report-help` | `voice ops report help`, `narrator voice ops report help` | Knowledge Librarian | Low | Yes | Print help command menu for the daily Voice Ops report generator. |
| `narrator-voice-ops-daily-report` | `voice ops daily report`, `narrator voice ops daily report` | Knowledge Librarian | Medium | Yes | Summarize the day's local voice sessions, ASR transcripts, staged packets, approvals, bridge executions, rejections, blocked attempts, safety events, and dashboard status. |
| `voice-ops-scheduled-briefing-help` | `scheduled briefing help`, `voice ops scheduled briefing help` | Knowledge Librarian | Low | Yes | Print help command menu for the scheduled briefing queue manager. |
| `voice-ops-scheduled-briefing` | `scheduled briefing`, `voice ops scheduled briefing` | Knowledge Librarian | Medium | Yes | Stage, inspect, approve, reject daily briefing jobs, and compile TTS rendering queue requests. |
| `briefing-tts-render-approval-help` | `briefing tts help`, `briefing tts render approval help` | Knowledge Librarian | Low | Yes | Print help command menu for the briefing TTS render approval manager. |
| `briefing-tts-render-approval` | `briefing tts`, `briefing tts render approval` | Knowledge Librarian | Medium | Yes | Briefing TTS render request validation, queue submission, manual approval, and offline Piper rendering. |
| `briefing-audio-playback-review-help` | `briefing audio review help`, `playback review help` | Workflow Auditor | Low | Yes | Print help command menu for the briefing audio playback review gate. |
| `briefing-audio-playback-review` | `briefing audio review`, `playback review` | Workflow Auditor | Medium | Yes | Stage, inspect, mark reviewed, and approve or reject rendered daily briefing audio files under strict no-autoplay constraints. |
| `offline-tts-dry-run-renderer-help` | `tts dry run help`, `dry run help` | Workflow Auditor | Low | Yes | Print help command menu for offline TTS dry-run renderer simulation. |
| `offline-tts-dry-run-renderer` | `tts dry run`, `dry run renderer` | Workflow Auditor | Medium | Yes | Simulate complete offline TTS rendering lifecycle, chunking, voice routing, and duration estimation without audio outputs. |
| `asr-model-gate-help` | `asr model help`, `whisper model help` | Build Operator | Low | No | Print help command menu for offline ASR model gate and checksum gate. |
| `asr-model-gate` | `asr model`, `whisper model` | Build Operator | Medium | Yes | Manual acquisition, verification inventory, and checksum gate for offline Whisper models. |
| `asr-dry-run-transcription-gate-help` | `asr dry run help`, `whisper dry run help` | Build Operator | Low | No | Print help command menu for offline ASR dry-run transcription gate. |
| `asr-dry-run-transcription-gate` | `asr dry run`, `whisper dry run` | Build Operator | Medium | Yes | Verify local model presence, inspect staged audio, and map simulated routes without executing transcription. |
| `asr-model-manifest-preparation-gate-help` | `asr manifest help`, `whisper manifest help` | Build Operator | Low | No | Print help command menu for offline ASR model manifest preparation gate. |
| `asr-model-manifest-preparation-gate` | `asr manifest`, `whisper manifest` | Build Operator | Medium | Yes | Prepare offline ASR model placement structures, checksum templates, and validators. |
| `asr-checksum-manifest-validation-gate-help` | `asr checksum help`, `whisper checksum help` | Build Operator | Low | No | Print help command menu for offline ASR checksum manifest validation gate. |
| `asr-checksum-manifest-validation-gate` | `asr checksum`, `whisper checksum` | Build Operator | Medium | Yes | Validate offline ASR model placement schemas, checksum details, and sizes. |
| `asr-audio-input-staging-validation-gate-help` | `asr audio help`, `whisper audio help` | Build Operator | Low | No | Print help menu for offline ASR audio input staging validation gate. |
| `asr-audio-input-staging-validation-gate` | `asr audio`, `whisper audio` | Build Operator | Medium | Yes | Validate offline ASR local staged audio input files and route previews. |
| `asr-readiness-join-gate-help` | `asr readiness help`, `whisper readiness help` | Build Operator | Low | No | Print help menu for the offline ASR readiness join gate. |
| `asr-readiness-join-gate` | `asr readiness`, `whisper readiness` | Build Operator | Medium | Yes | Integrate offline ASR checksum models and audio input signals into unified readiness manifest. |
| `asr-manual-asset-intake-checklist-help` | `asr intake help`, `whisper intake help` | Build Operator | Low | No | Print help menu for the offline ASR manual asset intake checklist generator. |
| `asr-manual-asset-intake-checklist` | `asr intake`, `whisper intake` | Build Operator | Medium | Yes | Generate manual asset intake checklists, manifest instructions, and validation rerun sequences. |
| `asr-manual-asset-presence-preflight-help` | `asr preflight help`, `whisper preflight help` | Build Operator | Low | Yes | Print help menu for the offline ASR manual asset presence preflight check. |
| `asr-manual-asset-presence-preflight` | `asr preflight`, `whisper preflight` | Build Operator | Medium | Yes | Perform manual asset presence preflight check for offline ASR models and audio inputs. |
| `briefing-delivery-package-exporter-help` | `briefing delivery help`, `exporter help` | Workflow Auditor | Low | Yes | Print help command menu for the briefing delivery package exporter. |
| `briefing-delivery-package-exporter` | `briefing delivery`, `delivery exporter` | Workflow Auditor | Medium | Yes | Package approved briefing audio, source daily reports, review metadata, and checksums into local folders. |
| `manual-delivery-handoff-help` | `manual delivery help`, `handoff help` | Workflow Auditor | Low | Yes | Print help command menu for the manual delivery handoff and checklist manager. |
| `manual-delivery-handoff` | `manual delivery`, `handoff manager` | Workflow Auditor | Medium | Yes | Create and manage delivery handoff checklists, sign off manual handoff records, and check package checksum integrity. |
| `delivery-archive-retention-help` | `archive help`, `retention help` | Workflow Auditor | Low | Yes | Print help command menu for the delivery archive and retention ledger manager. |
| `delivery-archive-retention` | `delivery archive`, `retention ledger` | Workflow Auditor | Medium | Yes | Ingest approved manual handoffs to retention ledger, verify archive checksums, run retention reviews, and export ledger. |
| `voice-ops-release-closure-help` | `release closure help`, `ops closure help` | Workflow Auditor | Low | Yes | Print help menu for the voice ops release closure report manager. |
| `voice-ops-release-closure` | `voice release closure`, `release closure` | Workflow Auditor | Medium | Yes | Compile completed phases (N5A - N5P), index artifacts, audit safety, and generate final release closure report. |
| `voice-ops-freeze-snapshot-help` | `voice freeze snapshot help`, `freeze snapshot help`, `voice-ops freeze snapshot help` | Workflow Auditor | Low | Yes | Print help menu for the voice ops freeze tag and recovery snapshot manager. |
| `voice-ops-freeze-snapshot` | `voice freeze snapshot`, `freeze snapshot`, `voice-ops freeze snapshot` | Workflow Auditor | Medium | Yes | Capture stable voice ops release state, export JSON/MD manifests, generate recovery checklist, and verify integrity. |
| `project-registry-review-help` | `registry help`, `project drift help` | Workflow Auditor | Low | No | Print help command menu for the local project registry drift review system. |
| `project-registry-review` | `registry review`, `project drift` | Workflow Auditor | Medium | Yes | Scan roots, classify project folders, score importance, and stage PROJECTS.md candidate entries. |
| `project-registry-append-gate-help` | `registry append help`, `append gate help` | Workflow Auditor | Low | No | Print help command menu for the local project registry append gate. |
| `project-registry-append-gate` | `registry append`, `append projects` | Workflow Auditor | High | Yes | Safely append approved staged registry candidate entries to PROJECTS.md. |
| `project-registry-health-monitor-help` | `registry health help`, `project health help` | Workflow Auditor | Low | No | Print help command menu for the local projects registry health monitor. |
| `project-registry-health-monitor` | `registry health`, `project health` | Workflow Auditor | Medium | Yes | Verify projects registry integrity, skipped candidates, and quarantine status. |
| `project-registry-duplicate-resolution-help` | `duplicate registry help`, `registry duplicate help` | Workflow Auditor | Low | No | Print help command menu for the local projects registry duplicate resolution gate. |
| `project-registry-duplicate-resolution` | `duplicate registry`, `registry duplicate` | Workflow Auditor | High | Yes | Stage and resolve duplicate project registry entries in PROJECTS.md. |
| `quarantine-deletion-readiness-help` | `deletion readiness help`, `quarantine deletion help` | Workflow Auditor | Low | No | Print help command menu for the local quarantine deletion readiness staging gate. |
| `quarantine-deletion-readiness` | `deletion readiness`, `quarantine deletion` | Workflow Auditor | Medium | Yes | Stage deletion readiness audits for quarantined duplicate files. |


| `grinders-keep-daily-brief` | *(none)* | OS Architect | Low | Yes | Generate daily creative intelligence brief summarizing projects, money moves, lessons, and gaps. |
| `grinders-keep-daily-brief-help` | *(none)* | OS Architect | Low | Yes | Print help documentation for Grinders Keep creative R&D engine commands. |
| `grinders-keep-adaptive-loop` | *(none)* | OS Architect | Low | Yes | Run v0.1 Adaptive Learning Loop to analyze stale outputs, blockers, and build signals. |
| `grinders-keep-vault-awareness` | *(none)* | OS Architect | Low | Yes | Scan candidate Obsidian and workspace folder roles and report status safely. |
| `grinders-keep-content-drafts` | *(none)* | Creative Revenue Strategist | Low | Yes | Generate local-only smart content drafts (Icyflamze ideas, build updates, newsletter notes). |
| `grinders-keep-consensus-packet` | *(none)* | OS Architect | Low | Yes | Stage multi-model agent consensus review templates for ChatGPT, Gemini, Claude, and NotebookLM. |
| `grinders-keep-gap-hunter` | *(none)* | Workflow Auditor | Low | Yes | Scan real local project data to identify gaps, stale outputs, duplicates, blocked phases, routing issues, and monetization opportunities. |
| `grinders-keep-gap-hunter-help` | *(none)* | Workflow Auditor | Low | Yes | Print help documentation for Grinders Keep Gap Hunter engine commands. |
| `grinders-keep-adaptive-learning-deepener` | *(none)* | Workflow Auditor | Low | Yes | Run v0.1 Adaptive Learning Deepener to compare gap records, analyze behavior signals, recommend habits, and stage adjustments. |
| `grinders-keep-adaptive-learning-deepener-help` | *(none)* | Workflow Auditor | Low | Yes | Print help documentation for Grinders Keep Adaptive Learning Deepener engine commands. |




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
