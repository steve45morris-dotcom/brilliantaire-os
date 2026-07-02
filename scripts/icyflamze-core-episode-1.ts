import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as config from '../config/icyflamze-core-episode-1.js';
import { REPO_ROOT, WRITE_STAGING_OUTPUT } from '../config/paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDirBase = path.join(REPO_ROOT, 'outputs', 'icyflamze_core', 'episode_1');
const scriptsDir = path.join(outDirBase, 'scripts');
const shotListsDir = path.join(outDirBase, 'shot_lists');
const imagePromptsDir = path.join(outDirBase, 'image_prompts');
const animPromptsDir = path.join(outDirBase, 'animation_prompts');
const audioDir = path.join(outDirBase, 'audio');
const coverArtDir = path.join(outDirBase, 'cover_art');
const captionsDir = path.join(outDirBase, 'captions');
const rolloutDir = path.join(outDirBase, 'rollout');
const stagingDir = path.join(outDirBase, 'obsidian_staging');
const reportsDir = path.join(outDirBase, 'reports');
const logsDir = path.join(outDirBase, 'logs');
const templatesDir = path.join(REPO_ROOT, 'templates', 'icyflamze_core', 'episode_1');

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ensureDirectories() {
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.mkdirSync(shotListsDir, { recursive: true });
  fs.mkdirSync(imagePromptsDir, { recursive: true });
  fs.mkdirSync(animPromptsDir, { recursive: true });
  fs.mkdirSync(audioDir, { recursive: true });
  fs.mkdirSync(coverArtDir, { recursive: true });
  fs.mkdirSync(captionsDir, { recursive: true });
  fs.mkdirSync(rolloutDir, { recursive: true });
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

// 1. trailer-script command
function handleTrailerScript(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'trailer-script-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{EPISODE_THEME\}\}/g, config.EPISODE_THEME)
    .replace(/\{\{LOGLINE\}\}/g, "Under intense concrete pressure, a street coder strikes his lighter to activate a hidden AI node, sparking a blue-gold flame that begins his strategic evolution.")
    .replace(/\{\{TRAILER_STRUCTURE\}\}/g, 
`- **0:00 - 0:08 (Setup):** Slow street panning under stormy night grid lines. Sound of deep bass heartbeat.
- **0:08 - 0:15 (Ignition):** Close-up of gold lighter striking, igniting a blue-gold flame. Keys click.
- **0:15 - 0:25 (Conflict & Strategy):** Lyrics and equations float, chess king placed on pavement grid.
- **0:25 - 0:30 (Resolution):** Hero shot of Icyflamze on throne overlooking mainframes. Title card reveal.`)
    .replace(/\{\{OPENING_NARRATION\}\}/g, 
`"They thought he was just another voice from the pressure.
But pressure was never his prison.
It was his professor.
Every loss became data.
Every silence became strategy.
Every scar became a signal.
He did not just survive the city.
He decoded it."`)
    .replace(/\{\{VISUAL_BEATS\}\}/g, 
`- Beat 1: Cyber specs glowing with neon-blue terminal diagnostics.
- Beat 2: Overhead crane shot of street blocks acting like chessboard coordinates.
- Beat 3: Orbiting leather books, AI screens, and gold waveform graphics.`)
    .replace(/\{\{CLOSING_TITLE\}\}/g, `${config.PROJECT_NAME} — ${config.SEASON_TITLE}`)
    .replace(/\{\{TAGLINE\}\}/g, config.MASTER_TAGLINE)
    .replace(/\{\{CTA\}\}/g, "Available now on Tree Groove Records. Search 'ICYFLAMZE CORE' to listen.");

  const destPath = path.join(scriptsDir, `episode_1_trailer_script_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Trailer script generated: outputs/icyflamze_core/episode_1/scripts/episode_1_trailer_script_${dateStr}.md`);
  writeLog(`Generated Trailer script at ${destPath}`);
}

// 2. voiceover command
function handleVoiceover(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'voiceover-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    .replace(/\{\{EMOTIONAL_TONE\}\}/g, "Philosophical, street-smart, calm, authoritative, sovereign, legacy-driven.")
    .replace(/\{\{VOICEOVER_SCRIPT\}\}/g, 
`"[0:00 - 0:02] [Low mechanical hum]
They thought he was just another voice from the **pressure**.

[0:02 - 0:05] [Lighter click, sound of flame ignition]
But **pressure** was never his **prison**.

[0:05 - 0:08] [A synthesizer pad swells]
It was his **professor**.

[0:08 - 0:12] [Monospace keyboard clacks]
Every loss became **data**. Every silence became **strategy**.

[0:12 - 0:16] [Solid thud of a chess piece placement]
Every scar became a **signal**.

[0:16 - 0:20] [Deep sub-bass drop]
He did not just survive the city.

[0:20 - 0:22] [Digital activation chime]
He **decoded** it.

[0:22 - 0:30] [Soundtrack theme swell]
This is **ICYFLAMZE CORE**. Street wisdom. Scientific mind. Futuristic soul."`)
    .replace(/\{\{DELIVERY_DIRECTION\}\}/g, "Deliver with a calm, strategic cadence, making noticeable pauses on transition beats to emphasize the scientific terminology.")
    .replace(/\{\{PACING\}\}/g, "Start slowly, allowing the sound design cues (lighter flicks) to stand out, then build rhythm as synth patterns enter, ending with a cold, direct tone.")
    .replace(/\{\{EMPHASIS_MARKS\}\}/g, "Highlight keywords: pressure, prison, professor, data, strategy, signal, decoded, core.")
    .replace(/\{\{ALTERNATE_VERSION\}\}/g, 
`"They saw the concrete walls. I saw a database mainframe.
They thought the city was noise; I calculated the frequency.
Striking the gold flame, waking the blue core.
This is the rise of the Street Scholar."`);

  const destPath = path.join(scriptsDir, `episode_1_30_second_voiceover_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ 30-Second Voiceover generated: outputs/icyflamze_core/episode_1/scripts/episode_1_30_second_voiceover_${dateStr}.md`);
  writeLog(`Generated 30s Voiceover at ${destPath}`);
}

// 3. teaser command
function handleTeaser(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'voiceover-template.md'); // We can re-use the same since it is generic, or customize it
  // Let's create content directly based on teaser script specs:
  const content = `# Teaser Details: Episode 1 Teaser (15-Second)

- **15-Second Teaser Script:**
  "[0:00 - 0:03] [Lighter clicks twice in slow-motion]
  Narration (Calm, strategic): They thought pressure was a cage.
  
  [0:03 - 0:06] [Sound of fire ignition]
  Narration: For us, it was the classroom.
  
  [0:06 - 0:10] [Deep sub-bass swell]
  Narration: Striking the fire. Initiating the core.
  
  [0:10 - 0:15] [Soundtrack stabs enter, screen fades to Title Card]
  Visual: Title Card: ICYFLAMZE CORE — Rise of the Street Scholar
  Narration: Rise of the Street Scholar."

- **Visual Beats:** Close shot of gold lighter striking, casting neon-blue code reflections across cybernetic glasses, transitioning to a clean black-gold-blue title card graphics layout.
- **Title Card:** ICYFLAMZE CORE — Rise of the Street Scholar.
- **Short Caption:** Pressure isn't a cage. It's the classroom. Episode 1: The Core Wakes coming soon. #StreetScholarFuturism
- **Hook Line:** They thought pressure was a cage. For us, it was the classroom.
`;

  const destPath = path.join(scriptsDir, `episode_1_15_second_teaser_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ 15-Second Teaser generated: outputs/icyflamze_core/episode_1/scripts/episode_1_15_second_teaser_${dateStr}.md`);
  writeLog(`Generated 15s Teaser at ${destPath}`);
}

