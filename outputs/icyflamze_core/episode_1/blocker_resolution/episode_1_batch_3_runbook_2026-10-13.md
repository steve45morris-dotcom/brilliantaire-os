# Episode 1 Batch 3: Asset Runbook

**Project:** ICYFLAMZE CORE · *Rise of the Street Scholar*
**Episode:** 1, *The Core Wakes*
**Date:** 2026-10-13
**Covers:** the eight video clips, VID-01 to VID-08. Generate each from its approved still, trim and place it, rerun the tracker, sign it off.
**Follows** `episode_1_batch_2_runbook_2026-10-06.md`. Unlike Batches 1 and 2, this batch **cannot start until its parents are APPROVED**: every clip depends on the narration AUD-01 and on one still from Batch 1 or 2. A clip placed before its parents are approved is marked STALE by the tracker (Step 5 says how to recover one).

Generation stays manual, as the production boundaries require. Every command here only checks, converts, places or reports on files you made yourself. Nothing is deleted or overwritten.

> **The reference photo is the `.png`.** The IP bible's 2026-09-15 entry found that `icyflamze_reference_MASTER.jpeg` was the "Who Is Icyflamze" MP3 with the wrong extension. The anchor for every character frame is `~/TreeGrooveProjects/Icyflamze_3D_Avatar_Pipeline/01_reference/photos/icyflamze_reference_MASTER.png`, sha256 `d5c17f08c4963e5c7ab2528a6d7d9831be1a47a5a982cbc1921e55c2db7379d2`. The Batch 1 and 2 runbooks named the `.jpeg`; they carry a correction note now, and `signoff-pending` prints the `.png`.

---

## What is in this batch, and what is not

| Slot | Shot | Tool | Length | Made from (must be APPROVED) | Identity review | Final file |
|---|---|---|---|---|---|---|
| VID-01 | Cyber Lens Close-up | Sora | 3.0s | IMG-02 Eyes Close-up | yes | `VID-01_cyber_lens_closeup_v01.mp4` |
| VID-02 | Circuit Skyline | Sora | 3.5s | IMG-04 Circuit Skyline | no | `VID-02_circuit_skyline_v01.mp4` |
| VID-03 | Gold Lighter Ignition | Sora | 4.0s | IMG-03 Lighter Spark | no | `VID-03_gold_lighter_ignition_v01.mp4` |
| VID-04 | Equation Microphone | Veo | 3.5s | IMG-05 Lyrics as Equations | no | `VID-04_equation_microphone_v01.mp4` |
| VID-05 | Chess King Drop | Runway | 3.0s | IMG-08 Chess King Drop | no | `VID-05_chess_king_drop_v01.mp4` |
| VID-06 | Orbiting Library | Veo | 4.5s | IMG-06 Books / AI Panels | yes | `VID-06_orbiting_library_v01.mp4` |
| VID-07 | Lighter Beats Flick | Sora | 4.5s | IMG-03 Lighter Spark | no | `VID-07_lighter_beats_flick_v01.mp4` |
| VID-08 | Empire Overlook | Veo | 4.0s | IMG-01 Hero Poster | yes | `VID-08_empire_overlook_v01.mp4` |

All eight are 16:9, placed in `incoming/videos/`, where `incoming/` means `outputs/icyflamze_core/episode_1/render_intake/incoming/`. Every clip also depends on **AUD-01**, the 30s narration. The tracker accepts a clip within 10% of its target length (never less than half a second either side) and within 2% of 16:9. Step 3 makes every clip exactly 1920×1080 at its exact length, so these never bite.

Two things the slot numbers do not tell you, from the video asset queue: VID-07 is B-roll with no shot-list entry, and VID-08 is Shot 7 of the shot list. Shot 8, the title card, is a held still composited in the edit; it has no clip.

**VID-05's parent changed on 2026-10-13.** The production manifest said it was made from IMG-06 (Books / AI Panels); it is made from IMG-08 (Chess King Drop), and now says so. After `git pull` the tracker uses the new parent.

**Not in this batch.** These wait until the eight clips are APPROVED:

- **The five covers, COV-01 to COV-05.** COV-01 depends on IMG-01; the other four depend on COV-01. They are Batch 4 with the captions and the edit.
- **The captions and the edit project, CAP-01 and ASM-01.** Both depend on all eight videos and AUD-01.

