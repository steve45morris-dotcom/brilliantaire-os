import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as config from '../config/icyflamze-core-episode-1-asset-queue.js';
import { REPO_ROOT, WRITE_STAGING_OUTPUT } from '../config/paths.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const queueOutDir = path.join(REPO_ROOT, 'outputs', 'icyflamze_core', 'episode_1', 'asset_queue');
const imageDir = path.join(queueOutDir, 'image_assets');
const videoDir = path.join(queueOutDir, 'video_assets');
const audioDir = path.join(queueOutDir, 'audio_assets');
const coverDir = path.join(queueOutDir, 'cover_art_assets');
const assemblyDir = path.join(queueOutDir, 'assembly_assets');
const checklistsDir = path.join(queueOutDir, 'checklists');
const stagingDir = path.join(queueOutDir, 'obsidian_staging');
const reportsDir = path.join(queueOutDir, 'reports');
const logsDir = path.join(queueOutDir, 'logs');
const templatesDir = path.join(REPO_ROOT, 'templates', 'icyflamze_core', 'episode_1', 'asset_queue');

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ensureDirectories() {
  fs.mkdirSync(queueOutDir, { recursive: true });
  fs.mkdirSync(imageDir, { recursive: true });
  fs.mkdirSync(videoDir, { recursive: true });
  fs.mkdirSync(audioDir, { recursive: true });
  fs.mkdirSync(coverDir, { recursive: true });
  fs.mkdirSync(assemblyDir, { recursive: true });
  fs.mkdirSync(checklistsDir, { recursive: true });
  fs.mkdirSync(stagingDir, { recursive: true });
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });
  if (WRITE_STAGING_OUTPUT) {
    fs.mkdirSync(WRITE_STAGING_OUTPUT, { recursive: true });
  }
}

function writeLog(message: string) {
  ensureDirectories();
  const dateStr = getFormattedDate();
  const logFile = path.join(logsDir, `exec_log_${dateStr}.txt`);
  const logEntry = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logFile, logEntry);
}

function getLatestFile(dirPath: string, prefix: string): string {
  if (!fs.existsSync(dirPath)) return 'None';
  const files = fs.readdirSync(dirPath)
    .filter(f => f.startsWith(prefix) && f.endsWith('.md'))
    .sort();
  if (files.length === 0) return 'None';
  return path.relative(REPO_ROOT, path.join(dirPath, files[files.length - 1]));
}

