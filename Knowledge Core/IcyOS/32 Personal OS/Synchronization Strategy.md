# 🔄 Synchronization Strategy: Release 0.3
`Status: Active` | `Scope: Sync`

This strategy outline conflict checks, retries, and data replication boundaries.

---

## ⚡ Sync Protocol

1. **Incremental Sync**: Pull only calendar events or notes updated since the last recorded timestamp (`last_sync`).
2. **Conflict Check Rules**:
  - The calendar sync *never* overwrites manual adjustments made to timeline blocks in the UI without asking.
  - Conflicts trigger optimistic UI warnings allowing users to select "Keep IcyOS Schedule" or "Sync Calendar Update".
3. **Retry Strategy**: Apply exponential backoff with jitter on failed sync requests (up to 3 retries).

---

## 🚦 Status Indicators
The UI sidebar displays local network sync status pills:
- `Syncing...` (active transfer loops)
- `Synced` (last sync completed under 3s)
- `Offline` (graceful offline degradation active)

*I build before burning.*
