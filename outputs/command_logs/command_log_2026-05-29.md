## [2026-05-29T16:43:44.553Z] Command: "brief"
- **Matched Command:** `brief`
- **Alias Used:** `false`
- **Owning Agent:** `OS Architect`
- **Risk Level:** `low`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:43:59.192Z] Command: "next"
- **Matched Command:** `next`
- **Alias Used:** `false`
- **Owning Agent:** `Action Router`
- **Risk Level:** `low`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:44:17.050Z] Command: "agents"
- **Matched Command:** `agents`
- **Alias Used:** `false`
- **Owning Agent:** `OS Architect`
- **Risk Level:** `low`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:44:25.551Z] Command: "build"
- **Matched Command:** `build`
- **Alias Used:** `false`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `low`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:44:31.667Z] Command: "unknown-test"
- **Matched Command:** `None (Unknown Command)`
- **Result Status:** `Error: Unknown Command`
- **Exit Code:** `1`

---

## [2026-05-29T16:44:47.329Z] Command: "obsidian"
- **Matched Command:** `ingest`
- **Alias Used:** `true`
- **Owning Agent:** `Knowledge Librarian`
- **Risk Level:** `medium`
- **Result Status:** `Blocked: Alias used on Medium Risk`
- **Exit Code:** `1`

---

## [2026-05-29T16:44:58.618Z] Command: "ingest"
- **Matched Command:** `ingest`
- **Alias Used:** `false`
- **Owning Agent:** `Knowledge Librarian`
- **Risk Level:** `medium`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:51:57.763Z] Command Attempt: "brief"
- **Matched Command:** `brief`
- **Alias Used:** `false`
- **Owning Agent:** `OS Architect`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:52:14.786Z] Command Attempt: "next"
- **Matched Command:** `next`
- **Alias Used:** `false`
- **Owning Agent:** `Action Router`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:52:21.943Z] Command Attempt: "agents"
- **Matched Command:** `agents`
- **Alias Used:** `false`
- **Owning Agent:** `OS Architect`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:52:28.267Z] Command Attempt: "build"
- **Matched Command:** `build`
- **Alias Used:** `false`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:52:37.952Z] Command Attempt: "unknown-test"
- **Matched Command:** `None (Unknown Command)`
- **Result Status:** `Error: Unknown Command`
- **Exit Code:** `1`

---

## [2026-05-29T16:52:51.883Z] Command Attempt: "stage"
- **Matched Command:** `stage-write`
- **Alias Used:** `true`
- **Owning Agent:** `Knowledge Librarian`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Blocked: Alias Used for Exact Name`
- **Exit Code:** `1`

---

## [2026-05-29T16:53:03.740Z] Command Attempt: "approve-write"
- **Matched Command:** `approve-write`
- **Alias Used:** `false`
- **Owning Agent:** `Knowledge Librarian`
- **Risk Level:** `high`
- **Confirmed:** `false`
- **Result Status:** `Blocked: Missing Confirmation Flag`
- **Exit Code:** `1`

---

## [2026-05-29T16:53:15.328Z] Command Attempt: "approve-write --confirm"
- **Matched Command:** `approve-write`
- **Alias Used:** `false`
- **Owning Agent:** `Knowledge Librarian`
- **Risk Level:** `high`
- **Confirmed:** `true`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T17:08:21.749Z] Command Attempt: "campaign"
- **Matched Command:** `campaign`
- **Alias Used:** `false`
- **Owning Agent:** `Creative Revenue Strategist`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Failed`
- **Exit Code:** `1`

---

## [2026-05-29T17:08:25.481Z] Command Attempt: "campaigns"
- **Matched Command:** `campaign`
- **Alias Used:** `true`
- **Owning Agent:** `Creative Revenue Strategist`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Blocked: Alias Used for Exact Name`
- **Exit Code:** `1`

---

## [2026-05-29T17:08:39.208Z] Command Attempt: "campaign brief sporty"
- **Matched Command:** `None (Unknown Command)`
- **Result Status:** `Error: Unknown Command`
- **Exit Code:** `1`

---

## [2026-05-29T17:08:55.349Z] Command Attempt: "campaign brief sporty"
- **Matched Command:** `campaign`
- **Alias Used:** `false`
- **Owning Agent:** `Creative Revenue Strategist`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Failed`
- **Exit Code:** `1`

