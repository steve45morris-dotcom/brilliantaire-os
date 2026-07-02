# Master Asset Queue: Episode 1 Trailer — The Core Wakes

This document tracks all physical asset generation tasks required to render the Episode 1 trailer.

## 📊 Summary Metrics
* **Total Queued Assets:** 23
* **Generation Status:** `ready_for_manual_generation`
* **Direct Vault Write:** `No (Blocked)`

## 🗂️ Asset Queue Ledger

| Asset ID | Category | Asset Name | Source Document | Assigned Tool | Status | Priority | Required Before Assembly | Manual Generation Instruction | Review Notes |
|---|---|---|---|---|---|---|---|---|---|
| IMG-01 | image | Hero Poster | outputs/icyflamze_core/episode_1/cover_art/episode_1_cover_art_direction_2026-07-02.md | Midjourney | ready_for_manual_generation | High | Yes | Generate square 1:1 main visual art of character on throne | Awaiting render |
| IMG-02 | image | Eyes Close-up | outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_2026-07-02.md | Midjourney | ready_for_manual_generation | High | Yes | Generate macro eye shot showing blue-gold terminal reflects | Needs neon alignment |
| IMG-03 | image | City Circuit Lights | outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_2026-07-02.md | Midjourney | ready_for_manual_generation | Medium | Yes | Generate circuit layout skyscraper panning visuals | Neon details |
| IMG-04 | image | Lighter Spark | outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_2026-07-02.md | Midjourney | ready_for_manual_generation | High | Yes | Generate slow motion gold spark strike detailing | Needs high contrast |
| IMG-05 | image | Lyrics as Equations | outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_2026-07-02.md | Midjourney | ready_for_manual_generation | Medium | Yes | Generate studio mic with floating equation overlays | Blue neon texts |
| IMG-06 | image | Chessboard City | outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_2026-07-02.md | Midjourney | ready_for_manual_generation | High | Yes | Generate chess king placed on pavement chalk layout | Wet asphalt reflections |
| IMG-07 | image | Books / AI Panels | outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_2026-07-02.md | Midjourney | ready_for_manual_generation | High | Yes | Generate orbiting leather books and holo screens grid | High contrast |
| IMG-08 | image | Title Card | outputs/icyflamze_core/episode_1/scripts/episode_1_trailer_script_2026-07-02.md | Canva | ready_for_manual_generation | Critical | Yes | Layout Title Typography overlaying dark gold-blue core | Main design typography |
| COV-01 | cover_art | Main Cover Art | outputs/icyflamze_core/episode_1/cover_art/episode_1_cover_art_direction_2026-07-02.md | Midjourney | ready_for_manual_generation | High | Yes | Assemble gold title variant with Anime visual assets | Release single artwork |
| AUD-01 | audio | 30s Voiceover Audio | outputs/icyflamze_core/episode_1/scripts/episode_1_30_second_voiceover_2026-07-02.md | ElevenLabs | ready_for_manual_generation | Critical | Yes | Generate philosophical narration track with clear pauses | Calm, strategic cadence |
| AUD-02 | audio | 15s Teaser Audio | outputs/icyflamze_core/episode_1/scripts/episode_1_15_second_teaser_2026-07-02.md | ElevenLabs | ready_for_manual_generation | High | Yes | Generate condensed teaser narration voice track | High impact delivery |
| AUD-03 | audio | Trailer Music Bed | outputs/icyflamze_core/episode_1/audio/episode_1_audio_direction_2026-07-02.md | Premiere Pro | ready_for_manual_generation | High | Yes | Loop and trim main record instrumental track | Deep sub-bass beat |
| AUD-04 | audio | Sound Effects Pack | outputs/icyflamze_core/episode_1/audio/episode_1_audio_direction_2026-07-02.md | DaVinci Resolve | ready_for_manual_generation | Medium | Yes | Aggregate spark swooshes, heartbeat hums, chess thuds | High fidelity sweeps |
| VID-01 | video | Shot 1: Cyber Lens Close-up | outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_2026-07-02.md | Sora | ready_for_manual_generation | High | Yes | Animate blue diagnostic lens reflections in slow motion | 3.0 seconds duration |
| VID-02 | video | Shot 2: Circuit Skyline | outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_2026-07-02.md | Sora | ready_for_manual_generation | Medium | Yes | Animate crane pan over city circuit board skyscraper | 3.5 seconds duration |
| VID-03 | video | Shot 3: Gold Lighter Ignition | outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_2026-07-02.md | Sora | ready_for_manual_generation | High | Yes | Animate macro side spark ignition to blue core flame | 4.0 seconds duration |
| VID-04 | video | Shot 4: Equation Microphone | outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_2026-07-02.md | Veo | ready_for_manual_generation | Medium | Yes | Animate orbiting math formulas surrounding studio mic | 3.5 seconds duration |
| VID-05 | video | Shot 5: Chess King Drop | outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_2026-07-02.md | Runway | ready_for_manual_generation | High | Yes | Animate low-angle chess piece thud on wet concrete | 3.0 seconds duration |
| VID-06 | video | Shot 6: Orbiting Library | outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_2026-07-02.md | Veo | ready_for_manual_generation | High | Yes | Animate rotational pan of flying books and hologram arrays | 4.5 seconds duration |
| VID-07 | video | Shot 7: Hand striking lighter | outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_2026-07-02.md | Sora | ready_for_manual_generation | High | Yes | Animate close shot of fingers flicking lighters on beat | 4.5 seconds duration |
| VID-08 | video | Shot 8: Empire Overlook | outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_2026-07-02.md | Veo | ready_for_manual_generation | High | Yes | Animate hero stance looking over neon server grid city | 4.0 seconds duration |
| CAP-01 | caption | Subtitle SRT file | outputs/icyflamze_core/episode_1/captions/episode_1_caption_pack_2026-07-02.md | CapCut | ready_for_manual_generation | High | No | Sync timestamp subtitles for Instagram and TikTok reel formats | Clean monospace typography |
| ASM-01 | assembly | Trailer Edit Project | outputs/icyflamze_core/episode_1/rollout/episode_1_rollout_checklist_2026-07-02.md | DaVinci Resolve | ready_for_manual_generation | Critical | Yes | Sequence visual files, layer voiceover and audio stems | Final master render file |
