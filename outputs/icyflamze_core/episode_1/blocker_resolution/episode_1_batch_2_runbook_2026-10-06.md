# Episode 1 Batch 2: Asset Runbook

**Project:** ICYFLAMZE CORE · *Rise of the Street Scholar*
**Episode:** 1, *The Core Wakes*
**Date:** 2026-10-06
**Covers:** the nine slots that depend on nothing: three stills and six sound effects. Generate them, place them, rerun the tracker, sign them off.
**Follows** `episode_1_batch_1_runbook_2026-10-06.md`. It can run before Batch 1 is signed off, because none of these slots is built on a Batch 1 asset.

Generation stays manual, as the production boundaries require. Every command here only checks, converts, places or reports on files you made yourself. Nothing is deleted or overwritten.

---

## What is in this batch, and what is not

| Slot | Asset | Shape | Final file | Folder |
|---|---|---|---|---|
| IMG-05 | Lyrics as Equations | 1920×1080 (16:9) | `IMG-05_lyrics_equations_v01.png` | `incoming/images/` |
| IMG-06 | Books / AI Panels | 1920×1080 (16:9) | `IMG-06_books_ai_panels_v01.png` | `incoming/images/` |
| IMG-08 | Chess King Drop | 1920×1080 (16:9) | `IMG-08_chess_king_drop_v01.png` | `incoming/images/` |
| AUD-04 | Lighter Spark SFX | 1.5s | `AUD-04_lighter_spark_v01.wav` | `incoming/audio/` |
| AUD-05 | City Hum SFX | 30.0s | `AUD-05_city_hum_v01.wav` | `incoming/audio/` |
| AUD-06 | AI Interface SFX | 2.0s | `AUD-06_ai_interface_v01.wav` | `incoming/audio/` |
| AUD-07 | Chess Impact SFX | 1.0s | `AUD-07_chess_impact_v01.wav` | `incoming/audio/` |
| AUD-08 | Title Reveal Hit SFX | 3.0s | `AUD-08_title_reveal_v01.wav` | `incoming/audio/` |
| AUD-09 | Outro Ambience SFX | 5.0s | `AUD-09_outro_ambience_v01.wav` | `incoming/audio/` |

`incoming/` means `outputs/icyflamze_core/episode_1/render_intake/incoming/`. The tracker accepts audio within 10% of the target length, and never less than half a second either side.

**Not in this batch.** These slots are built on Batch 1 assets, so they wait until those are signed off:

- **The eight videos, VID-01 to VID-08.** Each depends on AUD-01 and one Batch 1 or Batch 2 image.
- **All five covers, COV-01 to COV-05.** COV-01 depends on IMG-01, and the other four depend on COV-01.
- **The captions and the edit project, CAP-01 and ASM-01.** They depend on the videos.

If one of these is placed before its parents are APPROVED, the tracker marks it STALE.

---

## Step 1: Pre-flight

If you have already done Step 1 of the Batch 1 runbook on this Mac, skip to Step 2. Otherwise run it now: it pulls the repo, installs `ffmpeg` and checks the reference photo's checksum.

Then make the download folder for this batch:

```bash
mkdir -p ~/Downloads/ep01_batch2
```

---

## Step 2: Generate the 3 stills in ChatGPT

Same routine as Batch 1:

1. Start a new ChatGPT chat with image generation on.
2. For IMG-06 only, attach `icyflamze_reference_MASTER.jpeg` first. It is the only character frame in this batch.
3. Paste the prompt. The first two sentences are the identity lock line, which the IP bible requires word for word on every image prompt.
4. For IMG-06, reject and regenerate if the face, the short fade, the black-frame glasses, the goatee or the skin tone drift from the reference.
5. Download the image into `~/Downloads/ep01_batch2/` with the name shown.

Each prompt asks for the subject to stay away from the top and bottom edges, because Step 4 trims about 8% from them to reach 16:9.

### IMG-05 Lyrics as Equations: save as `lyrics_equations.png`

No reference photo. No character is shown.

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Make a wide landscape image (3:2), and keep the floating text away from the top and bottom edges. Create a cinematic anime image inside a dark recording studio booth. Glowing neon-blue holographic lyric lines and mathematical formulas float in the air like lines of code, set in a monospace font, with a microphone and pop filter in silhouette. High contrast, deep black shadows, gold accent light on the microphone. No person in frame. The color palette is strictly black, metallic gold, and neon-blue. Avoid: bright lights, ordinary instruments, generic singers, capes, spaceships, random wires, meaningless buttons, tech clutter, watermarks.

