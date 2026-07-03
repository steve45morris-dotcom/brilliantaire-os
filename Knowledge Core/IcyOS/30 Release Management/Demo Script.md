# 🎬 Demo Script: Release 0.1 Integrated Journey
`Status: Approved` | `Version: 1.0.0` | `Speaker: Icyflamze`

This script outlines the end-to-end user demonstration journey for internal testing of IcyOS Release 0.1.

---

## 🎭 Step-by-Step Walkthrough

### 🚀 Act 1: The Messy Inbox
1. **Action**: Open the `/inbox` page.
2. **Narration**: *"I enter the messy text: 'Need to write release docs for 2 hours, then 30 mins backup review. Had a blocker yesterday with sudden meetings.'"*
3. **Trigger**: Click **Submit**.
4. **Outcome**: The input is captured, routed through the **Decision Engine**, escalated to the **AI Runtime (MockProvider)**, and returns a structured parsing confirmation card.

### 📅 Act 2: Adaptive Timeline Generation
1. **Action**: Click **Timeline** from the sidebar.
2. **Narration**: *"Now, I generate my daily plan. The system computes my weekly completion history and overrun trends to adapt my schedule."*
3. **Trigger**: Click **Generate Daily Plan**.
4. **Outcome**: Renders 3 timeline blocks, including a **30-minute Protected Buffer** with explainable metadata detailing *why* the buffer was expanded.
5. **Action**: Click **Approve Timeline**. Status pill switches to **Locked**.

### ⏱️ Act 3: Focus Execution & Reflection
1. **Action**: Go to the `/focus` page and click **Start Focus Session**.
2. **Outcome**: The countdown timer triggers. Click **Pause**, then **Complete**.
3. **Action**: Go to `/review`. Rate the session **4/5**, record a mock audio reflection, and click **Submit**.
4. **Outcome**: Extracted learning signals (e.g. *Wins*, *Blockers*) are saved, updating the performance profile telemetry for tomorrow.

---

## 🏁 Demo Summary
The script proves that all 15 sprints of development operate as a unified, cohesive workspace ecosystem.

*I build before burning.*
