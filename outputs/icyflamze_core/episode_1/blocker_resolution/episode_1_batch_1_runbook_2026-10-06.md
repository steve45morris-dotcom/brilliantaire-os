# Episode 1 Batch 1: Asset Runbook

**Project:** ICYFLAMZE CORE · *Rise of the Street Scholar*
**Episode:** 1, *The Core Wakes*
**Date:** 2026-10-06
**Covers:** the four Phase 14E-R next actions: generate the 5 stills, generate the 3 audio files, drop them into render intake, rerun the tracker. Step 6 then signs each asset off.
**Supersedes** the filenames and verify commands in `episode_1_asset_drop_instructions_2026-07-02.md`, `episode_1_batch_1_generation_plan_2026-07-02.md` and `episode_1_chatgpt_image_prompts_2026-07-02.md`. Those files are kept as the record.

Generation stays manual, as the production boundaries require. Every command here only checks, converts, places or reports on files you made yourself. Nothing is deleted or overwritten.

---

## Why the old instructions don't work

- **The filenames fail the v2 gate.** Render intake v2 only looks at files whose names start with the slot ID, such as `IMG-01`. The old names (`icyflamze_core_ep01_hero_poster_v01.png`) are never seen. This runbook uses `IMG-01_hero_poster_v01.png` and so on.
- **ChatGPT's image shapes are not the slot shapes.** ChatGPT gives 1536×1024 or 1024×1536 (3:2). The slots want 16:9 or 9:16 within 2%, and the visual checklist wants at least 1920×1080. Step 4 crops and scales each image to exactly 1920×1080 or 1080×1920.
- **The old prompts break the identity lock.** The IP bible requires the identity line, verbatim, on every image prompt, and the reference photo on every character frame. The prompts below add both.
- **v2 crashes without its identity manifest.** `config/icyflamze-identity-manifest.json` is now in the repo and names the master reference photo. Step 1 still creates it if a checkout lacks it, and never touches an existing one.
- **Audio needs `ffprobe` to verify.** Without it, every audio file is held at STAGED. Step 1 installs `ffmpeg`, which includes it.

---

## Slot map

| Slot | Asset | Shape | Final file | Folder |
|---|---|---|---|---|
| IMG-01 | Hero Poster | 1080×1920 (9:16) | `IMG-01_hero_poster_v01.png` | `incoming/images/` |
| IMG-02 | Eyes Close-up | 1920×1080 (16:9) | `IMG-02_eyes_closeup_v01.png` | `incoming/images/` |
| IMG-03 | Lighter Spark | 1920×1080 (16:9) | `IMG-03_lighter_spark_v01.png` | `incoming/images/` |
| IMG-04 | Chessboard City (Circuit Skyline slot) | 1920×1080 (16:9) | `IMG-04_chessboard_city_v01.png` | `incoming/images/` |
| IMG-07 | Title Card | 1920×1080 (16:9) | `IMG-07_title_card_v01.png` | `incoming/images/` |
| AUD-01 | 30s Voiceover | 30.0s | `AUD-01_voiceover_30s_v01.wav` | `incoming/audio/` |
| AUD-02 | 15s Teaser Narration | 15.0s | `AUD-02_teaser_15s_v01.wav` | `incoming/audio/` |
| AUD-03 | Trailer Music Bed | 30.0s | `AUD-03_music_bed_v01.wav` | `incoming/audio/` |

`incoming/` means `outputs/icyflamze_core/episode_1/render_intake/incoming/`. The v2 gate accepts audio within 10% of the target, and never less than half a second either side.

---

## Step 1: Pre-flight (once)

The repo is rooted at your home folder, so every command runs from `~`.

```bash
cd ~ && git pull
brew list ffmpeg >/dev/null 2>&1 || brew install ffmpeg
ffprobe -version | head -1
shasum -a 256 ~/TreeGrooveProjects/Icyflamze_3D_Avatar_Pipeline/01_reference/photos/icyflamze_reference_MASTER.jpeg
```

The checksum must read:

```
7594b33211f8754724e2a211474de9157824bac63f100bbf0506e03600646abb
```

If it doesn't, stop and check the backup in `~/Desktop/icyflamze-reference-backup/` before generating anything.