### IMG-06 Books / AI Panels: save as `books_ai_panels.png`

Attach the reference photo. This is the character frame.

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Make a wide landscape image (3:2), and keep his face and the orbiting panels away from the top and bottom edges. Create a detailed 3D anime shot of the man in the attached reference photo, calm and centred, with antique brown leather-bound books, soundwave graphs and floating transparent neon-blue terminal screens orbiting around him. He wears a matte black tactical coat with gold engraving and minimalist tactical straps, his black-frame glasses with a faint diagnostic readout on the lenses, his goatee, his short fade, and his expressive eyes, exactly as in the reference. Gold highlights, high-end styling. The color palette is strictly black, metallic gold, and neon-blue. Avoid: superpowers, magic circles, spaceship dashboards, capes, spandex, superhero costume, space helmets, tribal masks or patterns, random wires, meaningless buttons, tech clutter.

### IMG-08 Chess King Drop: save as `chess_king_drop.png`

No reference photo. No character is shown.

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Make a wide landscape image (3:2), and keep the chess king away from the top and bottom edges. Create a low-angle cinematic anime close-up of a metallic gold chess king standing on a hand-drawn chalk chessboard grid on wet, rain-slicked cracked concrete at night. The pavement reflects gold streetlights and neon-blue signs, with reflections pooling around the base of the piece. The camera tilts upward from near ground level, and rain is visible in the air. No figure, no face, no person. Chiaroscuro lighting, heavy rain, matte black, gold and neon-blue only. Avoid: daylight, red or green tones, text, logos, watermarks, lens flare, random wires, tech clutter.

---

## Step 3: Generate the 6 sound effects

Use a sound-effects generator such as ElevenLabs Sound Effects, or record and cut them in DaVinci Resolve. Download each into `~/Downloads/ep01_batch2/` with the name shown.

Ask for the sound to **start immediately**. Step 4 keeps the start of each file and trims the end to length, so a hit that arrives late gets cut off. If your tool lets you set a length, set the target length below.

| Save as | Target | What to ask for |
|---|---|---|
| `lighter_spark.mp3` | 1.5s | A metal flip-top lighter: lid click, then a spark and a soft flame ignition whoosh. Close-mic and dry. Starts immediately. |
| `city_hum.mp3` | 30s | Night city ambience heard from a distance: low traffic rumble, faint electrical hum, light rain. No voices, sirens or music. Even level throughout. |
| `ai_interface.mp3` | 2s | A futuristic computer interface: a short burst of soft keyboard typing, then a clean activation chime. Starts immediately. |
| `chess_impact.mp3` | 1s | One heavy chess piece set down on stone: a deep concrete thud with a short low boom. A single hit. Starts immediately. |
| `title_reveal.mp3` | 3s | An analog synthesizer stab chord with a deep sub-bass drop and a faint digital heartbeat pulse, for a title reveal. Starts on the hit. |
| `outro_ambience.mp3` | 5s | An outro: boom-bap percussion and reverb fading out, ending on a single soft keyboard click and then silence. |

If your tool cannot make 30 seconds of city hum in one go, generate the longest it allows. Step 4 loops it to 30 seconds with a fade-out, so make sure the loop point is not jarring when you listen back.

---

## Step 4: Fit and place the files

Paste this whole block into Terminal. It crops and scales each image to exactly 1920×1080. It converts each sound to WAV at its exact target length: a longer file is trimmed with a short fade-out, a shorter one is padded with silence, and the city hum is looped if it is short. It prints `placed` for each file, with the source length so you can spot one that was trimmed hard.

It never overwrites. A file already in the intake folder is reported as `EXISTS` and left alone.

