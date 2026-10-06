import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { REPO_ROOT } from '../config/paths.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CreativeInput {
  episodeId: string;
  title: string;
  objective: string;
  theme: string;
  durationSeconds: number;
  platforms: string[];
}

function ensureDirectories(episodeId: string) {
  const baseDir = path.join(REPO_ROOT, 'outputs', 'icyflamze_core', episodeId);
  fs.mkdirSync(baseDir, { recursive: true });
  fs.mkdirSync(path.join(baseDir, 'checklists'), { recursive: true });
  fs.mkdirSync(path.join(baseDir, 'reports'), { recursive: true });
}

function generateBrief(input: CreativeInput): string {
  return `# Creative Brief: ${input.title}

### Episode Metadata:
- **Episode ID:** ${input.episodeId}
- **Target Duration:** ${input.durationSeconds} seconds
- **Release Platforms:** ${input.platforms.join(', ')}

## 🎯 Creative Objective
${input.objective}

## 🎨 Visual and Narrative Theme
- **Pillars:** ${input.theme}
- **Style Frame:** Cyberpunk Lagos (Chiaroscuro blue-gold, cinematic contrast)
- **Visual References:** Locked face portrait visual reference, gold Mr. 2 Lighter spark.

## 🎬 Narrative Arc & Scenes
1. **Scene 1 (Pressure):** 0s - 20s. Underworld slums backdrop. Rain, generators, traffic, fragmented terminal feeds. Icyflamze remains still, observing the chaos before acting.
2. **Scene 2 (Calculation):** 20s - 40s. Close-up portrait as environmental routes, chess geometry, and signal pathways resolve in visualized thought. Striking the Mr. 2 Lighter motif.
3. **Scene 3 (Command):** 40s - 60s. The Sovereign Knight moves with deliberate control, navigating structured pathways. Concludes with Icyflamze facing forward directly at the camera.
`;
}

function generateSceneArchitecture(input: CreativeInput): string {
  return `# Scene Architecture: ${input.title}

| Scene ID | Duration | Narrative Beats | Primary Tool | Primary Asset | Dependent Asset |
|---|---|---|---|---|---|
| **SCENE-01** | 20s | Lagos active chaos (Pressure); observing before acting | Sora / ElevenLabs | \`VID-01\` (Pressure Slums) | \`AUD-01\`, \`IMG-02\` |
| **SCENE-02** | 20s | Visualized thought calculations and lighter spark | Sora / ElevenLabs | \`VID-02\`, \`VID-03\` | \`AUD-02\`, \`IMG-03\`, \`IMG-04\` |
| **SCENE-03** | 20s | Calculated movement (Sovereignty); facing camera forward | Veo / ElevenLabs | \`VID-04\` | \`AUD-03\`, \`IMG-05\` |
`;
}

function generateDependencyGraph(input: CreativeInput): string {
  return `# Dependency Graph: ${input.title}

\`\`\`mermaid
graph TD
    AUD-01["Voiceover Part 1 (20s)"] --> VID-01["Video 1 (Pressure Slums)"]
    IMG-02["Image 2 (Landscape Base)"] --> VID-01
    
    AUD-02["Voiceover Part 2 (20s)"] --> VID-02["Video 2 (Calculation Portrait)"]
    IMG-03["Image 3 (Goatee Portrait)"] --> VID-02
    
    AUD-02["Voiceover Part 2 (20s)"] --> VID-03["Video 3 (Lighter Spark)"]
    IMG-04["Image 4 (Lighter Spark Base)"] --> VID-03
    
    AUD-03["Voiceover Part 3 (20s)"] --> VID-04["Video 4 (Sovereign Outro)"]
    IMG-05["Image 5 (Sovereign Outro Base)"] --> VID-04
    
    VID-01 --> CAP-01["Caption Subtitles"]
    VID-02 --> CAP-01
    VID-03 --> CAP-01
    VID-04 --> CAP-01
    AUD-01 --> CAP-01
    AUD-02 --> CAP-01
    AUD-03 --> CAP-01
    
    VID-01 --> ASM-01["Master Edit Assembly"]
    VID-02 --> ASM-01
    VID-03 --> ASM-01
    VID-04 --> ASM-01
    AUD-01 --> ASM-01
    AUD-02 --> ASM-01
    AUD-03 --> ASM-01
    AUD-04["Ambient Music (60s)"] --> ASM-01
    CAP-01 --> ASM-01
\`\`\`
`;
}

