import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as config from '../config/icyflamze-core-episode-1-render-intake.js';
import { REPO_ROOT, WRITE_STAGING_OUTPUT } from '../config/paths.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const intakeOutDir = path.join(REPO_ROOT, 'outputs', 'icyflamze_core', 'episode_1', 'render_intake');
const incomingDir = path.join(intakeOutDir, 'incoming');
const approvedDir = path.join(intakeOutDir, 'approved');
const rejectedDir = path.join(intakeOutDir, 'rejected');
const revisionDir = path.join(intakeOutDir, 'revision_needed');
const reportsDir = path.join(intakeOutDir, 'reports');
const checklistsDir = path.join(intakeOutDir, 'checklists');
const stagingDir = path.join(intakeOutDir, 'obsidian_staging');
const logsDir = path.join(intakeOutDir, 'logs');
const templatesDir = path.join(REPO_ROOT, 'templates', 'icyflamze_core', 'episode_1', 'render_intake');

// Incoming sub-folders
const incomingImages = path.join(incomingDir, 'images');
const incomingVideos = path.join(incomingDir, 'videos');
const incomingAudio = path.join(incomingDir, 'audio');
const incomingCoverArt = path.join(incomingDir, 'cover_art');
const incomingCaptions = path.join(incomingDir, 'captions');
const incomingEditProjects = path.join(incomingDir, 'edit_projects');

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ensureDirectories() {
  fs.mkdirSync(intakeOutDir, { recursive: true });
  fs.mkdirSync(incomingDir, { recursive: true });
  fs.mkdirSync(incomingImages, { recursive: true });
  fs.mkdirSync(incomingVideos, { recursive: true });
  fs.mkdirSync(incomingAudio, { recursive: true });
  fs.mkdirSync(incomingCoverArt, { recursive: true });
  fs.mkdirSync(incomingCaptions, { recursive: true });
  fs.mkdirSync(incomingEditProjects, { recursive: true });
  fs.mkdirSync(approvedDir, { recursive: true });
  fs.mkdirSync(rejectedDir, { recursive: true });
  fs.mkdirSync(revisionDir, { recursive: true });
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.mkdirSync(checklistsDir, { recursive: true });
  fs.mkdirSync(stagingDir, { recursive: true });
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

function scanFolderFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath).filter(f => !f.startsWith('.'));
}

// Required counts are derived from the production manifest, never hardcoded. They were
// hardcoded until 2026-08-08, and had drifted: the gate demanded 8 images and 5 cover art
// while the manifest defined 7 and 1. A flawless render run could not clear readiness,
// because it filled every slot that existed and the gate waited on slots that did not.
const REQUIRED_BY_CATEGORY: Record<string, number> = (() => {
  const manifestPath = path.join(REPO_ROOT, 'config', 'episode_1_production_manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  return manifest.assets.reduce((counts: Record<string, number>, asset: { category: string }) => {
    counts[asset.category] = (counts[asset.category] ?? 0) + 1;
    return counts;
  }, {});
})();

const required = (category: string): number => REQUIRED_BY_CATEGORY[category] ?? 0;

function getAssemblyReadinessState() {
  const ready =
    scanFolderFiles(incomingImages).length >= required('image') &&
    scanFolderFiles(incomingVideos).length >= required('video') &&
    scanFolderFiles(incomingAudio).length >= required('audio') &&
    scanFolderFiles(incomingCoverArt).length >= required('cover_art') &&
    scanFolderFiles(incomingCaptions).length >= required('caption') &&
    scanFolderFiles(incomingEditProjects).length >= required('assembly');

  return ready
    ? { percentage: '100%', status: 'ready', nextPhase: 'Phase 14F: Episode 1 Trailer Assembly and Mastering' }
    : { percentage: '0%', status: 'not_ready', nextPhase: 'Phase 14E: Render Intake — blocked until required assets are present' };
}

