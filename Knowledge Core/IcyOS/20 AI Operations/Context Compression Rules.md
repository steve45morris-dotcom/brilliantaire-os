# 🗜️ Context Compression Rules
`Version: 1.1.0` | `Status: Active` | `Scope: AI Operations`

Provides rules for summarizing logs, compressing historical outputs, and partitioning data inside context windows.

---

## 📐 Compression Rules
- **Log Compaction**: Strip debug trace details and compile files into bullet lists before feeding to context.
- **Decision Partitioning**: Do not load full ADR files. Load the unified ADR Index or specific Decision summaries.
- **Reference Pruning**: Exclude non-adjacent engine specifications from the loaded prompt parameters.

---

## 📋 Document Metadata
- **Purpose**: Map context pruning guidelines.
- **Version**: 1.1.0

*I build before burning.*
