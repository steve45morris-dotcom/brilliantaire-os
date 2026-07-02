# 📐 CANONICAL INFORMATION ARCHITECTURE v1.0
`Version: 1.0.0` | `Status: Approved` | `Scope: Information Architecture`

This document details the logical attribute schemas, relationship bindings, metadata strategies, and validation rules mapping the business concepts of **IcyOS** to information models.

---

## 🗃️ Canonical Information Mappings

### 1. User
- **Purpose**: Record tactical strategist profile.
- **Owner**: User.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `name: String`.
- **Optional Attributes**: `timezone: String`.
- **Relationships**: Parent of Workspace.
- **Aggregate**: None.
- **Bounded Context**: Planning Context.
- **Lifecycle**: Created ➔ Active ➔ Archived.
- **Validation Rules**: `name` must be non-empty string (< 255 chars).
- **Synchronization Rules**: Local profile, cloud backup options.
- **Audit Requirements**: Track login and permissions updates.
- **Retention Policy**: Never delete.
- **Archive Policy**: N/A.
- **Searchability**: Indexed by ID.
- **Versioning Rules**: Increment version integer.
- **Metadata**: Standard audit columns.

### 2. Workspace
- **Purpose**: Group projects and configurations.
- **Owner**: User.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `root_path: String`.
- **Relationships**: Child of User, Parent of Project.
- **Aggregate**: None.
- **Bounded Context**: Planning Context.
- **Lifecycle**: Created ➔ Active ➔ Deleted.

### 3. Project
- **Purpose**: Organize strategic objectives.
- **Owner**: User.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `name: String`, `priority: Priority`.
- **Relationships**: Child of Workspace, Parent of Sprint.
- **Aggregate**: Planning.
- **Bounded Context**: Planning Context.

### 4. Mission
- **Purpose**: Stage filesystem modifications.
- **Owner**: User / AI.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `name: String`, `status: MissionStatus`.
- **Relationships**: Child of Sprint, Parent of Actions.
- **Aggregate**: Planning.
- **Bounded Context**: Planning Context.

### 5. Action
- **Purpose**: Record individual script runs.
- **Owner**: AI.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `command: String`.
- **Relationships**: Child of Mission.
- **Aggregate**: Planning.
- **Bounded Context**: Planning Context.

### 6. Session
- **Purpose**: Log assistant iterations.
- **Owner**: System.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `status: SessionStatus`.
- **Relationships**: Child of Workspace.
- **Aggregate**: Execution.
- **Bounded Context**: Planning Context.

### 7. Mode
- **Purpose**: Adjust focus variables settings.
- **Owner**: User.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `name: String`.
- **Relationships**: Child of Workspace.

### 8. Timeline
- **Purpose**: Schedule tasks onto calendar grids.
- **Owner**: AI Scheduler.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`.
- **Relationships**: Relates to user calendar accounts.

### 9. Blueprint
- **Purpose**: Model visual graphs for DB updates.
- **Owner**: AI Designer.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `diagram_syntax: String`.

### 10. Trust Profile
- **Purpose**: Quantify compilation success metrics.
- **Owner**: Trust Engine.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `trust_score: Decimal`.

### 11. Executive Briefing
- **Purpose**: Compile status reports.
- **Owner**: Executive Briefing Engine.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `content: String`.

### 12. Recommendation
- **Purpose**: Queue backlog task selections.
- **Owner**: Recommendation Engine.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `actionable_task_id: UUID`.

### 13. Review
- **Purpose**: Validate staging code.
- **Owner**: Review Engine.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `linter_errors_count: Integer`.

### 14. Insight
- **Purpose**: Log session retrospectives findings.
- **Owner**: Learning Engine.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `findings: String`.

### 15. Learning Record
- **Purpose**: Package prompt pack changes.
- **Owner**: Learning Engine.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `prompt_syntax: String`.

### 16. Protected Buffer
- **Purpose**: Lock rest time blocks.
- **Owner**: User.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `start_hour: Integer`, `end_hour: Integer`.

### 17. Trade-Off Decision
- **Purpose**: Record descope choices.
- **Owner**: User.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `selected_option: String`.

### 18. Notification
- **Purpose**: Stage urgent priority alerts.
- **Owner**: User.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `message: String`.

### 19. AI Decision
- **Purpose**: Log proposed task allocations.
- **Owner**: Planning Engine.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `plan_json: String`.

### 20. AI Context Package
- **Purpose**: Selectively load workspace specs.
- **Owner**: Context Builder.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `file_paths: List[String]`.

### 21. Sprint
- **Purpose**: Target time-boxed ticket deliveries.
- **Owner**: User.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `sprint_name: String`.

### 22. Knowledge Asset
- **Purpose**: Track spec document links.
- **Owner**: OS Architect.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `path: String`.

### 23. Architecture Decision
- **Purpose**: Link ADR index records.
- **Owner**: OS Architect.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `adr_id: String`.

### 24. Memory Entry
- **Purpose**: Log lessons learned.
- **Owner**: System.
- **Identity**: UUIDv4 (`id`).
- **Primary Attributes**: `id: UUID`, `content: String`.

---

## 📋 Document Metadata
- **Purpose**: Canonical reference sheet for system information schemas.
- **Version**: 1.0.0
- **Cross References**:
  - [START HERE](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/START%20HERE.md)

*I build before burning.*