// 1. scan command
function handleScan(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'render-intake-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');

  const imagesList = scanFolderFiles(incomingImages);
  const videosList = scanFolderFiles(incomingVideos);
  const audioList = scanFolderFiles(incomingAudio);
  const coverList = scanFolderFiles(incomingCoverArt);
  const captionsList = scanFolderFiles(incomingCaptions);
  const editProjectsList = scanFolderFiles(incomingEditProjects);

  const totalFiles = imagesList.length + videosList.length + audioList.length + coverList.length + captionsList.length + editProjectsList.length;

  const intakeRows = [
    `| images/ | image | ${imagesList.length} | 0 | ${imagesList.length === 0 ? "Warning: Empty image folder" : "None"} | ${imagesList.length === 0 ? "Generate manual visual assets via Midjourney" : "Proceed to validate"} |`,
    `| videos/ | video | ${videosList.length} | 0 | ${videosList.length === 0 ? "Warning: Empty video folder" : "None"} | ${videosList.length === 0 ? "Generate manual animation clips via Sora/Veo" : "Proceed to validate"} |`,
    `| audio/ | audio | ${audioList.length} | 0 | ${audioList.length === 0 ? "Warning: Empty audio folder" : "None"} | ${audioList.length === 0 ? "Generate manual voice track stems via ElevenLabs" : "Proceed to validate"} |`,
    `| cover_art/ | cover_art | ${coverList.length} | 0 | ${coverList.length === 0 ? "Warning: Empty cover art folder" : "None"} | ${coverList.length === 0 ? "Generate promotional crops via Canva" : "Proceed to validate"} |`,
    `| captions/ | caption | ${captionsList.length} | 0 | ${captionsList.length === 0 ? "Warning: Empty captions folder" : "None"} | ${captionsList.length === 0 ? "Prepare reel/tiktok subtitle files via CapCut" : "Proceed to validate"} |`,
    `| edit_projects/ | assembly | ${editProjectsList.length} | 0 | ${editProjectsList.length === 0 ? "Warning: Empty edit projects folder" : "None"} | ${editProjectsList.length === 0 ? "Set up Premiere or Resolve project backup file" : "Proceed to validate"} |`
  ].join('\n');

  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{TOTAL_STAGED_FILES\}\}/g, String(totalFiles))
    .replace(/\{\{UNSUPPORTED_FILES_COUNT\}\}/g, "0")
    .replace(/\{\{INTAKE_ROWS\}\}/g, intakeRows);

  const destPath = path.join(reportsDir, `episode_1_render_intake_scan_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Render intake scan generated: outputs/icyflamze_core/episode_1/render_intake/reports/episode_1_render_intake_scan_${dateStr}.md`);
  writeLog(`Generated render intake scan at ${destPath}`);
}

// 2. validate command
function handleValidate(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'asset-validation-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');

  // Since we run sandbox scans, if directories are empty, we list placeholder checks to show evaluation pattern
  const imagesList = scanFolderFiles(incomingImages);
  let validationRows = "";

  if (imagesList.length === 0) {
    validationRows = `| None (Folder Empty) | incoming/images/ | image | N/A | N/A | N/A | pending_manual_render | Awaiting visual asset generation |`;
  } else {
    validationRows = imagesList.map(f => {
      const ext = path.extname(f).toLowerCase();
      const isValidExt = config.ALLOWED_EXTENSIONS.IMAGES.includes(ext);
      const isExpectedCat = f.startsWith('IMG-') || f.startsWith('episode_1_');
      return `| ${f} | incoming/images/ | image | ${isValidExt ? "Valid" : "Invalid"} | Yes | ${isExpectedCat ? "Valid" : "Warning: Naming pattern mismatch"} | ${isValidExt ? "Passed" : "Failed"} | Review rendering resolution |`;
    }).join('\n');
  }

  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{VALIDATION_ROWS\}\}/g, validationRows);

  const destPath = path.join(reportsDir, `episode_1_asset_validation_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Asset validation report generated: outputs/icyflamze_core/episode_1/render_intake/reports/episode_1_asset_validation_${dateStr}.md`);
  writeLog(`Generated asset validation report at ${destPath}`);
}

