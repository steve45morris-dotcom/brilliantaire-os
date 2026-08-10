# Image Prompt Pack: Episode 1

This document provides image generation prompts and negative prompts for promotional materials.

> **MANDATORY — applies to every prompt in this pack.**
>
> Required by `identity_lock.txt`. Append verbatim to any prompt that renders
> the character — in this pack that is **Hero Poster**, **Eyes Close-Up**,
> **Cover Art**, and **Books & AI Panels**. The other four — Lighter Spark,
> Circuit Skyline, Lyrics As Equations, Title Card — contain no figure and are
> not gated.
>
> **Books & AI Panels was ungated until 2026-08-08.** Its prompt says "a calm
> figure in black tactical coat", but the shot list — canonical for which shots
> exist — states Shot 6 orbits **Icyflamze**, with a 360° rotation around the
> character, so the face is in frame throughout. The character was named in the
> shot list, dropped from the image asset queue description, and anonymised to
> "a figure" in the prompt. Same attrition path that lost the goatee. If a
> prompt dresses a figure in the Season 1 coat, treat it as a character frame
> until the shot list says otherwise.
>
> "Use the locked Icyflamze avatar reference image for facial identity.
> Maintain exact facial likeness and glasses."
>
> Do not reword that line. `identity_lock.txt` requires it verbatim.
>
> **Identity anchors — state these explicitly in every character prompt.** The
> mandatory line above names only glasses, and `--cref` alone has not been
> carrying them: **goatee**, **expressive eyes**, black-frame glasses, short
> fade. `identity_lock.txt` lists facial hair among the features that must
> remain identical to the reference; the goatee anchor was previously lost
> between `~/.claude/CLAUDE.md` and this tree, which is why it is named here.
>
> Pass the anchor as `--cref`:
> `~/TreeGrooveProjects/Icyflamze_3D_Avatar_Pipeline/01_reference/photos/icyflamze_reference_MASTER.jpeg`
>
> **Canonical exclusions** — from Visual Language Do-Not-Use rules, which the
> per-shot negative prompts below implement only partially. Add to every prompt:
> no capes, no spandex, no superhero costume, no space helmets, no spacecraft,
> no space suits, no tribal masks or patterns, no random wires, no meaningless
> buttons or tech clutter.
>
> **Wardrobe:** tactical straps are part of the Season 1 outfit spec
> (Visual Language → Outfit Rules) and are absent from every prompt below.
>
> ✅ **Character frames are UNBLOCKED** as of 2026-08-08. The visual-style
> conflict that gated them is resolved: Commander ratified the **Season 1 Style
> Exception**, which suspends `identity_lock.txt`'s style section across
> ICYFLAMZE CORE Season 1. The anime and cyberpunk direction in this pack is
> approved. Full ruling in the IP Bible Authority Map
> (`ip_bible/documents/icyflamze_core_season_1_ip_bible_2026-07-02.md`) and as an
> amendment appended to `identity_lock.txt` itself.
>
> The exception covers **style only**. Everything above this note — the verbatim
> line, the identity anchors, `--cref`, the canonical exclusions — is unchanged
> and still mandatory. Season 2 does not inherit the exception.

---

## 🎨 Hero Poster Prompt
- **Prompt:** A strategic artist-founder in matte black technical coat with gold engravings and minimalist tactical straps, cybernetic glasses displaying code readouts, goatee, expressive eyes, standing on server grid, detailed anime.
- **Negative Prompt:** Superheroes, space helmets, tribal prints, fantasy elements, goofiness, low quality.
- **Aspect Ratio:** 9:16
- **Style Notes:** Cinematic 2.5D anime, chiascuro lighting.
- **Continuity Rules:** Subject wardrobe is matte black coat, gold engraving, minimalist tactical straps. (Neon-blue interior lining dropped 2026-08-08 — not in Visual Language → Outfit Rules, which is canonical for outfit surface.)

---

## 👀 Eyes Close-Up Prompt
- **Prompt:** Extreme macro close-up of eyes behind cyber spectacles, neon-blue and gold diagnostic terminal codes reflecting on the lenses, gritty anime.
- **Negative Prompt:** Unreal graphics, spacesuits, raw 3D, blur.
- **Aspect Ratio:** 16:9
- **Style Notes:** High contrast, detailed iris, clean digital diagnostics overlays.
- **Continuity Rules:** Diagnostic lines are cyan-blue and gold only.

