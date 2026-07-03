# 🔔 Notification Engine: Focus-Aware Alerts
`Status: Active` | `Scope: Alerts`

This document outlines the notification queue scheduling, delivery statuses, and focus state rules for local reminders.

---

## 🚦 Notification Rules Matrix

- **Rule 1: Focus State Respect**: Local alerts must be delayed or silenced if the user's focus timeline block is in the **Active** status (Except for buffer exhaustion alerts).
- **Rule 2: Categories**:
  - `mission_start`: Triggered 5 minutes prior to focus start.
  - `buffer_exhaust`: Triggered when an overrun focus session consumes more than 80% of its protected buffer.
  - `reflection`: Triggered upon focus session completion.

---

## ⏱️ Queue Dispatches
Pending alerts are registered inside the `NotificationEngine` schedule. Clicking the close toggle triggers `triggerDelivery(id)` to update its active state.

*I build before burning.*