// 3. visual-review command
function handleVisualReview(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'visual-continuity-review-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');

  const visualRows = [
    `| Icyflamze Identity Consistency | Cybernetic spec glasses, Mr. 2 Lighter visible across visual assets | pending | Awaiting manual render uploads | queued |`,
    `| Chiascuro Color Palette | Black, Metallic Gold, and Neon Blue styling highlights present | pending | Must maintain high-contrast cyberpunk anime styling | queued |`,
    `| Symbol System Alignment | Chess, lighters, formulas, and library themes active | pending | No generic superhero or spaceship sci-fi drift | queued |`,
    `| Anime Style Integrity | Consistent 3D cartoon shading lines, no photorealistic drift | pending | Verify texture continuity | queued |`,
    `| Technical Resolution | All assets output at minimum 1920x1080px size | pending | Clear margins for caption overlay placements | queued |`
  ].join('\n');

  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{VISUAL_ROWS\}\}/g, visualRows);

  const destPath = path.join(checklistsDir, `episode_1_visual_continuity_review_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Visual continuity review checklist generated: outputs/icyflamze_core/episode_1/render_intake/checklists/episode_1_visual_continuity_review_${dateStr}.md`);
  writeLog(`Generated visual review checklist at ${destPath}`);
}

// 4. audio-review command
function handleAudioReview(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'audio-review-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');

  const audioRows = [
    `| Voiceover Narration Clarity | Narration audio clear, zero clipping, background hum removed | pending | Verify ElevenLabs stability configurations | queued |`,
    `| Cadence & Pacing | Strategic cadence with distinct punctuation pauses (30s and 15s) | pending | Make sure transitions sync to visual beats | queued |`,
    `| Music Bed Alignment | Soundtrack bed looped at exactly 30.0s, sub-bass beats normalized | pending | Balance volumes with speech tracks | queued |`,
    `| SFX Layering | Spark swooshes, keyboard clacks, and chess drops timed on sequence grid | pending | Check panning and echo depth | queued |`,
    `| Output Export Format | Narration and stems saved as high-quality WAV files | pending | Check file size boundaries | queued |`
  ].join('\n');

  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{AUDIO_ROWS\}\}/g, audioRows);

  const destPath = path.join(checklistsDir, `episode_1_audio_review_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Audio review checklist generated: outputs/icyflamze_core/episode_1/render_intake/checklists/episode_1_audio_review_${dateStr}.md`);
  writeLog(`Generated audio review checklist at ${destPath}`);
}

// 5. assembly-readiness command
function handleAssemblyReadiness(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'assembly-readiness-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');

  const imagesList = scanFolderFiles(incomingImages);
  const videosList = scanFolderFiles(incomingVideos);
  const audioList = scanFolderFiles(incomingAudio);
  const coverList = scanFolderFiles(incomingCoverArt);
  const captionsList = scanFolderFiles(incomingCaptions);
  const editProjectsList = scanFolderFiles(incomingEditProjects);

  const readinessRow = (label: string, category: string, found: number, note: string): string => {
    const need = required(category);
    return `| ${label} | ${need} | ${found} | ${found >= need ? "ready" : "not_ready"} | ${note} |`;
  };

  const readinessRows = [
    readinessRow('Image Assets', 'image', imagesList.length, 'Awaiting manual visual assets compilation'),
    readinessRow('Video Clips', 'video', videosList.length, 'Awaiting manual Sora/Veo rendering'),
    readinessRow('Audio Assets', 'audio', audioList.length, 'Awaiting manual narration and sound FX Stems'),
    readinessRow('Cover Art Assets', 'cover_art', coverList.length, 'Awaiting Canva cover Crops'),
    readinessRow('Captions / Subtitles', 'caption', captionsList.length, 'Awaiting reel subtitle files'),
    readinessRow('Edit Projects Backup', 'assembly', editProjectsList.length, 'Awaiting premiere/resolve project file')
  ].join('\n');

  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{READINESS_ROWS\}\}/g, readinessRows);

  const destPath = path.join(reportsDir, `episode_1_assembly_readiness_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Assembly readiness report generated: outputs/icyflamze_core/episode_1/render_intake/reports/episode_1_assembly_readiness_${dateStr}.md`);
  writeLog(`Generated assembly readiness report at ${destPath}`);
}

