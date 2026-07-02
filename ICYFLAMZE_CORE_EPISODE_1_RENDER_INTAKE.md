# ICYFLAMZE CORE: Episode 1 Render Intake & Assembly Tracker

This document registers the strict guidelines and structures for compiling, staging, and tracking Phase 14E (Episode 1 Render Intake & Assembly Tracker) files for ICYFLAMZE CORE Episode 1: *The Core Wakes*.

---

## 🎯 Purpose & Scope

The **Episode 1 Render Intake & Assembly Tracker** serves as the quality control gate for manually generated creative assets. It scans the incoming raw renders, checks them against allowed formats and naming patterns, runs visual/audio review compliance checklists, and tracks overall assembly readiness before a final editor timeline render is authorized.

---

## 🔒 Strict Production Boundaries (No-Generation Rules)

To maintain absolute local system safety and offline sandboxing constraints, the intake tracker adheres to these rules:

1. **NO AUTOMATED IMAGES:** All visual assets must be generated manually by the creator.
2. **NO AUTOMATED AUDIO:** All voice tracks and SFX stems must be recorded or generated manually.
3. **NO AUTOMATED VIDEO:** No video renders or loops are run from CLI scripts.
4. **NO DIRECT VAULT WRITES:** Direct writes to Obsidian vaults are strictly disabled (`ALLOW_OBSIDIAN_DIRECT_WRITE = false`). Notes are staged in `outputs/write_staging/`.
5. **NO PUBLISHING:** No automated publishing to social platforms, YouTube, or Tree Groove Records distribution occurs.
6. **NO DELETIONS:** No local output files or assets are deleted or overwritten.

---

## 📁 Allowed Intake Folders & Formats

### Intake Folders
* `incoming/images/` - Local folder for static renders (Midjourney, Canva).
* `incoming/videos/` - Local folder for animation clips (Sora, Veo, Runway).
* `incoming/audio/` - Local folder for voice tracks (ElevenLabs) and music.
* `incoming/cover_art/` - Local folder for promo art graphics.
* `incoming/captions/` - Local folder for subtitle script files.
* `incoming/edit_projects/` - Local folder for editing project file backups.

### Allowed Extensions
* **Images:** `.png`, `.jpg`, `.jpeg`, `.webp`
* **Videos:** `.mp4`, `.mov`, `.webm`
* **Audio:** `.wav`, `.mp3`, `.m4a`
* **Captions:** `.srt`, `.vtt`, `.txt`, `.md`
* **Edit projects:** `.capcut`, `.drp`, `.prproj`, `.fcpxml`, `.xml`

---

## 📊 Asset statuses
* `incoming` - Staged in incoming folders, not yet evaluated.
* `pending_review` - Validated, awaiting checklist review.
* `approved` - Passes creative review and ready for sequence.
* `rejected` - Fails quality metrics, needs re-render.
* `needs_revision` - Minor adjustment required (e.g. contrast, audio level).
* `ready_for_assembly` - Critical asset set is complete.
* `assembled` - Integrated into edit sequence.

---

## 💻 CLI Commands Syntax

* Print help menu:
  ```bash
  npm run command -- "icyflamze-core-episode-1-render-intake-help"
  ```
* Scan incoming folders:
  ```bash
  npm run command -- "icyflamze-core-episode-1-render-intake" -- "scan"
  ```
* Validate file names and formats:
  ```bash
  npm run command -- "icyflamze-core-episode-1-render-intake" -- "validate"
  ```
* Compile visual continuity review:
  ```bash
  npm run command -- "icyflamze-core-episode-1-render-intake" -- "visual-review"
  ```
* Compile audio review checklist:
  ```bash
  npm run command -- "icyflamze-core-episode-1-render-intake" -- "audio-review"
  ```
* Compile assembly readiness report:
  ```bash
  npm run command -- "icyflamze-core-episode-1-render-intake" -- "assembly-readiness"
  ```
* Generate revision log:
  ```bash
  npm run command -- "icyflamze-core-episode-1-render-intake" -- "revision-log"
  ```
* Stage Obsidian note:
  ```bash
  npm run command -- "icyflamze-core-episode-1-render-intake" -- "obsidian-stage"
  ```
* Generate package report:
  ```bash
  npm run command -- "icyflamze-core-episode-1-render-intake" -- "report"
  ```
* Check latest intake status:
  ```bash
  npm run command -- "icyflamze-core-episode-1-render-intake" -- "status"
  ```

---

## 🚀 Phase Boundary Handoff
Once assembly readiness reaches 100%, the package handoff points directly to **Phase 14F: Episode 1 Trailer Assembly and Mastering**.