// 4. shot-list command
function handleShotList(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'shot-list-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    // Shot 1
    .replace(/\{\{SHOT_1_DURATION\}\}/g, "3.0s")
    .replace(/\{\{SHOT_1_VISUAL\}\}/g, "Extreme macro close-up of Icyflamze's eyes behind cybernetic glasses.")
    .replace(/\{\{SHOT_1_CAMERA\}\}/g, "Macro close-up, slowly zooming into the pupil.")
    .replace(/\{\{SHOT_1_LIGHTING\}\}/g, "Chiascuro darkness, with glowing neon-blue and gold terminal diagnostics reflecting off the lenses.")
    .replace(/\{\{SHOT_1_SYMBOL\}\}/g, "AI panels, blue-gold flame.")
    .replace(/\{\{SHOT_1_VOICEOVER\}\}/g, "\"They thought he was just another voice from the pressure.\"")
    .replace(/\{\{SHOT_1_SOUND\}\}/g, "Low mechanical hum, deep sub-bass heartbeat pulse.")
    .replace(/\{\{SHOT_1_PROMPT_SEED\}\}/g, "Macro close up shot of eyes behind cybernetic spectacles, glowing neon-blue and gold terminal readouts reflecting off the lenses, detailed cinematic anime style.")
    
    // Shot 2
    .replace(/\{\{SHOT_2_DURATION\}\}/g, "3.5s")
    .replace(/\{\{SHOT_2_VISUAL\}\}/g, "Skyscrapers and streets below flicker like circuit board conduits.")
    .replace(/\{\{SHOT_2_CAMERA\}\}/g, "High-angle overhead crane shot panning across skyline.")
    .replace(/\{\{SHOT_2_LIGHTING\}\}/g, "Stormy night city skyline, gold office windows flickering in algorithms.")
    .replace(/\{\{SHOT_2_SYMBOL\}\}/g, "Chessboard city, city pressure.")
    .replace(/\{\{SHOT_2_VOICEOVER\}\}/g, "\"But pressure was never his prison.\"")
    .replace(/\{\{SHOT_2_SOUND\}\}/g, "Distant rain, digital sound of electricity crackling.")
    .replace(/\{\{SHOT_2_PROMPT_SEED\}\}/g, "Overhead wide panoramic shot of a neon-lit cyberpunk cityscape mapping like a grid-patterned circuit board, gold and black atmosphere, rainy streets reflecting lights, 3D anime.")
    
    // Shot 3
    .replace(/\{\{SHOT_3_DURATION\}\}/g, "4.0s")
    .replace(/\{\{SHOT_3_VISUAL\}\}/g, "A matte gold lighter struck in slow motion, throwing a bright spark.")
    .replace(/\{\{SHOT_3_CAMERA\}\}/g, "Slow-motion macro tracking shot from the side.")
    .replace(/\{\{SHOT_3_LIGHTING\}\}/g, "Pitch black darkness lit instantly by gold spark bursts turning into a blue core flame.")
    .replace(/\{\{SHOT_3_SYMBOL\}\}/g, "Mr. 2 Lighter, blue-gold flame.")
    .replace(/\{\{SHOT_3_VOICEOVER\}\}/g, "\"It was his professor.\"")
    .replace(/\{\{SHOT_3_SOUND\}\}/g, "Metallic lighter strike click, slow-motion fire ignition whoosh.")
    .replace(/\{\{SHOT_3_PROMPT_SEED\}\}/g, "Close up slow motion shot of a metallic gold lighter being struck, sparks flying, igniting a blue-gold flame in pitch black darkness, cinematic high-contrast lighting, anime.")
    
    // Shot 4
    .replace(/\{\{SHOT_4_DURATION\}\}/g, "3.5s")
    .replace(/\{\{SHOT_4_VISUAL\}\}/g, "Glowing blue lyrics float around a studio microphone like math equations.")
    .replace(/\{\{SHOT_4_CAMERA\}\}/g, "Dynamic tracking shot floating through holographic symbols.")
    .replace(/\{\{SHOT_4_LIGHTING\}\}/g, "Glow from floating text casting blue highlights in the dark booth.")
    .replace(/\{\{SHOT_4_SYMBOL\}\}/g, "Formulas, soundwaves.")
    .replace(/\{\{SHOT_4_VOICEOVER\}\}/g, "\"Every loss became data. Every silence became strategy.\"")
    .replace(/\{\{SHOT_4_SOUND\}\}/g, "Crisp monospace keyboard clacks syncing to letters.")
    .replace(/\{\{SHOT_4_PROMPT_SEED\}\}/g, "A dark recording studio booth where glowing neon-blue holographic lyric lines and math formulas float in the air like code equations, cinematic anime, high-end design.")
    
    // Shot 5
    .replace(/\{\{SHOT_5_DURATION\}\}/g, "3.0s")
    .replace(/\{\{SHOT_5_VISUAL\}\}/g, "A metallic gold chess king placed on a chalk chessboard grid on cracked concrete.")
    .replace(/\{\{SHOT_5_CAMERA\}\}/g, "Low-angle tilt looking up from the asphalt.")
    .replace(/\{\{SHOT_5_LIGHTING\}\}/g, "Rain-slicked pavement reflecting gold streetlights and neon-blue signs.")
    .replace(/\{\{SHOT_5_SYMBOL\}\}/g, "Chess king, chessboard city.")
    .replace(/\{\{SHOT_5_VOICEOVER\}\}/g, "\"Every scar became a signal.\"")
    .replace(/\{\{SHOT_5_SOUND\}\}/g, "Heavy metallic thud of a chess piece placement.")
    .replace(/\{\{SHOT_5_PROMPT_SEED\}\}/g, "Low angle close up of a metallic gold chess king placed on a chalk-drawn chessboard grid on wet, cracked concrete asphalt, neon blue rain reflections, anime style.")
    
    // Shot 6
    .replace(/\{\{SHOT_6_DURATION\}\}/g, "4.5s")
    .replace(/\{\{SHOT_6_VISUAL\}\}/g, "Leather-bound books, soundwave graphs, and holographic AI screens orbit around Icyflamze.")
    .replace(/\{\{SHOT_6_CAMERA\}\}/g, "360-degree rotational movement around the character.")
    .replace(/\{\{SHOT_6_LIGHTING\}\}/g, "Bright gold rays from books contrast against neon-blue interface grids.")
    .replace(/\{\{SHOT_6_SYMBOL\}\}/g, "Books, AI panels, soundwaves.")
    .replace(/\{\{SHOT_6_VOICEOVER\}\}/g, "\"He did not just survive the city.\"")
    .replace(/\{\{SHOT_6_SOUND\}\}/g, "Rising synthesizer sweep, digital modular notes.")
    .replace(/\{\{SHOT_6_PROMPT_SEED\}\}/g, "3D anime shot of a strategic founder surrounded by orbiting leather-bound books, glowing soundwave graphics, and floating transparent terminal screens, gold and neon-blue.")
    
    // Shot 7
    .replace(/\{\{SHOT_7_DURATION\}\}/g, "4.0s")
    .replace(/\{\{SHOT_7_VISUAL\}\}/g, "Icyflamze sits calm, hands clasped, in a matte black coat on a server-rack throne.")
    .replace(/\{\{SHOT_7_CAMERA\}\}/g, "Slow dolly zoom push-in.")
    .replace(/\{\{SHOT_7_LIGHTING\}\}/g, "Key highlight on side of face, backlighting casting a golden throne shadow.")
    .replace(/\{\{SHOT_7_SYMBOL\}\}/g, "Crown, throne, calm founder energy.")
    .replace(/\{\{SHOT_7_VOICEOVER\}\}/g, "\"He decoded it.\"")
    .replace(/\{\{SHOT_7_SOUND\}\}/g, "Digital activation chime, deep sub-bass impact drop.")
    .replace(/\{\{SHOT_7_PROMPT_SEED\}\}/g, "Cinematic hero shot of a calm hip-hop artist-founder in a black matte coat, hands clasped, sitting on a high-tech gold-accented throne overlooking server racks, anime style.")
    
    // Shot 8
    .replace(/\{\{SHOT_8_DURATION\}\}/g, "4.5s")
    .replace(/\{\{SHOT_8_VISUAL\}\}/g, "Closing Title Card: ICYFLAMZE CORE — Rise of the Street Scholar.")
    .replace(/\{\{SHOT_8_CAMERA\}\}/g, "Static graphics frame.")
    .replace(/\{\{SHOT_8_LIGHTING\}\}/g, "Gold foiled letters on matte black background with neon-blue grid lines.")
    .replace(/\{\{SHOT_8_SYMBOL\}\}/g, "Crown, formulas.")
    .replace(/\{\{SHOT_8_VOICEOVER\}\}/g, "\"This is ICYFLAMZE CORE. Street wisdom. Scientific mind. Futuristic soul.\"")
    .replace(/\{\{SHOT_8_SOUND\}\}/g, "Final sub-bass swell fading into a monospace terminal heartbeat loop.")
    .replace(/\{\{SHOT_8_PROMPT_SEED\}\}/g, "Title card text reading 'ICYFLAMZE CORE - Rise of the Street Scholar', gold gilded lettering, neon-blue gridlines on black background, clean minimalist premium design.");

  const destPath = path.join(shotListsDir, `episode_1_trailer_shot_list_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Trailer shot list generated: outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_${dateStr}.md`);
  writeLog(`Generated Shot list at ${destPath}`);
}

