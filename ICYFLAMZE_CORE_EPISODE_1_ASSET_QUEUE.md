# ICYFLAMZE CORE: Episode 1 Asset Generation Queue

This document registers the strict guidelines and structures for compiling, staging, and tracking Phase 14D (Episode 1 Asset Generation Queue) files for ICYFLAMZE CORE Episode 1: *The Core Wakes*.

---

## 🎯 Purpose & Scope

The **Episode 1 Asset Generation Queue** acts as the intermediate buffer between visual/narrative script production (Phase 14C) and final video rendering and assembly. It ensures that every single image, video clip, voiceover file, sound design element, cover art format, and social caption is systematically cataloged and assigned a tracking ID before manual production begins.

---

## 🔒 Strict Production Boundaries (No-Generation Rules)

To maintain absolute local system safety and offline sandboxing constraints, the compiler adheres to these rules:

1. **NO AUTOMATED IMAGES:** No calls are made to Midjourney, ChatGPT Image, DALL-E, or other visual APIs. All prompts must be copied and run manually.
2. **NO AUTOMATED AUDIO:** No automated TTS models (ElevenLabs, Piper) are executed by scripts. All narration and SFX are manually tracked.
3. **NO AUTOMATED VIDEO:** No Sora, Veo, Runway, Kling, or Pika renders are executed automatically.
4. **NO DIRECT VAULT WRITES:** Direct writes to Obsidian vaults are strictly disabled (`ALLOW_OBSIDIAN_DIRECT_WRITE = false`). Notes are staged in `outputs/write_staging/`.
5. **NO PUBLISHING:** No automated publishing to social platforms, YouTube, or Tree Groove Records distribution occurs.
6. **NO DELETIONS:** No local output files are deleted or overwritten without appropriate timestamp tracking.

---

## 📊 Tracked Asset Categories & Status Labels

### Asset Categories
* `image` - Static imagery, poster designs, and storyboards.
* `video` - Renders, animations, B-rolls, and cinematic loops.
* `audio` - Narration voiceovers, soundtrack cuts, and SFX beds.
* `cover_art` - Promotional graphics and crops for streaming platforms.
* `caption` - Subtitles, metadata tags, and CTAs.
* `assembly` - Final sequence assembly project files.
* `review` - Verification items and audit logs.

### Status Labels
* `queued` - Registered in the master list, not yet compiled.
* `ready_for_manual_generation` - Prompts and parameters ready to copy-paste.
* `generated_pending_review` - Asset created by creator, awaiting validation.
* `approved` - Passes design criteria and ready for edit timeline.
* `rejected` - Fails design criteria, requires regeneration.
* `needs_revision` - Needs minor visual/audio adjustments.
* `assembled` - Integrated into the final trailer timeline.

---

## 💻 CLI Commands Syntax

* Print help menu:
  ```bash
  npm run command -- "icyflamze-core-episode-1-asset-queue-help"
  ```
* Compile master asset queue:
  ```bash
  npm run command -- "icyflamze-core-episode-1-asset-queue" -- "queue"
  ```
* Compile image asset queue:
  ```bash
  npm run command -- "icyflamze-core-episode-1-asset-queue" -- "image-assets"
  ```
* Compile video asset queue:
  ```bash
  npm run command -- "icyflamze-core-episode-1-asset-queue" -- "video-assets"
  ```
* Compile audio asset queue:
  ```bash
  npm run command -- "icyflamze-core-episode-1-asset-queue" -- "audio-assets"
  ```
* Compile cover art asset queue:
  ```bash
  npm run command -- "icyflamze-core-episode-1-asset-queue" -- "cover-art-assets"
  ```
* Compile trailer assembly checklist:
  ```bash
  npm run command -- "icyflamze-core-episode-1-asset-queue" -- "assembly-checklist"
  ```
* Compile manual generation guide:
  ```bash
  npm run command -- "icyflamze-core-episode-1-asset-queue" -- "manual-guide"
  ```
* Stage Obsidian note:
  ```bash
  npm run command -- "icyflamze-core-episode-1-asset-queue" -- "obsidian-stage"
  ```
* Generate queue audit report:
  ```bash
  npm run command -- "icyflamze-core-episode-1-asset-queue" -- "report"
  ```
* Check latest queue status:
  ```bash
  npm run command -- "icyflamze-core-episode-1-asset-queue" -- "status"
  ```

---

## 🚀 Phase Boundary Handoff
Upon successful validation of the asset queues, the package handoff points directly to **Phase 14E: Episode 1 Trailer Rendering and Assembly**.