function generateChecklist(input: CreativeInput): string {
  return `# Production Generation Checklist: ${input.title}

## Phase 1: Imagery Generation (Midjourney/Canva)
- [ ] **IMG-01** (Hero Poster) - Dimensions: \`16:9\` (YouTube Thumbnail)
- [ ] **IMG-02** (Underworld Slums Landscape) - Dimensions: \`16:9\`
- [ ] **IMG-03** (Goatee Portrait) - Dimensions: \`16:9\` (Visual Character Lock)
- [ ] **IMG-04** (Lighter Spark Base) - Dimensions: \`16:9\`
- [ ] **IMG-05** (Sovereign Outro Base) - Dimensions: \`16:9\`
- [ ] **COV-01** (Cover Art Portrait) - Dimensions: \`1:1\` (Instagram Cover)

## Phase 2: Narration & Audio (ElevenLabs/Premiere)
- [ ] **AUD-01** (VO Narration Part 1) - Duration: \`20s\`
- [ ] **AUD-02** (VO Narration Part 2) - Duration: \`20s\`
- [ ] **AUD-03** (VO Narration Part 3) - Duration: \`20s\`
- [ ] **AUD-04** (Ambient Synth BG) - Duration: \`60s\`

## Phase 3: Video Renders (Sora/Veo/Runway)
- [ ] **VID-01** (Neon Lagos Landscape) - Dimensions: \`16:9\`, Duration: \`20s\`. *Depends on AUD-01, IMG-02*
- [ ] **VID-02** (Calculation portrait motion) - Dimensions: \`16:9\`, Duration: \`20s\`. *Depends on AUD-02, IMG-03*
- [ ] **VID-03** (Mr. 2 Lighter spark motion) - Dimensions: \`16:9\`, Duration: \`20s\`. *Depends on AUD-02, IMG-04*
- [ ] **VID-04** (Sovereign Knight walks neon slums) - Dimensions: \`16:9\`, Duration: \`20s\`. *Depends on AUD-03, IMG-05*

## Phase 4: Capture & Compile (CapCut/DaVinci)
- [ ] **CAP-01** (Caption subtitles track) - *Depends on VID-01, VID-02, VID-03, VID-04, AUD-01, AUD-02, AUD-03*
- [ ] **ASM-01** (Master Edit Assembly project file) - *Depends on all video, audio, and subtitle components*
`;
}