// 5. image-prompts command
function handleImagePrompts(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'image-prompt-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    // Hero Poster
    .replace(/\{\{HERO_PROMPT\}\}/g, "A strategic artist-founder in matte black technical coat with gold engravings, cybernetic glasses displaying code readouts, standing on server grid, detailed anime.")
    .replace(/\{\{HERO_NEG_PROMPT\}\}/g, "Superheroes, space helmets, tribal prints, fantasy elements, goofiness, low quality.")
    .replace(/\{\{HERO_AR\}\}/g, "9:16")
    .replace(/\{\{HERO_STYLE\}\}/g, "Cinematic 2.5D anime, chiascuro lighting.")
    .replace(/\{\{HERO_CONTINUITY\}\}/g, "Subject wardrobe is matte black coat, gold accents, neon-blue interior lining.")
    
    // Eyes close-up
    .replace(/\{\{EYES_PROMPT\}\}/g, "Extreme macro close-up of eyes behind cyber spectacles, neon-blue and gold diagnostic terminal codes reflecting on the lenses, gritty anime.")
    .replace(/\{\{EYES_NEG_PROMPT\}\}/g, "Unreal graphics, spacesuits, raw 3D, blur.")
    .replace(/\{\{EYES_AR\}\}/g, "16:9")
    .replace(/\{\{EYES_STYLE\}\}/g, "High contrast, detailed iris, clean digital diagnostics overlays.")
    .replace(/\{\{EYES_CONTINUITY\}\}/g, "Diagnostic lines are cyan-blue and gold only.")
    
    // Lighter spark
    .replace(/\{\{LIGHTER_PROMPT\}\}/g, "A matte gold lighter striking in pitch black darkness, detailed slow-motion sparks, igniting a blue-gold flame, high contrast, anime.")
    .replace(/\{\{LIGHTER_NEG_PROMPT\}\}/g, "Daylight, normal flames, cartoonish drawing.")
    .replace(/\{\{LIGHTER_AR\}\}/g, "16:9")
    .replace(/\{\{LIGHTER_STYLE\}\}/g, "Chiascuro, detailed metal texture, particle effects.")
    .replace(/\{\{LIGHTER_CONTINUITY\}\}/g, "Lighter is metallic gold with custom strategic chess grid engravings.")
    
    // Chessboard city
    .replace(/\{\{CHESSBOARD_PROMPT\}\}/g, "Overhead wide pan view of a neon cyberpunk city streets mapping like a circuit board grid, gold and blue illumination, wet asphalt reflections, anime.")
    .replace(/\{\{CHESSBOARD_NEG_PROMPT\}\}/g, "Spaceships, generic fantasy, daytime, bright sun.")
    .replace(/\{\{CHESSBOARD_AR\}\}/g, "16:9")
    .replace(/\{\{CHESSBOARD_STYLE\}\}/g, "Gritty 2.5D anime, detailed cityscape grids.")
    .replace(/\{\{CHESSBOARD_CONTINUITY\}\}/g, "City features street lights (gold) and digital grids (blue) only.")
    
    // Lyrics as equations
    .replace(/\{\{LYRICS_PROMPT\}\}/g, "Inside a dark recording studio booth, glowing neon-blue holographic lyric lines and math formulas float in the air like code equations, anime.")
    .replace(/\{\{LYRICS_NEG_PROMPT\}\}/g, "Bright lights, standard instruments, generic vocals.")
    .replace(/\{\{LYRICS_AR\}\}/g, "16:9")
    .replace(/\{\{LYRICS_STYLE\}\}/g, "Monospace text overlay, high contrast.")
    .replace(/\{\{LYRICS_CONTINUITY\}\}/g, "Floating equations use monospace font characters.")
    
    // Books & AI panels
    .replace(/\{\{BOOKS_AI_PROMPT\}\}/g, "Detailed anime shot of leather-bound books, soundwave graphs, and floating transparent terminal screens orbiting around a calm figure in black tactical coat, gold highlights.")
    .replace(/\{\{BOOKS_AI_NEG_PROMPT\}\}/g, "Superpowers, magic circles, generic spaceship dashboards.")
    .replace(/\{\{BOOKS_AI_AR\}\}/g, "16:9")
    .replace(/\{\{BOOKS_AI_STYLE\}\}/g, "3D anime, high-end styling.")
    .replace(/\{\{BOOKS_AI_CONTINUITY\}\}/g, "Books are antique brown leather, AI screens are neon blue.")
    
    // Title card
    .replace(/\{\{TITLE_PROMPT\}\}/g, "Typography design reading 'ICYFLAMZE CORE - Rise of the Street Scholar', gold foil lettering, neon-blue gridlines on black background, clean minimalist premium design.")
    .replace(/\{\{TITLE_NEG_PROMPT\}\}/g, "Goofy fonts, standard 3D text effects, extra icons.")
    .replace(/\{\{TITLE_AR\}\}/g, "16:9")
    .replace(/\{\{TITLE_STYLE\}\}/g, "Minimalist vector layout, flat graphic design.")
    .replace(/\{\{TITLE_CONTINUITY\}\}/g, "Font style is clean sans-serif for main titles and monospace for tech details.")
    
    // Cover art
    .replace(/\{\{COVER_PROMPT\}\}/g, "High-contrast cover art featuring a strategic artist-founder seated on server throne, hands clasped, black matte coat, gold details, neon-blue grid lines background, anime.")
    .replace(/\{\{COVER_NEG_PROMPT\}\}/g, "Goofiness, standard cartoon prints, spaceships, tribal masks.")
    .replace(/\{\{COVER_AR\}\}/g, "1:1")
    .replace(/\{\{COVER_STYLE\}\}/g, "Cinematic 2.5D anime, premium album cover design.")
    .replace(/\{\{COVER_CONTINUITY\}\}/g, "Throne shadow forms a stylized crown shape.");

  const destPath = path.join(imagePromptsDir, `episode_1_image_prompt_pack_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Image prompts pack generated: outputs/icyflamze_core/episode_1/image_prompts/episode_1_image_prompt_pack_${dateStr}.md`);
  writeLog(`Generated Image prompts pack at ${destPath}`);
}