---

## Step 1: Pre-flight

Pull, check `ffmpeg`, and check the **real** reference photo:

```bash
cd ~ && git pull
brew list ffmpeg >/dev/null 2>&1 || brew install ffmpeg
shasum -a 256 ~/TreeGrooveProjects/Icyflamze_3D_Avatar_Pipeline/01_reference/photos/icyflamze_reference_MASTER.png
```

The checksum must read:

```
d5c17f08c4963e5c7ab2528a6d7d9831be1a47a5a982cbc1921e55c2db7379d2
```

If it doesn't, stop and check `~/Desktop/icyflamze-identity-offsite-20260915/` before generating anything.

Then confirm the parents are approved. This prints the state of the nine slots this batch is built on:

```bash
cd ~ && node -e '
const fs = require("fs");
const m = JSON.parse(fs.readFileSync("outputs/icyflamze_core/episode_1/render_intake/provenance_manifest.json", "utf8")).assets;
for (const id of ["AUD-01","IMG-01","IMG-02","IMG-03","IMG-04","IMG-05","IMG-06","IMG-08"]) console.log(id.padEnd(7), m[id] ? m[id].approvalState : "not placed");'
```

Every line must read `APPROVED`. One that reads `TECHNICALLY_VERIFIED` still needs its sign-off from the Batch 1 or Batch 2 runbook (Step 6 there); `signoff-pending` lists exactly what is owed. You can generate a clip whose parent is approved while another parent is still waiting, but do not place it until Step 3 says its parent is done.

Make the download folder for this batch:

```bash
mkdir -p ~/Downloads/ep01_batch3
```

---

## Step 2: Generate the 8 clips

Every clip is **image-to-video from its approved still**, so the trailer cuts between frames that already match. The stills are the 1920×1080 files in `incoming/images/` that you signed off; upload the one named in the table as the clip's first frame or reference image. Do not generate from text alone.

Rules for all eight, from the IP bible and the video queue:

1. The first two sentences of every prompt are the identity lock line, required verbatim on every image or video prompt, with or without a character in frame.
2. For the three character shots (VID-01, VID-06, VID-08), also attach `icyflamze_reference_MASTER.png`. Reject and regenerate if the face, the short fade, the black-frame glasses, the goatee or the skin tone drift from the reference, or if the generator reinterprets him as anime or cyberpunk: the lock allows pose, camera, environment, lighting and clothing to vary, nothing about the face.
3. Landscape 16:9, no text, no logos, no watermarks. The palette is black, metallic gold and neon-blue only.
4. Ask for the **shortest length the tool offers**. Each tool makes clips longer than the targets; Step 3 trims to length. Generate the clip, scrub it, and note the second where the motion is best: that is the start offset for Step 3.
5. Keep the subject away from the top and bottom edges. A tool that makes 16:9 needs no crop; one that makes another shape is cropped to 16:9 in Step 3.
6. Download the MP4 into `~/Downloads/ep01_batch3/` with the name shown.

Per tool:

- **Sora** (VID-01, VID-02, VID-03, VID-07): in ChatGPT, open Sora, choose image-to-video, upload the still, set landscape 16:9 and the shortest duration (5s), highest resolution available. Paste the prompt. Download as MP4.
- **Veo** (VID-04, VID-06, VID-08): in Gemini or Flow, choose image-to-video with the still as the first frame, 16:9. Veo makes 8-second clips with its own sound; Step 3 trims the picture and drops the sound, since the trailer uses AUD-01 and the Batch 2 effects. Download as MP4.
- **Runway** (VID-05): Gen-4 image-to-video, upload the still, 16:9, 5s. Paste the prompt. Download as MP4.

### VID-01 Cyber Lens Close-up: save as `cyber_lens_closeup.mp4`