// 1. queue command
function handleQueue(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'asset-queue-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');
  
  const assetRows = [
    `| IMG-01 | image | Hero Poster | ${config.INPUT_FILES.COVER_ART} | Midjourney | ready_for_manual_generation | High | Yes | Generate square 1:1 main visual art of character on throne | Awaiting render |`,
    `| IMG-02 | image | Eyes Close-up | ${config.INPUT_FILES.SHOT_LIST} | Midjourney | ready_for_manual_generation | High | Yes | Generate macro eye shot showing blue-gold terminal reflects | Needs neon alignment |`,
    `| IMG-03 | image | City Circuit Lights | ${config.INPUT_FILES.SHOT_LIST} | Midjourney | ready_for_manual_generation | Medium | Yes | Generate circuit layout skyscraper panning visuals | Neon details |`,
    `| IMG-04 | image | Lighter Spark | ${config.INPUT_FILES.SHOT_LIST} | Midjourney | ready_for_manual_generation | High | Yes | Generate slow motion gold spark strike detailing | Needs high contrast |`,
    `| IMG-05 | image | Lyrics as Equations | ${config.INPUT_FILES.SHOT_LIST} | Midjourney | ready_for_manual_generation | Medium | Yes | Generate studio mic with floating equation overlays | Blue neon texts |`,
    `| IMG-06 | image | Chessboard City | ${config.INPUT_FILES.SHOT_LIST} | Midjourney | ready_for_manual_generation | High | Yes | Generate chess king placed on pavement chalk layout | Wet asphalt reflections |`,
    `| IMG-07 | image | Books / AI Panels | ${config.INPUT_FILES.SHOT_LIST} | Midjourney | ready_for_manual_generation | High | Yes | Generate orbiting leather books and holo screens grid | High contrast |`,
    `| IMG-08 | image | Title Card | ${config.INPUT_FILES.TRAILER_SCRIPT} | Canva | ready_for_manual_generation | Critical | Yes | Layout Title Typography overlaying dark gold-blue core | Main design typography |`,
    `| COV-01 | cover_art | Main Cover Art | ${config.INPUT_FILES.COVER_ART} | Midjourney | ready_for_manual_generation | High | Yes | Assemble gold title variant with Anime visual assets | Release single artwork |`,
    `| AUD-01 | audio | 30s Voiceover Audio | ${config.INPUT_FILES.VOICEOVER_30S} | ElevenLabs | ready_for_manual_generation | Critical | Yes | Generate philosophical narration track with clear pauses | Calm, strategic cadence |`,
    `| AUD-02 | audio | 15s Teaser Audio | ${config.INPUT_FILES.TEASER_15S} | ElevenLabs | ready_for_manual_generation | High | Yes | Generate condensed teaser narration voice track | High impact delivery |`,
    `| AUD-03 | audio | Trailer Music Bed | ${config.INPUT_FILES.AUDIO_DIRECTION} | Premiere Pro | ready_for_manual_generation | High | Yes | Loop and trim main record instrumental track | Deep sub-bass beat |`,
    `| AUD-04 | audio | Sound Effects Pack | ${config.INPUT_FILES.AUDIO_DIRECTION} | DaVinci Resolve | ready_for_manual_generation | Medium | Yes | Aggregate spark swooshes, heartbeat hums, chess thuds | High fidelity sweeps |`,
    `| VID-01 | video | Shot 1: Cyber Lens Close-up | ${config.INPUT_FILES.SHOT_LIST} | Sora | ready_for_manual_generation | High | Yes | Animate blue diagnostic lens reflections in slow motion | 3.0 seconds duration |`,
    `| VID-02 | video | Shot 2: Circuit Skyline | ${config.INPUT_FILES.SHOT_LIST} | Sora | ready_for_manual_generation | Medium | Yes | Animate crane pan over city circuit board skyscraper | 3.5 seconds duration |`,
    `| VID-03 | video | Shot 3: Gold Lighter Ignition | ${config.INPUT_FILES.SHOT_LIST} | Sora | ready_for_manual_generation | High | Yes | Animate macro side spark ignition to blue core flame | 4.0 seconds duration |`,
    `| VID-04 | video | Shot 4: Equation Microphone | ${config.INPUT_FILES.SHOT_LIST} | Veo | ready_for_manual_generation | Medium | Yes | Animate orbiting math formulas surrounding studio mic | 3.5 seconds duration |`,
    `| VID-05 | video | Shot 5: Chess King Drop | ${config.INPUT_FILES.SHOT_LIST} | Runway | ready_for_manual_generation | High | Yes | Animate low-angle chess piece thud on wet concrete | 3.0 seconds duration |`,
    `| VID-06 | video | Shot 6: Orbiting Library | ${config.INPUT_FILES.SHOT_LIST} | Veo | ready_for_manual_generation | High | Yes | Animate rotational pan of flying books and hologram arrays | 4.5 seconds duration |`,
    `| VID-07 | video | Shot 7: Hand striking lighter | ${config.INPUT_FILES.SHOT_LIST} | Sora | ready_for_manual_generation | High | Yes | Animate close shot of fingers flicking lighters on beat | 4.5 seconds duration |`,
    `| VID-08 | video | Shot 8: Empire Overlook | ${config.INPUT_FILES.SHOT_LIST} | Veo | ready_for_manual_generation | High | Yes | Animate hero stance looking over neon server grid city | 4.0 seconds duration |`,
    `| CAP-01 | caption | Subtitle SRT file | ${config.INPUT_FILES.CAPTIONS} | CapCut | ready_for_manual_generation | High | No | Sync timestamp subtitles for Instagram and TikTok reel formats | Clean monospace typography |`,
    `| ASM-01 | assembly | Trailer Edit Project | ${config.INPUT_FILES.ROLLOUT_CHECKLIST} | DaVinci Resolve | ready_for_manual_generation | Critical | Yes | Sequence visual files, layer voiceover and audio stems | Final master render file |`
  ].join('\n');

  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{TOTAL_QUEUED_ASSETS\}\}/g, "23")
    .replace(/\{\{GENERATION_STATUS\}\}/g, "ready_for_manual_generation")
    .replace(/\{\{DIRECT_VAULT_WRITE_STATUS\}\}/g, config.ALLOW_OBSIDIAN_DIRECT_WRITE ? "Enabled" : "No (Blocked)")
    .replace(/\{\{ASSET_ROWS\}\}/g, assetRows);

  const destPath = path.join(queueOutDir, `episode_1_master_asset_queue_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Master asset queue generated: outputs/icyflamze_core/episode_1/asset_queue/episode_1_master_asset_queue_${dateStr}.md`);
  writeLog(`Generated master asset queue at ${destPath}`);
}

