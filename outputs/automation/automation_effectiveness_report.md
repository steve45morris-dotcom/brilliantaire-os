# 📊 Automation Effectiveness Report

## Daily Metrics Report
- **Executions Today**: 3
- **Success Rate**: 100.0%
- **Blocked Commands**: 1
- **Time Saved**: 18 minutes
- **Most Used Routines**: daily-check
- **Least Used Routines**: voice-check
- **Next Recommended Optimization**: Automate local PostgreSQL connection health check to verify pool parameters.

## Weekly Metrics Report
- **Top Automations**: `campaign-check` (highest time-saved yield) and `daily-check` (highest execution volume).
- **Low Value Automations**: `voice-check` (checks pending vocal bridge items, has low manual overhead).
- **Unused Automations**: *None (all routines executed at least once)*
- **Recommended Changes**:
  - Keep `daily-check` enabled for quick developer checks.
  - Scale up telemetry tracking metrics for `campaign-check` without connecting to external feeds.
  - Deprecate `voice-check` if voicebridge logs remain consistently empty.
