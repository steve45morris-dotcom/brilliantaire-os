# 🔗 Creator YouTube URL Staging Gate

## 🌌 Purpose
The **Creator YouTube URL Staging Gate** is a manual-first intake system under the Knowledge Librarian for tracking creator URLs (videos, playlists, channels) and staging review cycles. It is designed to act as an offline buffer, cataloging video metadata and preparing transcript ingestion checklists without triggering automated API queries or scraping loops.

## 🛡️ Staging Guardrails
1. **Manual Staging ONLY:** Crawling, channel scraping, and playlist monitoring are strictly disabled.
2. **No Video Downloads:** Downloads are blocked.
3. **No External API Queries:** YouTube APIs or scrapers are blocked.
4. **No Direct synthesis or synthesis API calls.**
5. **No Direct Obsidian Writes:** Direct writes into Obsidian vault directories are disabled.

## 🧑‍💻 Approved Creators & Statuses
* **Approved Creators:**
  - julian / Julian Goldie
* **Staged URL Types:**
  - video
  - playlist
  - channel
  - unknown
* **URL Status Labels:**
  - staged
  - needs_review
  - approved_for_transcript
  - rejected
  - processed

## 💻 Available Commands & Scripts
```bash
# General help menu
npm run creator-url-staging-help

# Stage a single creator URL record
npm run creator-url-staging -- "stage julian <URL>"

# Generate manual batch template
npm run creator-url-staging -- "batch julian"

# Compile URL staging review report
npm run creator-url-staging -- "review"

# Compile transcript next actions report
npm run creator-url-staging -- "transcript-next"

# Query dashboard status metrics
npm run creator-url-staging -- "status"
```

## 📁 Directory Output Mapping
- Staged creator URLs: `outputs/knowledge_harvest/url_staging/staged_urls/`
- Compiled reports: `outputs/knowledge_harvest/url_staging/reports/`
- Execution logs: `outputs/knowledge_harvest/url_staging/logs/`
- Templates: `templates/knowledge_harvest/url_staging/`