First frame: `IMG-02_eyes_closeup_v01.png`. Attach the reference photo. Character shot.

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Animate this frame as a 3-second extreme macro close-up of the man's eyes behind his black-frame cybernetic glasses. The camera creeps slowly into the pupil. Neon-blue and gold terminal diagnostics scroll and blink across the lenses, and a faint map of a chessboard city draws itself on the glass. He does not move; one slow blink at most. Chiaroscuro darkness, glow highlights on the eyes, the frame style exactly as in the reference. The color palette is strictly black, metallic gold, and neon-blue. Avoid: fast camera moves, facial distortion, face changes, standard glasses, goofy colour maps, text, watermarks.

### VID-02 Circuit Skyline: save as `circuit_skyline.mp4`

First frame: `IMG-04_chessboard_city_v01.png`. No character is shown.

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Animate this frame as a 3.5-second high-angle crane shot panning slowly down across a neon cyberpunk cityscape laid out like a circuit board. Rain falls, gold office windows flicker in patterns like running algorithms, and car lights leave long shutter drags along the grid. No person in frame. Stormy night, reflections of neon-blue and gold on wet asphalt, 3D anime. The color palette is strictly black, metallic gold, and neon-blue. Avoid: daylight, spaceships, hyper-speed camera sweeps, text, watermarks.

### VID-03 Gold Lighter Ignition: save as `gold_lighter_ignition.mp4`

First frame: `IMG-03_lighter_spark_v01.png`. No character is shown.

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Animate this frame as a 4-second slow-motion macro shot of a matte gold lighter being struck in pitch black darkness. The camera slides slowly along the side. Sparks pop outward one by one, then catch into a steady flame with a blue core and gold edges that rises cleanly. No hand shaking, no face. Chiaroscuro, deep black background lit only by the sparks and the flame. The color palette is strictly black, metallic gold, and neon-blue. Avoid: yellow plastic lighters, daylight, text, watermarks.

### VID-04 Equation Microphone: save as `equation_microphone.mp4`

First frame: `IMG-05_lyrics_equations_v01.png`. No character is shown.

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Animate this frame as a 3.5-second orbital tracking shot inside a dark recording studio booth. Glowing neon-blue holographic lyric lines and mathematical formulas in a monospace font float and slowly orbit a classic studio microphone with its pop filter, compiling line by line, with soundwave ripples flowing through them. The text stays readable. No person in frame. Neon-blue reflections on the acoustic padding, gold accent light on the microphone. The color palette is strictly black, metallic gold, and neon-blue. Avoid: live musicians, cartoon music notes, bright lights, text other than the floating formulas, watermarks.

### VID-05 Chess King Drop: save as `chess_king_drop.mp4`

First frame: `IMG-08_chess_king_drop_v01.png`. No character is shown.

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Animate this frame as a 3-second low-angle shot from the asphalt. A metallic gold chess king drops heavily onto a chalk-drawn chessboard grid on wet, cracked concrete and lands with a thud, water splashing outward from its base. The camera tilts slowly upward as it settles. Rain falls; the pavement reflects gold streetlights and neon-blue signs. No figure, no face, no person. Chiaroscuro, heavy rain. The color palette is strictly black, metallic gold, and neon-blue. Avoid: daylight, red or green tones, text, logos, lens flare, watermarks.

### VID-06 Orbiting Library: save as `orbiting_library.mp4`

First frame: `IMG-06_books_ai_panels_v01.png`. Attach the reference photo. Character shot.

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Animate this frame as a 4.5-second 360-degree orbit around the man in the reference photo, who stands calm and centred in his matte black tactical coat with gold engraving. Antique leather-bound books, soundwave graphs and transparent neon-blue terminal screens orbit him in the opposite direction, slowly, with the book spines and the interface grids staying stable and legible. His face, his black-frame glasses with a faint diagnostic readout, his goatee and his short fade stay exactly as in the reference throughout the orbit. Bright gold rays from the books against neon-blue grids. The color palette is strictly black, metallic gold, and neon-blue. Avoid: anime reinterpretation of the face, superpowers, magic circles, capes, spaceship dashboards, random wires, tech clutter, text, watermarks.

### VID-07 Lighter Beats Flick: save as `lighter_beats_flick.mp4`