// 2. image-assets command
function handleImageAssets(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'image-asset-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');

  const imageRows = [
    `| Hero Poster | ${config.INPUT_FILES.COVER_ART} | Midjourney | 1:1 | Cyberpunk anime, character on throne overseeing server mainframes, gold/neon-blue accents | High-fidelity rendering, gold/blue contrast, clear background layout | ready_for_manual_generation |`,
    `| Eyes Close-up | ${config.INPUT_FILES.SHOT_LIST} | Midjourney | 16:9 | Extreme close up of eyes behind cybernetic glasses with glowing terminal reflections | Neon blue code lines visible, anime texture | ready_for_manual_generation |`,
    `| Lighter Spark | ${config.INPUT_FILES.SHOT_LIST} | Midjourney | 16:9 | Close up gold lighter sparks firing in slow motion, dark background | Golden sparks high contrast details | ready_for_manual_generation |`,
    `| Chessboard City | ${config.INPUT_FILES.SHOT_LIST} | Midjourney | 16:9 | Gold chess king placed on pavement chalk grid, rainy neon reflections | Wet asphalt texture, neon blue highlights | ready_for_manual_generation |`,
    `| Lyrics as Equations | ${config.INPUT_FILES.SHOT_LIST} | Midjourney | 16:9 | Studio mic with holographic equations and waves orbiting in thin light rings | Floating math formula details | ready_for_manual_generation |`,
    `| Books and AI Panels | ${config.INPUT_FILES.SHOT_LIST} | Midjourney | 16:9 | Orbiting leather books and glow panels floating in dark server rooms | Golden rays, clean holo displays | ready_for_manual_generation |`,
    `| Title Card | ${config.INPUT_FILES.TRAILER_SCRIPT} | Canva | 16:9 | Solid black background, clean gold logo 'ICYFLAMZE CORE', neon blue outline accent | Strategic spacing, modern sans-serif typeface | ready_for_manual_generation |`
  ].join('\n');

  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{IMAGE_ROWS\}\}/g, imageRows);

  const destPath = path.join(imageDir, `episode_1_image_asset_queue_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Image asset queue generated: outputs/icyflamze_core/episode_1/asset_queue/image_assets/episode_1_image_asset_queue_${dateStr}.md`);
  writeLog(`Generated image asset queue at ${destPath}`);
}

// 3. video-assets command
function handleVideoAssets(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'video-asset-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');

  const videoRows = [
    `| VID-01: Cyber Lens Close-up | ${config.INPUT_FILES.SHOT_LIST} | Sora | 3.0s | Diagnostics scroll across spectacles lens, slow pupil zoom | Slow macro zoom | Neon blue alignment | Detailed character style sheet | ready_for_manual_generation |`,
    `| VID-02: Circuit Skyline | ${config.INPUT_FILES.SHOT_LIST} | Sora | 3.5s | Overhead panorama panning down across neon skyscraper layout | Downward crane pan | Circuit line grid continuity | Clear 3D landscape architecture | ready_for_manual_generation |`,
    `| VID-03: Gold Lighter Ignition | ${config.INPUT_FILES.SHOT_LIST} | Sora | 4.0s | Gold lighter striking in slow-motion, sparking blue core flame | Slow tracking slide | Spark count and flame color continuity | Ultra high frame rate sparks | ready_for_manual_generation |`,
    `| VID-04: Equation Microphone | ${config.INPUT_FILES.SHOT_LIST} | Veo | 3.5s | Floating blue neon equations spin around classic studio mic | Orbital tracking shot | Hologram formula readability | Perfect floating object animation | ready_for_manual_generation |`,
    `| VID-05: Chess King Drop | ${config.INPUT_FILES.SHOT_LIST} | Runway | 3.0s | Chess piece drops heavy on wet pavement chalk grid | Low angle tilt-up | Concrete reflections and crack details | Sound design thud sync alignment | ready_for_manual_generation |`,
    `| VID-06: Orbiting Library | ${config.INPUT_FILES.SHOT_LIST} | Veo | 4.5s | Rotation around character surrounded by floating books and screens | 360-degree orbit | Book spine titles and UI grid stability | Seamless background looping | ready_for_manual_generation |`,
    `| VID-07: Lighter beats flick | ${config.INPUT_FILES.SHOT_LIST} | Sora | 4.5s | Fingers flicking gold lighters in rhythmic sequence | Rapid jump cuts | Hands design and lighter model matching | Perfect cuts sync to snare hit beats | ready_for_manual_generation |`,
    `| VID-08: Empire Overlook | ${config.INPUT_FILES.SHOT_LIST} | Veo | 4.0s | Character on throne overlooking glowing mainframes and streets | High-angle slow pull-out | Golden lighting and throne visual styling | Cinematic visual depth scale | ready_for_manual_generation |`
  ].join('\n');

  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{VIDEO_ROWS\}\}/g, videoRows);

  const destPath = path.join(videoDir, `episode_1_video_asset_queue_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Video asset queue generated: outputs/icyflamze_core/episode_1/asset_queue/video_assets/episode_1_video_asset_queue_${dateStr}.md`);
  writeLog(`Generated video asset queue at ${destPath}`);
}

