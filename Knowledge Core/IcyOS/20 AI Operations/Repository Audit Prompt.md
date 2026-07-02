# 🔍 Repository Audit Prompt: System Instructions
`Version: 1.0.0` | `Status: Active`

This document details the exact prompt parameters for auditing directory layout and files.

---

## 🎙️ The Audit Prompt
```markdown
Execute a repository sanity check. Walk through the workspace folders:
1. Verify directories match the ICOS schema (00 Executive Office/ to 99 Command Center/).
2. Identify untracked files or directory conflicts.
3. Validate link paths mapping. Verify absolute file:/// links function.
4. Calculate Health Scores. Output the Audit Report markdown document.
```

---

## 📋 Document Metadata
- **Purpose**: version repo audit prompt.
- **Version**: 1.0.0

*I build before burning.*