---

## [2026-05-29T17:09:16.460Z] Command Attempt: "campaign brief sporty"
- **Matched Command:** `campaign`
- **Alias Used:** `false`
- **Owning Agent:** `Creative Revenue Strategist`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T17:09:22.404Z] Command Attempt: "campaign-help"
- **Matched Command:** `campaign-help`
- **Alias Used:** `false`
- **Owning Agent:** `Creative Revenue Strategist`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T17:13:12.526Z] Command Attempt: "campaign street-script sporty"
- **Matched Command:** `campaign`
- **Alias Used:** `false`
- **Owning Agent:** `Creative Revenue Strategist`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T17:21:27.871Z] Command Attempt: "daily-brief"
- **Matched Command:** `daily-brief`
- **Alias Used:** `false`
- **Owning Agent:** `Action Router`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T17:21:42.145Z] Command Attempt: "voice-help"
- **Matched Command:** `voice-help`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T17:21:51.455Z] Command Attempt: "voice"
- **Matched Command:** `voice-queue`
- **Alias Used:** `true`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Blocked: Alias Used for Exact Name`
- **Exit Code:** `1`

---

## [2026-05-29T17:22:03.852Z] Command Attempt: "voice-queue"
- **Matched Command:** `voice-queue`
- **Alias Used:** `false`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T17:29:55.170Z] Command Attempt: "daily-brief"
- **Matched Command:** `daily-brief`
- **Alias Used:** `false`
- **Owning Agent:** `Action Router`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T17:38:39.816Z] Command Attempt: "campaign brief sporty"
- **Matched Command:** `campaign`
- **Alias Used:** `false`
- **Owning Agent:** `Creative Revenue Strategist`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T17:39:16.762Z] Command Attempt: "voice-pending"
- **Matched Command:** `voice-pending`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T17:39:24.070Z] Command Attempt: "voice-confirm"
- **Matched Command:** `voice-confirm`
- **Alias Used:** `false`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `high`
- **Confirmed:** `false`
- **Result Status:** `Blocked: Missing Confirmation Flag`
- **Exit Code:** `1`

---

## [2026-05-29T17:50:48.245Z] Command Attempt: "campaign brief sporty"
- **Matched Command:** `campaign`
- **Alias Used:** `false`
- **Owning Agent:** `Creative Revenue Strategist`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T18:01:07.744Z] Command Attempt: "daily-brief"
- **Matched Command:** `daily-brief`
- **Alias Used:** `false`
- **Owning Agent:** `Action Router`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T18:01:21.409Z] Command Attempt: "vibevoice-help"
- **Matched Command:** `vibevoice-help`
- **Alias Used:** `false`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T18:01:37.216Z] Command Attempt: "vibevoice-transcript"
- **Matched Command:** `vibevoice-transcript`
- **Alias Used:** `false`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T18:01:45.168Z] Command Attempt: "transcribe voice"
- **Matched Command:** `vibevoice-transcript`
- **Alias Used:** `true`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Blocked: Alias Used for Exact Name`
- **Exit Code:** `1`

---