// 4. audio-assets command
function handleAudioAssets(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'audio-asset-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');

  const audioRows = [
    `| 30s Voiceover Narration | ${config.INPUT_FILES.VOICEOVER_30S} | ElevenLabs | 30s | Calm, strategic cadence, making dramatic pauses on key transition beats | Studio room hum removal, master normalization | High voiceover presence, zero clipping | ready_for_manual_generation |`,
    `| 15s Teaser Narration | ${config.INPUT_FILES.TEASER_15S} | ElevenLabs | 15s | High impact, strategic delivery matching fast visual pacing | Low mechanical hum background overlay | Clean pronunciation, sharp outro fade | ready_for_manual_generation |`,
    `| Trailer Music Bed | ${config.INPUT_FILES.AUDIO_DIRECTION} | Premiere Pro | 30s | Loop and trim main single track instrumentals | Sync transition sweeps on bars 4 and 8 | Deep sub-bass beat, crisp snare loops | ready_for_manual_generation |`,
    `| Lighter Spark SFX | ${config.INPUT_FILES.AUDIO_DIRECTION} | DaVinci Resolve | 1.5s | Metallic click, slow-motion ignition whoosh | Sync to Shot 3 and Shot 7 lighter flicks | Stereo panning width | ready_for_manual_generation |`,
    `| City Hum SFX | ${config.INPUT_FILES.AUDIO_DIRECTION} | DaVinci Resolve | 30s | Low frequency ambient hum with distant rain sounds | Layered across the entire timeline bed | Sub-audible low end presence | ready_for_manual_generation |`,
    `| AI Interface SFX | ${config.INPUT_FILES.AUDIO_DIRECTION} | DaVinci Resolve | 2.0s | Monospace digital clacks, data scroll chirps | Sync to Shot 1 and Shot 4 holograms | Clear high-end frequencies | ready_for_manual_generation |`,
    `| Chess Impact SFX | ${config.INPUT_FILES.AUDIO_DIRECTION} | DaVinci Resolve | 1.0s | Solid thud of a heavy metal piece striking concrete | Sync to Shot 5 chess drop | Deep mid-range thump | ready_for_manual_generation |`,
    `| Title Reveal Hit SFX | ${config.INPUT_FILES.AUDIO_DIRECTION} | DaVinci Resolve | 3.0s | Sub-bass drop transition swoosh and synthetic stab | Sync to outro title card reveal | Wide stereo reverb tail | ready_for_manual_generation |`,
    `| Outro Ambience SFX | ${config.INPUT_FILES.AUDIO_DIRECTION} | DaVinci Resolve | 5.0s | Long reverb decay of the music bed with rain drops | Fading out cleanly into silent black screen | Zero clicks, clean tail decay | ready_for_manual_generation |`
  ].join('\n');

  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{AUDIO_ROWS\}\}/g, audioRows);

  const destPath = path.join(audioDir, `episode_1_audio_asset_queue_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Audio asset queue generated: outputs/icyflamze_core/episode_1/asset_queue/audio_assets/episode_1_audio_asset_queue_${dateStr}.md`);
  writeLog(`Generated audio asset queue at ${destPath}`);
}

