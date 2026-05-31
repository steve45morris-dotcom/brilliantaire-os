# Background Scheduler Status
Last updated: 2026-05-31T13:37:30.016Z

## 📊 Scheduler Health
- **Successful runs**: 3
- **Failed runs**: 0
- **Skipped runs**: 0
- **Average runtime**: 194ms
- **Concurrent Execution State**: Idle

## ⏰ Registered Schedules
| Schedule Name | Routine | Frequency | Status | Last Run | Next Run |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Daily Audit Check | daily-check | daily | active | 2026-05-31T13:37:29.589Z | 2026-05-31T17:02:36.987Z |
| Campaign Check | campaign-check | weekly | active | Never | 2026-06-06T17:03:15.833Z |
| Voice Check | voice-check | cron (`*/5 * * * *`) | active | Never | 2026-05-30T17:05:00.000Z |
| Security Audit | security-audit | daily | active | Never | 2026-06-01T09:31:43.586Z |
| Sandbox Sweep | sandbox-sweep | weekly | active | Never | 2026-06-07T09:31:43.587Z |
| Launchpad Build Check | launchpad-build-check | daily | active | Never | 2026-06-01T09:31:43.587Z |
| Home Sync | home-sync | daily | active | Never | 2026-06-01T09:45:41.143Z |
| Stripe Ledger Sync | ledger-sync | weekly | active | Never | 2026-06-07T09:45:41.145Z |

## 🔒 Safety Verification
- **Approved Routines Restriction**: Verified (Only `daily-check`, `campaign-check`, `voice-check` permitted).
- **Execution Limit Enforcement**: Active (Max 5 per day, Max 1 concurrent).
- **Commands Allowlist Check**: Active (Reads `COMMANDS.md` list on tick).