## [2026-05-29T18:24:38.058Z] Command Attempt: "daily-brief"
- **Matched Command:** `daily-brief`
- **Alias Used:** `false`
- **Owning Agent:** `Action Router`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T18:24:55.836Z] Command Attempt: "live-asr-help"
- **Matched Command:** `live-asr-help`
- **Alias Used:** `false`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T18:25:02.031Z] Command Attempt: "live-asr-import"
- **Matched Command:** `live-asr-import`
- **Alias Used:** `false`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T18:25:12.849Z] Command Attempt: "import voice"
- **Matched Command:** `live-asr-import`
- **Alias Used:** `true`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Blocked: Alias Used for Exact Name`
- **Exit Code:** `1`

---

## [2026-05-29T19:23:06.353Z] Command Attempt: "campaign-scheduler-help"
- **Matched Command:** `campaign-scheduler-help`
- **Alias Used:** `false`
- **Owning Agent:** `Creative Revenue Strategist`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T19:23:23.233Z] Command Attempt: "campaign-scheduler"
- **Matched Command:** `campaign-scheduler`
- **Alias Used:** `false`
- **Owning Agent:** `Creative Revenue Strategist`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T20:33:20.640Z] Command Attempt: "scheduler"
- **Matched Command:** `campaign-scheduler`
- **Alias Used:** `true`
- **Owning Agent:** `Creative Revenue Strategist`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Blocked: Alias Used for Exact Name`
- **Exit Code:** `1`

---

## [2026-05-29T20:58:32.452Z] Command Attempt: "campaign-simulate-help"
- **Matched Command:** `campaign-simulate-help`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T20:58:39.595Z] Command Attempt: "campaign-simulate"
- **Matched Command:** `campaign-simulate`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T20:58:46.602Z] Command Attempt: "simulate campaign"
- **Matched Command:** `campaign-simulate`
- **Alias Used:** `true`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Blocked: Alias Used for Exact Name`
- **Exit Code:** `1`

---

## [2026-05-29T21:17:57.513Z] Command Attempt: "mesh-telemetry-help"
- **Matched Command:** `mesh-telemetry-help`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:18:06.117Z] Command Attempt: "mesh-telemetry"
- **Matched Command:** `mesh-telemetry`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:18:12.180Z] Command Attempt: "telemetry"
- **Matched Command:** `mesh-telemetry`
- **Alias Used:** `true`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Blocked: Alias Used for Exact Name`
- **Exit Code:** `1`

---

## [2026-05-29T21:30:35.134Z] Command Attempt: "dashboard-export"
- **Matched Command:** `dashboard-export`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:30:56.710Z] Command Attempt: "dashboard-build"
- **Matched Command:** `dashboard-build`
- **Alias Used:** `false`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:45:04.261Z] Command Attempt: "audit"
- **Matched Command:** `audit`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:45:05.828Z] Command Attempt: "brief"
- **Matched Command:** `brief`
- **Alias Used:** `false`
- **Owning Agent:** `OS Architect`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:45:07.386Z] Command Attempt: "next"
- **Matched Command:** `next`
- **Alias Used:** `false`
- **Owning Agent:** `Action Router`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:45:09.092Z] Command Attempt: "mesh-telemetry snapshot"
- **Matched Command:** `mesh-telemetry`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:45:10.644Z] Command Attempt: "mesh-telemetry report"
- **Matched Command:** `mesh-telemetry`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:45:12.219Z] Command Attempt: "dashboard-export"
- **Matched Command:** `dashboard-export`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:45:31.551Z] Command Attempt: "campaign-simulate status sporty"
- **Matched Command:** `campaign-simulate`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Failed`
- **Exit Code:** `1`

---

## [2026-05-29T21:47:00.598Z] Command Attempt: "campaign-simulate status sporty"
- **Matched Command:** `campaign-simulate`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:47:02.306Z] Command Attempt: "mesh-telemetry campaign sporty"
- **Matched Command:** `mesh-telemetry`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:47:04.219Z] Command Attempt: "dashboard-export"
- **Matched Command:** `dashboard-export`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:47:22.793Z] Command Attempt: "voice-pending"
- **Matched Command:** `voice-pending`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:47:24.541Z] Command Attempt: "mesh-telemetry report"
- **Matched Command:** `mesh-telemetry`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:47:26.491Z] Command Attempt: "dashboard-export"
- **Matched Command:** `dashboard-export`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:47:39.386Z] Command Attempt: "automation-help"
- **Matched Command:** `automation-help`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:47:58.919Z] Command Attempt: "audit"
- **Matched Command:** `audit`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:48:01.247Z] Command Attempt: "brief"
- **Matched Command:** `brief`
- **Alias Used:** `false`
- **Owning Agent:** `OS Architect`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:48:03.218Z] Command Attempt: "next"
- **Matched Command:** `next`
- **Alias Used:** `false`
- **Owning Agent:** `Action Router`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:48:05.348Z] Command Attempt: "mesh-telemetry snapshot"
- **Matched Command:** `mesh-telemetry`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:48:07.328Z] Command Attempt: "mesh-telemetry report"
- **Matched Command:** `mesh-telemetry`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:48:09.064Z] Command Attempt: "dashboard-export"
- **Matched Command:** `dashboard-export`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:48:09.216Z] Command Attempt: "automation-runner daily-check"
- **Matched Command:** `automation-runner`
- **Alias Used:** `false`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T21:48:35.660Z] Command Attempt: "run automation daily-check"
- **Matched Command:** `automation-runner`
- **Alias Used:** `true`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Blocked: Alias Used for Exact Name`
- **Exit Code:** `1`