// 5. cover-art-assets command
function handleCoverArtAssets(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'cover-art-asset-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');

  const coverArtRows = [
    `| Main Cover Art | ${config.INPUT_FILES.COVER_ART} | Midjourney + Canva | 3000 x 3000 (Square) | Centered gold text, neon-blue outline accents | Throne character art | High contrast print-safe colors, no pixelation | ready_for_manual_generation |`,
    `| Vertical Story Crop | ${config.INPUT_FILES.COVER_ART} | Canva | 1080 x 1920 (Vertical) | Text placed in middle third, background extended | Same visual alignment | Clear margins for mobile reels layouts | ready_for_manual_generation |`,
    `| YouTube Thumbnail Crop | ${config.INPUT_FILES.COVER_ART} | Canva | 1920 x 1080 (Landscape) | Logo left-aligned, high impact typography | Same visual alignment | Eye-catching sizing for video lists | ready_for_manual_generation |`,
    `| Title Typography Variant | ${config.INPUT_FILES.COVER_ART} | Canva | 3000 x 3000 (Square) | Gold text on pure dark textured leather background | Text margins match Main Cover | Clean vector graphics output | ready_for_manual_generation |`,
    `| No-Text Variant | ${config.INPUT_FILES.COVER_ART} | Midjourney | 3000 x 3000 (Square) | Clean background art without text elements | Character throne assets | Clean brush styles, clear center focal point | ready_for_manual_generation |`
  ].join('\n');

  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{COVER_ART_ROWS\}\}/g, coverArtRows);

  const destPath = path.join(coverDir, `episode_1_cover_art_asset_queue_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Cover art asset queue generated: outputs/icyflamze_core/episode_1/asset_queue/cover_art_assets/episode_1_cover_art_asset_queue_${dateStr}.md`);
  writeLog(`Generated cover art asset queue at ${destPath}`);
}

// 6. assembly-checklist command
function handleAssemblyChecklist(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'assembly-checklist-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');

  const checklistRows = [
    `| Image Assets | Generate and review all 8 visual images | pending | Creative Architect | Verify resolution, colors, and prompts continuity |`,
    `| Video Clips | Generate and review all 8 cinematic clips | pending | Creative Architect | Verify duration, motion curves, and anime style |`,
    `| Voiceover Narration | Generate narration with ElevenLabs and normalize audio | pending | Creative Architect | Calm cadence, clear punctuation, studio hum removal |`,
    `| Music Bed Loop | Import and trim the instrumental track loop | pending | Creative Architect | Set target loop to exactly 30.0 seconds |`,
    `| Sound Effects | Sync clicks, drops, and sweeps on the edit grid timeline | pending | Creative Architect | Balance track volumes with voiceover stems |`,
    `| Subtitles / Captions | Import captions file and stylize monospace texts | pending | Creative Architect | Place centered in lower third, clear margins |`,
    `| Video Sequence | Align assets, apply cross-dissolve video transitions | pending | Creative Architect | Sync transitions to bass kicks on beat |`,
    `| Final Output Export | Export Master trailer H.264 at 1080p, 24fps | pending | Creative Architect | File size optimized under 20MB, clean audio |`
  ].join('\n');

  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{CHECKLIST_ROWS\}\}/g, checklistRows);

  const destPath = path.join(checklistsDir, `episode_1_assembly_checklist_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Assembly checklist generated: outputs/icyflamze_core/episode_1/asset_queue/checklists/episode_1_assembly_checklist_${dateStr}.md`);
  writeLog(`Generated assembly checklist at ${destPath}`);
}

// 7. manual-guide command
function handleManualGuide(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'manual-generation-guide-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');

  const toolWalkthroughs = [
    `### 1. Midjourney Generation Guide
- **Workflow:** Copy prompt text, add aspect ratios (--ar 16:9 for landscape, --ar 1:1 for poster), run in Midjourney Discord workspace.
- **Rules:** Preserve the gold, neon blue, and dark chiascuro lighting parameters.
- **Naming:** Save file as \`IMG_XX_desc.png\` inside your local staging folder.

### 2. Sora & Veo Animation Guide
- **Workflow:** Input prompt text, specify high frame-rate and camera motion directions (orbital tracking pan, macro zoom).
- **Rules:** Target exact clip duration (3.0s - 4.5s) to avoid edit timeline gaps.
- **Naming:** Save file as \`VID_XX_desc.mp4\`.

### 3. ElevenLabs Narration Guide
- **Workflow:** Input the voiceover script from the guide, choose a deep, authoritative voice model, adjust stability to 65% and clarity to 85%.
- **Rules:** Keep speech delivery calm and paced.
- **Naming:** Save file as \`AUD_XX_desc.wav\`.`
  ].join('\n');

  const guideRows = [
    `| Image Assets | Midjourney | Paste prompt, adjust aspect ratio parameters | IMG_01_hero_poster.png | outputs/icyflamze_core/episode_1/asset_queue/image_assets/ | Compare contrast and color palette against palette guide | Redo if layout feels generic or pixelated |`,
    `| Video Clips | Sora/Veo | Paste prompts, set targeted clip duration | VID_01_lens_close.mp4 | outputs/icyflamze_core/episode_1/asset_queue/video_assets/ | Compare motion speed and character face continuity | Redo if faces distort or camera pans stutter |`,
    `| Audio Tracks | ElevenLabs | Paste voiceover script, set stability slider | AUD_01_voiceover_30s.wav | outputs/icyflamze_core/episode_1/asset_queue/audio_assets/ | Check cadence, noise levels, and punctuation | Re-generate if pacing feels rushed or voice clips |`,
    `| Cover Graphics | Canva | Layout title cards on grid overlay | COV_01_cover_art.png | outputs/icyflamze_core/episode_1/asset_queue/cover_art_assets/ | Check spelling, bleed margins, crop constraints | Readjust layer spacing if margins clip |`
  ].join('\n');

  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{TOOL_WALKTHROUGHS\}\}/g, toolWalkthroughs)
    .replace(/\{\{GUIDE_ROWS\}\}/g, guideRows);

  const destPath = path.join(queueOutDir, `episode_1_manual_generation_guide_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Manual generation guide generated: outputs/icyflamze_core/episode_1/asset_queue/episode_1_manual_generation_guide_${dateStr}.md`);
  writeLog(`Generated manual generation guide at ${destPath}`);
}

