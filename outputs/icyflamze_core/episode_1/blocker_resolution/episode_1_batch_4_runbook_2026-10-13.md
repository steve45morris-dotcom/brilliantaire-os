# Episode 1 Batch 4: Asset Runbook

**Project:** ICYFLAMZE CORE · *Rise of the Street Scholar*
**Episode:** 1, *The Core Wakes*
**Date:** 2026-10-13
**Covers:** the last seven slots: the five covers (COV-01 to COV-05), the captions (CAP-01) and the edit project (ASM-01). With these signed off the tracker reads 32/32 and readiness 100%, and the trailer master is exported from the edit.
**Follows** `episode_1_batch_3_runbook_2026-10-13.md`. This batch has four stages with their own prerequisites, because its slots are built on each other: the main cover needs IMG-01 approved, the four variants need the main cover approved, the captions need the eight clips and AUD-01 approved, and the edit needs the clips, every audio file and the captions approved. Each stage says what it waits on; placing a file early marks it STALE (Batch 3, Step 5, says how to recover one).

Generation stays manual, as the production boundaries require. Every command here only checks, converts, places or reports on files you made yourself. Nothing is deleted or overwritten.

> **The reference photo is the `.png`:** `~/TreeGrooveProjects/Icyflamze_3D_Avatar_Pipeline/01_reference/photos/icyflamze_reference_MASTER.png`, sha256 `d5c17f08c4963e5c7ab2528a6d7d9831be1a47a5a982cbc1921e55c2db7379d2`. Batch 3's Step 1 checks it.

---

## What is in this batch

| Stage | Slot | Asset | Shape | Made from (must be APPROVED) | Identity review | Final file | Folder |
|---|---|---|---|---|---|---|---|
| A | COV-01 | Main Cover Art | 2048×2048 (1:1) | IMG-01 Hero Poster | yes | `COV-01_main_cover_v01.png` | `incoming/cover_art/` |
| B | COV-02 | Vertical Story Crop | 1080×1920 (9:16) | COV-01 | yes | `COV-02_vertical_story_v01.png` | `incoming/cover_art/` |
| B | COV-03 | YouTube Thumbnail Crop | 1920×1080 (16:9) | COV-01 | yes | `COV-03_youtube_thumbnail_v01.png` | `incoming/cover_art/` |
| B | COV-04 | Title Typography Variant | 2048×2048 (1:1) | COV-01 | no | `COV-04_title_typography_v01.png` | `incoming/cover_art/` |
| B | COV-05 | No-Text Variant | 2048×2048 (1:1) | COV-01 | yes | `COV-05_no_text_v01.png` | `incoming/cover_art/` |
| C | CAP-01 | Subtitle SRT file | text | VID-01 to VID-08, AUD-01 | no | `CAP-01_trailer_captions_v01.srt` | `incoming/captions/` |
| D | ASM-01 | Trailer Edit Project | Resolve project | VID-01 to VID-08, AUD-01, AUD-03 to AUD-09, CAP-01 | no | `ASM-01_trailer_edit_v01.drp` | `incoming/edit_projects/` |

`incoming/` means `outputs/icyflamze_core/episode_1/render_intake/incoming/`. The tracker probes the covers like stills (shape within 2%; Step A3 makes each one exact). The captions and the edit project are documents: the tracker's bar is a non-empty file with an allowed extension (`.srt`, `.vtt`, `.txt`, `.md` for captions; `.drp`, `.prproj`, `.fcpxml`, `.xml`, `.capcut` for the edit). The cover queue asked for 3000×3000 squares; 2048 is what an image generator can honestly deliver and is above the visual checklist's 1920 minimum. If you generate in Midjourney and upscale, place the larger file: `fit_image` only scales to the size you give it.

The trailer master itself (the exported MP4) is not a slot. Stage D says where to put it.

---

## Step 1: Pre-flight

```bash
cd ~ && git pull
brew list ffmpeg >/dev/null 2>&1 || brew install ffmpeg
mkdir -p ~/Downloads/ep01_batch4
```

