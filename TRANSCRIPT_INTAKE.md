# 🛡️ Manual Transcript Intake & Grounding Compiler

This document details the specifications, security boundaries, commands, and outputs for the manual transcript intake and grounding compiler system under Phase 13C.

---

## 🎯 1. Purpose

The Manual Transcript Intake & Grounding Compiler handles local text-based transcript files, validates their integrity and format, maps them to staged creator URL records, compiles grounded learning notes, and constructs NotebookLM-compatible source packs.

---

## 🛑 2. Strict Security Guardrails

To preserve system integrity and strictly comply with third-party service terms:
*   **No Automated Crawling/Scraping:** Transcripts must be provided locally by the operator as `.txt` or `.md` files. No YouTube downloads or network requests are executed.
*   **No YouTube API Calls:** The system runs offline with respect to the YouTube platform.
*   **No Public Distribution of Full Transcripts:** The compiler produces summaries, R&D notes, and prompt instructions rather than duplicating or republishing full copyrighted transcripts.
*   **No Automatic Obsidian Writes:** Staged outputs reside within `outputs/knowledge_harvest/`.

---

## 📋 3. Status Labels

### Transcript Status Labels
*   `raw`: Freshly ingested transcript file.
*   `validated`: Passed structural validation checks.
*   `rejected`: Failed structural validation (empty, too long, wrong extension).
*   `processed`: Completed downstream compiler steps.
*   `needs_review`: Requires manual operator inspection.

### Grounding Status Labels
*   `matched_to_url`: Mapped to a staged creator URL record.
*   `unmatched`: Staged URL record could not be resolved automatically.
*   `needs_review`: Flagged for manual mapping review.
*   `ready_for_notebooklm`: Fully grounded and compiled into a NotebookLM source pack.
*   `ready_for_workflow_extraction`: Suitable for automated workflow instruction mining.

---

## 💻 4. CLI Commands

Run these commands using the Command Router:

```bash
# Print the CLI help menu
npm run command -- "transcript-intake-help"

# Intake a local transcript file
npm run command -- "transcript-intake intake <PATH_TO_TRANSCRIPT>"

# Validate raw transcript files
npm run command -- "transcript-intake validate"

# Map validated transcripts to staged URL records
npm run command -- "transcript-intake map-urls"

# Compile grounded learning notes
npm run command -- "transcript-intake grounded-note"

# Compile NotebookLM source packs
npm run command -- "transcript-intake source-pack"

# Display the status dashboard
npm run command -- "transcript-intake status"
```

---

## 📂 5. Outputs & Directories

*   **Raw Transcripts:** `outputs/knowledge_harvest/transcripts/raw/`
*   **Processed Transcripts:** `outputs/knowledge_harvest/transcripts/processed/`
*   **Rejected Transcripts:** `outputs/knowledge_harvest/transcripts/rejected/`
*   **Intake Reports:** `outputs/knowledge_harvest/transcripts/reports/transcript_record_YYYY-MM-DD.md`
*   **Validation Reports:** `outputs/knowledge_harvest/transcripts/reports/transcript_validation_YYYY-MM-DD.md`
*   **URL Mapping Reports:** `outputs/knowledge_harvest/transcripts/reports/transcript_url_mapping_YYYY-MM-DD.md`
*   **Grounded Notes:** `outputs/knowledge_harvest/grounded_notes/grounded_learning_note_YYYY-MM-DD.md`
*   **Grounded Source Packs:** `outputs/knowledge_harvest/grounded_source_packs/grounded_notebooklm_source_pack_YYYY-MM-DD.md`

---
*I build before burning.*
