# 🎙️ Voice Command Queue Architecture

This document outlines the design, security boundaries, and mapping specifications for voice command handling in **Brilliantaire OS**.

---

## 1. Purpose

The **Voice Command Queue** provides a secure translation layer mapping spoken phrase transcripts to pre-approved Command Router endpoints. This decouples speech-to-text recognition from command execution and enforces strict validation gates.

---

## 2. Why Queue-Based Voice is Safer Than Live Daemon Control

Traditional live listening scripts often execute raw speech strings dynamically in shell sub-processes. This creates high risk for:
* **Accidental triggers:** Environmental noise or conversations executing commands.
* **Prompt injection:** Transcribing a voice that says "delete everything" and running it directly.
* **Resource exhaustion:** Spawning multiple processes in parallel.

Our **Queue-Based Architecture** resolves this by separating the bridge into two isolated layers:
1. **Transcriber Layer (VibeVoice ASR):** Listens to microphone input, transcribes spoken text, and writes it to static `.txt` files in `voice_queue/inbox/`.
2. **Processor Layer (Voice Queue):** Reads files, normalizes input, checks mapping records, validates safety rules, forwards only whitelisted commands to the router, and moves files to appropriate folders.

---

## 3. Allowed Voice Phrases Registry

The active voice phrases are defined in [config/voice-commands.ts](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/config/voice-commands.ts):

| Mapped Phrase | Normalized Match | Router Command | Owning Agent | Risk Level | Requires Confirmation |
|---|---|---|---|---|---|
| `show daily brief` | `show daily brief` | `daily-brief` | Action Router | Low | No |
| `run audit` | `run audit` | `audit` | Workflow Auditor | Low | No |
| `show next actions` | `show next actions` | `next` | Action Router | Low | No |
| `show agents` | `show agents` | `agents` | OS Architect | Low | No |
| `show campaign help` | `show campaign help` | `campaign-help` | Creative Revenue Strategist | Low | No |
| `scan obsidian` | `scan obsidian` | `ingest` | Knowledge Librarian | Medium | Yes |
| `stage write` | `stage write` | `stage-write` | Knowledge Librarian | Medium | Yes |
| `approve write` | `approve write` | `approve-write` | Knowledge Librarian | High | Yes |
| `create sporty brief` | `create sporty brief` | `campaign brief sporty` | Creative Revenue Strategist | Medium | Yes |
| `create sporty calendar` | `create sporty calendar` | `campaign calendar sporty` | Creative Revenue Strategist | Medium | Yes |
| `create sporty street script` | `create sporty street script` | `campaign street-script sporty` | Creative Revenue Strategist | Medium | Yes |
| `create sporty checklist` | `create sporty checklist` | `campaign checklist sporty` | Creative Revenue Strategist | Medium | Yes |
| `show higgsfield status` | `show higgsfield status` | `higgsfield-ai status` | Creative Architect | Low | No |
| `show higgsfield help` | `show higgsfield help` | `higgsfield-ai-help` | Creative Architect | Low | No |
| `show inference status` | `show inference status` | `local-inference status` | Prompt Engineer | Low | No |
| `show inference help` | `show inference help` | `local-inference-help` | Prompt Engineer | Low | No |

---

## 4. Safety & Confirmation Rules

* **Risk Level Limits:** Only **LOW** risk commands that do not require confirmation can run automatically via queue execution.
* **Confirmation Gate:** Any command flagged with `requiresConfirmation: true` is blocked from automatic run. The processing script will hold it, move the command file to `voice_queue/pending_confirmation/`, and output the exact command needed to run it manually.
* **Normalization Logic:** Punctuation is stripped, whitespaces are trimmed, characters are lowercased, and duplicate spaces are collapsed to ensure robust matching.

---

## 5. Execution Examples

* Check the registered voice phrases table:
  ```bash
  npm run command -- "voice-help"
  ```
* Run queue execution check manually:
  ```bash
  npm run command -- "voice-queue"
  ```

---

## 6. Future VibeVoice Bridge Integration

Once live vocal control is approved, a hands-free background worker utilizing the VibeVoice ASR bridge will stream microphone input, process speech-to-text using local models (e.g., Whisper), and write command text directly to `voice_queue/inbox/`. The voice queue processor will then consume them securely.
