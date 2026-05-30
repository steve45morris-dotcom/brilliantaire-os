# 🛡️ Decoupled Platform Verification Gates (Phase 9B)

This document specifies the design, scoring methodology, and safety operations for the **Decoupled Platform Verification Gates** in **Brilliantaire OS**.

---

## 1. Purpose

The **Platform Verification Gates** layer reads the latest generated copy-paste posting packages (Phase 9A) to audit and verify that they are structurally complete, contain whitelisted key strings (CTA and phrase), and are ready for manual posting. It outputs detailed verification reports for each platform.

---

## 2. Safety Design & Decoupled Boundaries

To safeguard user sovereignty, this verification layer enforces the following constraints:
1. **Offline Parsing Only:** The verification script runs locally and offline. It does not connect to external endpoints, databases, or third-party checkers.
2. **No Automated Corrections:** Verification reports only highlight errors or missing fields; they do *not* edit or modify the source packages.
3. **No Automatic Posting:** Verified packages are never submitted automatically. Review and publishing are strictly manual.
4. **Collision Protection:** Report outputs do not overwrite existing files without applying a timestamp suffix.

---

## 3. Scoring Model & Verdict Tiers

The readiness score (0 to 100) is calculated proportionally as follows:
- **Required Fields Match (60% weight):** Proportional points for every required platform field present.
- **Campaign Phrase Match (15% weight):** Verified presence of *"A Brilliantier knows when to cash out."*
- **Core CTA Match (15% weight):** Verified presence of *"Join the Brilliantier movement and unlock early access."*
- **Asset Note Populated (5% weight):** Verified that `Asset Needed:` has been configured.
- **Review Status Checked (5% weight):** Verified that `Review Status:` has been updated.

### Verdict Tiers:
* **🥇 90 to 100 (Ready for Manual Posting):** Package is verified and safe for production.
* **🥈 75 to 89 (Needs Light Cleanup):** Minor details or optional fields missing; check reports.
* **🥉 50 to 74 (Needs Revision):** Critical fields or metadata sections are unpopulated.
* **❌ Below 50 (Blocked):** Core phrase or CTA link is missing. DO NOT publish.

---

## 4. Execution Commands

* **Print Verification Help Manual:**
  ```bash
  npm run platform-verify-help
  ```
* **Verify Specific Platform Package:**
  ```bash
  npm run platform-verify -- "sporty youtube"
  npm run platform-verify -- "sporty tiktok"
  npm run platform-verify -- "sporty instagram"
  npm run platform-verify -- "sporty facebook"
  npm run platform-verify -- "sporty whatsapp"
  npm run platform-verify -- "sporty obsidian"
  ```
* **Verify All Packages & Generate Summary:**
  ```bash
  npm run platform-verify -- "sporty all"
  ```
* **Check Diagnostics Verification Status:**
  ```bash
  npm run platform-verify -- "status sporty"
  ```

---

## 5. Outputs Directory Structure
- Individual platform checks are logged to:
  `outputs/platform_verification/reports/sporty_[platform]_verification_YYYY-MM-DD.md`
- Aggregated summaries are logged to:
  `outputs/platform_verification/reports/sporty_platform_verification_summary_YYYY-MM-DD.md`