First frame: `IMG-03_lighter_spark_v01.png`. Hands only; no face is shown.

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Animate this frame as a 4.5-second sequence of close-ups on a pair of hands with warm brown skin flicking matte gold lighters open and striking them in a rhythmic pattern, like a snare hit on every beat, with sharp jump cuts between the flicks. The same hands and the same lighter model in every cut. Sparks and brief blue-core flames on each strike. No face in frame. Pitch black background, chiaroscuro, the lighters lit only by their own sparks. The color palette is strictly black, metallic gold, and neon-blue. Avoid: changing hands or lighter design between cuts, yellow plastic lighters, daylight, text, watermarks.

### VID-08 Empire Overlook: save as `empire_overlook.mp4`

Reference image: `IMG-01_hero_poster_v01.png`. It is portrait (9:16), so upload it as the reference image rather than the first frame if the tool distinguishes them, and keep him centred. Attach the reference photo. Character shot.

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Animate this as a 4-second high-angle shot that slowly pulls out from the man in the reference photo, calm, hands clasped, seated on a high-tech gold-accented server-rack throne, overlooking glowing mainframes and neon city streets laid out like a circuit board far below. He breathes slowly and does not otherwise move; ambient dust drifts through the server cooling fans; server nodes pulse neon-blue and gold. A key highlight on the side of his face, backlight casting a golden throne shadow. His face, black-frame glasses, goatee and short fade exactly as in the reference. The color palette is strictly black, metallic gold, and neon-blue. Avoid: fast camera moves, facial distortion, anime reinterpretation of the face, capes, spaceships, background people walking, text, watermarks.

---

## Step 3: Fit and place the files

Paste this whole block into Terminal. It crops each clip to 16:9 if needed, scales it to exactly 1920×1080, trims it to its exact target length from the start offset you noted (0 if you noted none), re-encodes it as H.264 with no audio track, and prints `placed` with the source length so you can spot a clip that was trimmed hard. The originals stay in `~/Downloads/ep01_batch3/`.

It never overwrites. A file already in the intake folder is reported as `EXISTS` and left alone.

Edit the last number on a line to change where the trimmed clip starts. For example, `1.5` on the VID-03 line keeps seconds 1.5 to 5.5 of the generated clip.

```bash
cd ~
SRC=~/Downloads/ep01_batch3
IN=outputs/icyflamze_core/episode_1/render_intake/incoming
mkdir -p "$IN/videos"

fit_video() {
  # fit_video <source> <seconds> <final path> [start offset in seconds]
  if [ ! -f "$1" ]; then echo "MISSING source: $1"; return 1; fi
  if [ -e "$3" ]; then echo "EXISTS, not touched: $3"; return 0; fi
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$1")
  ffmpeg -hide_banner -loglevel error -n -ss "${4:-0}" -i "$1" -t "$2" \
    -vf "crop='min(iw,ih*16/9)':'min(ih,iw*9/16)',scale=1920:1080:flags=lanczos,setsar=1" \
    -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart -an "$3" \
    && echo "placed $3 (source ${d}s)"
}

fit_video "$SRC/cyber_lens_closeup.mp4"    3.0 "$IN/videos/VID-01_cyber_lens_closeup_v01.mp4"    0
fit_video "$SRC/circuit_skyline.mp4"       3.5 "$IN/videos/VID-02_circuit_skyline_v01.mp4"       0
fit_video "$SRC/gold_lighter_ignition.mp4" 4.0 "$IN/videos/VID-03_gold_lighter_ignition_v01.mp4" 0
fit_video "$SRC/equation_microphone.mp4"   3.5 "$IN/videos/VID-04_equation_microphone_v01.mp4"   0
fit_video "$SRC/chess_king_drop.mp4"       3.0 "$IN/videos/VID-05_chess_king_drop_v01.mp4"       0
fit_video "$SRC/orbiting_library.mp4"      4.5 "$IN/videos/VID-06_orbiting_library_v01.mp4"      0
fit_video "$SRC/lighter_beats_flick.mp4"   4.5 "$IN/videos/VID-07_lighter_beats_flick_v01.mp4"   0
fit_video "$SRC/empire_overlook.mp4"       4.0 "$IN/videos/VID-08_empire_overlook_v01.mp4"       0
```

If a tool gave you a `.mov` or `.webm`, change the source name to match; the placed file is always `.mp4`. A start offset that leaves less than the target length in the source makes a short clip, and the tracker then fails it on duration: pick an earlier offset and replace the file (see "Replacing a file").