// 8. obsidian-stage command
function handleObsidianStage(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'obsidian-stage-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');

  const aliases = [
    `  - "ICYFLAMZE CORE Episode 1 Asset Queue"`,
    `  - "Episode 1 Trailer Asset Queue"`,
    `  - "The Core Wakes Asset Queue"`
  ].join('\n');

  const tags = [
    `  - "Icyflamze"`,
    `  - "ICYFLAMZECORE"`,
    `  - "StreetScholarFuturism"`,
    `  - "RiseOfTheStreetScholar"`,
    `  - "TheCoreWakes"`,
    `  - "AssetQueue"`,
    `  - "TrailerProduction"`,
    `  - "TreeGrooveRecords"`,
    `  - "BrilliantaireOS"`,
    `  - "CreativeIP"`,
    `  - "MusicTech"`,
    `  - "AnimeVisuals"`,
    `  - "AIWorkflow"`
  ].join('\n');

  const overview = `The asset generation queue systematically maps all visual and audio elements required for Episode 1 trailer assembly. Out of a total of 23 cataloged assets, all tasks remain staged for manual execution. Direct writing to Obsidian is disabled by default, ensuring all notes are staged in write_staging first.`;

  const imageAssets = `List of 8 required images including the Hero Poster, close-up spectacles lens, city circuit board skyline, metallic gold lighter spark, recording studio mic, concrete chessboard layout, orbiting library books, and black-gold-blue title card graphics.`;

  const videoAssets = `List of 8 video animation clips corresponding to the trailer shot list (C-01 to C-08), detailed with Sora, Veo, and Runway style guidelines, duration constraints, camera panning angles, and motion directions.`;

  const audioAssets = `List of 9 audio stems including ElevenLabs narration guides, record instrumental beds, and sound effects sweeps (lighter clicks, city hums, keyboard clacks, and chess piece placement thuds).`;

  const coverArtAssets = `Promotional graphics assets and crops (3000x3000px square, vertical story crop, horizontal YouTube crop, typography-only layout, and textless variant).`;

  const assemblyChecklist = `Pre-assembly verification checklist including asset availability reviews, edit timeline synchronization steps, monospace captions overlays, and final master video file H.264 export rendering rules.`;

  const manualGuide = `Step-by-step instructions for copy-pasting visual prompts, running speech synthesis audio generators, enforcing strict naming formats, and saving output assets inside local folders.`;

  const nextActions = `- [ ] Copy visual prompts from image asset queue into Midjourney Discord\n- [ ] Generate narration audios using ElevenLabs voice tools\n- [ ] Import generated clips into Premiere/Resolve sequence layout\n- [ ] Sync cut markers to beat drums and render master clip`;

  content = content
    .replace(/\{\{ALIASES\}\}/g, aliases)
    .replace(/\{\{TAGS\}\}/g, tags)
    .replace(/\{\{PROJECT_NAME\}\}/g, config.PROJECT_NAME)
    .replace(/\{\{SEASON_TITLE\}\}/g, config.SEASON_TITLE)
    .replace(/\{\{EPISODE_NUMBER\}\}/g, String(config.EPISODE_NUMBER))
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{STAGED_AT\}\}/g, new Date().toISOString())
    .replace(/\{\{OVERVIEW\}\}/g, overview)
    .replace(/\{\{IMAGE_ASSETS\}\}/g, imageAssets)
    .replace(/\{\{VIDEO_ASSETS\}\}/g, videoAssets)
    .replace(/\{\{AUDIO_ASSETS\}\}/g, audioAssets)
    .replace(/\{\{COVER_ART_ASSETS\}\}/g, coverArtAssets)
    .replace(/\{\{ASSEMBLY_CHECKLIST\}\}/g, assemblyChecklist)
    .replace(/\{\{MANUAL_GENERATION_GUIDE\}\}/g, manualGuide)
    .replace(/\{\{NEXT_ACTIONS\}\}/g, nextActions);

  const localStagingPath = path.join(stagingDir, `ICYFLAMZE_CORE_EPISODE_1_ASSET_QUEUE_OBSIDIAN_STAGE_${dateStr}.md`);
  fs.writeFileSync(localStagingPath, content, 'utf-8');
  console.log(`✅ Obsidian staged note generated: outputs/icyflamze_core/episode_1/asset_queue/obsidian_staging/ICYFLAMZE_CORE_EPISODE_1_ASSET_QUEUE_OBSIDIAN_STAGE_${dateStr}.md`);
  writeLog(`Generated Obsidian staged note at ${localStagingPath}`);

  if (WRITE_STAGING_OUTPUT) {
    const gatewayStagingPath = path.join(WRITE_STAGING_OUTPUT, `ICYFLAMZE_CORE_EPISODE_1_ASSET_QUEUE_OBSIDIAN_STAGE_${dateStr}.md`);
    fs.writeFileSync(gatewayStagingPath, content, 'utf-8');
    console.log(`✅ Staged note copied to Obsidian write-gateway: outputs/write_staging/ICYFLAMZE_CORE_EPISODE_1_ASSET_QUEUE_OBSIDIAN_STAGE_${dateStr}.md`);
    writeLog(`Copied Obsidian note to write-gateway: ${gatewayStagingPath}`);
  }
}