Then make sure the identity manifest that render intake v2 needs is there. After `git pull` it is, so this prints "present". It only creates the file in a checkout that lacks it.

```bash
cd ~
if [ -f config/icyflamze-identity-manifest.json ]; then
  echo "Identity manifest present, left as is."
else
  cat > config/icyflamze-identity-manifest.json <<'JSON'
{
  "character_id": "icyflamze",
  "identity_lock": "strict-facial",
  "reference_asset": "~/TreeGrooveProjects/Icyflamze_3D_Avatar_Pipeline/01_reference/photos/icyflamze_reference_MASTER.jpeg",
  "reference_sha256": "7594b33211f8754724e2a211474de9157824bac63f100bbf0506e03600646abb",
  "canonical_source": "outputs/icyflamze_core/ip_bible/documents/icyflamze_core_season_1_ip_bible_2026-07-02.md"
}
JSON
  echo "Identity manifest created."
fi
mkdir -p ~/Downloads/ep01_batch1
```

---

## Step 2: Generate the 5 stills in ChatGPT

For each prompt:

1. Start a new ChatGPT chat with image generation on.
2. For IMG-01, IMG-02 and IMG-04, attach `icyflamze_reference_MASTER.jpeg` first. Those frames show the character.
3. Paste the prompt. The first two sentences are the identity lock line and must stay word for word.
4. Reject and regenerate if the face, the short fade, the black-frame glasses, the facial hair or the skin tone drift from the reference.
5. Download the image and save it into `~/Downloads/ep01_batch1/` with the name shown. Step 4 renames and places it.

Each prompt asks for the subject and any text to sit in the middle, because Step 4 trims about 8% from two edges to reach the slot shape.

### IMG-01 Hero Poster: save as `hero_poster.png`

Attach the reference photo.

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Make a tall portrait image (2:3), and keep the figure and all text away from the left and right edges. Create a premium 3D cartoon / animated style cinematic poster. The subject is the man in the attached reference photo, as a founder-figure standing confidently on a giant chessboard that extends across a futuristic city skyline at night. He wears a sleek dark hoodie with subtle gold geometric patterns and his black-frame glasses with a faint blue-gold lens glow, and holds a lighter in one hand with a calm blue-gold flame. His posture is relaxed but commanding: a strategist, not a fighter. The city behind him has towering buildings with glowing neon-blue circuit-line patterns running up the facades. The sky is deep black with faint gold constellations forming chess piece shapes. The color palette is strictly black, metallic gold, and neon-blue. The mood is calm, intellectual, powerful, and cinematic. At the bottom of the image, include this text in a clean modern sans-serif font: "ICYFLAMZE CORE" in large gold letters, "Rise of the Street Scholar" beneath it in smaller neon-blue letters, and "Street wisdom. Scientific mind. Futuristic soul." in small white italic text beneath that. Avoid: generic superhero poses, capes, spaceship sci-fi, goofy cartoon exaggeration, bright primary colors, random tech clutter.

### IMG-02 Eyes Close-up: save as `eyes_closeup.png`

Attach the reference photo.

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Make a wide landscape image (3:2), and keep the eyes and glasses away from the top and bottom edges. Create a premium 3D cartoon / animated style extreme close-up of the eyes and upper face of the man in the attached reference photo. The eyes are sharp, focused, and deeply intelligent, reflecting determination without aggression. He wears his black-frame glasses with a subtle blue-gold lens reflection showing faint chess piece patterns. The skin texture has a smooth stylized 3D render quality with a subtle gold highlight along the cheekbones. One eye reflects a chessboard pattern, the other reflects a glowing lighter flame in blue-gold. The background is pure black with faint neon-blue particle dust floating. The color palette is strictly black, metallic gold, and neon-blue. The mood is introspective, calm, and powerful. This is a thinker, not a warrior. Avoid: generic superhero look, angry expressions, bright primary colors, goofy cartoon exaggeration, random tech clutter, spaceship sci-fi.

### IMG-03 Lighter Spark: save as `lighter_spark.png`