This prints the state of every slot this batch is built on. Read it per stage: Stage A needs the first line APPROVED; Stage C needs the VID lines and AUD-01; Stage D needs everything.

```bash
cd ~ && node -e '
const fs = require("fs");
const m = JSON.parse(fs.readFileSync("outputs/icyflamze_core/episode_1/render_intake/provenance_manifest.json", "utf8")).assets;
const ids = ["IMG-01","COV-01","VID-01","VID-02","VID-03","VID-04","VID-05","VID-06","VID-07","VID-08","AUD-01","AUD-03","AUD-04","AUD-05","AUD-06","AUD-07","AUD-08","AUD-09","CAP-01"];
for (const id of ids) console.log(id.padEnd(7), m[id] ? m[id].approvalState : "not placed");'
```

---

## Stage A: the main cover, COV-01

**Waits on:** IMG-01 APPROVED.

### A1. Generate the artwork, without text

The main cover and the no-text variant share one piece of art: generate it once with no lettering, add the title in Canva for COV-01 (A2), and keep the clean version for COV-05 (Stage B). Start a new ChatGPT chat with image generation on, attach **both** `icyflamze_reference_MASTER.png` and the approved `IMG-01_hero_poster_v01.png` from `incoming/images/`, ask for a square image, and paste:

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Make a square image (1:1), and keep the figure and the throne away from all four edges, with empty space in the upper third for a title to be added later. Create premium cover art in the same 3D anime style, palette and wardrobe as the attached poster: the man in the reference photo seated calmly on a high-tech server-rack throne, hands clasped, looking directly forward, in a matte black tactical coat with custom gold engraving and minimalist tactical straps, his black-frame glasses with a faint neon-blue diagnostic readout, his goatee and his short fade exactly as in the reference. Behind him, industrial server racks with blue LED indicators; the floor maps out as a gold chessboard grid; the shadow of a chess king behind the throne forms a crown; a matte gold lighter rests on a pedestal beside the seat. High contrast, print-safe colours. No text, no lettering, no logos, no watermark. The color palette is strictly matte black, metallic gold, and neon-blue. Avoid: anime reinterpretation of the face, superheroes, spacesuits, tribal marks, capes, random wires, meaningless buttons, tech clutter, low-quality cartoon shading.

Reject and regenerate if the face, the short fade, the black-frame glasses, the goatee or the skin tone drift from the reference, or if the wardrobe stops matching IMG-01. Download as `cover_art_base.png` into `~/Downloads/ep01_batch4/`.

### A2. Add the title in Canva

Canva, custom size 2048×2048 (or 3000×3000 if you will export larger). Place `cover_art_base.png` filling the canvas. Add, from the cover art direction:

- Title, centred in the upper third: **ICYFLAMZE CORE** on one line, **Rise of the Street Scholar** beneath it, a gilded sans-serif (Outfit or Inter weight 700), gold `#D4AF37` with a thin neon-blue `#00E5FF` outline accent.
- Metadata, small monospace text in two corners: `The Core Wakes` bottom left, `Episode 1 · Tree Groove Records` bottom right.
- Nothing else: no stickers, no gradients over the face, no extra logos.

Export as PNG at full size, no compression, to `~/Downloads/ep01_batch4/main_cover.png`. Keep the Canva design: Stage B makes the four variants from it.

### A3. Fit, place, validate

```bash
cd ~
SRC=~/Downloads/ep01_batch4
IN=outputs/icyflamze_core/episode_1/render_intake/incoming
mkdir -p "$IN/cover_art" "$IN/captions" "$IN/edit_projects"

fit_image() {
  if [ ! -f "$1" ]; then echo "MISSING source: $1"; return 1; fi
  if [ -e "$4" ]; then echo "EXISTS, not touched: $4"; return 0; fi
  ffmpeg -hide_banner -loglevel error -n -i "$1" \
    -vf "crop='min(iw,ih*$2/$3)':'min(ih,iw*$3/$2)',scale=$2:$3:flags=lanczos" -frames:v 1 "$4" \
    && echo "placed $4"
}

fit_image "$SRC/main_cover.png" 2048 2048 "$IN/cover_art/COV-01_main_cover_v01.png"

npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "scan"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "validate"
```

