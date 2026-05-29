# 📅 Campaign Scheduler Draft Engine (Phase 6A)

This document specifies the design, scheduling rules, and folder structure for the **Campaign Scheduler Draft Engine** in **Brilliantaire OS**.

---

## 1. Purpose

The **Campaign Scheduler** serves as the planning adapter that compiles campaign templates and outputs into daily local schedules, posting queues, and execution log templates.

---

## 2. Strict Safety & Local-Only Boundary

To prevent unauthorized external actions or exposure of the OS workspace, this engine enforces the following security boundaries:
* **No Social Platform APIs:** The system contains no API integration with TikTok, Instagram, Facebook, Snapchat, or WhatsApp.
* **No Auto-Posting / Auto-Publishing:** There are no automated publishing agents or background processes that communicate with the internet.
* **Local Staging Only:** All generated files (schedules, daily queues, execution logs) are written strictly to the local directory as static Markdown files under `outputs/campaigns/`.
* **No Shell Execution:** This CLI script acts as a static Markdown compiler and does not run any shell processes or external jobs.

---

## 3. Command Flow and Pipeline

```
[templates/scheduler/] <-- Staging Markdown templates (queue, platform, log)
          │
          ▼ (npm run campaign-scheduler)
          │
      ┌───┼──────────────────────────────┐
      ▼   ▼                              ▼
 [schedules/]                       [posting_queue/]               [execution_logs/]
 sporty_schedule_*.md               sporty_queue_*.md              sporty_execution_log_*.md
 (21-Day Platform Grid)             (Daily Posting Queue items)    (Manual execution progress)
```

---

## 4. Supported CLI Commands

* **Help Menu:**
  ```bash
  npm run campaign-scheduler -- "help"
  ```
* **Generate Schedule:**
  ```bash
  npm run campaign-scheduler -- "create sporty"
  ```
* **Generate Posting Queue:**
  ```bash
  npm run campaign-scheduler -- "queue sporty"
  ```
* **Generate Execution Log:**
  ```bash
  npm run campaign-scheduler -- "log sporty"
  ```
* **Status Dashboard:**
  ```bash
  npm run campaign-scheduler -- "status sporty"
  ```

---

## 5. Output Mechanics

* **Schedule Format:** A comprehensive 21-day timeline outlining 3 posts per day distributed across TikTok, Instagram, Facebook, Snapchat, and WhatsApp. It integrates street challenge content, hook conditioning, website coupon early-access reminders, and the core Brilliantier brand phrase: *"A Brilliantier knows when to cash out."*
* **Posting Queue Format:** Daily queue listings populated from templates, specifying platform specifications, CTA, asset needs, and ownership by the Creative Revenue Strategist.
* **Execution Log Format:** Verification markdown sheet designed to let team members manually audit completed posts, log URLs, engagement stats, and issue resolutions.

---

## 6. Future Automation Boundary

Should remote or auto-publishing modules be designed in later phases, they must:
1. Run in completely separate network sandbox containers.
2. Read exclusively from the finalized `posting_queue/` files after manual developer sign-off.
3. Be confirmation-locked via the Safe Command Router.
