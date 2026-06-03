# 📊 Workflow Idea Scoring Engine

This document details the specifications, security boundaries, scoring rules, commands, and outputs for the workflow idea scoring engine under Phase 13D.

---

## 🎯 1. Purpose

The Workflow Idea Scoring Engine acts as a triage gate that reads grounded learning notes and source packs, extracts potential workflows/builds, rates them across multiple practical categories, and yields prioritized, ranked build recommendations. This ensures that only high-value ideas move forward to implementation or Obsidian staging.

---

## 🛑 2. Strict Security Guardrails

*   **Offline Operation Only:** No external API requests, crawlers, or scrapers are active.
*   **No Automatic Obsidian Updates:** Output files are created inside `outputs/knowledge_harvest/workflow_scoring/`.
*   **No Auto-Writes to Next Actions:** `NEXT_ACTIONS.md` is updated only by the developer, never by the automation engine.
*   **No Automatic Task Creation:** The tool does not invoke task managers or schedule actions automatically.
*   **Strict Command Routing:** Commands require exact-name match gating; alias execution is blocked.

---

## 📋 3. Scoring System Details

### Scoring Categories (Rated 1 to 5)
1.  **Brilliantaire OS fit**
2.  **Icyflamze relevance**
3.  **Tree Groove Records relevance**
4.  **Revenue potential**
5.  **Speed to implement**
6.  **Difficulty** (inverted in final weighted formula)
7.  **Risk** (inverted in final weighted formula)
8.  **Reusability**
9.  **Automation value**
10. **Audience value**

### Scale & Formula
*   Individual Categories: **1** (lowest/worst) to **5** (highest/best).
*   Weighted Score: Compiled out of **100**.

### Recommendation Labels
*   `build_now`: Score > 75. High value, low risk, high fit.
*   `test_small`: Score 60–75. Good potential, needs small R&D proof.
*   `study_more`: Score 45–59. High difficulty or uncertainty, research required.
*   `archive`: Score < 45. Viable but out of immediate scope.
*   `reject`: Unviable or violates security/architectural boundaries.

---

## 💻 4. CLI Commands

Run these commands using the Command Router:

```bash
# Print help menu
npm run command -- "workflow-idea-scoring-help"

# Scan grounded notes/source packs and extract ideas
npm run command -- "workflow-idea-scoring extract"

# Run scoring scorecard matrices on extracted ideas
npm run command -- "workflow-idea-scoring score"

# Rank all active ideas by weighted score
npm run command -- "workflow-idea-scoring rank"

# Produce targeted build recommendations reports
npm run command -- "workflow-idea-scoring recommend"

# Compile and print the summary statistics report
npm run command -- "workflow-idea-scoring summary"

# Query the current dashboard status of logs and reports
npm run command -- "workflow-idea-scoring status"
```

---

## 📂 5. Outputs & Directories

*   **Extraction Reports:** `outputs/knowledge_harvest/workflow_scoring/reports/workflow_idea_extraction_YYYY-MM-DD.md`
*   **Scorecards Reports:** `outputs/knowledge_harvest/workflow_scoring/reports/workflow_idea_scorecards_YYYY-MM-DD.md`
*   **Ranked Ideas Reports:** `outputs/knowledge_harvest/workflow_scoring/ranked_ideas/ranked_workflow_ideas_YYYY-MM-DD.md`
*   **Build Recommendations:** `outputs/knowledge_harvest/workflow_scoring/reports/build_recommendations_YYYY-MM-DD.md`
*   **Scoring Summaries:** `outputs/knowledge_harvest/workflow_scoring/reports/workflow_scoring_summary_YYYY-MM-DD.md`
*   **Logs:** `outputs/knowledge_harvest/workflow_scoring/logs/workflow_scoring_log_YYYY-MM-DD.md`

---
*I build before burning.*