`validate` shows COV-01 TECHNICALLY_VERIFIED. Open the placed file and check the crop kept the title and the throne.

### A4. Sign off COV-01

```bash
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff" "COV-01" "identity" "pass"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff" "COV-01" "creative" "pass"
```

For the identity review compare his face against `icyflamze_reference_MASTER.png`; for the creative review check the direction's symbols (throne, crown shadow, lighter on its pedestal, gold chessboard floor), the palette, and that the title is legible at thumbnail size. Stage B cannot start until both reviews pass, because the four variants depend on COV-01.

---

## Stage B: the four variants, COV-02 to COV-05

**Waits on:** COV-01 APPROVED.

### B1. Make the four files in Canva

From the Stage A design, with the cover queue's crop notes:

| Save as | Canvas | What changes |
|---|---|---|
| `vertical_story.png` | 1080×1920 | Resize the design to 9:16, centred on the figure. Extend the background (server racks, grid floor) to fill the top and bottom; move the title into the middle third, below his face, so the reels interface does not cover it. Clear margins top and bottom. |
| `youtube_thumbnail.png` | 1920×1080 | Resize to 16:9 showing server racks in the side margins. Title left-aligned, larger, high impact: it has to read in a video list at a glance. |
| `title_typography.png` | 2048×2048 | Delete the artwork. Gold title on a pure dark textured leather background, text margins matching the main cover, neon-blue outline accent. No character. |
| `no_text.png` | 2048×2048 | The clean artwork: delete every text layer and export. This is `cover_art_base.png` as placed on the canvas. |

Export each as PNG at full size into `~/Downloads/ep01_batch4/`.

### B2. Fit, place, validate

```bash
cd ~
SRC=~/Downloads/ep01_batch4
IN=outputs/icyflamze_core/episode_1/render_intake/incoming
fit_image "$SRC/vertical_story.png"    1080 1920 "$IN/cover_art/COV-02_vertical_story_v01.png"
fit_image "$SRC/youtube_thumbnail.png" 1920 1080 "$IN/cover_art/COV-03_youtube_thumbnail_v01.png"
fit_image "$SRC/title_typography.png"  2048 2048 "$IN/cover_art/COV-04_title_typography_v01.png"
fit_image "$SRC/no_text.png"           2048 2048 "$IN/cover_art/COV-05_no_text_v01.png"

npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "scan"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "validate"
```

If you closed Terminal since Stage A, paste the `fit_image` function from A3 first. `scan` now shows cover_art 5/5.

### B3. Sign off

| Slot | Reviews owed |
|---|---|
| COV-02, COV-03, COV-05 | identity and creative |
| COV-04 | creative only (no character) |

```bash
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff-pending"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff" "COV-02" "identity" "pass"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff" "COV-02" "creative" "pass"
```

And the same for COV-03, COV-04 (creative only) and COV-05. The creative review for the crops is about the crop: nothing important cut off, text inside the safe area, the same artwork as COV-01.

---

## Stage C: the captions, CAP-01

**Waits on:** VID-01 to VID-08 and AUD-01 APPROVED.

The captions are the narration, one cue per line, timed to the **recorded** AUD-01. The voiceover script gives the planned cue times, and the file below starts from them. Then retime each cue to the recording: open `AUD-01_voiceover_30s_v01.wav` in CapCut or Resolve with this SRT, and drag each cue's in and out points to where the line is actually spoken. A recording that runs 27 seconds rather than 30 moves every cue; a cue must start within a quarter of a second of its first word.

Write the draft file:

