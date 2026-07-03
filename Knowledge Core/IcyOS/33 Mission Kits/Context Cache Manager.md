# 💾 Context Cache Manager: Performance Tuning
`Status: Active` | `Scope: Caching`

This document details the retrieval latency optimizations, cache TTL, and invalidation rules for assembled context.

---

## ⚡ Cache Policies
- **TTL Duration**: 60,000 milliseconds (1 minute). Aswards context queries within the active focus block read directly from memory.
- **Latency Optimization**: Direct cache hits resolve under **5ms**, bypassing external filesystem checks.
- **Invalidation Triggers**:
  - Toggling status from `active` to `completed`.
  - Manual reload trigger button on Timeline page.

*I build before burning.*