function generateProductionManifest(input: CreativeInput): any {
  return {
    project_name: "icyflamze-core",
    season_title: "Season 1",
    episode_number: parseInt(input.episodeId.replace('episode_', ''), 10) || 2,
    episode_title: input.title,
    assets: [
      {
        id: "IMG-01",
        category: "image",
        prefix: "IMG-01",
        allowed_extensions: [".png", ".jpg"],
        tool: "Midjourney",
        dimensions: "16:9",
        role: "Hero poster thumbnail visual asset",
        identity_reference: "icyflamze",
        dependencies: []
      },
      {
        id: "IMG-02",
        category: "image",
        prefix: "IMG-02",
        allowed_extensions: [".png", ".jpg"],
        tool: "Midjourney",
        dimensions: "16:9",
        role: "Underworld slums scene landscape background",
        dependencies: []
      },
      {
        id: "IMG-03",
        category: "image",
        prefix: "IMG-03",
        allowed_extensions: [".png", ".jpg"],
        tool: "Midjourney",
        dimensions: "16:9",
        role: "Goatee portrait character reference close-up",
        identity_reference: "icyflamze",
        dependencies: []
      },
      {
        id: "IMG-04",
        category: "image",
        prefix: "IMG-04",
        allowed_extensions: [".png", ".jpg"],
        tool: "Midjourney",
        dimensions: "16:9",
        role: "Lighter mechanism visual asset close-up",
        dependencies: []
      },
      {
        id: "IMG-05",
        category: "image",
        prefix: "IMG-05",
        allowed_extensions: [".png", ".jpg"],
        tool: "Midjourney",
        dimensions: "16:9",
        role: "Sovereign Knight outro visual asset",
        identity_reference: "icyflamze",
        dependencies: []
      },
      {
        id: "COV-01",
        category: "cover_art",
        prefix: "COV-01",
        allowed_extensions: [".png", ".jpg"],
        tool: "Midjourney",
        dimensions: "1:1",
        role: "Square platform release cover art asset",
        dependencies: ["IMG-01"]
      },
      {
        id: "AUD-01",
        category: "audio",
        prefix: "AUD-01",
        allowed_extensions: [".wav", ".mp3"],
        tool: "ElevenLabs",
        duration: "20s",
        role: "Narrative voiceover part 1",
        dependencies: []
      },
      {
        id: "AUD-02",
        category: "audio",
        prefix: "AUD-02",
        allowed_extensions: [".wav", ".mp3"],
        tool: "ElevenLabs",
        duration: "20s",
        role: "Narrative voiceover part 2",
        dependencies: []
      },
      {
        id: "AUD-03",
        category: "audio",
        prefix: "AUD-03",
        allowed_extensions: [".wav", ".mp3"],
        tool: "ElevenLabs",
        duration: "20s",
        role: "Narrative voiceover part 3",
        dependencies: []
      },
      {
        id: "AUD-04",
        category: "audio",
        prefix: "AUD-04",
        allowed_extensions: [".wav", ".mp3"],
        tool: "Premiere",
        duration: "60s",
        role: "Ambient synth background soundscape",
        dependencies: []
      },
      {
        id: "VID-01",
        category: "video",
        prefix: "VID-01",
        allowed_extensions: [".mp4"],
        tool: "Sora",
        dimensions: "16:9",
        duration: "20s",
        role: "Scene 1 neon Lagos slums landscape",
        dependencies: ["AUD-01", "IMG-02"]
      },
      {
        id: "VID-02",
        category: "video",
        prefix: "VID-02",
        allowed_extensions: [".mp4"],
        tool: "Sora",
        dimensions: "16:9",
        duration: "20s",
        role: "Scene 2 character portrait panning",
        identity_reference: "icyflamze",
        dependencies: ["AUD-02", "IMG-03"]
      },
      {
        id: "VID-03",
        category: "video",
        prefix: "VID-03",
        allowed_extensions: [".mp4"],
        tool: "Sora",
        dimensions: "16:9",
        duration: "20s",
        role: "Scene 2 lighter ignition slow-motion close-up",
        dependencies: ["AUD-02", "IMG-04"]
      },
      {
        id: "VID-04",
        category: "video",
        prefix: "VID-04",
        allowed_extensions: [".mp4"],
        tool: "Veo",
        dimensions: "16:9",
        duration: "20s",
        role: "Scene 3 Scholar walk out of neon slums",
        identity_reference: "icyflamze",
        dependencies: ["AUD-03", "IMG-05"]
      },
      {
        id: "CAP-01",
        category: "caption",
        prefix: "CAP-01",
        allowed_extensions: [".srt", ".vtt"],
        tool: "CapCut",
        role: "Full narration subtitle tracks",
        dependencies: ["VID-01", "VID-02", "VID-03", "VID-04", "AUD-01", "AUD-02", "AUD-03"]
      },
      {
        id: "ASM-01",
        category: "assembly",
        prefix: "ASM-01",
        allowed_extensions: [".capcut", ".drp"],
        tool: "DaVinci",
        role: "Master video editor timelines assembly project",
        dependencies: [
          "VID-01",
          "VID-02",
          "VID-03",
          "VID-04",
          "AUD-01",
          "AUD-02",
          "AUD-03",
          "AUD-04",
          "CAP-01"
        ]
      }
    ]
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] !== 'plan' || !args[1]) {
    console.error(`❌ Usage: npm run agy-planner -- plan <creativeMissionJsonPath>`);
    process.exit(1);
  }

  const creativeMissionPath = path.join(REPO_ROOT, args[1]);
  if (!fs.existsSync(creativeMissionPath)) {
    console.error(`❌ Creative mission configuration file not found at: ${creativeMissionPath}`);
    process.exit(1);
  }

  const input: CreativeInput = JSON.parse(fs.readFileSync(creativeMissionPath, 'utf-8'));
  console.log(`\n🎨 Starting Creative Planning Process for: ${input.title}...`);

  await announceIntent(`Compiling Creative Plan for ${input.title}`);

  ensureDirectories(input.episodeId);

  const baseDir = path.join(REPO_ROOT, 'outputs', 'icyflamze_core', input.episodeId);

  // Write Brief
  const briefMd = generateBrief(input);
  fs.writeFileSync(path.join(baseDir, 'creative_brief.md'), briefMd, 'utf-8');
  console.log(`✓ Generated Creative Brief: outputs/icyflamze_core/${input.episodeId}/creative_brief.md`);

  // Write Scene Architecture
  const sceneMd = generateSceneArchitecture(input);
  fs.writeFileSync(path.join(baseDir, 'scene_architecture.md'), sceneMd, 'utf-8');
  console.log(`✓ Generated Scene Architecture: outputs/icyflamze_core/${input.episodeId}/scene_architecture.md`);

  // Write Dependency Graph
  const graphMd = generateDependencyGraph(input);
  fs.writeFileSync(path.join(baseDir, 'dependency_graph.md'), graphMd, 'utf-8');
  console.log(`✓ Generated Dependency Graph: outputs/icyflamze_core/${input.episodeId}/dependency_graph.md`);

  // Write Generation Checklist
  const checkMd = generateChecklist(input);
  fs.writeFileSync(path.join(baseDir, 'checklists', 'generation_plan.md'), checkMd, 'utf-8');
  console.log(`✓ Generated Production Checklist: outputs/icyflamze_core/${input.episodeId}/checklists/generation_plan.md`);

  // Write Production Manifest JSON
  const manifestJson = generateProductionManifest(input);
  const manifestPath = path.join(REPO_ROOT, 'config', `${input.episodeId}_production_manifest.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifestJson, null, 2), 'utf-8');
  console.log(`✓ Generated Production Manifest configuration: config/${input.episodeId}_production_manifest.json`);

  console.log(`\n🎉 Creative planning completed! System schemas are now prepared for Episode 2.`);
  console.log(`Run: npm run agy-orchestrator -- init ${input.episodeId} "${input.title}" to initialize production state.\n`);

  await announceCompletion(`Creative planning completed for ${input.title}`, '10');
}

main();