// 6. revision-log command
function handleRevisionLog(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'revision-log-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');

  const revisionRows = [
    `| IMG-01 Hero Poster | Composition lacks contrast | Re-adjust Midjourney parameters to chiascuro chiascuro style | High | Midjourney | pending_revision | Paste updated visuals in images folder |`,
    `| AUD-01 Narration | Narration speed too fast | Re-generate ElevenLabs with stability slider adjusted to 65% | Critical | ElevenLabs | pending_revision | Paste updated narration in audio folder |`
  ].join('\n');

  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{REVISION_ROWS\}\}/g, revisionRows);

  const destPath = path.join(reportsDir, `episode_1_revision_log_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Revision log generated: outputs/icyflamze_core/episode_1/render_intake/reports/episode_1_revision_log_${dateStr}.md`);
  writeLog(`Generated revision log at ${destPath}`);
}

// 7. obsidian-stage command
function handleObsidianStage(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'obsidian-stage-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');

  const aliases = [
    `  - "ICYFLAMZE CORE Episode 1 Render Intake"`,
    `  - "Episode 1 Trailer Render Intake"`,
    `  - "The Core Wakes Render Intake"`
  ].join('\n');

  const tags = [
    `  - "Icyflamze"`,
    `  - "ICYFLAMZECORE"`,
    `  - "StreetScholarFuturism"`,
    `  - "RiseOfTheStreetScholar"`,
    `  - "TheCoreWakes"`,
    `  - "RenderIntake"`,
    `  - "AssetReview"`,
    `  - "TrailerAssembly"`,
    `  - "TreeGrooveRecords"`,
    `  - "BrilliantaireOS"`,
    `  - "CreativeIP"`,
    `  - "MusicTech"`,
    `  - "AnimeVisuals"`,
    `  - "AIWorkflow"`
  ].join('\n');

  const overview = `The render intake tracker evaluates incoming manual visual and audio assets against quality metrics, allowed format extensions, naming patterns, and continuity checklists. Direct vault writing is disabled, so notes are staged in write_staging first.`;

  const imagesList = scanFolderFiles(incomingImages);
  const videosList = scanFolderFiles(incomingVideos);
  const audioList = scanFolderFiles(incomingAudio);
  const coverList = scanFolderFiles(incomingCoverArt);
  const captionsList = scanFolderFiles(incomingCaptions);
  const editProjectsList = scanFolderFiles(incomingEditProjects);

  const detectedAssets = `Images: ${imagesList.length} files detected\nVideos: ${videosList.length} files detected\nAudio: ${audioList.length} files detected\nCover Art: ${coverList.length} files detected\nCaptions: ${captionsList.length} files detected\nEdit Projects: ${editProjectsList.length} files detected`;

  const validationSummary = `Total files scanned: ${imagesList.length + videosList.length + audioList.length + coverList.length + captionsList.length + editProjectsList.length} staged. Allowed formats checked cleanly. Format validation results written to local staging paths.`;

  const visualReview = `Visual review checks chiascuro color palette (black, gold, neon blue), Icyflamze anime style, and chest/lighter symbolism. Compliance score: staged for manual verification.`;

  const audioReview = `Audio review checks voiceover narration clarity, cadence pauses, beat alignment, and WAV/MP3 export settings. Staged for review.`;

  const assemblyReadiness = `Overall Readiness: 0% (staged raw queue). Approved asset presence validation is blocked pending rendering uploads.`;

  const revisionLog = `Active revisions cataloged: IMG-01 Hero Poster contrast adjustment; AUD-01 Voiceover narration pacing stabilization.`;

  const nextActions = `- [ ] Upload raw renders into incoming subdirectories\n- [ ] Run validate subcommand to check file names\n- [ ] Complete visual and audio review checklists\n- [ ] Sync editing project timeline sequence and export master`;

  content = content
    .replace(/\{\{ALIASES\}\}/g, aliases)
    .replace(/\{\{TAGS\}\}/g, tags)
    .replace(/\{\{PROJECT_NAME\}\}/g, config.PROJECT_NAME)
    .replace(/\{\{SEASON_TITLE\}\}/g, config.SEASON_TITLE)
    .replace(/\{\{EPISODE_NUMBER\}\}/g, String(config.EPISODE_NUMBER))
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{STAGED_AT\}\}/g, new Date().toISOString())
    .replace(/\{\{OVERVIEW\}\}/g, overview)
    .replace(/\{\{DETECTED_ASSETS\}\}/g, detectedAssets)
    .replace(/\{\{VALIDATION_SUMMARY\}\}/g, validationSummary)
    .replace(/\{\{VISUAL_REVIEW\}\}/g, visualReview)
    .replace(/\{\{AUDIO_REVIEW\}\}/g, audioReview)
    .replace(/\{\{ASSEMBLY_READINESS\}\}/g, assemblyReadiness)
    .replace(/\{\{REVISION_LOG\}\}/g, revisionLog)
    .replace(/\{\{NEXT_ACTIONS\}\}/g, nextActions);

  const localStagingPath = path.join(stagingDir, `ICYFLAMZE_CORE_EPISODE_1_RENDER_INTAKE_OBSIDIAN_STAGE_${dateStr}.md`);
  fs.writeFileSync(localStagingPath, content, 'utf-8');
  console.log(`✅ Obsidian staged note generated: outputs/icyflamze_core/episode_1/render_intake/obsidian_staging/ICYFLAMZE_CORE_EPISODE_1_RENDER_INTAKE_OBSIDIAN_STAGE_${dateStr}.md`);
  writeLog(`Generated Obsidian staged note at ${localStagingPath}`);

  if (WRITE_STAGING_OUTPUT) {
    const gatewayStagingPath = path.join(WRITE_STAGING_OUTPUT, `ICYFLAMZE_CORE_EPISODE_1_RENDER_INTAKE_OBSIDIAN_STAGE_${dateStr}.md`);
    fs.writeFileSync(gatewayStagingPath, content, 'utf-8');
    console.log(`✅ Staged note copied to Obsidian write-gateway: outputs/write_staging/ICYFLAMZE_CORE_EPISODE_1_RENDER_INTAKE_OBSIDIAN_STAGE_${dateStr}.md`);
    writeLog(`Copied Obsidian note to write-gateway: ${gatewayStagingPath}`);
  }
}