No reference photo needed. Only a hand is shown.

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Make a wide landscape image (3:2), and keep the lighter and flame away from the top and bottom edges. Create a premium 3D cartoon / animated style cinematic close-up of a hand holding a sleek metallic lighter. The thumb is flicking the lighter open, producing a striking blue-gold flame that illuminates the surrounding darkness. The lighter has subtle engraved geometric patterns resembling circuit lines and chess notation. The flame casts neon-blue and gold light on the hand and wrist, which wears a minimal black wristband. Tiny ember particles float upward from the flame, transitioning from gold to neon-blue as they rise. The background is deep black with faint mathematical equations and chess move notations barely visible in the darkness like watermarks. The color palette is strictly black, metallic gold, and neon-blue. The mood is ignition, purpose, calm intensity, and the beginning of something strategic. Avoid: generic superhero imagery, fire that looks destructive, goofy cartoon proportions, bright primary colors, random tech clutter.

### IMG-04 Chessboard City: save as `chessboard_city.png`

Attach the reference photo. The lone figure is the character.

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Make a wide landscape image (3:2), and keep the skyline and the figure away from the top and bottom edges. Create a premium 3D cartoon / animated style wide cinematic landscape of a futuristic city at night where the streets and plazas are laid out as a giant chessboard. The black and gold chess squares stretch across the ground between towering buildings. Some buildings resemble chess pieces: a rook-shaped tower, a bishop-shaped spire, a king-shaped central skyscraper. The buildings have glowing neon-blue circuit-line patterns running up their surfaces. The sky is deep black with scattered gold constellations. In the far distance, a lone figure stands on the chessboard, small but visible: the man in the attached reference photo, in a dark hoodie, looking outward at the city. The perspective is from a high angle looking down at the city grid. The color palette is strictly black, metallic gold, and neon-blue. The mood is strategic, vast, intellectual, and cinematic. This is a world built on moves, not chaos. Avoid: generic superhero imagery, spaceship sci-fi, goofy cartoon exaggeration, bright primary colors, random floating tech objects, war or destruction.

### IMG-07 Title Card: save as `title_card.png`

No reference photo needed. No character is shown.

> Use the locked Icyflamze avatar reference image for facial identity. Maintain exact facial likeness and glasses. Make a wide landscape image (3:2), and keep all text in the middle band, well away from the top and bottom edges. Create a premium 3D cartoon / animated style title card with a pure black background. In the center, display the text "ICYFLAMZE CORE" in large bold metallic gold 3D letters with a subtle neon-blue edge glow. Below it, display "Episode 1 — The Core Wakes" in clean neon-blue sans-serif text. The letters have a slight 3D depth with gold light reflecting off the surfaces. Behind the text, very subtle geometric patterns are barely visible: chess grid lines, circuit traces, and faint mathematical notation in dark gray on the black background. A small blue-gold flame icon sits above the "I" in ICYFLAMZE, acting as a subtle brand mark. Faint gold particle dust drifts upward from the bottom edge. The color palette is strictly black, metallic gold, and neon-blue. The mood is premium, cinematic, clean, and authoritative. Avoid: busy backgrounds, generic superhero styling, goofy fonts, bright primary colors, random tech clutter, spaceship imagery.

Check every letter of the text in IMG-01 and IMG-07. Image models misspell words often, and a misspelt title fails creative review.

---

## Step 3: Generate the 3 audio files

Use ElevenLabs for both narrations, with a calm, strategic voice. Paste only the spoken lines below. The bracketed sound cues in the scripts are for the edit, not the narrator. Download as MP3 or WAV into `~/Downloads/ep01_batch1/`.

### AUD-01 30s Voiceover: save as `voiceover_30s.mp3`

Source: `outputs/icyflamze_core/episode_1/scripts/episode_1_30_second_voiceover_2026-07-02.md`. Aim for 27 to 30 seconds. Slow, with clear pauses on the transitions.

> They thought he was just another voice from the pressure. But pressure was never his prison. It was his professor. Every loss became data. Every silence became strategy. Every scar became a signal. He did not just survive the city. He decoded it. This is ICYFLAMZE CORE. Street wisdom. Scientific mind. Futuristic soul.

### AUD-02 15s Teaser Narration: save as `teaser_15s.mp3`

