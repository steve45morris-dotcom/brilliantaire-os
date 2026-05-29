# Unified System Telemetry Report

- **Report Date:** 2026-05-29
- **System Phase:** Phase 8A: Local Automation Runner
- **Inputs Checked:** Command Logs (`outputs/command_logs`), Voice Logs (`outputs/voice_command_logs`), Confirmation Logs (`outputs/voice_confirmation_logs`), ASR/VibeVoice Logs, Write Logs (`outputs/write_logs`), Campaign Outputs

## Activity & Command Logs Analysis

### Command Activity
- **Total Command Attempts:** 68
- **Successful Gated Script Runs:** 0
- **Blocked / Risk Boundary Violations:** 0

### Voice Activity
- **Total Voice Command Dispatch Runs:** 0
- **Accepted & Executed Immediately (Low Risk):** 0
- **Quarantined / Held for Manual Review (Med/High Risk):** 0
- **Rejected (Unknown voice command phrases):** 0
- **Voice Confirmations Approved (Human Released):** 2
- **Voice Confirmations Rejected (Human Dismissed):** 2

### Campaign Activity
- **Campaign Schedule Timeline Drafts:** 1
- **Daily Staging Posting Queues:** 1
- **Daily Manual Verification Logs:** 1
- **Total Campaign Generation Runs:** 3

### Validation Scores
- **Latest Audited Campaign Readiness:** 100% - Ready for manual execution (85 - 100)

### Risk Events
- **Total Logged Mesh Anomalies / Safe Rejections:** 2
- **Blocked commands count:** 0
- **Rejected voice transcript phrases:** 0
- **Denied confirmation requests:** 2

### Obsidian Write Logs
- **Obsidian approved write operations logged:** 0

### Recommendations
1. Periodic check of rejected Live ASR files under `voice_input/live_logs/rejected/` to audit microphone stream clarity.
2. Execute pending confirmation requests using `npm run command -- "voice-confirm"` or reject via `npm run command -- "voice-deny"`.
3. Perform manual execution logs check inside `outputs/campaigns/execution_logs/` to track actual daily posts.
