# Render Intake - Asset Scan Report

- **Scan ID:** {{SCAN_ID}}
- **Date:** {{DATE}}
- **Bridge Mode:** {{BRIDGE_MODE}}
- **Status:** staged

---

## Summary

| Metric | Count |
|---|---|
| Incoming Assets | {{INCOMING_TOTAL}} |
| Reviewed Assets | {{REVIEWED_TOTAL}} |

## Incoming Breakdown

| Category | Count |
|---|---|
| Images | {{INCOMING_IMAGE_COUNT}} |
| Videos | {{INCOMING_VIDEO_COUNT}} |
| Audio | {{INCOMING_AUDIO_COUNT}} |

## Incoming Inventory

{{INCOMING_INVENTORY}}

## Reviewed Inventory

{{REVIEWED_INVENTORY}}

---

## Next Steps

- [ ] Review incoming assets for naming compliance
- [ ] Validate file formats against supported types
- [ ] Run `validate all` to check against Phase 14D manifest
- [ ] Move approved assets to `inputs/render_intake/reviewed/`

## Safety Notes

- This scan report is read-only. No files were moved or modified.
- Asset validation is reporting-only and does not alter source files.