```bash
mkdir -p ~/Downloads/ep01_batch4
cat > ~/Downloads/ep01_batch4/trailer_captions.srt <<'SRT'
1
00:00:00,000 --> 00:00:02,000
They thought he was just another voice from the pressure.

2
00:00:02,000 --> 00:00:05,000
But pressure was never his prison.

3
00:00:05,000 --> 00:00:08,000
It was his professor.

4
00:00:08,000 --> 00:00:12,000
Every loss became data.
Every silence became strategy.

5
00:00:12,000 --> 00:00:16,000
Every scar became a signal.

6
00:00:16,000 --> 00:00:20,000
He did not just survive the city.

7
00:00:20,000 --> 00:00:22,000
He decoded it.

8
00:00:22,000 --> 00:00:30,000
This is ICYFLAMZE CORE.
Street wisdom. Scientific mind. Futuristic soul.
SRT
```

Retime it against the recording, save it back to the same name, then place and validate:

```bash
cd ~
IN=outputs/icyflamze_core/episode_1/render_intake/incoming
[ -e "$IN/captions/CAP-01_trailer_captions_v01.srt" ] && echo "EXISTS, not touched" || \
  cp ~/Downloads/ep01_batch4/trailer_captions.srt "$IN/captions/CAP-01_trailer_captions_v01.srt"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "scan"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "validate"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff" "CAP-01" "creative" "pass"
```

`validate` shows CAP-01 TECHNICALLY_VERIFIED with "Document present". The creative review is the timing: play the narration with the captions on and confirm every cue lands on its line. Styling (monospace, centred lower third, clear margins) is done in the edit, not in the SRT.

---

## Stage D: the edit project, ASM-01

**Waits on:** VID-01 to VID-08, AUD-01, AUD-03 to AUD-09 and CAP-01 APPROVED.

### D1. Build the timeline in DaVinci Resolve

New project `ICYFLAMZE_CORE_EP01_trailer`. Timeline 1920×1080, 24 fps, 30.0 seconds. Import everything from `incoming/`: the eight clips from `videos/`, `IMG-07_title_card_v01.png` from `images/`, the narration, music bed and six effects from `audio/`, and the SRT from `captions/`.

Video, in the order the video queue makes authoritative (VID-07 is B-roll in the resolution block, and the title card is a held still over the throne shot):

| Track | Asset | In | Out | Note |
|---|---|---|---|---|
| V1 | VID-01 Cyber Lens Close-up | 0.0 | 3.0 | |
| V1 | VID-02 Circuit Skyline | 3.0 | 6.5 | |
| V1 | VID-03 Gold Lighter Ignition | 6.5 | 10.5 | |
| V1 | VID-04 Equation Microphone | 10.5 | 14.0 | |
| V1 | VID-05 Chess King Drop | 14.0 | 17.0 | |
| V1 | VID-06 Orbiting Library | 17.0 | 21.5 | |
| V1 | VID-07 Lighter Beats Flick | 21.5 | 26.0 | |
| V1 | VID-08 Empire Overlook | 26.0 | 30.0 | |
| V2 | IMG-07 Title Card | 26.0 | 30.0 | fade in over 1.0s from 26.0, held to the end, over the throne |
| V3 | CAP-01 captions | 0.0 | 30.0 | import the SRT as a subtitle track; monospace, centred lower third, clear margins |

Cross-dissolves of 6 frames between clips, placed on the beat of the music bed. The assembly checklist's note: sync the transitions to the bass kicks.

Audio, from the shot list's sound design notes:

| Track | Asset | At | Note |
|---|---|---|---|
| A1 | AUD-01 Voiceover | 0.0 | the master; everything else sits under it |
| A2 | AUD-03 Music Bed | 0.0 | the full 30.0s; dip 6 dB under the narration |
| A3 | AUD-05 City Hum | 0.0 to 30.0 | low, under everything; fades with the bed |
| A4 | AUD-06 AI Interface | 0.0 | the diagnostics on the lens (Shot 1) |
| A4 | AUD-04 Lighter Spark | 6.5 | the strike in Shot 3; reuse on each flick in VID-07 if the picture calls for it |
| A4 | AUD-07 Chess Impact | at the thud in VID-05 | find the frame the king lands on, from 14.0 |
| A4 | AUD-06 AI Interface | 20.0 | the activation chime on "He decoded it." |
| A4 | AUD-08 Title Reveal Hit | 26.0 | with the title card fade-in |
| A5 | AUD-09 Outro Ambience | 25.0 | fades out at 30.0 |

