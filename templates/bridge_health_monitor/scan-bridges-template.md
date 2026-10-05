# Bridge Health Monitor — Bridge Scan

- **Report ID:** {{REPORT_ID}}
- **Date:** {{DATE}}
- **Generated:** {{TIMESTAMP}}
- **Bridge Mode:** manual-first
- **Status:** staged (read-only)

---

## Bridge File Status

| Bridge | File Status | Config Status |
|---|---|---|
{{BRIDGE_TABLE}}

## Capability Checks

| Bridge | BRIDGE_MODE | Safety Flags | Status Export | Report Export | CLI Guard |
|---|---|---|---|---|---|
{{CAPABILITY_TABLE}}

## Summary

- Total Bridges: {{TOTAL_BRIDGES}}
- Bridge Files Present: {{BRIDGE_PRESENT}}
- Config Files Present: {{CONFIG_PRESENT}}
- Bridges with BRIDGE_MODE: {{HAS_MODE}}
- Bridges with Safety Flags: {{HAS_FLAGS}}

---

## Review Checklist

- [ ] All bridge files accounted for
- [ ] All config files accounted for
- [ ] BRIDGE_MODE declared in all bridges
- [ ] Safety flags present in all configs
- [ ] Report approved

## Safety Notes

- This report is read-only. No bridge files are modified.
- No external APIs or services are contacted.
- Human approval required for any remediation actions.