---

## [2026-05-29T22:01:29.646Z] Command Attempt: "audit"
- **Matched Command:** `audit`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:01:31.238Z] Command Attempt: "brief"
- **Matched Command:** `brief`
- **Alias Used:** `false`
- **Owning Agent:** `OS Architect`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:01:32.814Z] Command Attempt: "next"
- **Matched Command:** `next`
- **Alias Used:** `false`
- **Owning Agent:** `Action Router`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:01:34.404Z] Command Attempt: "mesh-telemetry snapshot"
- **Matched Command:** `mesh-telemetry`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:01:36.002Z] Command Attempt: "mesh-telemetry report"
- **Matched Command:** `mesh-telemetry`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:01:37.602Z] Command Attempt: "dashboard-export"
- **Matched Command:** `dashboard-export`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:01:53.743Z] Command Attempt: "campaign-simulate status sporty"
- **Matched Command:** `campaign-simulate`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:01:55.311Z] Command Attempt: "mesh-telemetry campaign sporty"
- **Matched Command:** `mesh-telemetry`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:01:56.873Z] Command Attempt: "dashboard-export"
- **Matched Command:** `dashboard-export`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:02:07.970Z] Command Attempt: "voice-pending"
- **Matched Command:** `voice-pending`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:02:09.547Z] Command Attempt: "mesh-telemetry report"
- **Matched Command:** `mesh-telemetry`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:02:11.110Z] Command Attempt: "dashboard-export"
- **Matched Command:** `dashboard-export`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:02:22.793Z] Command Attempt: "automation-help"
- **Matched Command:** `automation-help`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:02:33.088Z] Command Attempt: "audit"
- **Matched Command:** `audit`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:02:34.656Z] Command Attempt: "brief"
- **Matched Command:** `brief`
- **Alias Used:** `false`
- **Owning Agent:** `OS Architect`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:02:36.222Z] Command Attempt: "next"
- **Matched Command:** `next`
- **Alias Used:** `false`
- **Owning Agent:** `Action Router`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:02:37.797Z] Command Attempt: "mesh-telemetry snapshot"
- **Matched Command:** `mesh-telemetry`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:02:39.371Z] Command Attempt: "mesh-telemetry report"
- **Matched Command:** `mesh-telemetry`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:02:40.951Z] Command Attempt: "dashboard-export"
- **Matched Command:** `dashboard-export`
- **Alias Used:** `false`
- **Owning Agent:** `Workflow Auditor`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:02:40.998Z] Command Attempt: "automation-runner daily-check"
- **Matched Command:** `automation-runner`
- **Alias Used:** `false`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T22:02:56.465Z] Command Attempt: "run automation daily-check"
- **Matched Command:** `automation-runner`
- **Alias Used:** `true`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Blocked: Alias Used for Exact Name`
- **Exit Code:** `1`

---

