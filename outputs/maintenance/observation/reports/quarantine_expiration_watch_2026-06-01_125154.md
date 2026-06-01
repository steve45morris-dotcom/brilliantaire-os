# 🔎 Quarantine Expiration Watch

- **Earliest Expiration Date:** 2026-06-08
- **Current Eligibility:** no
- **Required Checks:** Checksum validation, restore script matching, and operator confirmation sign-off.
- **Commands To Run:**
  npm run quarantine-deletion-readiness -- "readiness-report"
  npm run quarantine-monitoring -- "continuation-report"
  npm run maintenance-check -- "full-report"
- **Future Gate Required:** Yes (requires separate approval gate and confirming command switches before pruning).