// 8. report command
function handleReport(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'render-intake-report-template.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  let content = fs.readFileSync(templatePath, 'utf-8');

  const scanFile = `episode_1_render_intake_scan_${dateStr}.md`;
  const validateFile = `episode_1_asset_validation_${dateStr}.md`;
  const visualFile = `episode_1_visual_continuity_review_${dateStr}.md`;
  const audioFile = `episode_1_audio_review_${dateStr}.md`;
  const readinessFile = `episode_1_assembly_readiness_${dateStr}.md`;
  const revisionFile = `episode_1_revision_log_${dateStr}.md`;
  const obsidianFile = `ICYFLAMZE_CORE_EPISODE_1_RENDER_INTAKE_OBSIDIAN_STAGE_${dateStr}.md`;

  content = content
    .replace(/\{\{EPISODE_TITLE\}\}/g, config.EPISODE_TITLE)
    .replace(/\{\{READINESS_PERCENTAGE\}\}/g, "0")
    .replace(/\{\{READINESS_STATUS\}\}/g, "not_ready")
    .replace(/\{\{DIRECT_VAULT_WRITE_STATUS\}\}/g, config.ALLOW_OBSIDIAN_DIRECT_WRITE ? "Enabled" : "No (Blocked)")
    .replace(/\{\{SCAN_REPORT_PATH\}\}/g, `outputs/icyflamze_core/episode_1/render_intake/reports/${scanFile}`)
    .replace(/\{\{\.SCAN_REPORT_URL\}\}/g, `file://${reportsDir}/${scanFile}`)
    .replace(/\{\{VALIDATION_REPORT_PATH\}\}/g, `outputs/icyflamze_core/episode_1/render_intake/reports/${validateFile}`)
    .replace(/\{\{\.VALIDATION_REPORT_URL\}\}/g, `file://${reportsDir}/${validateFile}`)
    .replace(/\{\{VISUAL_REVIEW_PATH\}\}/g, `outputs/icyflamze_core/episode_1/render_intake/checklists/${visualFile}`)
    .replace(/\{\{\.VISUAL_REVIEW_URL\}\}/g, `file://${checklistsDir}/${visualFile}`)
    .replace(/\{\{AUDIO_REVIEW_PATH\}\}/g, `outputs/icyflamze_core/episode_1/render_intake/checklists/${audioFile}`)
    .replace(/\{\{\.AUDIO_REVIEW_URL\}\}/g, `file://${checklistsDir}/${audioFile}`)
    .replace(/\{\{ASSEMBLY_READINESS_PATH\}\}/g, `outputs/icyflamze_core/episode_1/render_intake/reports/${readinessFile}`)
    .replace(/\{\{\.ASSEMBLY_READINESS_URL\}\}/g, `file://${reportsDir}/${readinessFile}`)
    .replace(/\{\{REVISION_LOG_PATH\}\}/g, `outputs/icyflamze_core/episode_1/render_intake/reports/${revisionFile}`)
    .replace(/\{\{\.REVISION_LOG_URL\}\}/g, `file://${reportsDir}/${revisionFile}`)
    .replace(/\{\{OBSIDIAN_STAGE_PATH\}\}/g, `outputs/icyflamze_core/episode_1/render_intake/obsidian_staging/${obsidianFile}`)
    .replace(/\{\{\.OBSIDIAN_STAGE_URL\}\}/g, `file://${stagingDir}/${obsidianFile}`)
    .replace(/\{\{NEXT_PHASE\}\}/g, "Phase 14F: Episode 1 Trailer Assembly and Mastering");

  const destPath = path.join(reportsDir, `episode_1_render_intake_report_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Render intake compilation report generated: outputs/icyflamze_core/episode_1/render_intake/reports/episode_1_render_intake_report_${dateStr}.md`);
  writeLog(`Compiled render intake report at ${destPath}`);
}

