# ICYFLAMZE CORE Episode 1 Trailer Production Package

## 🌌 Purpose
This document acts as the master operational guide and asset map for the production package of **Episode 1: The Core Wakes** (under the Street Scholar Futurism universe). It outlines script timelines, shot lists, audio cues, and social rollouts.

## 🎯 Scope
The scope of this Phase includes:
- Defining trailer scripts, voiceover directions, and shot lists locally.
- Formulating tool-ready image and animation prompt packs.
- Generating social captions and rollout checklists.
- Compiling staging notes for the Obsidian write gateway.

---

## 🎬 Episode Profile
- **Title:** Episode 1 — *The Core Wakes*
- **Theme:** Identity
- **Tagline:** *Street wisdom. Scientific mind. Futuristic soul.*
- **Logline:** Under intense concrete pressure, a street coder strikes his lighter to activate a hidden AI node, sparking a blue-gold flame that begins his strategic evolution.

---

## 🔒 Production Rules & Guardrails
1. **No-Generation Rule:** No automated audio synthesis or image/video rendering takes place during document compiles (`ALLOW_IMAGE_GENERATION = false`, `ALLOW_AUDIO_GENERATION = false`, `ALLOW_VIDEO_GENERATION = false`).
2. **No-Publishing Rule:** All output remains localized and staged. No automated social postings or distribution pipelines are active.
3. **Manual Tool-Use Boundary:** Prompts generated in this package are designed for manual operator copy-pasting into tools (such as Midjourney, Sora, Veo, Piper, and Runway).
4. **No Direct Vault writes:** All staged files are saved locally. Copying into active Obsidian vaults requires explicit operator confirmation via `npm run approve-write`.

---

## ⚙️ CLI Commands
Execute Episode 1 compiler routines via:

```bash
# Print help menu of subcommands
npm run command -- "icyflamze-core-episode-1-help"

# Generate trailer script markdown
npm run command -- "icyflamze-core-episode-1" -- "trailer-script"

# Generate 30-second voiceover guide
npm run command -- "icyflamze-core-episode-1" -- "voiceover"

# Generate 15-second teaser guide
npm run command -- "icyflamze-core-episode-1" -- "teaser"

# Generate scene-by-scene trailer shot list
npm run command -- "icyflamze-core-episode-1" -- "shot-list"

# Generate image prompt pack
npm run command -- "icyflamze-core-episode-1" -- "image-prompts"

# Generate Sora/Veo/Runway animation prompt pack
npm run command -- "icyflamze-core-episode-1" -- "animation-prompts"

# Generate audio & sound design direction sheet
npm run command -- "icyflamze-core-episode-1" -- "audio-direction"

# Generate cover art graphic direction
npm run command -- "icyflamze-core-episode-1" -- "cover-art"

# Generate platform caption packs
npm run command -- "icyflamze-core-episode-1" -- "captions"

# Generate marketing rollout checklist
npm run command -- "icyflamze-core-episode-1" -- "rollout"

# Stage Obsidian note to write-gateway
npm run command -- "icyflamze-core-episode-1" -- "obsidian-stage"

# Compile production package report
npm run command -- "icyflamze-core-episode-1" -- "report"

# Display latest compile file paths
npm run command -- "icyflamze-core-episode-1" -- "status"
```

---

## 📂 Expected Outputs
Files are generated to the following localized directories:
- **Scripts:** `outputs/icyflamze_core/episode_1/scripts/`
- **Shot Lists:** `outputs/icyflamze_core/episode_1/shot_lists/`
- **Image Prompts:** `outputs/icyflamze_core/episode_1/image_prompts/`
- **Animation Prompts:** `outputs/icyflamze_core/episode_1/animation_prompts/`
- **Audio & Sound:** `outputs/icyflamze_core/episode_1/audio/`
- **Cover Art:** `outputs/icyflamze_core/episode_1/cover_art/`
- **Captions:** `outputs/icyflamze_core/episode_1/captions/`
- **Rollout Checklists:** `outputs/icyflamze_core/episode_1/rollout/`
- **Staging Notes:** `outputs/icyflamze_core/episode_1/obsidian_staging/` & `outputs/write_staging/`
- **Audits & Logs:** `outputs/icyflamze_core/episode_1/reports/` & `outputs/icyflamze_core/episode_1/logs/`

---

## 🏁 Next Phase Boundary
Completion of Phase 14C prepares all templates and prompt sheets. The next phase is the **Phase 14D: Episode 1 Trailer Rendering and Assembly**, focusing on manual generation of visual/audio assets, final video compilation in editing suites, and staging launch files.
