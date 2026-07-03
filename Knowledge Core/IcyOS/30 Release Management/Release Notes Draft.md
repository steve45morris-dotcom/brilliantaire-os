# 📢 Release Notes: IcyOS Release 0.1
`Date: 2026-07-03` | `Version: 0.1.0-beta`

We are proud to announce **IcyOS Release 0.1**, the first integrated milestone of the autonomous AI Operating System. This release transforms separate components into a single, cohesive user experience.

---

## 🌟 Key Features

### 📨 Integrated Inbox Capture
- Messy text input forms with dynamic load indicators.
- **Decision Engine** category routing (deterministic rule matching vs LLM runtime escalation).
- AI Runtime provider registry containing local development mock adapters.

### 📅 Adaptive Planning & Timeline
- Multi-block timeline schedules displaying title, duration, and execution modes.
- **Learning Engine** analysis calculating completion metrics, buffer overruns, and weekly productivity peaks.
- Explanations and confidence ratings cards for plan suggestions.

### ⏱️ Focus Execution Engine
- Countdown timers with pause, complete, and skip actions.
- Automatically consumes **Protected Buffer** if a focus session overruns its target.
- Extracted learning signals (wins, blockers, lessons) with numeric satisfaction ratings.

---

## 🛠️ Monorepo Package Layout
- `apps/web`: Next.js frontend UI dashboard and API route endpoints.
- `packages/shared`: Static types, date helpers, and Zod schemas.
- `packages/database`: PostgreSQL repositories and mapper adapters.
- `packages/services`: Unified application layer service engines.
- `packages/learning`: Deterministic performance aggregation libraries.
- `packages/decision`: Router rules evaluating LLM escalation criteria.
- `packages/ai`: Provider-agnostic AI Runtime wrapping model adapters.

*I build before burning.*
