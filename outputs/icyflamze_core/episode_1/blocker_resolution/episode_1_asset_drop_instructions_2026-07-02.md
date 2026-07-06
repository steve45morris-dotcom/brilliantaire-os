# Episode 1: Asset Drop Instructions

**Project:** ICYFLAMZE CORE
**Season:** Rise of the Street Scholar
**Episode:** 1 — The Core Wakes
**Date:** 2026-07-02
**Phase:** 14E-R-lite

---

## Purpose

After generating Batch 1 assets manually, place each file in the exact folder with the exact filename listed below. The render intake tracker will detect these files on the next scan.

---

## Image Assets

Drop into: `outputs/icyflamze_core/episode_1/render_intake/incoming/images/`

| # | Filename | Source Tool |
|---|---|---|
| 1 | icyflamze_core_ep01_hero_poster_v01.png | ChatGPT Image |
| 2 | icyflamze_core_ep01_eyes_closeup_v01.png | ChatGPT Image |
| 3 | icyflamze_core_ep01_lighter_spark_v01.png | ChatGPT Image |
| 4 | icyflamze_core_ep01_chessboard_city_v01.png | ChatGPT Image |
| 5 | icyflamze_core_ep01_title_card_v01.png | ChatGPT Image |

---

## Audio Assets

Drop into: `outputs/icyflamze_core/episode_1/render_intake/incoming/audio/`

| # | Filename | Source Tool |
|---|---|---|
| 6 | icyflamze_core_ep01_voiceover_30s_v01.wav | ElevenLabs / Piper |
| 7 | icyflamze_core_ep01_teaser_15s_v01.wav | ElevenLabs / Piper |
| 8 | icyflamze_core_ep01_music_bed_v01.wav | Manual Composition |

---

## Other Intake Folders (For Future Batches)

| Folder | Path |
|---|---|
| Cover Art | outputs/icyflamze_core/episode_1/render_intake/incoming/cover_art/ |
| Videos | outputs/icyflamze_core/episode_1/render_intake/incoming/videos/ |
| Captions | outputs/icyflamze_core/episode_1/render_intake/incoming/captions/ |
| Edit Projects | outputs/icyflamze_core/episode_1/render_intake/incoming/edit_projects/ |

---

## Naming Convention

```
icyflamze_core_ep01_{asset_name}_v{version}.{ext}
```

- All lowercase with underscores
- ep01 for Episode 1
- v01 for first version, v02 for revisions
- .png for images
- .wav for audio

---

## Verification After Drop

After placing all files, run:

```bash
npm run icyflamze-core-episode-1-render-intake -- "scan"
npm run icyflamze-core-episode-1-render-intake -- "status"
```

The scan should detect the newly placed files and update the readiness percentage.
