# ICYFLAMZE CORE Season 1 IP Bible

## 🌌 Purpose
This document serves as the master blueprint for the creative IP and narrative universe of **ICYFLAMZE CORE**. It defines the official story structure, character profiles, visual rules, symbols, and marketing assets for Season 1: *Rise of the Street Scholar*.

## 🎯 Scope
The scope of this Phase includes:
- Establishing character profiles, narrative rules, and visual style sheets locally.
- Constructing templates for automated IP document compiling.
- Staging Obsidian-compatible files inside the write gateway without direct vault modification.
- Documenting rollout schedules and monetization avenues.

---

## 🛰️ Universe Direction: Street Scholar Futurism
**Street Scholar Futurism** is the official niche of ICYFLAMZE CORE. It blends street intelligence, raw concrete observation, and hip-hop mythology with academic discipline, advanced scientific inquiry, philosophical depth, and AI system design. It is defined by the following characteristics:
- **Pain into Knowledge:** Street struggles are treated as academic case studies.
- **The City as a System:** Urban environments are parsed as logical grid structures or chessboards.
- **AI Integration:** Systems, codexes, and agent panels are active tools used by characters to strategize and create.
- **Legacy Framing:** Legacy building, discipline, faith, and purpose are prioritized over transient industry hype.

- **Season 1 Title:** `ICYFLAMZE CORE: Rise of the Street Scholar`
- **Core Tagline:** *Street wisdom. Scientific mind. Futuristic soul.*

---

## 🔒 Project Rules & Guardrails
1. **No Direct Vault Writes:** All outputs stage locally to `outputs/icyflamze_core/ip_bible/obsidian_staging/` and `outputs/write_staging/`. Copying into live vaults requires explicit manual approval.
2. **No Automated Image Generation:** No image generation calls are initiated during compile sweeps (`ALLOW_IMAGE_GENERATION = false`).
3. **No External Network Queries:** The compiler operates strictly offline (`ALLOW_EXTERNAL_API_CALLS = false`).
4. **No Arbitrary Script Execution:** Command execution is routed solely via the pre-approved [config/commands.ts](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/config/commands.ts) configurations.

---

## ⚙️ CLI Commands
Execute IP Bible compiler routines via:

```bash
# Print help menu of subcommands
npm run command -- "icyflamze-core-ip-bible-help"

# Generate master IP Bible document
npm run command -- "icyflamze-core-ip-bible bible"

# Generate character profile
npm run command -- "icyflamze-core-ip-bible character"

# Generate episode-by-episode narrative arc
npm run command -- "icyflamze-core-ip-bible episodes"

# Generate visual style rules
npm run command -- "icyflamze-core-ip-bible visuals"

# Generate symbol system
npm run command -- "icyflamze-core-ip-bible symbols"

# Generate voiceover script templates
npm run command -- "icyflamze-core-ip-bible voiceover"

# Generate music release strategy
npm run command -- "icyflamze-core-ip-bible music-tie-ins"

# Generate marketing rollout plan
npm run command -- "icyflamze-core-ip-bible rollout"

# Stage Obsidian note to write-gateway
npm run command -- "icyflamze-core-ip-bible obsidian-stage"

# Compile audit and generation reports
npm run command -- "icyflamze-core-ip-bible report"

# Display latest compile file paths
npm run command -- "icyflamze-core-ip-bible status"
```

---

## 📂 Expected Outputs
Upon executing compilation commands, documents are written to the following localized directories:
- **IP Bible:** `outputs/icyflamze_core/ip_bible/documents/`
- **Episodes:** `outputs/icyflamze_core/ip_bible/episodes/`
- **Characters:** `outputs/icyflamze_core/ip_bible/characters/`
- **Visuals & Symbols:** `outputs/icyflamze_core/ip_bible/visual_language/`
- **Rollout Planning:** `outputs/icyflamze_core/ip_bible/rollout/`
- **Staging Notes:** `outputs/icyflamze_core/ip_bible/obsidian_staging/` & `outputs/write_staging/`
- **Audits & Logs:** `outputs/icyflamze_core/ip_bible/reports/` & `outputs/icyflamze_core/ip_bible/logs/`

---

## 🏁 Next Phase Boundary
Completion of Phase 14B establishes the creative foundation of the universe. The next phase is the **Phase 14C: Episode 1 Trailer Package Production**, compiling concrete script cues, audio/visual prompts (Piper/Sora/Veo compatible), and cover art assets.
