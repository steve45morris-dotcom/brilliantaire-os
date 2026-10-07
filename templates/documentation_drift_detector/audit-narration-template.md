# Documentation Drift Detector — Narration Audit Report

- **Report ID:** {{REPORT_ID}}
- **Date:** {{DATE}}
- **Generated:** {{TIMESTAMP}}
- **Bridge Mode:** manual-first
- **Status:** staged (read-only)

---

## Narration Source Summary

| Metric | Value |
|---|---|
| Config Sources | {{CONFIG_SOURCE_COUNT}} |
| NARRATOR.md Sources | {{DOC_SOURCE_COUNT}} |

## Sources in Config but NOT in NARRATOR.md

{{MISSING_FROM_NARRATOR_DOC}}

## Sources in NARRATOR.md but NOT in Config

{{MISSING_FROM_CONFIG}}

## MESH_TELEMETRY.md Status

| Field | Value |
|---|---|
| File Exists | {{MESH_TELEMETRY_EXISTS}} |
| Last Updated | {{MESH_TELEMETRY_UPDATED}} |

## Verdict

**{{VERDICT}}** — {{VERDICT_DETAIL}}

---

## Review Checklist

- [ ] Config sources reviewed
- [ ] NARRATOR.md alignment checked
- [ ] MESH_TELEMETRY.md status verified
- [ ] Report approved

## Safety Notes

- This report is read-only. No narrator configs or docs are modified.
- Source matching is name-based.
