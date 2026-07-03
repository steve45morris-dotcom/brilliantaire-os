# 🗂️ Mission Kits Registry: Release 0.4
`Status: Active` | `Scope: Templates`

This document details the configuration and structures of reusable Mission Kits templates within `@icyos/services`.

---

## 🛠️ Registered Templates
The registry matches tasks to execution workspaces:

1. **Recording Kit (`recording-kit`)**
   - **Timers**: 3600 seconds (1 hour).
   - **Launch actions**: DAW, vocal tracks audio.
   - **Completion rules**: Wave file exported, vocal logs saved.
2. **Coding Kit (`coding-kit`)**
   - **Timers**: 5400 seconds (90 minutes).
   - **Launch actions**: IDE, localhost URL.
   - **Completion rules**: All Vitest checks pass, git commits created.
3. **Writing Kit (`writing-kit`)**
   - **Timers**: 2700 seconds (45 minutes).
   - **Launch actions**: Obsidian Blog Draft.
   - **Completion rules**: Markdown saved.

---

## 🚦 Registry Resolution Rule
When starting a mission, the registry resolves its template target ID to automatically pre-load launch actions, checklist guidelines, and resource references.

*I build before burning.*
