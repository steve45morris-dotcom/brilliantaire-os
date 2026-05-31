# Background Scheduler Status
Last updated: 2026-05-31T11:50:18.747Z

## 📊 Scheduler Health
- **Successful runs**: 2
- **Failed runs**: 0
- **Skipped runs**: 0
- **Average runtime**: 94ms
- **Concurrent Execution State**: Idle

## ⏰ Registered Schedules
| Schedule Name | Routine | Frequency | Status | Last Run | Next Run |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Daily Audit Check | daily-check | daily | active | Never | 2026-05-31T16:00:00.000Z |
| Campaign Check | campaign-check | weekly | active | Never | 2026-06-07T11:37:26.329Z |
| Voice Check | voice-check | cron | active | Never | 2026-05-31T11:55:00.000Z |

## 🔒 Safety Verification
- **Approved Routines Restriction**: Verified (Only `daily-check`, `campaign-check`, `voice-check` permitted).
- **Execution Limit Enforcement**: Active (Max 5 per day, Max 1 concurrent).
- **Commands Allowlist Check**: Active (Reads COMMANDS.md list on tick).
