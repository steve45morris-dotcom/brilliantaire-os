# 🛡️ Platform Package Integrity Rules

Use these rules to inspect generated copy-paste packages:

- **100% Offline Rule:** Output packages must contain NO active tracking scripts, script blocks, or external web-hook parameters.
- **VNP Alignment:** Verification runs must log metrics via the Safe Command Router only.
- **Double Check Toggles:** Verify CTA matches the whitelist exact string.
- **Phrase Check:** Verify phrase matches the whitelist exact string.
- **Readiness Tiers:**
  - 🥇 **90 - 100:** Ready for manual copy-pasting.
  - 🥈 **75 - 89:** Needs light cleanup (e.g. minor typos, checklist checks).
  - 🥉 **50 - 74:** Needs revision (e.g. missing optional fields, CTA links).
  - ❌ **Below 50:** Blocked (missing required core fields or phrase/CTA strings).