Loudness: the rollout checklist asks for -14 LUFS on the master; Resolve's loudness meter on the Fairlight page shows it.

### D2. Export the master, then the project

Deliver page: H.264, 1920×1080, 24 fps, audio AAC 320 kbps, 30.0s, to `~/Movies/ICYFLAMZE_CORE/ep01_trailer_master_v01.mp4`. The assembly checklist wants it under 20 MB; raise the quality setting until just under. A 9:16 version for TikTok and Reels is the same timeline with the output resolution set to 1080×1920 and the clips reframed to the subject, exported beside it as `ep01_trailer_vertical_v01.mp4`. Neither export is a slot, and neither goes into the repo.

Then save the project as a file, which is the slot: File → Export Project, to `~/Downloads/ep01_batch4/trailer_edit.drp`.

### D3. Place, validate, sign off

```bash
cd ~
IN=outputs/icyflamze_core/episode_1/render_intake/incoming
[ -e "$IN/edit_projects/ASM-01_trailer_edit_v01.drp" ] && echo "EXISTS, not touched" || \
  cp ~/Downloads/ep01_batch4/trailer_edit.drp "$IN/edit_projects/ASM-01_trailer_edit_v01.drp"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "scan"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "validate"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "status"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff" "ASM-01" "creative" "pass"
```

The creative review for ASM-01 is the master export: watch it once at full size and once on a phone. Every clip in order, narration clear over the bed, captions on their lines, the title card reads, nothing clipped.

---

## What a finished run looks like

| After | v2 `scan` | v2 `status` |
|---|---|---|
| Stage A | cover_art 1/5, readiness 81% | COV-01 APPROVED after A4 |
| Stage B | cover_art 5/5, readiness 94% | all five covers APPROVED |
| Stage C | caption 1/1, readiness 97% | CAP-01 APPROVED |
| Stage D | assembly 1/1, readiness 100% | all 32 slots APPROVED, Integrity Health CLEAN |

A row marked FAILED names the problem in its details column: for a cover, a shape outside 2% of its ratio; for a document, an empty file or an extension the slot does not allow. A row marked STALE means a parent was not APPROVED when the file was validated: Batch 3, Step 5, covers recovery.

With all 32 approved, the roadmap's next lines are "Export Episode 1", which Stage D2 does, and the finish line in sentinel-os `docs/FINISH_LINE.md`.

---

## Replacing a file

v2 checks only the first file per slot in name order, so a v02 next to a v01 would never be looked at. Move the old version out of the intake folder, then place the new one as v02. Moving keeps the old file; nothing is deleted. For example, for the vertical crop:

```bash
cd ~
mkdir -p outputs/icyflamze_core/episode_1/render_intake/superseded
mv outputs/icyflamze_core/episode_1/render_intake/incoming/cover_art/COV-02_vertical_story_v01.png \
   outputs/icyflamze_core/episode_1/render_intake/superseded/
```

Then rerun the matching `fit_image` or `cp` line with `_v02` in the final name, and rerun `validate`. Replacing COV-01 marks its four variants STALE, because they were made from it; replacing CAP-01 marks ASM-01 STALE.

---

## Don't commit the renders

Since 2026-10-13, images in `incoming/cover_art/` and everything in `incoming/edit_projects/` are git-ignored, as the WAV and video renders are. The SRT in `incoming/captions/` is not ignored: it is small text and the record of the timing, so commit it with the tracker files if you want it on other machines, or leave it. Before any commit from `~`, check what is staged:

```bash
cd ~ && git status --short outputs/icyflamze_core/episode_1/render_intake/
```
