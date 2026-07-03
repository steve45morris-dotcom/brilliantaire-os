# 📅 Calendar Integration: Release 0.3
`Status: Active` | `Scope: Connectors`

This document outlines the Google Calendar and Apple Calendar integration features, conflict checks, and buffer settings.

---

## 📋 Calendar Capabilities

### 1. Immutable Event Mapping
- **Rule**: Standard calendar events marked as *fixed* or *busy* are imported and treated as immutable timeline blocks inside the planner layout.
- **Verification**: The planner prevents manual rescheduling or overlap creation on locked timeline periods.

### 2. Overlap & Conflict Check
- **Rule**: If an imported event overlaps with an active focus session, the planner raises a scheduling conflict warning and suggests alternative time slots.

### 3. Buffer Placement
- **Rule**: The calendar importer automatically suggests placing a **30-minute Protected Buffer** directly preceding major external calendar events.

*I build before burning.*