// 6. animation-prompts command
function handleAnimationPrompts(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'animation-prompt-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    // Sora
    .replace(/\{\{SORA_SCENE\}\}/g, "Slow dolly zoom shot of a strategic founder in a matte black coat, hands clasped, sitting on a high-tech gold-accented server throne.")
    .replace(/\{\{SORA_CAMERA\}\}/g, "Dolly zoom push-in.")
    .replace(/\{\{SORA_MOTION\}\}/g, "Extremely slow breathing, subtle ambient dust particles floating through server cooling fans.")
    .replace(/\{\{SORA_LIGHTING\}\}/g, "High-contrast side keys, server nodes pulsing neon-blue and gold light rays.")
    .replace(/\{\{SORA_MOOD\}\}/g, "Calm, epic, legacy-driven.")
    .replace(/\{\{SORA_CONTINUITY\}\}/g, "Black matte coat with gold engravings, cyber spectacles.")
    .replace(/\{\{SORA_DURATION\}\}/g, "4.0 seconds")
    .replace(/\{\{SORA_DO_NOT_USE\}\}/g, "No fast camera movements, no facial distortion, no random background walking.")
    
    // Veo
    .replace(/\{\{VEO_SCENE\}\}/g, "Overhead wide pan view of wet street blocks looking like a chessboard grid under stormy night skies, cars moving like chess pieces.")
    .replace(/\{\{VEO_CAMERA\}\}/g, "Crane panning shot.")
    .replace(/\{\{VEO_MOTION\}\}/g, "Rain falling, vehicle lights leaving long shutter drags.")
    .replace(/\{\{VEO_LIGHTING\}\}/g, "Reflections of neon-blue and gold street ads on rain-slicked asphalt.")
    .replace(/\{\{VEO_MOOD\}\}/g, "Cerebral, tense, systematic.")
    .replace(/\{\{VEO_CONTINUITY\}\}/g, "Grid mapping matches local city architecture.")
    .replace(/\{\{VEO_DURATION\}\}/g, "3.5 seconds")
    .replace(/\{\{VEO_DO_NOT_USE\}\}/g, "No day scenes, no spaceships, no hyper-speed camera sweeps.")
    
    // Runway
    .replace(/\{\{RUNWAY_SCENE\}\}/g, "Macro slow motion shot of a gold-plated lighter striking, sparking sparks that transform into a steady blue-gold core flame.")
    .replace(/\{\{RUNWAY_CAMERA\}\}/g, "Macro slider tracking shot.")
    .replace(/\{\{RUNWAY_MOTION\}\}/g, "Sparks popping outward, flame rising cleanly.")
    .replace(/\{\{RUNWAY_LIGHTING\}\}/g, "Chiascuro, deep shadow background with flame illumination.")
    .replace(/\{\{RUNWAY_MOOD\}\}/g, "Tactical, detailed, survivalist.")
    .replace(/\{\{RUNWAY_CONTINUITY\}\}/g, "Lighter details match static cover art references.")
    .replace(/\{\{RUNWAY_DURATION\}\}/g, "4.0 seconds")
    .replace(/\{\{RUNWAY_DO_NOT_USE\}\}/g, "No hand shaking, no standard yellow lighter prints.")
    
    // Pika
    .replace(/\{\{PIKA_SCENE\}\}/g, "Floating holographic code lines and soundwaves orbiting a microphone booth in a dark studio booth.")
    .replace(/\{\{PIKA_CAMERA\}\}/g, "Parallax rotation.")
    .replace(/\{\{PIKA_MOTION\}\}/g, "Flowing soundwave ripples, code compiling line-by-line.")
    .replace(/\{\{PIKA_LIGHTING\}\}/g, "Neon-blue casting reflections on acoustic padding.")
    .replace(/\{\{PIKA_MOOD\}\}/g, "Scientific, musical, clean.")
    .replace(/\{\{PIKA_CONTINUITY\}\}/g, "Monospace styling on text overlays.")
    .replace(/\{\{PIKA_DURATION\}\}/g, "3.5 seconds")
    .replace(/\{\{PIKA_DO_NOT_USE\}\}/g, "No live musicians in frame, no cartoonish music notes.")
    
    // Kling
    .replace(/\{\{KLING_SCENE\}\}/g, "Macro close up zoom of cyber spectacles, transparent neon-blue diagnostics and Chessboard city map compiling on the glass lenses.")
    .replace(/\{\{KLING_CAMERA\}\}/g, "Extreme macro zoom.")
    .replace(/\{\{KLING_MOTION\}\}/g, "Blinking indicators, map lines drawing.")
    .replace(/\{\{KLING_LIGHTING\}\}/g, "Glow highlights on eyes behind the spectacles.")
    .replace(/\{\{KLING_MOOD\}\}/g, "Strategic, calculated.")
    .replace(/\{\{KLING_CONTINUITY\}\}/g, "Spectacle frames are gold engraved.")
    .replace(/\{\{KLING_DURATION\}\}/g, "3.0 seconds")
    .replace(/\{\{KLING_DO_NOT_USE\}\}/g, "No standard glasses, no goofy color maps.");

  const destPath = path.join(animPromptsDir, `episode_1_animation_prompt_pack_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Animation prompts pack generated: outputs/icyflamze_core/episode_1/animation_prompts/episode_1_animation_prompt_pack_${dateStr}.md`);
  writeLog(`Generated Animation prompts pack at ${destPath}`);
}

