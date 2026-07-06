# Episode 1: Readiness Recovery Plan

**Project:** ICYFLAMZE CORE
**Season:** Rise of the Street Scholar
**Episode:** 1 — The Core Wakes
**Date:** 2026-07-02
**Phase:** 14E-R-lite

---

## Current Blocker

The render intake incoming folders are empty. No visual or audio assets have been placed yet.

---

## Current Readiness

| Field | Value |
|---|---|
| Readiness Percentage | 0% |
| Readiness Status | not_ready |
| Reason | All incoming render folders are empty |
| Images Present | 0 |
| Audio Present | 0 |
| Videos Present | 0 |
| Cover Art Present | 0 |
| Captions Present | 0 |
| Edit Projects Present | 0 |

---

## Minimum Batch 1 Assets Required

To move readiness above 0%, the operator must generate and place at least:

| # | Asset | Category | Tool |
|---|---|---|---|
| 1 | icyflamze_core_ep01_hero_poster_v01.png | image | ChatGPT Image |
| 2 | icyflamze_core_ep01_eyes_closeup_v01.png | image | ChatGPT Image |
| 3 | icyflamze_core_ep01_lighter_spark_v01.png | image | ChatGPT Image |
| 4 | icyflamze_core_ep01_chessboard_city_v01.png | image | ChatGPT Image |
| 5 | icyflamze_core_ep01_title_card_v01.png | image | ChatGPT Image |
| 6 | icyflamze_core_ep01_voiceover_30s_v01.wav | audio | ElevenLabs / Piper |
| 7 | icyflamze_core_ep01_teaser_15s_v01.wav | audio | ElevenLabs / Piper |
| 8 | icyflamze_core_ep01_music_bed_v01.wav | audio | Manual Composition |

---

## Expected Readiness After Batch 1

| Scenario | Images | Audio | Expected Readiness | Expected Status |
|---|---|---|---|---|
| All 8 placed | 5 | 3 | ~25% | partial |
| Images only | 5 | 0 | ~15% | partial |
| Audio only | 0 | 3 | ~10% | partial |
| None placed | 0 | 0 | 0% | not_ready |

Full readiness requires all asset categories (images, videos, audio, cover art, captions, edit projects) to be populated.

---

## Commands to Rerun After Assets Are Placed

Run these in order:

```bash
npm run icyflamze-core-episode-1-render-intake -- "scan"
npm run icyflamze-core-episode-1-render-intake -- "validate"
npm run icyflamze-core-episode-1-render-intake -- "visual-review"
npm run icyflamze-core-episode-1-render-intake -- "audio-review"
npm run icyflamze-core-episode-1-render-intake -- "assembly-readiness"
npm run icyflamze-core-episode-1-render-intake -- "report"
npm run icyflamze-core-episode-1-render-intake -- "status"
```

---

## Decision Rule After Rerun

| Status After Rerun | Action |
|---|---|
| not_ready | Generate the missing assets listed in the scan report |
| partial | Continue manual asset generation for remaining categories |
| ready_for_manual_assembly | Proceed to Phase 14F: Episode 1 Final Assembly Checklist & Launch Gate |

---

## Next Phase

**Phase 14F: Episode 1 Final Assembly Checklist & Launch Gate**

Phase 14F is unlocked only when readiness status reaches `ready_for_manual_assembly`.