// 9. report command
function handleReport(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'asset-queue-report-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');

  const masterQueueFile = `episode_1_master_asset_queue_${dateStr}.md`;
  const imageQueueFile = `episode_1_image_asset_queue_${dateStr}.md`;
  const videoQueueFile = `episode_1_video_asset_queue_${dateStr}.md`;
  const audioQueueFile = `episode_1_audio_asset_queue_${dateStr}.md`;
  const coverQueueFile = `episode_1_cover_art_asset_queue_${dateStr}.md`;
  const checklistQueueFile = `episode_1_assembly_checklist_${dateStr}.md`;
  const manualGuideQueueFile = `episode_1_manual_generation_guide_${dateStr}.md`;
  const obsidianStageQueueFile = `ICYFLAMZE_CORE_EPISODE_1_ASSET_QUEUE_OBSIDIAN_STAGE_${dateStr}.md`;

  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{TOTAL_QUEUED_ASSETS\}\}/g, "23")
    .replace(/\{\{DIRECT_VAULT_WRITE_STATUS\}\}/g, config.ALLOW_OBSIDIAN_DIRECT_WRITE ? "Enabled" : "No (Blocked)")
    .replace(/\{\{MASTER_QUEUE_PATH\}\}/g, `outputs/icyflamze_core/episode_1/asset_queue/${masterQueueFile}`)
    .replace(/\{\{\.MASTER_QUEUE_URL\}\}/g, `file://${queueOutDir}/${masterQueueFile}`)
    .replace(/\{\{IMAGE_QUEUE_PATH\}\}/g, `outputs/icyflamze_core/episode_1/asset_queue/image_assets/${imageQueueFile}`)
    .replace(/\{\{\.IMAGE_QUEUE_URL\}\}/g, `file://${imageDir}/${imageQueueFile}`)
    .replace(/\{\{VIDEO_QUEUE_PATH\}\}/g, `outputs/icyflamze_core/episode_1/asset_queue/video_assets/${videoQueueFile}`)
    .replace(/\{\{\.VIDEO_QUEUE_URL\}\}/g, `file://${videoDir}/${videoQueueFile}`)
    .replace(/\{\{AUDIO_QUEUE_PATH\}\}/g, `outputs/icyflamze_core/episode_1/asset_queue/audio_assets/${audioQueueFile}`)
    .replace(/\{\{\.AUDIO_QUEUE_URL\}\}/g, `file://${audioDir}/${audioQueueFile}`)
    .replace(/\{\{COVER_ART_QUEUE_PATH\}\}/g, `outputs/icyflamze_core/episode_1/asset_queue/cover_art_assets/${coverQueueFile}`)
    .replace(/\{\{\.COVER_ART_QUEUE_URL\}\}/g, `file://${coverDir}/${coverQueueFile}`)
    .replace(/\{\{ASSEMBLY_CHECKLIST_PATH\}\}/g, `outputs/icyflamze_core/episode_1/asset_queue/checklists/${checklistQueueFile}`)
    .replace(/\{\{\.ASSEMBLY_CHECKLIST_URL\}\}/g, `file://${checklistsDir}/${checklistQueueFile}`)
    .replace(/\{\{MANUAL_GUIDE_PATH\}\}/g, `outputs/icyflamze_core/episode_1/asset_queue/${manualGuideQueueFile}`)
    .replace(/\{\{\.MANUAL_GUIDE_URL\}\}/g, `file://${queueOutDir}/${manualGuideQueueFile}`)
    .replace(/\{\{OBSIDIAN_STAGE_PATH\}\}/g, `outputs/icyflamze_core/episode_1/asset_queue/obsidian_staging/${obsidianStageQueueFile}`)
    .replace(/\{\{\.OBSIDIAN_STAGE_URL\}\}/g, `file://${stagingDir}/${obsidianStageQueueFile}`)
    .replace(/\{\{NEXT_PHASE\}\}/g, "Phase 14E: Episode 1 Trailer Rendering and Assembly");

  const destPath = path.join(reportsDir, `episode_1_asset_queue_report_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Asset queue report compiled: outputs/icyflamze_core/episode_1/asset_queue/reports/episode_1_asset_queue_report_${dateStr}.md`);
  writeLog(`Compiled asset queue report at ${destPath}`);
}

