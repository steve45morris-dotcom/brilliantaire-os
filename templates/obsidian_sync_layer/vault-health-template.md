# Obsidian Sync Layer — Vault Health

- **Health ID:** {{HEALTH_ID}}
- **Date:** {{DATE}}
- **Generated:** {{TIMESTAMP}}
- **Bridge Mode:** manual-first
- **Status:** staged (read-only)

---

## Vault Detection

- **Vault Path:** {{VAULT_PATH}}
- **Safe Write Folder:** {{SAFE_WRITE_FOLDER}}

## Subfolder Status

{{SUBFOLDER_TABLE}}

## Candidate Paths

{{CANDIDATE_STATUS}}

## Freshness

- **Latest Brief:** {{BRIEFS_FRESHNESS}}

## Health Score

{{HEALTH_SCORE}}

- **Routing Rules Configured:** {{ROUTING_RULE_COUNT}}

---

## Review Checklist

- [ ] Vault path confirmed accessible
- [ ] Missing subfolders identified for creation
- [ ] Brief freshness within acceptable range
- [ ] Routing rule coverage reviewed

## Safety Notes

- This health check is read-only. No vault structures are created or modified.
- No files are written, moved, or deleted.
- Human operator must create missing subfolders manually.
