# 🛡️ Creator YouTube URL Staging Gate

This document outlines the safety specifications, strict security guardrails, commands, and outputs for the manual creator YouTube URL staging system under Phase 13B.

---

## 🎯 1. Purpose

The Creator URL Staging Gate is a safe zone to manually register and catalog approved creator URLs (individual video, playlist, or channel links) before any downstream indexing or transcript downloading occurs. 

---

## 🛑 2. Strict Security Guardrails

To remain compliant with third-party service terms and maintain system sovereignty, the following security guardrails are hardcoded and enforced:

* **Strict Staging-Only:** This phase is completely read-only relative to YouTube. No network requests are made.
* **No YouTube Crawling/Scraping:** Automated retrieval or mapping of channel/playlist videos from YouTube is disabled.
* **No YouTube API Integration:** No API tokens are configured, and no Google APIs are called.
* **No Video Downloads:** Video acquisition (using tools like `yt-dlp` or `ffmpeg`) is strictly blocked.
* **No Automated Transcript Fetching:** Transcripts must be supplied manually as local text files to prevent scrapers from running on the backend.
* **No Automatic Obsidian Writes:** Outputs are structured purely inside `outputs/knowledge_harvest/url_staging/`.

---

## 📋 3. Approved Creators & Metadata Labels

### Approved Creators
* `julian` / `Julian Goldie`

### Allowed URL Types
* `video`
* `playlist`
* `channel`
* `unknown`

### URL Status Labels
* `staged` (staged initially)
* `needs_review` (requires operator sign-off)
* `approved_for_transcript` (approved for manual transcript file intake)
* `rejected` (marked as out of scope)
* `processed` (completed downstream transcript processing)

---

## 💻 4. CLI Commands

Run these commands using the Command Router:

```bash
# Display help and safety parameters
npm run command -- "creator-url-staging-help"

# Stage a specific URL manually
npm run command -- "creator-url-staging stage julian <URL>"

# Generate a batch intake template
npm run command -- "creator-url-staging batch julian"

# Audit staged URL records and generate a review report
npm run command -- "creator-url-staging review"

# Generate manual next-step transcript instructions
npm run command -- "creator-url-staging transcript-next"

# Show the status dashboard
npm run command -- "creator-url-staging status"
```

---

## 📂 5. Outputs & Directories

* **Staged URL Records:** `outputs/knowledge_harvest/url_staging/staged_urls/julian_url_record_YYYY-MM-DD.md`
* **Staged Batch Templates:** `outputs/knowledge_harvest/url_staging/staged_urls/julian_url_batch_template_YYYY-MM-DD.md`
* **Review Reports:** `outputs/knowledge_harvest/url_staging/reports/url_staging_review_YYYY-MM-DD.md`
* **Next Steps Reports:** `outputs/knowledge_harvest/url_staging/reports/transcript_next_steps_YYYY-MM-DD.md`
* **Execution Logs:** `outputs/knowledge_harvest/url_staging/logs/url_staging_log_YYYY-MM-DD.md`

---

## 🚀 6. Future Transcript Processing Boundary

Once a URL is reviewed and approved, it moves to the transcript processing queue. The operator manually places the downloaded `.txt` transcript inside `outputs/knowledge_harvest/transcripts/` and triggers:
`npm run knowledge-harvest -- "intake-transcript <TRANSCRIPT_FILE>"`

---
*I build before burning.*
