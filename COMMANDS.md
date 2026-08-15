# 🛡️ Safe Command Router Allowlist Registry

This file documents all approved commands registered inside the Safe Command Router policy config (`config/commands.ts`). Any command run via the OS must go through the router block `npm run command -- "<command>"`.

## Command Registry

### 1. `automation-help`
- **Key/Name**: `automation-help`
- **Aliases**: `automation list`, `routine help`
- **Requires Exact Name**: `false`
- **npm Script**: `automation-help` (runs `scripts/automation-help.ts`)
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Enabled**: `true`
- **Description**: Prints available routines, descriptions, owners, risk levels, and command counts.

### 2. `automation-runner`
- **Key/Name**: `automation-runner`
- **Aliases**: `run automation`, `routine`
- **Requires Exact Name**: `true`
- **npm Script**: `automation-runner` (runs `scripts/automation-runner.ts`)
- **Owning Agent**: `Build Operator`
- **Risk Level**: `medium`
- **Enabled**: `true`
- **Description**: Executes approved maintenance routines in sequence and logs the results.


### 3. `automation-metrics`
- **Key/Name**: `automation-metrics`
- **Aliases**: None
- **Requires Exact Name**: `false`
- **npm Script**: `automation-metrics` (runs `scripts/telemetry_layer.ts --metrics`)
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Enabled**: `true`
- **Description**: Displays daily scorecard metrics (executions, success rate, time saved) and weekly stats.

### 4. `automation-health`
- **Key/Name**: `automation-health`
- **Aliases**: None
- **Requires Exact Name**: `false`
- **npm Script**: `automation-health` (runs `scripts/telemetry_layer.ts --health`)
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Enabled**: `true`
- **Description**: Displays routine health evaluation and average script runtime checks.

### 5. `automation-history`
- **Key/Name**: `automation-history`
- **Aliases**: None
- **Requires Exact Name**: `false`
- **npm Script**: `automation-history` (runs `scripts/telemetry_layer.ts --history`)
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Enabled**: `true`
- **Description**: Lists historical routine runs with timestamps, duration, and status.

### 6. `automation-effectiveness`
- **Key/Name**: `automation-effectiveness`
- **Aliases**: None
- **Requires Exact Name**: `false`
- **npm Script**: `automation-effectiveness` (runs `scripts/telemetry_layer.ts --effectiveness`)
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Enabled**: `true`
- **Description**: Answers structural effectiveness metrics to prevent routine sprawl.

### 7. `automation-scoreboard`
- **Key/Name**: `automation-scoreboard`
- **Aliases**: None
- **Requires Exact Name**: `false`
- **npm Script**: `automation-scoreboard` (runs `scripts/telemetry_layer.ts --scoreboard`)
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Enabled**: `true`
- **Description**: Formulates composite Automation Score across Reliability, Usage, Time Saved, Error Rate, and Adoption.

### 8. `list-schedules`
- **Key/Name**: `list-schedules`
- **Aliases**: None
- **Requires Exact Name**: `false`
- **npm Script**: `list-schedules` (runs `scripts/scheduler_layer.ts --list`)
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Enabled**: `true`
- **Description**: Displays registered schedule name, routine, frequency, status, last run, and next run.

### 9. `create-schedule`
- **Key/Name**: `create-schedule`
- **Aliases**: None
- **Requires Exact Name**: `false`
- **npm Script**: `create-schedule` (runs `scripts/scheduler_layer.ts --create`)
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Enabled**: `true`
- **Description**: Registers a new scheduled trigger for approved routines.

### 10. `pause-schedule`
- **Key/Name**: `pause-schedule`
- **Aliases**: None
- **Requires Exact Name**: `false`
- **npm Script**: `pause-schedule` (runs `scripts/scheduler_layer.ts --pause`)
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Enabled**: `true`
- **Description**: Temporarily disables a schedule's trigger.

### 11. `resume-schedule`
- **Key/Name**: `resume-schedule`
- **Aliases**: None
- **Requires Exact Name**: `false`
- **npm Script**: `resume-schedule` (runs `scripts/scheduler_layer.ts --resume`)
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Enabled**: `true`
- **Description**: Re-enables a paused schedule.

### 12. `scheduler-health`
- **Key/Name**: `scheduler-health`
- **Aliases**: None
- **Requires Exact Name**: `false`
- **npm Script**: `scheduler-health` (runs `scripts/scheduler_layer.ts --health`)
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Enabled**: `true`
- **Description**: Displays scheduled runs health overview and checks limits.

### 13. `scheduler-report`
- **Key/Name**: `scheduler-report`
- **Aliases**: None
- **Requires Exact Name**: `false`
- **npm Script**: `scheduler-report` (runs `scripts/scheduler_layer.ts --report`)
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Enabled**: `true`
- **Description**: Compiles scheduler logs into daily/weekly reports.

### 14. `scheduler-run`
- **Key/Name**: `scheduler-run`
- **Aliases**: None
- **Requires Exact Name**: `false`
- **npm Script**: `scheduler-run` (runs `scripts/scheduler_layer.ts --run`)
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Enabled**: `true`
- **Description**: Performs scheduler cron tick verification and runs due tasks.

### 15. `audit` (Internal Mock)
- **Key/Name**: `audit`
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Description**: Validates configuration integrity and executes project-level health checks.

### 16. `brief` (Internal Mock)
- **Key/Name**: `brief`
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Description**: Prepares daily operational logs summary.

### 17. `next` (Internal Mock)
- **Key/Name**: `next`
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Description**: Fetches next steps from pipeline queue.

### 18. `mesh-telemetry snapshot` (Internal Mock)
- **Key/Name**: `mesh-telemetry snapshot`
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Description**: Saves current configuration of background particle mesh nodes.

### 19. `mesh-telemetry report` (Internal Mock)
- **Key/Name**: `mesh-telemetry report`
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Description**: Generates real-time health stats of active canvas nodes.

### 20. `dashboard-export` (Internal Mock)
- **Key/Name**: `dashboard-export`
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Description**: Exports cockpit layout files to direct offline preview paths.

### 21. `campaign-simulate status sporty` (Internal Mock)
- **Key/Name**: `campaign-simulate status sporty`
- **Owning Agent**: `Creative Revenue Strategist`
- **Risk Level**: `low`
- **Description**: Checks conversion rate metrics on the active sporty campaign.

### 22. `mesh-telemetry campaign sporty` (Internal Mock)
- **Key/Name**: `mesh-telemetry campaign sporty`
- **Owning Agent**: `Creative Revenue Strategist`
- **Risk Level**: `low`
- **Description**: Isolates telemetry bounds for the active sporty campaign.

### 23. `voice-pending` (Internal Mock)
- **Key/Name**: `voice-pending`
- **Owning Agent**: `Workflow Auditor`
- **Risk Level**: `low`
- **Description**: Scans vocal buffer for pending announcements.