// 7. audio-direction command
function handleAudioDirection(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'audio-direction-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    .replace(/\{\{VOICE_TYPE\}\}/g, "Calm, resonant, low-register male baritone with deep strategic timbre.")
    .replace(/\{\{DELIVERY_TONE\}\}/g, "Poetic, street-smart, philosophical, calm but powerful, founder-minded.")
    .replace(/\{\{PACING\}\}/g, "Measured, deliberate. Approximately 110 words per minute. Notable pauses on sound effect marks.")
    .replace(/\{\{MUSIC_BED\}\}/g, "Cerebral synth pads, low monospace hum, followed by a heavy, slow boom-bap rhythm (80 BPM) with bass-boosted sub drops.")
    .replace(/\{\{RISERS\}\}/g, "Digital filter sweeps rising slowly from 0:10 to 0:18.")
    .replace(/\{\{IMPACT_HITS\}\}/g, "Deep sub-bass drop at 0:16 (corresponds to 'decoded'). Heavy metallic thuds at chess piece cues.")
    .replace(/\{\{TITLE_REVEAL\}\}/g, "An analog synthesizer chord with digital terminal heartbeat loop.")
    .replace(/\{\{OUTRO_SOUND\}\}/g, "Fading boom-bap percussion layers down to a simple monospace keyboard click sound.")
    .replace(/\{\{PIPER_NOTES\}\}/g, "Configure voice engine using standard model 'en_US-danny-low' at speed 0.95 for optimal baritone depth.")
    .replace(/\{\{ELEVENLABS_SETTINGS\}\}/g, "Use 'Marcus' or custom strategic voice model with stability set to 80% and clarity set to 90% to avoid theatrical swings.");

  const destPath = path.join(audioDir, `episode_1_audio_direction_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Audio direction guide generated: outputs/icyflamze_core/episode_1/audio/episode_1_audio_direction_${dateStr}.md`);
  writeLog(`Generated Audio direction at ${destPath}`);
}

// 8. cover-art command
function handleCoverArt(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'cover-art-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{COVER_TITLE\}\}/g, "The Core Wakes")
    .replace(/\{\{VISUAL_CONCEPT\}\}/g, "Icyflamze seated on server throne, hands clasped, black matte coat, gold details, neon-blue grid lines background.")
    .replace(/\{\{SUBJECT_POSE\}\}/g, "Seated, calm founder posture, looking directly forward.")
    .replace(/\{\{WARDROBE\}\}/g, "Matte black tactical coat, gold zippers, subtle neon-blue lining showing at cuffs.")
    .replace(/\{\{BACKGROUND\}\}/g, "Industrial server racks with blue LED indicators, floor mapping out as a gold chessboard grid.")
    .replace(/\{\{SYMBOLS\}\}/g, "Chess king shadow behind throne forming a crown, gold lighter on pedestal next to seat.")
    .replace(/\{\{COLOR_PALETTE\}\}/g, "Matte black (#0A0A0A), gold (#D4AF37), neon-blue (#00E5FF).")
    .replace(/\{\{TYPOGRAPHY\}\}/g, "- Title: Gilded sans-serif (Outfit/Inter style).\n- Metadata: Small Monospace text in corners.")
    .replace(/\{\{IMAGE_PROMPT\}\}/g, "Premium cover art featuring strategic artist-founder seated on server throne, hands clasped, black matte coat, gold details, neon-blue grid lines background, detailed anime.")
    .replace(/\{\{NEGATIVE_PROMPT\}\}/g, "Low-quality drawings, standard cartoon prints, spacesuits, tribal marks, superheroes.")
    .replace(/\{\{CROP_NOTES\}\}/g, "- Spotify/Apple Music: 1:1 square crop centered on the figure.\n- YouTube/Social banners: 16:9 cropping showing server racks on side margins.");

  const destPath = path.join(coverArtDir, `episode_1_cover_art_direction_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Cover art direction guide generated: outputs/icyflamze_core/episode_1/cover_art/episode_1_cover_art_direction_${dateStr}.md`);
  writeLog(`Generated Cover art direction at ${destPath}`);
}

