# Render Intake - Asset Validation Report

- **Validation ID:** {{VALIDATION_ID}}
- **Date:** {{DATE}}
- **Asset Type:** {{ASSET_TYPE}}
- **Bridge Mode:** {{BRIDGE_MODE}}
- **Status:** staged

---

## Summary

| Metric | Count |
|---|---|
| Total Validated | {{TOTAL_VALIDATED}} |
| Pass | {{PASS_COUNT}} |
| Warn | {{WARN_COUNT}} |
| Fail | {{FAIL_COUNT}} |

## Validation Results

| Asset | Category | MIME Type | Status | Notes |
|---|---|---|---|---|
{{VALIDATION_ROWS}}

---

## Phase 14D Queue Manifest Cross-Reference

- [ ] All validated assets match entries in the Episode 1 Asset Generation Queue
- [ ] No orphan assets detected (assets without queue manifest entries)
- [ ] No missing assets detected (queue entries without matching files)

## Next Steps

- [ ] Address any WARN or FAIL items listed above
- [ ] Re-validate after corrections with `validate {{ASSET_TYPE}}`
- [ ] Proceed to visual-continuity and audio-review checklists

## Safety Notes

- This validation report is read-only. No files were moved or modified.
- All validation checks are reporting-only and do not alter source files.
