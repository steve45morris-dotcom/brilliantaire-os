# ⚖️ Open Decisions & Strategic Blockers
`Version: 1.1.0` | `Status: Active`

This document tracks unresolved development disputes, architecture trade-offs, and design conflicts requiring strategic human validation.

---

## 📋 Active Open Decisions

### 1. DEC-001: Biometric Integration Priority
- **Context**: Speculative plans exist to sync scheduler timelines with user biometric trackers.
- **Conflict**: Adding this now expands MVP scope beyond the core plan loop (Messy Input → Timeline → Human Approval).
- **Proposed Resolution**: Defer biometric schemas to Phase 2 (Roadmap v2.0).

### 2. DEC-002: ADR Number for AI Plans, Human Approves
- **Context**: The ADR consolidation prompt recommended `ADR-0008: AI Plans. Human Approves.`
- **Conflict**: `ADR-0008` is already occupied by the accepted `Foundation Freeze` decision.
- **Proposed Resolution**: Create `AI Plans. Human Approves.` as `ADR-0012` unless Commander explicitly approves renumbering `ADR-0008 Foundation Freeze`.

### 3. DEC-003: ADR-0011 Link Portability Review
- **Context**: `ADR-0011 Absolute URI Path Mapping` preserves local absolute URI mapping as an accepted architecture decision.
- **Conflict**: Absolute `file://` links can reduce portability across machines and AI assistants.
- **Proposed Resolution**: Review whether ADR-0011 should be superseded or constrained by a future portable-link ADR.

---

## 📋 Document Metadata
- **Purpose**: Record design decisions requiring validation.
- **Version**: 1.1.0

*I build before burning.*
