# 📊 Campaign Simulation & Mesh Validation (Phase 6B)

This document specifies the design, scoring model, and safety checks for the **Campaign Simulation & Mesh Validation Engine** in **Brilliantaire OS**.

---

## 1. Purpose

The **Simulation & Validation Engine** runs auditing checks against draft timeline schedules, posting queues, and execution logs. It calculates readiness scoring metrics to ensure complete platform coverage, visual assets readiness, and identity compliance prior to manual release gates.

---

## 2. Safe Local Audit Policy (No Auto-Posting)

To protect the host OS and prevent external resource execution:
* **Strictly Local and Offline:** The script operates fully locally. It does not communicate with external network APIs (TikTok, Facebook, snapchat, Instagram, WhatsApp).
* **Zero Shell Execution:** Runs exclusively in-memory, compiling markdown status reports into the `outputs/` folder.
* **No Auto-Publishing:** This layer does not run background processes or trigger external jobs.

---

## 3. Supported CLI Commands

* **Help Instructions:**
  ```bash
  npm run campaign-simulate -- "help"
  ```
* **Score Simulator:**
  ```bash
  npm run campaign-simulate -- "sporty"
  ```
* **Audit Checklists:**
  ```bash
  npm run campaign-simulate -- "validate sporty"
  ```
* **Validation Status Summary:**
  ```bash
  npm run campaign-simulate -- "status sporty"
  ```

---

## 4. Score Scoring Model

The simulation audits campaign readiness across 6 key metrics, each scored from 0 to 100:
1. **Platform Coverage Score:** Ensures TikTok, Instagram, Facebook, Snapchat, and WhatsApp channels exist.
2. **CTA Integrity Score:** Verifies that links, coupon codes, and action items (e.g. `SPORTY21`) are populated.
3. **Asset Readiness Score:** Scans for media files and visual banners (`.mp4`, `.png`, `.jpg`).
4. **Hook Conditioning Score:** Checks for hook strategies and street challenges.
5. **Brilliantier Identity Score:** Audits compliance with core brand phrases (*"A Brilliantier knows when to cash out."*).
6. **Execution Readiness Score:** Checks if schedule files, posting queues, and execution log sheets exist.

### Readiness Thresholds
* **85 to 100:** Ready for manual execution (green light).
* **70 to 84:** Needs light cleanup.
* **50 to 69:** Needs revision.
* **Below 50:** Not ready.

---

## 5. Security & Validation Checklist

Every audit enforces structural checks verifying the presence of:
* Complete 21-day timeline tables.
* Owner agent designations (Creative Revenue Strategist).
* Time blocks (Morning, Afternoon, Evening).
* Staged Status fields (`DRAFT`).
* Asset parameters, CTA angles, and notes sections.
