# 🗓️ Quarantine Monitoring Next Check Instructions

- **Next Check Date:** 2026-06-08
- **Readiness Command:** `npm run quarantine-deletion-readiness -- "readiness-report"`
- **Monitoring Command:** `npm run quarantine-monitoring -- "continuation-report"`
- **Expected Progress Condition:** Monitoring age reaches 7 days or more, allowing the staging gate to pass the monitoring age check.
- **Notes:** Ensure that the restore script and checksum reports are not altered during the monitoring period.
