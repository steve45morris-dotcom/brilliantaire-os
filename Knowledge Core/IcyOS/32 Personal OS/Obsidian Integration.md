# 📓 Obsidian Integration: Release 0.3
`Status: Active` | `Scope: Connectors`

This document details the Obsidian markdown notes synchronizer, wiki-links parser, and workspace launch actions.

---

## 📋 Obsidian Connector Capabilities

### 1. Markdown Note Sync
- Reads Markdown files (.md) from local vaults using the `ObsidianConnector.importData()` call.
- Tracks note titles, vault filepath paths, and metadata properties.

### 2. Focus Mode Attachment
- **Action**: Users can attach an Obsidian note directly to a focus timeline block.
- **Trigger**: Launching Focus Mode automatically opens the corresponding note reference inside the workspace layout.

### 3. Wiki-Links Mapping
- Parses Obsidian-style wikilinks (`[[Note Name]]`) to link related mission blocks together.

*I build before burning.*
