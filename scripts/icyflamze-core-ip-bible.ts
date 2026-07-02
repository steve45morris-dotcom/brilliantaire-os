import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as config from '../config/icyflamze-core-ip-bible.js';
import { REPO_ROOT, WRITE_STAGING_OUTPUT } from '../config/paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDirBase = path.join(REPO_ROOT, 'outputs', 'icyflamze_core', 'ip_bible');
const docsDir = path.join(outDirBase, 'documents');
const episodesDir = path.join(outDirBase, 'episodes');
const charactersDir = path.join(outDirBase, 'characters');
const visualLangDir = path.join(outDirBase, 'visual_language');
const rolloutDir = path.join(outDirBase, 'rollout');
const stagingDir = path.join(outDirBase, 'obsidian_staging');
const reportsDir = path.join(outDirBase, 'reports');
const logsDir = path.join(outDirBase, 'logs');
const templatesDir = path.join(REPO_ROOT, 'templates', 'icyflamze_core', 'ip_bible');

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ensureDirectories() {
  fs.mkdirSync(docsDir, { recursive: true });
  fs.mkdirSync(episodesDir, { recursive: true });
  fs.mkdirSync(charactersDir, { recursive: true });
  fs.mkdirSync(visualLangDir, { recursive: true });
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

// 1. bible command
function handleBible(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'ip-bible-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    .replace(/\{\{PROJECT_TITLE\}\}/g, config.PROJECT_NAME)
    .replace(/\{\{SEASON_TITLE\}\}/g, config.SEASON_TITLE)
    .replace(/\{\{UNIVERSE_DIRECTION\}\}/g, config.UNIVERSE_DIRECTION)
    .replace(/\{\{GENRE\}\}/g, config.GENRE)
    .replace(/\{\{TAGLINE\}\}/g, config.MASTER_TAGLINE)
    .replace(/\{\{PRIMARY_CHARACTER\}\}/g, config.PRIMARY_CHARACTER)
    .replace(/\{\{PRIMARY_THEME\}\}/g, config.PRIMARY_THEME)
    .replace(/\{\{CORE_PREMISE\}\}/g, "A street-smart creative technologist maps his struggles, narrative art, and musical catalog like a chessboard, utilizing modular systems and local AI agents to build system sovereignty and bypass standard music labels.")
    .replace(/\{\{LOGLINE\}\}/g, "In a pressure-cooked city, a street-smart creative technologist merges scientific discipline and hip-hop mythology to build an autonomous cultural empire.")
    .replace(/\{\{UNIVERSE_RULES\}\}/g, 
`- **Rule of Concrete Friction:** The physical city provides resistance. Every block has its own layout, rules, and stakes.
- **Rule of Scientific Expression:** Art is treated as calculation. Frequencies are parsed, bars are structured, and systems are programmed.
- **Rule of Agent Collaboration:** Human creative intent works symmetrically with automated terminal subagents (OS council).`)
    .replace(/\{\{CHARACTER_IDENTITY\}\}/g, "Icyflamze: AI-era hip-hop founder, artist, architect, strategist, cultural systems builder, and legacy-driven creative technologist.")
    .replace(/\{\{VISUAL_LANGUAGE\}\}/g, "- Palette: Black, Metallic Gold, and Neon Blue.\n- Styling: Cinematic anime with chiascuro street lighting, chess grids, transparent terminal readouts, and gold foiled details.")
    .replace(/\{\{SYMBOL_SYSTEM\}\}/g, "- Mr. 2 Lighter: creative ignition & survival.\n- Chess King & Chessboard City: system sovereignty & tactical arena play.\n- Books & Formulas: academic discipline & scientific execution.")
    .replace(/\{\{VOICEOVER_STYLE\}\}/g, "Poetic, strategic, street-smart, philosophical, scientific, calm but powerful, founder-minded, legacy-driven.")
    .replace(/\{\{MUSIC_TIE_INS\}\}/g, "Each episode features a corresponding single release under Tree Groove Records. sound palette suggests: modular analog synths, monospace clicks, and sub-bass stabs.")
    .replace(/\{\{CONTENT_LANES\}\}/g, "- Production breakdowns (Music physics)\n- Animated episode shorts\n- System terminal screencasts")
    .replace(/\{\{ROLLOUT_STRATEGY\}\}/g, "6-week cycle with 3 posts per episode (15s short teasers, music video snippets, and technical/strategic carousel threads).")
    .replace(/\{\{MONETIZATION_LANES\}\}/g, "- Digital streaming royalties (TGR Soundtrack & Singles)\n- Limited edition black-and-gold vinyl prints\n- High-end physical merch (gilded books, custom lighters)\n- Licensing of AI creative tools")
    .replace(/\{\{NEXT_PHASE\}\}/g, "Phase 14C: Episode 1 Trailer Package Production");

  const destPath = path.join(docsDir, `icyflamze_core_season_1_ip_bible_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Season 1 IP Bible generated: outputs/icyflamze_core/ip_bible/documents/icyflamze_core_season_1_ip_bible_${dateStr}.md`);
  writeLog(`Generated IP Bible doc at ${destPath}`);
}

// 2. character command
function handleCharacter(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'character-profile-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    .replace(/\{\{NAME\}\}/g, config.PRIMARY_CHARACTER)
    .replace(/\{\{PROFESSIONAL_IDENTITY\}\}/g, "AI-era hip-hop founder, artist, architect, strategist, cultural systems builder, and legacy-driven creative technologist.")
    .replace(/\{\{ARCHETYPE\}\}/g, "The Street Scholar / The Strategic Artist-Founder / The Brilliantier")
    .replace(/\{\{PHILOSOPHY\}\}/g, "I build before burning. Knowledge is street currency. Legacy is the ultimate payout.")
    .replace(/\{\{INNER_CONFLICT\}\}/g, "The tension between immediate street survival (acting as a Knight in the universe's game) and long-term strategic building (acting as a King on his own board).")
    .replace(/\{\{OUTER_MISSION\}\}/g, "Establishing an autonomous creative empire (Tree Groove Records) powered by proprietary AI systems under the Brilliantaire OS grid.")
    .replace(/\{\{STRENGTHS\}\}/g, "- Strategic foresight\n- High-pressure execution\n- Scientific discipline\n- Music composition\n- Tech-savviness")
    .replace(/\{\{WEAKNESSES\}\}/g, "- Paranoia from city pressure\n- Perfectionism\n- Reluctance to delegate core structural designs")
    .replace(/\{\{POWER_SYSTEM\}\}/g, "The Brilliantier Protocol (combining musical frequency modulation with algorithmic coding to influence systems).")
    .replace(/\{\{VISUAL_IDENTITY\}\}/g, "Black tactical gear with gold details and neon-blue lining, cybernetic glasses showing terminal readouts.")
    .replace(/\{\{SYMBOLS\}\}/g, "Mr. 2 Lighter, blue-gold flame, chessboard, formulas, books.")
    .replace(/\{\{VOICE_STYLE\}\}/g, "Poetic, street-smart, philosophical, scientific, calm but powerful, founder-minded.")
    .replace(/\{\{SEASON_1_TRANSFORMATION\}\}/g, "Starting as a street coder survivalist and ending as a recognized system architect-artist founder.");

  const destPath = path.join(charactersDir, `icyflamze_character_profile_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Character profile generated: outputs/icyflamze_core/ip_bible/characters/icyflamze_character_profile_${dateStr}.md`);
  writeLog(`Generated Character profile at ${destPath}`);
}

// 3. episodes command
function handleEpisodes(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'episode-arc-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    .replace(/\{\{SEASON_TITLE\}\}/g, config.SEASON_TITLE)
    .replace(/\{\{INTRO_TEXT\}\}/g, "The official six-episode narrative arc charting the evolution of Icyflamze from local coder to Strategic Founder.")
    
    // Episode 1
    .replace(/\{\{EP_1_TITLE\}\}/g, "The Core Wakes")
    .replace(/\{\{EP_1_THEME\}\}/g, "Identity")
    .replace(/\{\{EP_1_PURPOSE\}\}/g, "Introduce Icyflamze and the Street Scholar Futurist universe.")
    .replace(/\{\{EP_1_LOGLINE\}\}/g, "Under intense concrete pressure, a street coder strikes his lighter to activate a hidden AI node, sparking a blue-gold flame that begins his strategic evolution.")
    .replace(/\{\{EP_1_VISUAL_MOOD\}\}/g, "Neon-blue rain, dark alleys, glowing transparent interface panels, gold lighter flickers.")
    .replace(/\{\{EP_1_SYMBOLS\}\}/g, "Mr. 2 Lighter, city pressure, AI panels, blue-gold flame.")
    .replace(/\{\{EP_1_VOICEOVER_SEED\}\}/g, "\"Pressure is a compressor. It either breaks the carbon, or it shapes the diamond. The grid is active.\"")
    .replace(/\{\{EP_1_MUSIC_TIE_IN\}\}/g, "\"The Core Wakes\" (Main theme: heavy 808s, cerebral keys, and low terminal hums).")
    .replace(/\{\{EP_1_SHORT_FORM\}\}/g, "A 15-second teaser showing a gold lighter striking, casting neon-blue code reflections across cybernetic glasses.")
    
    // Episode 2
    .replace(/\{\{EP_2_TITLE\}\}/g, "The Street Is a Classroom")
    .replace(/\{\{EP_2_THEME\}\}/g, "Street intelligence")
    .replace(/\{\{EP_2_PURPOSE\}\}/g, "Show how pain, pressure, and observation become knowledge.")
    .replace(/\{\{EP_2_LOGLINE\}\}/g, "Icyflamze maps the patterns of the city streets, translating survival tactics into mathematical formulas for database nodes.")
    .replace(/\{\{EP_2_VISUAL_MOOD\}\}/g, "Overhead grid shots, glowing gold streetlights, chalk formulas on brick walls.")
    .replace(/\{\{EP_2_SYMBOLS\}\}/g, "Books, formulas, city pressure.")
    .replace(/\{\{EP_2_VOICEOVER_SEED\}\}/g, "\"They think I'm running. I'm taking notes. The asphalt is a library if you know how to read the cracks.\"")
    .replace(/\{\{EP_2_MUSIC_TIE_IN\}\}/g, "\"Asphalt Library\" (Boom-bap rhythm overlaid with lo-fi vinyl cracks and academic lecture speech snippets).")
    .replace(/\{\{EP_2_SHORT_FORM\}\}/g, "A short breakdown post explaining how chess principles map to street navigation.")
    
    // Episode 3
    .replace(/\{\{EP_3_TITLE\}\}/g, "The Science of Sound")
    .replace(/\{\{EP_3_THEME\}\}/g, "Music as science")
    .replace(/\{\{EP_3_PURPOSE\}\}/g, "Show sound as frequency, memory, psychology, and architecture.")
    .replace(/\{\{EP_3_LOGLINE\}\}/g, "In the studio, Icyflamze builds the sound signature of Tree Groove Records, proving that a hit is a combination of sonic physics and street feeling.")
    .replace(/\{\{EP_3_VISUAL_MOOD\}\}/g, "Holographic soundwaves, glowing gold equalizer bars, deep shadows.")
    .replace(/\{\{EP_3_SYMBOLS\}\}/g, "Soundwaves, formulas, AI panels.")
    .replace(/\{\{EP_3_VOICEOVER_SEED\}\}/g, "\"Bass isn't just felt. It's calculated. Equalize the frequency, and you control the heartbeat of the concrete.\"")
    .replace(/\{\{EP_3_MUSIC_TIE_IN\}\}/g, "\"Sonic Physics\" (Bass-boosted modular synth loops and high-pitched synth leads).")
    .replace(/\{\{EP_3_SHORT_FORM\}\}/g, "A motion graphic of a soundwave morphing into a line of code.")
    
    // Episode 4
    .replace(/\{\{EP_4_TITLE\}\}/g, "The Chessboard City")
    .replace(/\{\{EP_4_THEME\}\}/g, "Strategy")
    .replace(/\{\{EP_4_PURPOSE\}\}/g, "Show the city as a board and life as positioning, sacrifice, and endgames.")
    .replace(/\{\{EP_4_LOGLINE\}\}/g, "Faced with a hostile takeover of his music catalog, Icyflamze moves his assets like chess pieces, turning a tactical retreat into a final trap.")
    .replace(/\{\{EP_4_VISUAL_MOOD\}\}/g, "Holographic chessboard grid over the cityscape, gold and blue chess pieces.")
    .replace(/\{\{EP_4_SYMBOLS\}\}/g, "Chess king, chessboard city.")
    .replace(/\{\{EP_4_VOICEOVER_SEED\}\}/g, "\"Knights jump. Queens attack. But the King... the King just steps. One block at a time, until the board is ours.\"")
    .replace(/\{\{EP_4_MUSIC_TIE_IN\}\}/g, "\"Checkmate\" (Tense orchestration, marching drumrolls, and rapid lyric flow).")
    .replace(/\{\{EP_4_SHORT_FORM\}\}/g, "A graphic layout of the chessboard city showing where major music-tech hubs are positioned.")
    
    // Episode 5
    .replace(/\{\{EP_5_TITLE\}\}/g, "Brilliantier Protocol")
    .replace(/\{\{EP_5_THEME\}\}/g, "Systems and empire")
    .replace(/\{\{EP_5_PURPOSE\}\}/g, "Activate AI, founder systems, Tree Groove Records, and legacy infrastructure.")
    .replace(/\{\{EP_5_LOGLINE\}\}/g, "With the foundation set, Icyflamze deploys the Brilliantier Protocol, integrating his multi-agent council to automate his label's distribution and protect system sovereignty.")
    .replace(/\{\{EP_5_VISUAL_MOOD\}\}/g, "Cinematic server rooms, neon-blue cables, gold terminal prompts, multi-window command router displays.")
    .replace(/\{\{EP_5_SYMBOLS\}\}/g, "AI panels, formulas, blue-gold flame.")
    .replace(/\{\{EP_5_VOICEOVER_SEED\}\}/g, "\"I don't run an empire. I run a protocol. Let the agents watch the nodes while I write the script.\"")
    .replace(/\{\{EP_5_MUSIC_TIE_IN\}\}/g, "\"Sovereign Code\" (Glitch-hop beats, digital synth swells, and robotic vocal chops).")
    .replace(/\{\{EP_5_SHORT_FORM\}\}/g, "A screencast of a stylized terminal executing a \"brilliantier bootstrap\" routine.")
    
    // Episode 6
    .replace(/\{\{EP_6_TITLE\}\}/g, "Built Different")
    .replace(/\{\{EP_6_THEME\}\}/g, "Legacy")
    .replace(/\{\{EP_6_PURPOSE\}\}/g, "Complete the identity transformation into artist, scholar, strategist, and builder.")
    .replace(/\{\{EP_6_LOGLINE\}\}/g, "As the season closes, Icyflamze stands on the mainframe of Brilliantaire OS, demonstrating that a creative technologist is built different and ready to claim his legacy.")
    .replace(/\{\{EP_6_VISUAL_MOOD\}\}/g, "Golden hour sunset reflecting off skyscrapers, high-contrast neon-blue grids, deep golden throne.")
    .replace(/\{\{EP_6_SYMBOLS\}\}/g, "Crown, throne, blue-gold flame, chess king.")
    .replace(/\{\{EP_6_VOICEOVER_SEED\}\}/g, "\"They wanted a product. I built a system. They wanted a song. I gave them a future. We are built different.\"")
    .replace(/\{\{EP_6_MUSIC_TIE_IN\}\}/g, "\"Built Different\" (Triumphant brass stabs, heavy sub-bass, and rapid, aggressive flows).")
    .replace(/\{\{EP_6_SHORT_FORM\}\}/g, "A cinematic transition from a simple pencil sketch of a crown to a gold-gilded, neon-blue anime rendering.");

  const destPath = path.join(episodesDir, `season_1_episode_arc_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Episode arc generated: outputs/icyflamze_core/ip_bible/episodes/season_1_episode_arc_${dateStr}.md`);
  writeLog(`Generated Episode arc at ${destPath}`);
}

// 4. visuals command
function handleVisuals(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'visual-language-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    .replace(/\{\{PROJECT_NAME\}\}/g, config.PROJECT_NAME)
    .replace(/\{\{COLOR_PALETTE\}\}/g, "- Base Black (#0A0A0A): Midnight depths representing absolute system privacy.\n- Metallic Gold (#D4AF37): Royalty, value, legacy building.\n- Neon Blue (#00E5FF): AI integration, code lines, terminal routing guides.")
    .replace(/\{\{LIGHTING_RULES\}\}/g, "- High-contrast chiascuro lighting.\n- Cyber-street scenes showing rain-slicked docks reflecting neon blue and gold rays.\n- Silhouette character portraits backlit by transparent interface panels.")
    .replace(/\{\{OUTFIT_RULES\}\}/g, "- Black matte technical coats with custom gold engraving.\n- Minimalist tactical straps and gear.\n- Cybernetic specs displaying command diagnostics in neon-blue overlays.")
    .replace(/\{\{ENVIRONMENT_RULES\}\}/g, "- Concrete urban alleyways under dark stormy skies.\n- Industrial server rooms with gold cabling and blue status nodes.\n- Elevated golden throne mainframes overlooking high-contrast grid layouts.")
    .replace(/\{\{STYLE_RULES\}\}/g, "- Highly detailed cinematic 2.5D anime style.\n- Dark, grit-textured concrete structures mapping cleanly against clean digital panels.")
    .replace(/\{\{CAMERA_RULES\}\}/g, "- Overhead bird's-eye views parsing city street blocks like chessboard patterns.\n- Macro focus shots on lighter ignitions and hand-placed chess items.")
    .replace(/\{\{TYPOGRAPHY_RULES\}\}/g, "- Monospace fonts (Courier/JetBrains) for terminal screens.\n- Clean modern sans-serif fonts (Inter/Outfit) for graphic overlays.")
    .replace(/\{\{DO_NOT_USE_RULES\}\}/g, 
`- **No Generic Superheroes:** Avoid spandex, capes, or random energy-throwing battles.
- **No Generic Space Sci-Fi:** Avoid space helmets, spacecraft, or generic space suits.
- **No Generic Afro-Futurism:** Do not use generic tribal masks or patterns; focus strictly on Street Scholar elements.
- **No Random Tech Clutter:** Do not add meaningless wires or random buttons. Every screen must represent clean data.`);

  const destPath = path.join(visualLangDir, `visual_language_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Visual language guide generated: outputs/icyflamze_core/ip_bible/visual_language/visual_language_${dateStr}.md`);
  writeLog(`Generated Visual language at ${destPath}`);
}

// 5. symbols command
function handleSymbols(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'symbol-system-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    .replace(/\{\{PROJECT_NAME\}\}/g, config.PROJECT_NAME)
    .replace(/\{\{CHESS_KING_MEANING\}\}/g, "System sovereignty, intellectual property ownership, independence.")
    .replace(/\{\{CHESS_KING_USE\}\}/g, "When announcing complete copyright/catalog control or final system status milestones.")
    .replace(/\{\{CHESS_KING_BLOCK\}\}/g, "For secondary routine tasks or intermediate developer progress commits.")
    
    .replace(/\{\{CHESSBOARD_CITY_MEANING\}\}/g, "The grid arena of play, strategic positioning, structural leverage.")
    .replace(/\{\{CHESSBOARD_CITY_USE\}\}/g, "When mapping distribution channels or content rollouts.")
    .replace(/\{\{CHESSBOARD_CITY_BLOCK\}\}/g, "When documenting local microsecond serial voice bus queues.")
    
    .replace(/\{\{LIGHTER_MEANING\}\}/g, "Creative spark, tactical survival, ignition under concrete pressure.")
    .replace(/\{\{LIGHTER_USE\}\}/g, "When starting new tracks or initiating active campaigns.")
    .replace(/\{\{LIGHTER_BLOCK\}\}/g, "During passive maintenance or cleanup audits.")
    
    .replace(/\{\{FLAME_MEANING\}\}/g, "The blue-gold flame combining street heat and technological precision.")
    .replace(/\{\{FLAME_USE\}\}/g, "When compiling final release briefs and telemetry metrics.")
    .replace(/\{\{FLAME_BLOCK\}\}/g, "When running local dry-run tests.")
    
    .replace(/\{\{BOOKS_MEANING\}\}/g, "Academic discipline, structured study, reference theory.")
    .replace(/\{\{BOOKS_USE\}\}/g, "When detailing architecture specifications or safety guardrails.")
    .replace(/\{\{BOOKS_BLOCK\}\}/g, "In rapid social media captions.")
    
    .replace(/\{\{FORMULAS_MEANING\}\}/g, "Calculated execution, optimization, system precision.")
    .replace(/\{\{FORMULAS_USE\}\}/g, "In database indexing notes or monetization ladders.")
    .replace(/\{\{FORMULAS_BLOCK\}\}/g, "In narrative dialogue scenes.")
    
    .replace(/\{\{AI_PANELS_MEANING\}\}/g, "System orchestration, developer control, multi-agent status panels.")
    .replace(/\{\{AI_PANELS_USE\}\}/g, "When querying dashboard analytics or terminal checklists.")
    .replace(/\{\{AI_PANELS_BLOCK\}\}/g, "In standard music videos.")
    
    .replace(/\{\{SOUNDWAVES_MEANING\}\}/g, "Music resonance, sonic physics, frequency control.")
    .replace(/\{\{SOUNDWAVES_USE\}\}/g, "When validating audio masters or recording transcript segments.")
    .replace(/\{\{SOUNDWAVES_BLOCK\}\}/g, "In database schema documentations.")
    
    .replace(/\{\{PRESSURE_MEANING\}\}/g, "Urban concrete stress, systemic friction, blocker challenges.")
    .replace(/\{\{PRESSURE_USE\}\}/g, "When analyzing risks, bottlenecks, or compiler errors.")
    .replace(/\{\{PRESSURE_BLOCK\}\}/g, "When declaring successful phase closures.")
    
    .replace(/\{\{CROWN_MEANING\}\}/g, "Self-sovereignty, final milestone completion.")
    .replace(/\{\{CROWN_USE\}\}/g, "When establishing independent labels.")
    .replace(/\{\{CROWN_BLOCK\}\}/g, "During initial scaffolding phases.")
    
    .replace(/\{\{THRONE_MEANING\}\}/g, "Mainframe stability, established legacy structure.")
    .replace(/\{\{THRONE_USE\}\}/g, "In final system acceptance packets.")
    .replace(/\{\{THRONE_BLOCK\}\}/g, "During early testing runs.")
    
    .replace(/\{\{SHADOW_MEANING\}\}/g, "Introspection, code verification, validation checks.")
    .replace(/\{\{SHADOW_USE\}\}/g, "During regression testing and peer validations.")
    .replace(/\{\{SHADOW_BLOCK\}\}/g, "In default template staging notes.");

  const destPath = path.join(visualLangDir, `symbol_system_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Symbol system guide generated: outputs/icyflamze_core/ip_bible/visual_language/symbol_system_${dateStr}.md`);
  writeLog(`Generated Symbol system guide at ${destPath}`);
}

// 6. voiceover command
function handleVoiceover(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'voiceover-style-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    .replace(/\{\{PROJECT_NAME\}\}/g, config.PROJECT_NAME)
    .replace(/\{\{VOICE_STYLE\}\}/g, "Poetic, strategic, street-smart, philosophical, scientific, calm but powerful, founder-minded, legacy-driven.")
    .replace(/\{\{VOICEOVER_STYLE_RULES\}\}/g, 
`- Speak with calculated cadence. Pause on terminal transitions.
- Maintain a calm, strategic tone. Avoid hype voice styles.
- Frame street knowledge as a scientific study.`)
    .replace(/\{\{SENTENCE_STYLE\}\}/g, "- Rhythmic, declarative, short structures.\n- Uses contrasts (e.g. \"They built... I ran...\") and mathematical/chess motifs.")
    .replace(/\{\{ALLOWED_WORDS\}\}/g, "grid, gridlines, board, position, strike, spark, calculated, pressure, formula, legacy, mainframe, sovereign, checkmate, lighter, carbon, system.")
    .replace(/\{\{BANNED_PHRASES\}\}/g, "industry standard, generic path, viral trend, normal routine, hype track, magic formula.")
    .replace(/\{\{NARRATION_EXAMPLES\}\}/g, 
`- Example 1: "They built a stage. I built a grid. They chase the signal; I write the algorithm."
- Example 2: "Flick the lighter. The gold sparks first, but it's the blue that holds the heat. That's the science of sound."`)
    .replace(/\{\{TRAILER_VOICEOVER\}\}/g, 
`[Sound of a lighter flicking. A deep sub-bass drops.]
Narration (Calm, strategic): They looked at the concrete and saw a wall. I looked at the concrete and saw a motherboard.
[Sound of keys clacking on a terminal.]
Narration: In this city, pressure is a given. You either let it crush you, or you use the heat to compile something sovereign.
[Music swell: a synthesizer lead enters.]
Narration: This isn't just music. It's a protocol. Striking the fire between the street and the science.
[Visual: Gold flame turns blue. The screen fades to black.]
Narration: Rise of the Street Scholar. Welcome to the core.`)
    .replace(/\{\{TEASER_VOICEOVER\}\}/g, 
`[Lighter clicks twice.]
Narration (Whispered, powerful): They play checkers. We map the chessboard city.
[Synth hum.]
Narration: Striking the gold, igniting the blue. The mainframe is awake.`);

  const destPath = path.join(docsDir, `voiceover_style_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Voiceover style guide generated: outputs/icyflamze_core/ip_bible/documents/voiceover_style_${dateStr}.md`);
  writeLog(`Generated Voiceover style guide at ${destPath}`);
}

// 7. music-tie-ins command
function handleMusicTieIns(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'music-tie-in-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    .replace(/\{\{PROJECT_NAME\}\}/g, config.PROJECT_NAME)
    .replace(/\{\{SONG_CONNECTIONS\}\}/g, "- Episode 1: \"The Core Wakes\" (Heavy sub-bass, monospace clicking sounds, minor synth keys).\n- Episode 2: \"Asphalt Library\" (Boom-bap rhythm, dusty vinyl crackles).\n- Episode 3: \"Sonic Physics\" (Modular synths, frequency sweeps).\n- Episode 4: \"Checkmate\" (Marching percussion, rapid lyrical flow).\n- Episode 5: \"Sovereign Code\" (Robotic vocal cuts, synth pads).\n- Episode 6: \"Built Different\" (Triumphant horns, heavy basslines).")
    .replace(/\{\{ROLLOUT_IDEAS\}\}/g, "- Release audio tracks synchronously on Spotify and Apple Music alongside animated episode snippets.\n- Utilize instrumental synth loops for developer screencasts.")
    .replace(/\{\{FREESTYLE_TIE_INS\}\}/g, "- Weekly social drops (e.g. \"Street Scholar Freestyles\") carrying symbols of the upcoming episodes.")
    .replace(/\{\{COVER_ART\}\}/g, "- High-contrast black-gold-blue anime art showing Icyflamze at terminals or chessboards.")
    .replace(/\{\{INTRO_OUTRO_VOICEOVER\}\}/g, "- Spoken word strategic quotes overlaying intros/outros to anchor narrative themes.")
    .replace(/\{\{SOUND_PALETTE\}\}/g, "- 808 sub-bass, Piper voice synthesizers, monospace sound design, boom-bap acoustic drums.")
    .replace(/\{\{LYRICAL_THEMES\}\}/g, "- Autonomy, AI system builds, calculated chess endgames, Lagos street memories, scientific formulas.")
    .replace(/\{\{PLATFORM_IDEAS\}\}/g, "- Mix breakdown screen recordings demonstrating the physical science of sound.");

  const destPath = path.join(docsDir, `music_tie_ins_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Music tie-ins guide generated: outputs/icyflamze_core/ip_bible/documents/music_tie_ins_${dateStr}.md`);
  writeLog(`Generated Music tie-ins at ${destPath}`);
}

// 8. rollout command
function handleRollout(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'rollout-plan-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    .replace(/\{\{PROJECT_NAME\}\}/g, config.PROJECT_NAME)
    .replace(/\{\{SIX_WEEK_PLAN\}\}/g, 
`- Week 1: Episode 1 (Video & Single launch).\n- Week 2: Episode 2 (Freestyle & BTS breakdown).\n- Week 3: Episode 3 (Sound design breakdown & Single launch).\n- Week 4: Episode 4 (Interactive chess strategy & freestyle).\n- Week 5: Episode 5 (AI protocol and system panel showcase).\n- Week 6: Episode 6 (Season finale & album soundtrack release).`)
    .replace(/\{\{EPISODE_DISTRIBUTION\}\}/g, "- Teaser clip (15s teaser voiceover).\n- Full episode clip (30s main narrative video).\n- Strategy breakdown thread (carousels explaining technical themes).")
    .replace(/\{\{TRAILER_PLAN\}\}/g, "Release 30s trailer 1 week prior to Episode 1, combining anime cityscapes and the calculated narrator voiceover.")
    .replace(/\{\{CHARACTER_POSTER_PLAN\}\}/g, "Release high-contrast black-gold-blue character poster highlighting the \"Brilliantier\" archetype.")
    .replace(/\{\{QUOTE_CARD_PLAN\}\}/g, "Quote cards featuring declarative formulas like \"I build before burning.\"")
    .replace(/\{\{MOTION_COMIC_PLAN\}\}/g, "Using layered artwork offsets and camera pans to create animated motion comic shorts.")
    .replace(/\{\{MUSIC_SNIPPET_PLAN\}\}/g, "Short-form clips using instrumental snippets to back strategic tips.")
    .replace(/\{\{TIKTOK_PLAN\}\}/g, "Upload fast-cut strategic clips featuring terminal interfaces and terminal music stabs.")
    .replace(/\{\{YOUTUBE_PLAN\}\}/g, "Upload full HD episodes, including detailed markdown descriptions linking to the codebase.")
    .replace(/\{\{OBSIDIAN_LOOP_PLAN\}\}/g, "Track streaming statistics and audience responses in staged Obsidian analytics files.")
    .replace(/\{\{LABEL_PLAN\}\}/g, "Coordinate distributions via Tree Groove Records pipeline channels.")
    .replace(/\{\{MONETIZATION_LANES\}\}/g, 
`- Soundtrack album and singles streaming royalties.\n- Limited edition black-and-gold vinyl drops.\n- High-end streetwear merch (engraved lighters, strategy journals).\n- Developer license tokens for AI automation plugins.`);

  const destPath = path.join(rolloutDir, `season_1_rollout_plan_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Rollout plan generated: outputs/icyflamze_core/ip_bible/rollout/season_1_rollout_plan_${dateStr}.md`);
  writeLog(`Generated Rollout plan at ${destPath}`);
}

// 9. obsidian-stage command
function handleObsidianStage(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'obsidian-stage-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content
    .replace(/\{\{ALIASES\}\}/g, "\"Rise of the Street Scholar\", \"ICYFLAMZE CORE IP Bible\"")
    .replace(/\{\{UNIVERSE_DIRECTION\}\}/g, config.UNIVERSE_DIRECTION)
    .replace(/\{\{SEASON_TITLE\}\}/g, config.SEASON_TITLE)
    .replace(/\{\{CORE_TAGLINE\}\}/g, config.MASTER_TAGLINE)
    .replace(/\{\{PROJECT_OVERVIEW\}\}/g, "Official Season 1 IP Bible defining the Street Scholar Futurist hip-hop universe. Blends street intelligence with academic and AI systems.")
    .replace(/\{\{CHARACTER_SUMMARY\}\}/g, "Icyflamze: AI-era hip-hop founder, strategic artist-founder, systems architect, and legacy creative technologist.")
    .replace(/\{\{EPISODE_ARC_SUMMARY\}\}/g, 
`- Ep 1: The Core Wakes (Identity)\n- Ep 2: The Street Is a Classroom (Street Intelligence)\n- Ep 3: The Science of Sound (Music physics)\n- Ep 4: The Chessboard City (Strategy)\n- Ep 5: Brilliantier Protocol (Systems)\n- Ep 6: Built Different (Legacy)`)
    .replace(/\{\{VISUAL_LANGUAGE_GUIDELINES\}\}/g, "- Color Palette: Black, metallic gold, neon blue.\n- Style: Gritty 2.5D cinematic anime, chiascuro lighting.")
    .replace(/\{\{SYMBOL_SYSTEM_GUIDELINES\}\}/g, "- Mr. 2 Lighter: spark, survival.\n- Chess pieces: strategy, position play.\n- Books & Formulas: academic discipline.")
    .replace(/\{\{ROLLOUT_PLAN_OVERVIEW\}\}/g, "6-week cycle with 3 posts per episode (Teaser, MV snippet, strategy notes).")
    .replace(/\{\{NEXT_ACTIONS\}\}/g, 
`- [ ] Build Season 1 IP Bible\n- [ ] Generate character profile\n- [ ] Generate episode arc\n- [ ] Generate visual language guide\n- [ ] Generate symbol system\n- [ ] Generate voiceover style guide\n- [ ] Generate music tie-ins\n- [ ] Generate rollout plan\n- [ ] Stage Obsidian-ready IP Bible note\n- [ ] Prepare Episode 1 trailer package`);

  const destPath = path.join(stagingDir, `ICYFLAMZE_CORE_SEASON_1_IP_BIBLE_OBSIDIAN_STAGE_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Obsidian staged note generated: outputs/icyflamze_core/ip_bible/obsidian_staging/ICYFLAMZE_CORE_SEASON_1_IP_BIBLE_OBSIDIAN_STAGE_${dateStr}.md`);
  writeLog(`Generated Obsidian staged note at ${destPath}`);

  if (WRITE_STAGING_OUTPUT) {
    const stageDestPath = path.join(WRITE_STAGING_OUTPUT, `ICYFLAMZE_CORE_SEASON_1_IP_BIBLE_OBSIDIAN_STAGE_${dateStr}.md`);
    fs.writeFileSync(stageDestPath, content, 'utf-8');
    console.log(`✅ Staged note copied to Obsidian write-gateway: outputs/write_staging/ICYFLAMZE_CORE_SEASON_1_IP_BIBLE_OBSIDIAN_STAGE_${dateStr}.md`);
    writeLog(`Copied Obsidian staged note to write_staging folder`);
  }
}

// 10. report command
function handleReport(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'ip-bible-report-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  
  const bibleRel = `outputs/icyflamze_core/ip_bible/documents/icyflamze_core_season_1_ip_bible_${dateStr}.md`;
  const characterRel = `outputs/icyflamze_core/ip_bible/characters/icyflamze_character_profile_${dateStr}.md`;
  const episodesRel = `outputs/icyflamze_core/ip_bible/episodes/season_1_episode_arc_${dateStr}.md`;
  const visualsRel = `outputs/icyflamze_core/ip_bible/visual_language/visual_language_${dateStr}.md`;
  const symbolsRel = `outputs/icyflamze_core/ip_bible/visual_language/symbol_system_${dateStr}.md`;
  const voiceoverRel = `outputs/icyflamze_core/ip_bible/documents/voiceover_style_${dateStr}.md`;
  const musicRel = `outputs/icyflamze_core/ip_bible/documents/music_tie_ins_${dateStr}.md`;
  const rolloutRel = `outputs/icyflamze_core/ip_bible/rollout/season_1_rollout_plan_${dateStr}.md`;
  const stageRel = `outputs/icyflamze_core/ip_bible/obsidian_staging/ICYFLAMZE_CORE_SEASON_1_IP_BIBLE_OBSIDIAN_STAGE_${dateStr}.md`;

  content = content
    .replace(/\{\{REPORT_DATE\}\}/g, dateStr)
    .replace(/\{\{IP_BIBLE_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, bibleRel)) ? bibleRel : 'Not generated')
    .replace(/\{\{CHARACTER_PROFILE_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, characterRel)) ? characterRel : 'Not generated')
    .replace(/\{\{EPISODE_ARC_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, episodesRel)) ? episodesRel : 'Not generated')
    .replace(/\{\{VISUAL_LANGUAGE_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, visualsRel)) ? visualsRel : 'Not generated')
    .replace(/\{\{SYMBOL_SYSTEM_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, symbolsRel)) ? symbolsRel : 'Not generated')
    .replace(/\{\{VOICEOVER_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, voiceoverRel)) ? voiceoverRel : 'Not generated')
    .replace(/\{\{MUSIC_TIE_INS_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, musicRel)) ? musicRel : 'Not generated')
    .replace(/\{\{ROLLOUT_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, rolloutRel)) ? rolloutRel : 'Not generated')
    .replace(/\{\{OBSIDIAN_STAGE_PATH\}\}/g, fs.existsSync(path.join(REPO_ROOT, stageRel)) ? stageRel : 'Not generated')
    .replace(/\{\{DIRECT_WRITE_STATUS\}\}/g, config.ALLOW_OBSIDIAN_DIRECT_WRITE ? 'Allowed' : 'Blocked')
    .replace(/\{\{NEXT_RECOMMENDED_PHASE\}\}/g, "Phase 14C: Episode 1 Trailer Package Production");

  const destPath = path.join(reportsDir, `ip_bible_generation_report_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Generation report compiled: outputs/icyflamze_core/ip_bible/reports/ip_bible_generation_report_${dateStr}.md`);
  writeLog(`Generated Generation report at ${destPath}`);
}

// 11. status command
function handleStatus() {
  const latestBible = getLatestFile(docsDir, 'icyflamze_core_season_1_ip_bible_');
  const latestCharacter = getLatestFile(charactersDir, 'icyflamze_character_profile_');
  const latestEpisodes = getLatestFile(episodesDir, 'season_1_episode_arc_');
  const latestVisuals = getLatestFile(visualLangDir, 'visual_language_');
  const latestSymbols = getLatestFile(visualLangDir, 'symbol_system_');
  const latestRollout = getLatestFile(rolloutDir, 'season_1_rollout_plan_');
  const latestStaged = getLatestFile(stagingDir, 'ICYFLAMZE_CORE_SEASON_1_IP_BIBLE_OBSIDIAN_STAGE_');
  const latestReport = getLatestFile(reportsDir, 'ip_bible_generation_report_');

  console.log("=========================================");
  console.log("📊 ICYFLAMZE CORE: Season 1 IP Bible Status");
  console.log("=========================================");
  console.log(`- Latest IP Bible:           ${latestBible}`);
  console.log(`- Latest Character Profile:  ${latestCharacter}`);
  console.log(`- Latest Episode Arc:        ${latestEpisodes}`);
  console.log(`- Latest Visuals Sheet:      ${latestVisuals}`);
  console.log(`- Latest Symbols System:     ${latestSymbols}`);
  console.log(`- Latest Rollout Plan:       ${latestRollout}`);
  console.log(`- Latest Obsidian Staged:    ${latestStaged}`);
  console.log(`- Latest Report:             ${latestReport}`);
  console.log(`- Direct Obsidian Write:     ${config.ALLOW_OBSIDIAN_DIRECT_WRITE ? 'Yes' : 'No (Blocked)'}`);
  console.log(`- Next Recommended Phase:    Phase 14C: Episode 1 Trailer Package Production`);
  console.log("=========================================");
  writeLog("Status queried");
}

function printHelp() {
  console.log("=========================================");
  console.log("🔥 ICYFLAMZE CORE IP BIBLE COMMANDS: Brilliantaire OS");
  console.log("=========================================");
  console.log("\nUsage: npm run icyflamze-core-ip-bible -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help              Print this list of available commands");
  console.log("  bible             Generate master IP Bible document");
  console.log("  character         Generate character profile profile note");
  console.log("  episodes          Generate Season 1 episode-by-episode arc details");
  console.log("  visuals           Generate visual style guide rules");
  console.log("  symbols           Generate key symbols mapping sheet");
  console.log("  voiceover         Generate voiceover scripts and narration guidelines");
  console.log("  music-tie-ins     Generate music release integrations");
  console.log("  rollout           Generate marketing rollout strategy");
  console.log("  obsidian-stage    Generate Obsidian-ready staging note in write_staging");
  console.log("  report            Compile generation report details");
  console.log("  status            Print latest compiled files and status states");
  console.log("=========================================");
}

const command = process.argv[2]?.trim().toLowerCase();

try {
  const dateStr = getFormattedDate();
  switch (command) {
    case 'bible':
      handleBible(dateStr);
      break;
    case 'character':
      handleCharacter(dateStr);
      break;
    case 'episodes':
      handleEpisodes(dateStr);
      break;
    case 'visuals':
      handleVisuals(dateStr);
      break;
    case 'symbols':
      handleSymbols(dateStr);
      break;
    case 'voiceover':
      handleVoiceover(dateStr);
      break;
    case 'music-tie-ins':
      handleMusicTieIns(dateStr);
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
      console.log("💡 Run 'npm run icyflamze-core-ip-bible-help' to see available commands.");
      writeLog(`Attempted unknown command: ${command}`);
      process.exit(1);
  }
} catch (error: any) {
  console.error(`❌ Action failed: ${error.message}`);
  writeLog(`Error: ${error.message}`);
  process.exit(1);
}