// 9. captions command
function handleCaptions(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'caption-pack-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    .replace(/\{\{TIKTOK_CAPTIONS\}\}/g, 
`1. "Pressure isn't a prison. It's the classroom. Episode 1 - The Core Wakes is out. ⚡ #StreetScholarFuturism"
2. "Every loss became data. Every silence became strategy. Waking the core. 🧬"
3. "They play checkers, we map the chessboard city. Strike the spark. 🔥"
4. "The street wisdom is computed. Mainframe online. 🖥️"
5. "Calm energy, strategic moves. Welcome to the core. 👑"`)
    .replace(/\{\{INSTAGRAM_CAPTIONS\}\}/g, 
`1. "They thought he was just another voice from the pressure. But pressure was never his prison. It was his professor. Episode 1: The Core Wakes is live. Link in bio. ⛓️🧬"
2. "Every scar became a signal. Strategic thinking meets street intelligence. Rise of the Street Scholar. 📚🔥"
3. "I build before burning. Mr. 2 Lighter struck. Mainframe active. 🌐"
4. "The asphalt is a library if you know how to read the cracks. Calculated bars only. 🎼🧮"
5. "Tree Groove Records presents: The Core Wakes. Streaming now. 🎧"`)
    .replace(/\{\{YOUTUBE_SHORTS\}\}/g, 
`1. "They play checkers, we map the chessboard city. ♟️"
2. "Pressure was his professor. 📚"
3. "Striking the gold, waking the blue. 🔥"
4. "How a street scholar decodes the city. 🧠"
5. "The Core Wakes — Episode 1 Trailer. 🎬"`)
    .replace(/\{\{FACEBOOK_CAPTIONS\}\}/g, 
`1. "They thought he was just another voice from the pressure. But pressure was never his prison. It was his professor. Episode 1 - The Core Wakes represents the start of the Street Scholar Futurist universe. Stream the soundtrack now under Tree Groove Records."
2. "Calculated music, structured legacy. Watch Icyflamze map the chessboard city."
3. "The Brilliantier Protocol is deployed. Automating independent label distribution."
4. "I build before burning. No shortcuts, just system architecture."
5. "Check out the official trailer for ICYFLAMZE CORE Season 1."`)
    .replace(/\{\{WHATSAPP_STATUS\}\}/g, 
`1. "Pressure was his professor. Episode 1 live. ⚡"
2. "Decoding the city, one block at a time. ♟️"
3. "Strike the spark. Waking the core. 🔥"
4. "Tree Groove Records active. 🎼"
5. "Street wisdom. Scientific mind. Futuristic soul. 🧠"`)
    .replace(/\{\{HASHTAGS\}\}/g, "#Icyflamze #ICYFLAMZECORE #StreetScholarFuturism #RiseOfTheStreetScholar #TheCoreWakes #TreeGrooveRecords #BrilliantaireOS #CreativeIP #MusicTech #AnimeVisuals #AIWorkflow #HipHopMythology #TrailerProduction")
    .replace(/\{\{CTA_OPTIONS\}\}/g, "- Search 'ICYFLAMZE CORE' on Spotify/Apple Music\n- Click link in bio to watch full episode on YouTube\n- Run 'npm run command' to explore codebase");

  const destPath = path.join(captionsDir, `episode_1_caption_pack_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Caption pack generated: outputs/icyflamze_core/episode_1/captions/episode_1_caption_pack_${dateStr}.md`);
  writeLog(`Generated Caption pack at ${destPath}`);
}

// 10. rollout command
function handleRollout(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'rollout-checklist-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    .replace(/\{\{PRE_LAUNCH\}\}/g, 
`- [ ] Finalize trailer video cut and export (1080p, 9:16 & 16:9).
- [ ] Verify audio track master level matches streaming standards (-14 LUFS).
- [ ] Pre-save campaign activation on DSPs via Tree Groove Records link.
- [ ] Stage all caption packs and copy assets to mobile devices.`)
    .replace(/\{\{LAUNCH_DAY\}\}/g, 
`- [ ] Publish 30-second trailer on YouTube (16:9) and Link in Bio.
- [ ] Publish 15-second teaser on TikTok & Instagram Reels (9:16).
- [ ] Share Spotify/Apple Music link on WhatsApp Status & Twitter.
- [ ] Log launch confirmation telemetry notes in Obsidian staging folder.`)
    .replace(/\{\{POST_LAUNCH\}\}/g, 
`- [ ] Review daily streaming analytics and audience interaction metrics.
- [ ] Update projects matrix next actions for Episode 2.
- [ ] Archive launch logs and verify repository status.`)
    .replace(/\{\{THREE_POST_STRUCTURE\}\}/g, 
`- **Post 1 (Teaser):** Lighter click visual, hook line, date announcement.
- **Post 2 (Main Video):** Complete 30-second trailer featuring high-contrast animation and voiceover script.
- **Post 3 (Breakdown):** Technical carousel slide showing the formulas and chess symbols mapping rules.`)
    .replace(/\{\{PLATFORM_CHECKLISTS\}\}/g, 
`- **YouTube:** Complete tags, add closed captions, add end screens to Spotify link.
- **TikTok:** Select trending tactical background sound, insert hashtags, crop centered.`)
    .replace(/\{\{MANUAL_POSTING\}\}/g, "Use official mobile terminals to post assets manually to bypass automated security blocks. Archive links in `outputs/icyflamze_core/reports/`.")
    .replace(/\{\{METRICS_TO_WATCH\}\}/g, 
`- YouTube views & retention rate (Target: 70%+ on 30s trailer).
- TikTok click-through-rate on streaming links (Target: 5%+).
- Spotify streams & playlist adds during first 48 hours.`)
    .replace(/\{\{NEXT_ACTION\}\}/g, "Queue Phase 14D: Episode 1 Trailer Rendering and Assembly");

  const destPath = path.join(rolloutDir, `episode_1_rollout_checklist_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Rollout checklist generated: outputs/icyflamze_core/episode_1/rollout/episode_1_rollout_checklist_${dateStr}.md`);
  writeLog(`Generated Rollout checklist at ${destPath}`);
}