```bash
cd ~
SRC=~/Downloads/ep01_batch2
IN=outputs/icyflamze_core/episode_1/render_intake/incoming
mkdir -p "$IN/images" "$IN/audio"

fit_image() {
  if [ ! -f "$1" ]; then echo "MISSING source: $1"; return 1; fi
  if [ -e "$4" ]; then echo "EXISTS, not touched: $4"; return 0; fi
  ffmpeg -hide_banner -loglevel error -n -i "$1" \
    -vf "crop='min(iw,ih*$2/$3)':'min(ih,iw*$3/$2)',scale=$2:$3:flags=lanczos" -frames:v 1 "$4" \
    && echo "placed $4"
}

fit_sfx() {
  if [ ! -f "$1" ]; then echo "MISSING source: $1"; return 1; fi
  if [ -e "$3" ]; then echo "EXISTS, not touched: $3"; return 0; fi
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$1")
  fade=$(awk -v t="$2" 'BEGIN { f = t / 5; if (f > 1) f = 1; printf "%.2f", f }')
  start=$(awk -v t="$2" -v f="$fade" 'BEGIN { printf "%.2f", t - f }')
  if [ "$4" = "loop" ]; then
    ffmpeg -hide_banner -loglevel error -n -stream_loop -1 -i "$1" \
      -af "afade=t=out:st=$start:d=$fade" -t "$2" -ar 48000 -ac 2 "$3"
  else
    ffmpeg -hide_banner -loglevel error -n -i "$1" \
      -af "apad,afade=t=out:st=$start:d=$fade" -t "$2" -ar 48000 -ac 2 "$3"
  fi && echo "placed $3 (source ${d}s)"
}

fit_image "$SRC/lyrics_equations.png" 1920 1080 "$IN/images/IMG-05_lyrics_equations_v01.png"
fit_image "$SRC/books_ai_panels.png"  1920 1080 "$IN/images/IMG-06_books_ai_panels_v01.png"
fit_image "$SRC/chess_king_drop.png"  1920 1080 "$IN/images/IMG-08_chess_king_drop_v01.png"
fit_sfx "$SRC/lighter_spark.mp3"  1.5 "$IN/audio/AUD-04_lighter_spark_v01.wav"
fit_sfx "$SRC/city_hum.mp3"       30  "$IN/audio/AUD-05_city_hum_v01.wav" loop
fit_sfx "$SRC/ai_interface.mp3"   2   "$IN/audio/AUD-06_ai_interface_v01.wav"
fit_sfx "$SRC/chess_impact.mp3"   1   "$IN/audio/AUD-07_chess_impact_v01.wav"
fit_sfx "$SRC/title_reveal.mp3"   3   "$IN/audio/AUD-08_title_reveal_v01.wav"
fit_sfx "$SRC/outro_ambience.mp3" 5   "$IN/audio/AUD-09_outro_ambience_v01.wav"
```

If you saved a sound as WAV or M4A, change its source name to match. The originals stay in `~/Downloads/ep01_batch2/`.

Open the placed images in Preview and check the crop kept the chess king, the floating text and, for IMG-06, his face and glasses. Play each WAV and check the hit is still there after trimming.

---

## Step 5: Rerun the tracker

```bash
cd ~
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "scan"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "validate"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "status"
```

What a good run looks like:

| Check | Batch 2 alone | Batch 1 and Batch 2 both placed |
|---|---|---|
| v2 `scan` | image 3/8, audio 6/9, readiness 28% | image 8/8, audio 9/9, readiness 53% |
| v2 `validate` | the nine Batch 2 rows TECHNICALLY_VERIFIED | all seventeen rows TECHNICALLY_VERIFIED or, for signed-off Batch 1 assets, APPROVED |

A row marked FAILED names the problem in its details column, usually a length or shape. Fix the source and follow "Replacing a file" in the Batch 1 runbook.

---

## Step 6: Sign off each asset

List what is waiting, with the file to open and the exact commands:

```bash
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff-pending"
```

| Slot | Reviews owed |
|---|---|
| IMG-06 | identity and creative |
| IMG-05, IMG-08, AUD-04 to AUD-09 | creative only |

Which slots need an identity review is set per slot in the production manifest, by `requires_identity`. In this batch only IMG-06 shows you.

Everything else works exactly as in Batch 1. For example:

```bash
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff" "IMG-06" "identity" "pass"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff" "AUD-07" "creative" "pass"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff" "AUD-05" "creative" "fail" "loop seam audible at 22s"
```

With both batches signed off, v2 `status` shows Visuals 8/8, Narration 9/9 and readiness 53%. The videos and covers come next, once their Batch 1 parents are APPROVED.

---

## Don't commit the renders

WAV files are git-ignored, but PNG files in `incoming/images/` are not. Before any commit from `~`, check that no render is staged:

```bash
cd ~ && git status --short outputs/icyflamze_core/episode_1/render_intake/
```
