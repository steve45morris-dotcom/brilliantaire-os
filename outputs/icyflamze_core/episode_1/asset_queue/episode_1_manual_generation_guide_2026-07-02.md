# Manual Generation Guide: Episode 1 Trailer — The Core Wakes

This guide provides step-by-step instructions for manual visual and audio asset generation using AI tools.

## 🛠️ Tool Walkthroughs

### 1. Midjourney Generation Guide
- **Workflow:** Copy prompt text, add aspect ratios (--ar 16:9 for landscape, --ar 1:1 for poster), run in Midjourney Discord workspace.
- **Rules:** Preserve the gold, neon blue, and dark chiascuro lighting parameters.
- **Naming:** Save file as `IMG_XX_desc.png` inside your local staging folder.

### 2. Sora & Veo Animation Guide
- **Workflow:** Input prompt text, specify high frame-rate and camera motion directions (orbital tracking pan, macro zoom).
- **Rules:** Target exact clip duration (3.0s - 4.5s) to avoid edit timeline gaps.
- **Naming:** Save file as `VID_XX_desc.mp4`.

### 3. ElevenLabs Narration Guide
- **Workflow:** Input the voiceover script from the guide, choose a deep, authoritative voice model, adjust stability to 65% and clarity to 85%.
- **Rules:** Keep speech delivery calm and paced.
- **Naming:** Save file as `AUD_XX_desc.wav`.

## 📐 Asset Generation Instructions

| Asset Type | Tool | Copy-Paste Instruction | Naming Rule | Storage Rule | Review Process | Revision Process |
|---|---|---|---|---|---|---|
| Image Assets | Midjourney | Paste prompt, adjust aspect ratio parameters | IMG_01_hero_poster.png | outputs/icyflamze_core/episode_1/asset_queue/image_assets/ | Compare contrast and color palette against palette guide | Redo if layout feels generic or pixelated |
| Video Clips | Sora/Veo | Paste prompts, set targeted clip duration | VID_01_lens_close.mp4 | outputs/icyflamze_core/episode_1/asset_queue/video_assets/ | Compare motion speed and character face continuity | Redo if faces distort or camera pans stutter |
| Audio Tracks | ElevenLabs | Paste voiceover script, set stability slider | AUD_01_voiceover_30s.wav | outputs/icyflamze_core/episode_1/asset_queue/audio_assets/ | Check cadence, noise levels, and punctuation | Re-generate if pacing feels rushed or voice clips |
| Cover Graphics | Canva | Layout title cards on grid overlay | COV_01_cover_art.png | outputs/icyflamze_core/episode_1/asset_queue/cover_art_assets/ | Check spelling, bleed margins, crop constraints | Readjust layer spacing if margins clip |