Source: `outputs/icyflamze_core/episode_1/scripts/episode_1_15_second_teaser_2026-07-02.md`. Aim for 12 to 15 seconds.

> They thought pressure was a cage. For us, it was the classroom. Striking the fire. Initiating the core. Rise of the Street Scholar.

### AUD-03 Trailer Music Bed: save as `music_bed.wav`

An instrumental at 80 BPM from the Tree Groove catalog or a fresh session: modular analog synths, monospace clicks, sub-bass stabs. Any length of 30 seconds or more works. Step 4 trims it to 30 seconds with a 2-second fade-out.

If you save under another extension, change the source name in Step 4 to match. MP3, WAV and M4A all work.

---

## Step 4: Fit and place the files

Paste this whole block into Terminal. It crops and scales each image to its exact slot size, converts each audio file to WAV and pads narration with silence to its target length. It prints `placed` for each file.

It never overwrites. A file already in the intake folder is reported as `EXISTS` and left alone. A narration longer than its target is kept whole rather than cut, with a note, so no words are lost. If that note appears for a file more than 10% over, regenerate it shorter.

```bash
cd ~
SRC=~/Downloads/ep01_batch1
IN=outputs/icyflamze_core/episode_1/render_intake/incoming
mkdir -p "$IN/images" "$IN/audio"

fit_image() {
  if [ ! -f "$1" ]; then echo "MISSING source: $1"; return 1; fi
  if [ -e "$4" ]; then echo "EXISTS, not touched: $4"; return 0; fi
  ffmpeg -hide_banner -loglevel error -n -i "$1" \
    -vf "crop='min(iw,ih*$2/$3)':'min(ih,iw*$3/$2)',scale=$2:$3:flags=lanczos" -frames:v 1 "$4" \
    && echo "placed $4"
}

fit_audio() {
  if [ ! -f "$1" ]; then echo "MISSING source: $1"; return 1; fi
  if [ -e "$3" ]; then echo "EXISTS, not touched: $3"; return 0; fi
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$1")
  if [ "$4" = "music" ]; then
    ffmpeg -hide_banner -loglevel error -n -i "$1" \
      -af "apad,afade=t=out:st=$(( $2 - 2 )):d=2" -t "$2" -ar 48000 -ac 2 "$3"
  elif awk -v d="$d" -v t="$2" 'BEGIN { exit !(d > t) }'; then
    echo "NOTE: $1 runs ${d}s, over ${2}s. Kept whole, not cut."
    ffmpeg -hide_banner -loglevel error -n -i "$1" -ar 48000 -ac 2 "$3"
  else
    ffmpeg -hide_banner -loglevel error -n -i "$1" -af apad -t "$2" -ar 48000 -ac 2 "$3"
  fi && echo "placed $3 (source ${d}s)"
}

fit_image "$SRC/hero_poster.png"     1080 1920 "$IN/images/IMG-01_hero_poster_v01.png"
fit_image "$SRC/eyes_closeup.png"    1920 1080 "$IN/images/IMG-02_eyes_closeup_v01.png"
fit_image "$SRC/lighter_spark.png"   1920 1080 "$IN/images/IMG-03_lighter_spark_v01.png"
fit_image "$SRC/chessboard_city.png" 1920 1080 "$IN/images/IMG-04_chessboard_city_v01.png"
fit_image "$SRC/title_card.png"      1920 1080 "$IN/images/IMG-07_title_card_v01.png"
fit_audio "$SRC/voiceover_30s.mp3"   30 "$IN/audio/AUD-01_voiceover_30s_v01.wav"
fit_audio "$SRC/teaser_15s.mp3"      15 "$IN/audio/AUD-02_teaser_15s_v01.wav"
fit_audio "$SRC/music_bed.wav"       30 "$IN/audio/AUD-03_music_bed_v01.wav" music
```

You can run it again after adding more files. Placed files are skipped, and only new ones are processed. The originals stay in `~/Downloads/ep01_batch1/`.

Open the placed images in Preview and check that the crop kept the face, the glasses and all the text.

---

## Step 5: Rerun the tracker