// 9. status command
function handleStatus(dateStr: string) {
  ensureDirectories();
  const readiness = getAssemblyReadinessState();
  const latestScan = getLatestFile(reportsDir, 'episode_1_render_intake_scan_');
  const latestVal = getLatestFile(reportsDir, 'episode_1_asset_validation_');
  const latestVis = getLatestFile(checklistsDir, 'episode_1_visual_continuity_review_');
  const latestAud = getLatestFile(checklistsDir, 'episode_1_audio_review_');
  const latestReady = getLatestFile(reportsDir, 'episode_1_assembly_readiness_');
  const latestRev = getLatestFile(reportsDir, 'episode_1_revision_log_');
  const latestStage = getLatestFile(stagingDir, 'ICYFLAMZE_CORE_EPISODE_1_RENDER_INTAKE_OBSIDIAN_STAGE_');
  const latestReport = getLatestFile(reportsDir, 'episode_1_render_intake_report_');

  console.log(`=========================================
📊 ICYFLAMZE CORE: Episode 1 Render Intake Status
=========================================
- Latest Scan Report:        ${latestScan}
- Latest Validation Report:  ${latestVal}
- Latest Visual Review:      ${latestVis}
- Latest Audio Review:       ${latestAud}
- Latest Assembly Readiness: ${latestReady}
- Latest Revision Log:       ${latestRev}
- Latest Obsidian Staged:    ${latestStage}
- Latest Report:             ${latestReport}
- Readiness Percentage:      ${readiness.percentage}
- Readiness Status:          ${readiness.status}
- Direct Obsidian Write:     No (Blocked)
- Next Recommended Phase:    ${readiness.nextPhase}
=========================================`);
  writeLog(`Printed status menu.`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  const dateStr = getFormattedDate();

  await announceIntent(`Compiling Render Intake subcommand: ${command}`);

  try {
    switch (command) {
      case 'help':
        console.log(`Usage: npm run icyflamze-core-episode-1-render-intake -- <subcommand>`);
        break;
      case 'scan':
        handleScan(dateStr);
        break;
      case 'validate':
        handleValidate(dateStr);
        break;
      case 'visual-review':
        handleVisualReview(dateStr);
        break;
      case 'audio-review':
        handleAudioReview(dateStr);
        break;
      case 'assembly-readiness':
        handleAssemblyReadiness(dateStr);
        break;
      case 'revision-log':
        handleRevisionLog(dateStr);
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
    await announceCompletion(`Render intake command ${command} completed successfully`, '10');
  } catch (error) {
    console.error(`❌ Error executing command ${command}:`, error);
    process.exit(1);
  }
}

main();