// 11. obsidian-stage command
function handleObsidianStage(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'obsidian-stage-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    .replace(/\{\{ALIASES\}\}/g, "\"The Core Wakes\", \"Episode 1 Trailer Package\"")
    .replace(/\{\{UNIVERSE_DIRECTION\}\}/g, config.UNIVERSE_DIRECTION)
    .replace(/\{\{EPISODE_NUMBER\}\}/g, String(config.EPISODE_NUMBER))
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{EPISODE_THEME\}\}/g, config.EPISODE_THEME)
    .replace(/\{\{EPISODE_PURPOSE\}\}/g, config.EPISODE_PURPOSE)
    .replace(/\{\{TRAILER_SCRIPT\}\}/g, 
`They thought he was just another voice from the pressure. But pressure was never his prison. It was his professor.
Every loss became data. Every silence became strategy. Every scar became a signal.
He did not just survive the city. He decoded it.`)
    .replace(/\{\{FINAL_VOICEOVER\}\}/g, "30-second final narration text staged at outputs/icyflamze_core/episode_1/scripts/episode_1_30_second_voiceover_2026-07-02.md.")
    .replace(/\{\{TEASER_SCRIPT\}\}/g, "15-second teaser text staged at outputs/icyflamze_core/episode_1/scripts/episode_1_15_second_teaser_2026-07-02.md.")
    .replace(/\{\{SHOT_LIST_SUMMARY\}\}/g, "- Shot 1: Eyes closeup\n- Shot 2: City skyline grid\n- Shot 3: Lighter ignition\n- Shot 4: Flying lyrics/formulas\n- Shot 5: Gold chess king\n- Shot 6: Orbiting books/panels\n- Shot 7: Hero on throne\n- Shot 8: Title Card")
    .replace(/\{\{COVER_ART_DIRECTION\}\}/g, "Cover Concept: Icyflamze seated on server throne, hands clasped, black coat, gold accents. Palette: Black, gold, neon-blue.")
    .replace(/\{\{CAPTION_PACK\}\}/g, "Platform captions configured for TikTok, Instagram, YouTube, Facebook, and WhatsApp.")
    .replace(/\{\{ROLLOUT_CHECKLIST\}\}/g, "Checklists structured for pre-launch prep, launch day, and post-launch analytics.")
    .replace(/\{\{NEXT_ACTIONS\}\}/g, 
`- [ ] Build Episode 1 Trailer Package\n- [ ] Generate trailer script\n- [ ] Generate 30-second voiceover\n- [ ] Generate 15-second teaser\n- [ ] Generate shot list\n- [ ] Generate image prompt pack\n- [ ] Generate animation prompt pack\n- [ ] Generate audio direction\n- [ ] Generate cover art direction\n- [ ] Generate caption pack\n- [ ] Generate rollout checklist\n- [ ] Stage Episode 1 Obsidian note\n- [ ] Prepare manual image/video generation`);

  const destPath = path.join(stagingDir, `ICYFLAMZE_CORE_EPISODE_1_OBSIDIAN_STAGE_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Obsidian staged note generated: outputs/icyflamze_core/episode_1/obsidian_staging/ICYFLAMZE_CORE_EPISODE_1_OBSIDIAN_STAGE_${dateStr}.md`);
  writeLog(`Generated Obsidian staged note at ${destPath}`);

  if (WRITE_STAGING_OUTPUT) {
    const stageDestPath = path.join(WRITE_STAGING_OUTPUT, `ICYFLAMZE_CORE_EPISODE_1_OBSIDIAN_STAGE_${dateStr}.md`);
    fs.writeFileSync(stageDestPath, content, 'utf-8');
    console.log(`✅ Staged note copied to Obsidian write-gateway: outputs/write_staging/ICYFLAMZE_CORE_EPISODE_1_OBSIDIAN_STAGE_${dateStr}.md`);
    writeLog(`Copied Obsidian staged note to write_staging folder`);
  }
}

// 12. report command
function handleReport(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'episode-package-report-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  
  const scriptRel = `outputs/icyflamze_core/episode_1/scripts/episode_1_trailer_script_${dateStr}.md`;
  const voiceoverRel = `outputs/icyflamze_core/episode_1/scripts/episode_1_30_second_voiceover_${dateStr}.md`;
  const teaserRel = `outputs/icyflamze_core/episode_1/scripts/episode_1_15_second_teaser_${dateStr}.md`;
  const shotListRel = `outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_${dateStr}.md`;
  const imagesRel = `outputs/icyflamze_core/episode_1/image_prompts/episode_1_image_prompt_pack_${dateStr}.md`;
  const animRel = `outputs/icyflamze_core/episode_1/animation_prompts/episode_1_animation_prompt_pack_${dateStr}.md`;
  const audioRel = `outputs/icyflamze_core/episode_1/audio/episode_1_audio_direction_${dateStr}.md`;
  const coverRel = `outputs/icyflamze_core/episode_1/cover_art/episode_1_cover_art_direction_${dateStr}.md`;
  const captionsRel = `outputs/icyflamze_core/episode_1/captions/episode_1_caption_pack_${dateStr}.md`;
  const rolloutRel = `outputs/icyflamze_core/episode_1/rollout/episode_1_rollout_checklist_${dateStr}.md`;
  const stageRel = `outputs/icyflamze_core/episode_1/obsidian_staging/ICYFLAMZE_CORE_EPISODE_1_OBSIDIAN_STAGE_${dateStr}.md`;

  content = content
    .replace(/\{\{REPORT_DATE\}\}/g, dateStr)
    .replace(/\{\{TRAILER_SCRIPT_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, scriptRel)) ? scriptRel : 'Not generated')
    .replace(/\{\{VOICEOVER_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, voiceoverRel)) ? voiceoverRel : 'Not generated')
    .replace(/\{\{TEASER_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, teaserRel)) ? teaserRel : 'Not generated')
    .replace(/\{\{SHOT_LIST_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, shotListRel)) ? shotListRel : 'Not generated')
    .replace(/\{\{IMAGE_PROMPTS_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, imagesRel)) ? imagesRel : 'Not generated')
    .replace(/\{\{ANIMATION_PROMPTS_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, animRel)) ? animRel : 'Not generated')
    .replace(/\{\{AUDIO_DIRECTION_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, audioRel)) ? audioRel : 'Not generated')
    .replace(/\{\{COVER_ART_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, coverRel)) ? coverRel : 'Not generated')
    .replace(/\{\{CAPTIONS_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, captionsRel)) ? captionsRel : 'Not generated')
    .replace(/\{\{ROLLOUT_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, rolloutRel)) ? rolloutRel : 'Not generated')
    .replace(/\{\{OBSIDIAN_STAGE_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, stageRel)) ? stageRel : 'Not generated')
    .replace(/\{\{DIRECT_WRITE_STATUS\}\}/g, config.ALLOW_OBSIDIAN_DIRECT_WRITE ? 'Allowed' : 'Blocked')
    .replace(/\{\{NEXT_RECOMMENDED_PHASE\}\}/g, "Phase 14D: Episode 1 Trailer Rendering and Assembly");

  const destPath = path.join(reportsDir, `episode_1_package_report_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Production package report compiled: outputs/icyflamze_core/episode_1/reports/episode_1_package_report_${dateStr}.md`);
  writeLog(`Generated Production package report at ${destPath}`);
}

