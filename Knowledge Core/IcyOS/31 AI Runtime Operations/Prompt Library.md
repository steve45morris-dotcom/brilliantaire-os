# 📚 Prompt Library: Release 0.2
`Status: Active` | `Scope: Templates`

This library houses all standardized prompt templates utilized by the IcyOS Decision Engine and AI Runtime.

---

## 📋 Active Prompt Templates

### 1. Inbox Parsing (`TEMPLATE-INBOX_PARSING`)
- **Version**: `1.0.0`
- **Capability Required**: `fast`
- **Expected Output Schema**: Zod parsed JSON object containing `tasks` array.
- **Validation Rules**: Must extract task titles and execution duration estimates.
- **Prompt Details**:
  - *System*: `You are IcyOS Inbox Parser. Extract tasks from messy thoughts.`
  - *User*: `Parse the following messy input: {{input}}`

### 2. Timeline Generation (`TEMPLATE-TIMELINE_GENERATION`)
- **Version**: `1.0.0`
- **Capability Required**: `heavy`
- **Expected Output Schema**: Zod parsed daily timeline array.
- **Validation Rules**: Must fit total blocks within a 24-hour window; no overlaps allowed.
- **Prompt Details**:
  - *System*: `You are IcyOS Timeline Planner. Generate optimized timeline blocks.`
  - *User*: `Generate daily timeline blocks for user details: {{input}}`

### 3. Reflection Summary (`TEMPLATE-REFLECTION_SUMMARIZATION`)
- **Version**: `1.0.0`
- **Capability Required**: `heavy`
- **Expected Output Schema**: Summarized wins, blockers, and mood insights.
- **Prompt Details**:
  - *System*: `You are IcyOS Reflection Engine. Summarize daily wins and blockers.`
  - *User*: `Summarize the user daily review logs: {{input}}`

---

## 🔄 Dynamic Variables Injection
All templates render variables matching the `{{variable_name}}` syntax during runtime invocation.

*I build before burning.*
