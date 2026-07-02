# 🧱 CANONICAL DOMAIN MODEL v1.0
`Version: 1.0.0` | `Status: Approved` | `Scope: Domain Model`

This document defines the canonical entities, value objects, lifecycle flows, and invariants of the **IcyOS** Domain Model.

---

## 🏛️ Core Entities Specifications

### 1. User
- **Definition**: The strategic commander and owner of IcyOS.
- **Attributes**: `id: UUID`, `name: String`, `timezone: String`.
- **Relationships**: Owns Workspaces, Projects, and Trust Profiles.
- **Ownership**: Strategic root.
- **Constraints**: System must support single-user local tenancy first.
- **Business Rules**: All transactions execute under User authorization.

### 2. Workspace
- **Definition**: The logical container for files, configurations, and specs.
- **Attributes**: `id: UUID`, `root_path: String`, `status: ActiveStatus`.
- **Relationships**: Contains Projects, Sprints, and Memory Entries.

### 3. Project
- **Definition**: A structured coordinate of strategic goals.
- **Attributes**: `id: UUID`, `name: String`, `priority: Priority`.
- **Relationships**: Parent of Sprints and Missions.

### 4. Mission
- **Definition**: An executable task package staging changes under a local folder.
- **Attributes**: `id: UUID`, `name: String`, `status: MissionStatus`.
- **Relationships**: Relates to Actions, Timeline events, and AI Context Packages.

### 5. Action
- **Definition**: An atomic development or terminal command script execution.
- **Attributes**: `id: UUID`, `command: String`, `is_write_operation: Boolean`.
- **Relationships**: Bound inside a single Mission.

### 6. Session
- **Definition**: A continuous run of developer or AI agent edits.
- **Attributes**: `id: UUID`, `start_time: Timestamp`, `status: SessionStatus`.
- **Relationships**: Connects AI Context Packages and Session Summaries.

### 7. Mode
- **Definition**: Adjusts notification muting and priority parameters.
- **Attributes**: `id: UUID`, `name: ModeName`, `is_notifications_muted: Boolean`.

### 8. Timeline
- **Definition**: Hour-by-hour calendar grid allocations.
- **Attributes**: `id: UUID`, `last_optimized_at: Timestamp`.
- **Relationships**: Maps Missions and Protected Buffers.

### 9. Blueprint
- **Definition**: Visual Mermaid diagram specifications representing database layout.
- **Attributes**: `id: UUID`, `diagram_syntax: String`.

### 10. Trust Profile
- **Definition**: Metric tracking AI compilation failures and test results.
- **Attributes**: `id: UUID`, `trust_score: Decimal`.
- **Relationships**: Restricts or grants permissions parameters.

### 11. Executive Briefing
- **Definition**: Compact status summary compiled at sprint milestones.
- **Attributes**: `id: UUID`, `content: String`.

### 12. Recommendation
- **Definition**: Suggested task selections from backlog queues.
- **Attributes**: `id: UUID`, `actionable_task_id: UUID`.

### 13. Review
- **Definition**: Validation report output checking tests and compile syntax.
- **Attributes**: `id: UUID`, `linter_errors_count: Integer`, `tests_passed_count: Integer`.

### 14. Insight
- **Definition**: Extracted lesson log compiled after execution runs.
- **Attributes**: `id: UUID`, `findings: String`.

### 15. Learning Record
- **Definition**: Reusable prompt pack template added to guidelines.
- **Attributes**: `id: UUID`, `prompt_syntax: String`.

### 16. Protected Buffer
- **Definition**: Locked calendar window guarding rest times.
- **Attributes**: `id: UUID`, `start_hour: Integer`, `end_hour: Integer`.

### 17. Trade-Off Decision
- **Definition**: Resolution choice delaying or delegating sprint tasks.
- **Attributes**: `id: UUID`, `selected_option: TradeOffOption`.

### 18. Notification
- **Definition**: Alert signal pushed during critical priority tasks.
- **Attributes**: `id: UUID`, `priority: Priority`, `message: String`.

### 19. AI Decision
- **Definition**: Task sequence plans proposed by Planning Engines.
- **Attributes**: `id: UUID`, `plan_json: String`.

### 20. AI Context Package
- **Definition**: Selectively loaded documents package.
- **Attributes**: `id: UUID`, `file_paths: List[String]`.

### 21. Sprint
- **Definition**: Time-boxed delivery target window (Sprint 01).
- **Attributes**: `id: UUID`, `sprint_name: String`.

### 22. Knowledge Asset
- **Definition**: Markdown file stored under directories.
- **Attributes**: `id: UUID`, `path: String`, `level: MemoryLevel`.

### 23. Architecture Decision
- **Definition**: ADR document specifying design choices.
- **Attributes**: `id: UUID`, `adr_id: String`.

### 24. Memory Entry
- **Definition**: Historical log entry appended to lessons learned.
- **Attributes**: `id: UUID`, `content: String`.

---

## 🧭 Domain Core Invariants
- **Invariant 1 (Rest Security)**: Schedulers *must never* assign task event blocks during a Protected Buffer window.
- **Invariant 2 (Trust Lock)**: AI permissions *must lock* write actions if `trust_score` drops below `0.7`.

---

## 📋 Document Metadata
- **Purpose**: Canonical reference sheet for the Domain Model.
- **Version**: 1.0.0
- **Cross References**:
  - [START HERE](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/START%20HERE.md)

*I build before burning.*