Open each placed clip in QuickTime and check that the crop kept the subject, that the motion you chose is inside the trimmed window, and, for VID-01, VID-06 and VID-08, that his face is unchanged from first frame to last.

---

## Step 4: Rerun the tracker

```bash
cd ~
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "scan"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "validate"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "status"
```

What a good run looks like, with Batches 1 and 2 signed off:

| Check | Result |
|---|---|
| v2 `scan` | image 8/8, audio 9/9, video 8/8, readiness 78% |
| v2 `validate` | the eight VID rows TECHNICALLY_VERIFIED; the seventeen Batch 1 and 2 rows APPROVED |

A row marked FAILED names the problem in its details column, usually a length (outside 10% of the target) or a shape (not 16:9). Fix the source and see "Replacing a file" below. A row marked STALE means a parent was not APPROVED when the clip was validated: see Step 5.

The full report is written to `outputs/icyflamze_core/episode_1/render_intake/reports/v2_asset_validation_report_<date>.md`.

---

## Step 5: If a clip went STALE

The tracker marks a clip STALE when its parent still or AUD-01 is not APPROVED, or when a parent gets a new version after the clip was made. It also queues a recovery job for it. Nothing is deleted. Two cases:

**The clip was made from the parent that is now approved** (you placed it a little early). Approve the job and let the tracker re-check the file in place:

```bash
cd ~
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "recovery-show"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "recovery-approve" "REC-VID-02-1-1"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "recovery-run"
```

`recovery-show` prints the job IDs; they look like `REC-<slot>-<parent versions>`. `recovery-run` never writes to an asset file: it re-probes the clip you placed and, if the parents are now at the versions the clip was made from, returns it to TECHNICALLY_VERIFIED, ready for sign-off.

**A parent changed after the clip was made** (you replaced a still as v02). The clip has to be regenerated from the new still: `recovery-run` says so and names the parent. Generate it again from Step 2, place it as `_v02` per "Replacing a file", then run `validate`.

---

## Step 6: Sign off each asset

List what is waiting, with the file to open and the exact commands:

```bash
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff-pending"
```

| Slot | Reviews owed |
|---|---|
| VID-01, VID-06, VID-08 | identity and creative |
| VID-02, VID-03, VID-04, VID-05, VID-07 | creative only |

For the identity review, play the clip and compare his face against `icyflamze_reference_MASTER.png` at the first frame, the middle and the last frame: generators drift across a clip more than across a still. For the creative review, check the motion matches the shot (the queue's motion and camera columns), that the palette held, and that the clip reads at trailer speed. Everything else works exactly as in Batch 1. For example:

```bash
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff" "VID-06" "identity" "pass"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff" "VID-02" "creative" "pass"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff" "VID-08" "identity" "fail" "glasses frame changes shape at 2s"
```

A sign-off belongs to the exact file you looked at, and a fail marks the asset REJECTED: regenerate and follow "Replacing a file".

With all eight signed off, v2 `status` shows video 8/8 and readiness 78%. Batch 4 is next: the five covers (COV-01 from IMG-01, then its four crops), the captions CAP-01 and the edit project ASM-01, which depend on these clips.

---

## Replacing a file

v2 checks only the first file per slot in name order, so a v02 next to a v01 would never be looked at. Move the old version out of the intake folder, then place the new one as v02. Moving keeps the old file; nothing is deleted. For example, for VID-03:

```bash
cd ~
mkdir -p outputs/icyflamze_core/episode_1/render_intake/superseded
mv outputs/icyflamze_core/episode_1/render_intake/incoming/videos/VID-03_gold_lighter_ignition_v01.mp4 \
   outputs/icyflamze_core/episode_1/render_intake/superseded/
```

Then rerun the matching `fit_video` line from Step 3 with `_v02` in the final name, and rerun Step 4. v2 notes the new version in its provenance log.

---

## Don't commit the renders

Since 2026-10-13, MP4, MOV and WEBM files in `incoming/videos/` are git-ignored, as WAV files already were. PNG files in `incoming/images/` are not. Before any commit from `~`, check that no render is staged:

```bash
cd ~ && git status --short outputs/icyflamze_core/episode_1/render_intake/
```
