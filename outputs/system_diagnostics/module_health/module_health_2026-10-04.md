# System Diagnostics — Module Health Report

- **Report ID:** SDR-20261004-7067
- **Date:** 2026-10-04
- **Generated:** 2026-10-04T21:59:56.922Z
- **Bridge Mode:** manual-first
- **Status:** staged (read-only)

---

## Module Summary

| Metric | Value |
|---|---|
| Total Modules | 7 |
| Present | 7 |
| Missing | 0 |
| Safety Violations | 0 |

## Module Status

| Module | Status | Safety Flags |
|---|---|---|
| config/commands.ts | OK | 0 |
| config/tree-groove-release-pipeline.ts | OK | 7 |
| config/obsidian-sync-layer.ts | OK | 7 |
| config/stripe-webhook-verification.ts | OK | 6 |
| config/zk-webhook-verification.ts | OK | 6 |
| config/micro-product-tree-groove-connector.ts | OK | 6 |
| config/live-microphone-audio-streamer.ts | OK | 7 |

## Safety Flag Violations

None detected

---

## Review Checklist

- [ ] All modules accounted for
- [ ] Safety flag violations addressed
- [ ] Missing modules investigated
- [ ] Report approved

## Safety Notes

- This report is read-only. No module configs are modified.
- Safety flag convention: ALLOW_* defaults to false, REQUIRE_* defaults to true.
