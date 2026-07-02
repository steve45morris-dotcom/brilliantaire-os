# 📡 Domain Events: Pub-Sub Message Schemas
`Version: 1.0.0` | `Status: Active` | `Scope: Domain Model`

Logical specifications for asynchronous messages published across contexts.

---

## 🗂️ Event Catalog
- **`MissionStarted`**: Dispatched when a staged task enters execution. Contains `mission_id` and `timestamp`.
- **`MissionCompleted`**: Dispatched after tests validation reviews pass.
- **`MissionSkipped` / `MissionDelayed`**: Triggers reschedule checks.
- **`TimelineRegenerated`**: Dispatched when scheduling changes occur.
- **`TrustIncreased` / `TrustDecreased`**: Triggers permissions adjustment updates.
- **`ExecutiveBriefingGenerated`**: Dispatched after sprint evaluations wrap.
- **`RecommendationAccepted` / `RecommendationRejected`**: Refines next actions prioritizations.
- **`BufferConsumed`**: Dispatched when focus overlays overlap rest bounds.

---

## 📋 Document Metadata
- **Purpose**: Map domain event types.
- **Version**: 1.0.0

*I build before burning.*