// 10. status command
function handleStatus(dateStr: string) {
  ensureDirectories();
  const latestQueue = getLatestFile(queueOutDir, 'episode_1_master_asset_queue_');
  const latestImage = getLatestFile(imageDir, 'episode_1_image_asset_queue_');
  const latestVideo = getLatestFile(videoDir, 'episode_1_video_asset_queue_');
  const latestAudio = getLatestFile(audioDir, 'episode_1_audio_asset_queue_');
  const latestCover = getLatestFile(coverDir, 'episode_1_cover_art_asset_queue_');
  const latestChecklist = getLatestFile(checklistsDir, 'episode_1_assembly_checklist_');
  const latestGuide = getLatestFile(queueOutDir, 'episode_1_manual_generation_guide_');
  const latestStage = getLatestFile(stagingDir, 'ICYFLAMZE_CORE_EPISODE_1_ASSET_QUEUE_OBSIDIAN_STAGE_');
  const latestReport = getLatestFile(reportsDir, 'episode_1_asset_queue_report_');

  console.log(`=========================================
📊 ICYFLAMZE CORE: Episode 1 Asset Queue Status
=========================================
- Latest Master Queue:       ${latestQueue}
- Latest Image Queue:        ${latestImage}
- Latest Video Queue:        ${latestVideo}
- Latest Audio Queue:        ${latestAudio}
- Latest Cover Art Queue:    ${latestCover}
- Latest Assembly Checklist: ${latestChecklist}
- Latest Manual Guide:       ${latestGuide}
- Latest Obsidian Staged:    ${latestStage}
- Latest Report:             ${latestReport}
- Total Queued Assets:       23
- Direct Obsidian Write:     No (Blocked)
- Next Recommended Phase:    Phase 14E: Episode 1 Trailer Rendering and Assembly
=========================================`);
  writeLog(`Printed status menu.`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  const dateStr = getFormattedDate();

  await announceIntent(`Compiling Asset Queue subcommand: ${command}`);

  try {
    switch (command) {
      case 'help':
        console.log(`Usage: npm run icyflamze-core-episode-1-asset-queue -- <subcommand>`);
        break;
      case 'queue':
        handleQueue(dateStr);
        break;
      case 'image-assets':
        handleImageAssets(dateStr);
        break;
      case 'video-assets':
        handleVideoAssets(dateStr);
        break;
      case 'audio-assets':
        handleAudioAssets(dateStr);
        break;
      case 'cover-art-assets':
        handleCoverArtAssets(dateStr);
        break;
      case 'assembly-checklist':
        handleAssemblyChecklist(dateStr);
        break;
      case 'manual-guide':
        handleManualGuide(dateStr);
        break;
      case 'obsidian-stage':
        handleObsidianStage(dateStr);
        break;
      case 'report':
        handleReport(dateStr);
        break;
      case 'status':
        handleStatus(dateStr);
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
    await announceCompletion(`Asset queue command ${command} completed successfully`, '10');
  } catch (error) {
    console.error(`❌ Error executing command ${command}:`, error);
    process.exit(1);
  }
}

main();