```bash
cd ~
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "scan"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "validate"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "status"
npm run command -- "icyflamze-core-episode-1-render-intake" -- "scan"
npm run command -- "icyflamze-core-episode-1-render-intake" -- "assembly-readiness"
npm run command -- "icyflamze-core-episode-1-render-intake" -- "status"
```

What a good run looks like:

| Check | Expected after Batch 1 |
|---|---|
| v2 `scan` | image 5/8, audio 3/9, readiness 25% |
| v2 `validate` | all 8 rows TECHNICALLY_VERIFIED, with identity and creative review PENDING |
| v2 `validate` summary line | "0/8 assets successfully verified to APPROVED state" |
| v2 `status` | 8 assets TECHNICALLY_VERIFIED, readiness 0% |
| v1 `status` | readiness 0% |

- **0/8 APPROVED is expected at this point.** Identity and creative review are human sign-offs, recorded as PENDING until you do Step 6.
- **`status` readiness starts at 0% in both versions.** v2's `status` counts only APPROVED assets, so it rises as you sign off in Step 6.
- **v1 counts whole categories.** A category is ready only when every slot in it is filled, and Batch 1 fills none completely. Use v2's 25% as the progress number.
- **A row marked STAGED** means `ffprobe` was not found. Rerun Step 1.
- **A row marked FAILED** names the problem in its details column, such as a wrong shape or duration. Fix the source and see "Replacing a file" below.

The full v2 report is written to `outputs/icyflamze_core/episode_1/render_intake/reports/v2_asset_validation_report_<date>.md`.

---

## Step 6: Sign off each asset

The tracker can check shape and length, but only you can judge the face and the style. List what is waiting, with the file to open and the exact commands:

```bash
cd ~
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff-pending"
```

Open each file and judge it:

- **Identity** applies to IMG-01 and IMG-02. Compare the face, the short fade, the black-frame glasses, the facial hair and the skin tone against `icyflamze_reference_MASTER.jpeg`.
- **Creative** applies to all eight. Check the palette, the symbols and the mood against the IP bible's visual language, and the spelling of any text.

Record a pass:

```bash
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff" "IMG-01" "identity" "pass"
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff" "IMG-01" "creative" "pass"
```

Record a fail with a note saying what to fix:

```bash
npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff" "IMG-03" "creative" "fail" "embers read as fireworks"
```

How sign-off behaves:

- **An asset is APPROVED once every review that applies has passed.** For IMG-01 and IMG-02 that is identity and creative. For the other six it is creative alone.
- **A fail marks the asset REJECTED.** Regenerate it and follow "Replacing a file" below. You can also change your mind on the same file by signing off again; the event log keeps both decisions.
- **A sign-off belongs to the exact file you looked at.** It is refused if the file changed since the last `validate`. Changing the file afterwards resets the asset to pending on the next `validate`.
- **Each sign-off is logged** with your username, the time, the file's checksum and the note, in `outputs/icyflamze_core/episode_1/render_intake/provenance_events.jsonl`.

With all eight signed off, v2 `status` shows Visuals 5/8 and readiness 25%.

---

## Replacing a file

v2 checks only the first file per slot in name order, so a v02 next to a v01 would never be looked at. Move the old version out of the intake folder, then place the new one as v02. Moving keeps the old file; nothing is deleted. For example, for the hero poster:

```bash
cd ~
mkdir -p outputs/icyflamze_core/episode_1/render_intake/superseded
mv outputs/icyflamze_core/episode_1/render_intake/incoming/images/IMG-01_hero_poster_v01.png \
   outputs/icyflamze_core/episode_1/render_intake/superseded/
```

Then rerun the matching `fit_image` or `fit_audio` line from Step 4 with `_v02` in the final name, and rerun Step 5. v2 notes the new version in its provenance log.

---

## Don't commit the renders

WAV and MP3 files are git-ignored, but PNG files in `incoming/images/` are not. `GIT_ASSET_POLICY.md` keeps media out of git. Before any commit from `~`, check that no render is staged:

```bash
cd ~ && git status --short outputs/icyflamze_core/episode_1/render_intake/
```

Commit the identity manifest from Step 1 if you want it on other machines. It holds a path and a checksum, no secrets.