// 13. status command
function handleStatus() {
  const latestScript = getLatestFile(scriptsDir, 'episode_1_trailer_script_');
  const latestVoiceover = getLatestFile(scriptsDir, 'episode_1_30_second_voiceover_');
  const latestTeaser = getLatestFile(scriptsDir, 'episode_1_15_second_teaser_');
  const latestShotList = getLatestFile(shotListsDir, 'episode_1_trailer_shot_list_');
  const latestImages = getLatestFile(imagePromptsDir, 'episode_1_image_prompt_pack_');
  const latestAnim = getLatestFile(animPromptsDir, 'episode_1_animation_prompt_pack_');
  const latestAudio = getLatestFile(audioDir, 'episode_1_audio_direction_');
  const latestCover = getLatestFile(coverArtDir, 'episode_1_cover_art_direction_');
  const latestCaptions = getLatestFile(captionsDir, 'episode_1_caption_pack_');
  const latestRollout = getLatestFile(rolloutDir, 'episode_1_rollout_checklist_');
  const latestStaged = getLatestFile(stagingDir, 'ICYFLAMZE_CORE_EPISODE_1_OBSIDIAN_STAGE_');
  const latestReport = getLatestFile(reportsDir, 'episode_1_package_report_');

  console.log("=========================================");
  console.log("📊 ICYFLAMZE CORE: Episode 1 Trailer Package Status");
  console.log("=========================================");
  console.log(`- Latest Trailer Script:     ${latestScript}`);
  console.log(`- Latest 30s Voiceover:      ${latestVoiceover}`);
  console.log(`- Latest 15s Teaser:         ${latestTeaser}`);
  console.log(`- Latest Shot List:          ${latestShotList}`);
  console.log(`- Latest Image Prompts:      ${latestImages}`);
  console.log(`- Latest Animation Prompts:  ${latestAnim}`);
  console.log(`- Latest Audio Direction:    ${latestAudio}`);
  console.log(`- Latest Cover Art:          ${latestCover}`);
  console.log(`- Latest Captions:           ${latestCaptions}`);
  console.log(`- Latest Rollout Checklist:  ${latestRollout}`);
  console.log(`- Latest Obsidian Staged:    ${latestStaged}`);
  console.log(`- Latest Report:             ${latestReport}`);
  console.log(`- Direct Obsidian Write:     ${config.ALLOW_OBSIDIAN_DIRECT_WRITE ? 'Yes' : 'No (Blocked)'}`);
  console.log(`- Next Recommended Phase:    Phase 14D: Episode 1 Trailer Rendering and Assembly`);
  console.log("=========================================");
  writeLog("Status queried");
}

function printHelp() {
  console.log("=========================================");
  console.log("🔥 ICYFLAMZE CORE EPISODE 1 PRODUCTION COMMANDS");
  console.log("=========================================");
  console.log("\nUsage: npm run icyflamze-core-episode-1 -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help              Print this list of available commands");
  console.log("  trailer-script    Generate official trailer script");
  console.log("  voiceover         Generate 30-second voiceover direction details");
  console.log("  teaser            Generate 15-second teaser script details");
  console.log("  shot-list         Generate scene-by-scene cinematography shot list");
  console.log("  image-prompts     Generate image prompts pack");
  console.log("  animation-prompts Generate Sora/Veo/Runway animation prompts pack");
  console.log("  audio-direction   Generate audio and sound design direction details");
  console.log("  cover-art         Generate single/cover art design direction");
  console.log("  captions          Generate social platform captions pack");
  console.log("  rollout           Generate launch rollout checklist");
  console.log("  obsidian-stage    Generate Obsidian staged note in write_staging");
  console.log("  report            Compile production package report details");
  console.log("  status            Print latest compiled files and status states");
  console.log("=========================================");
}

const command = process.argv[2]?.trim().toLowerCase();

try {
  const dateStr = getFormattedDate();
  switch (command) {
    case 'trailer-script':
      handleTrailerScript(dateStr);
      break;
    case 'voiceover':
      handleVoiceover(dateStr);
      break;
    case 'teaser':
      handleTeaser(dateStr);
      break;
    case 'shot-list':
      handleShotList(dateStr);
      break;
    case 'image-prompts':
      handleImagePrompts(dateStr);
      break;
    case 'animation-prompts':
      handleAnimationPrompts(dateStr);
      break;
    case 'audio-direction':
      handleAudioDirection(dateStr);
      break;
    case 'cover-art':
      handleCoverArt(dateStr);
      break;
    case 'captions':
      handleCaptions(dateStr);
      break;
    case 'rollout':
      handleRollout(dateStr);
      break;
    case 'obsidian-stage':
      handleObsidianStage(dateStr);
      break;
    case 'report':
      handleReport(dateStr);
      break;
    case 'status':
      handleStatus();
      break;
    case 'help':
    case undefined:
      printHelp();
      break;
    default:
      console.error(`❌ Unknown command: "${command}"`);
      console.log("💡 Run 'npm run icyflamze-core-episode-1-help' to see available commands.");
      writeLog(`Attempted unknown command: ${command}`);
      process.exit(1);
  }
} catch (error: any) {
  console.error(`❌ Action failed: ${error.message}`);
  writeLog(`Error: ${error.message}`);
  process.exit(1);
}