---

## 🔥 Lighter Spark Prompt
- **Prompt:** A matte gold lighter striking in pitch black darkness, detailed slow-motion sparks, igniting a blue-gold flame, high contrast, anime.
- **Negative Prompt:** Daylight, normal flames, cartoonish drawing.
- **Aspect Ratio:** 16:9
- **Style Notes:** Chiascuro, detailed metal texture, particle effects.
- **Continuity Rules:** Lighter is metallic gold with custom strategic chess grid engravings.

---

## 🏙️ Circuit Skyline Prompt
- **Prompt:** Overhead wide pan view of a neon cyberpunk city streets mapping like a circuit board grid, gold and blue illumination, wet asphalt reflections, anime.
- **Negative Prompt:** Spaceships, generic fantasy, daytime, bright sun.
- **Aspect Ratio:** 16:9
- **Style Notes:** Gritty 2.5D anime, detailed cityscape grids.
- **Continuity Rules:** City features street lights (gold) and digital grids (blue) only.

---

## ♟️ Chess King Drop Prompt
- **Prompt:** Low angle close-up of a metallic gold chess king standing on a chalk-drawn chessboard grid on wet, rain-slicked cracked concrete. Pavement reflecting gold streetlights and neon-blue signs, reflections pooling around the base of the piece. Camera tilts upward from near-ground level, rain visible in the air. No figure, no face, no character. Dark ambient atmosphere, heavy rain, anime cinematic style.
- **Negative Prompt:** Daylight, red or green tones, random wires, meaningless buttons, tech clutter, capes, spandex, superhero costume, space helmets, spacecraft, space suits, tribal masks or patterns, text, watermark, logos, lens flare.
- **Aspect Ratio:** 16:9
- **Style Notes:** Cinematic 2.5D anime, chiascuro lighting, wet asphalt specularity.
- **Continuity Rules:** Chess king is metallic gold (#D4AF37); grid is hand-drawn chalk, not printed. Palette is matte black, gold and neon-blue only. No character in frame — this prompt does not take `--cref`.

---

## 🧮 Lyrics As Equations Prompt
- **Prompt:** Inside a dark recording studio booth, glowing neon-blue holographic lyric lines and math formulas float in the air like code equations, anime.
- **Negative Prompt:** Bright lights, standard instruments, generic vocals.
- **Aspect Ratio:** 16:9
- **Style Notes:** Monospace text overlay, high contrast.
- **Continuity Rules:** Floating equations use monospace font characters.

---

## 🖥️ Books & AI Panels Prompt
- **Prompt:** Detailed anime shot of leather-bound books, soundwave graphs, and floating transparent terminal screens orbiting around Icyflamze — calm, matte black tactical coat with gold engraving and minimalist tactical straps, black-frame cybernetic specs, goatee, expressive eyes — gold highlights.
- **Negative Prompt:** Superpowers, magic circles, generic spaceship dashboards.
- **Aspect Ratio:** 16:9
- **Style Notes:** 3D anime, high-end styling.
- **Continuity Rules:** Books are antique brown leather, AI screens are neon blue.

---

## 📽️ Title Card Prompt
- **Prompt:** Typography design reading 'ICYFLAMZE CORE - Rise of the Street Scholar', gold foil lettering, neon-blue gridlines on black background, clean minimalist premium design.
- **Negative Prompt:** Goofy fonts, standard 3D text effects, extra icons.
- **Aspect Ratio:** 16:9
- **Style Notes:** Minimalist vector layout, flat graphic design.
- **Continuity Rules:** Font style is clean sans-serif for main titles and monospace for tech details.

---

## 🖼️ Cover Art Prompt
- **Prompt:** High-contrast cover art featuring a strategic artist-founder seated on server throne, hands clasped, matte black coat with gold engraving and minimalist tactical straps, black-frame cybernetic specs, goatee, expressive eyes, neon-blue grid lines background, anime.
- **Negative Prompt:** Goofiness, standard cartoon prints, spaceships, tribal masks.
- **Aspect Ratio:** 1:1
- **Style Notes:** Cinematic 2.5D anime, premium album cover design.
- **Continuity Rules:** Throne shadow forms a stylized crown shape.
