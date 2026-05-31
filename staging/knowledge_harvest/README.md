# 📥 KNOWLEDGE HARVEST STAGING AREA

This staging directory is a secure buffer zone for raw incoming knowledge resources before ingestion.

## 📁 Staged Inputs Location
You can drop raw text materials here:
- Raw audio/video transcripts (.txt, .md)
- Article text documents
- Research notes or URL manifest lists

## ⚙️ Ingestion & Processing Pipeline
- **Processing Command:** `npm run knowledge-harvest`
- **Staging Restrictions:** This folder has **no active autonomous triggers**. No scraping or external network requests are executed automatically.
- **Manual Approval Gate:** All processed assets must be manually verified and reviewed.
- **Obsidian Vault Staging:** Under no circumstances should this staging folder write directly to the live Obsidian vault directories. Content must be pushed to a local output staging folder first and requires a secondary validation pass.

---
*Security Rule: I build before burning. Sandbox first, validate next, deploy last.*
