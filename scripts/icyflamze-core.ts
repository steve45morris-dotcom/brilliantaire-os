import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as config from '../config/icyflamze-core.js';
import { REPO_ROOT, WRITE_STAGING_OUTPUT } from '../config/paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDirBase = path.join(REPO_ROOT, 'outputs', 'icyflamze_core');
const registryDir = path.join(outDirBase, 'registry');
const stagingDir = path.join(outDirBase, 'obsidian_staging');
const reportsDir = path.join(outDirBase, 'reports');
const logsDir = path.join(outDirBase, 'logs');
const templatesDir = path.join(REPO_ROOT, 'templates', 'icyflamze_core');

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ensureDirectories() {
  fs.mkdirSync(registryDir, { recursive: true });
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

function handleRegistry(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'project-registry-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let content = fs.readFileSync(templatePath, 'utf-8');

  content = content
    .replace(/\{\{PROJECT_NAME\}\}/g, config.PROJECT_NAME)
    .replace(/\{\{UNIVERSE_DIRECTION\}\}/g, config.UNIVERSE_DIRECTION)
    .replace(/\{\{SEASON_ONE_TITLE\}\}/g, config.SEASON_ONE_TITLE)
    .replace(/\{\{MASTER_TAGLINE\}\}/g, config.MASTER_TAGLINE)
    .replace(/\{\{PROFESSIONAL_POSITIONING\}\}/g, "Icyflamze is an AI-era hip-hop founder, artist, architect, strategist, cultural systems builder, and legacy-driven creative technologist.")
    .replace(/\{\{CORE_PILLARS\}\}/g, config.BRAND_PILLARS.map(p => `- ${p}`).join('\n'))
    .replace(/\{\{VISUAL_LANGUAGE\}\}/g, config.VISUAL_LANGUAGE.map(v => `- ${v}`).join('\n'))
    .replace(/\{\{SYMBOLS\}\}/g, "- chess, strategy, lighters, books, formulas, AI panels, soundwaves, city pressure, blue-gold flame, founder/artist/architect framing")
    .replace(/\{\{TARGET_OUTPUTS\}\}/g, "- ICYFLAMZE CORE Project Registry\n- Obsidian Staged note\n- Season 1 summary\n- Season 1 IP Bible")
    .replace(/\{\{NEXT_PHASE\}\}/g, "Season 1 IP Bible");

  const destPath = path.join(registryDir, `icyflamze_core_project_registry_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Project registry generated: outputs/icyflamze_core/registry/icyflamze_core_project_registry_${dateStr}.md`);
  writeLog(`Generated registry file at ${destPath}`);
}

function handleObsidianStage(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'obsidian-vault-note-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let content = fs.readFileSync(templatePath, 'utf-8');

  content = content
    .replace(/\{\{TITLE\}\}/g, config.PROJECT_NAME)
    .replace(/\{\{ALIASES\}\}/g, `"ICYFLAMZE CORE", "Rise of the Street Scholar"`)
    .replace(/\{\{STATUS\}\}/g, "Staged / Review Required")
    .replace(/\{\{UNIVERSE_DEFINITION\}\}/g, "ICYFLAMZE CORE is a Street Scholar Futurist hip-hop universe blending street intelligence, academic discipline, scientific thinking, philosophical depth, AI systems, and music mythology.")
    .replace(/\{\{SEASON_TITLE\}\}/g, config.SEASON_ONE_TITLE)
    .replace(/\{\{TAGLINE\}\}/g, config.MASTER_TAGLINE)
    .replace(/\{\{CHARACTER_POSITIONING\}\}/g, "- Icyflamze is an AI-era hip-hop founder, artist, architect, strategist, cultural systems builder, and legacy-driven creative technologist.")
    .replace(/\{\{VISUAL_RULES\}\}/g, "- Black, gold, and neon-blue anime/cyber aesthetics\n- Key symbols: chess, strategy, lighters, books, formulas, AI panels, soundwaves, city pressure, blue-gold flame")
    .replace(/\{\{NARRATIVE_PILLARS\}\}/g, config.BRAND_PILLARS.map(p => `- ${p}`).join('\n'))
    .replace(/\{\{CONTENT_LANES\}\}/g, "- Music production and release (Tree Groove Records)\n- Cyberpunk narrative episodes\n- AI-assisted worldbuilding and system development")
    .replace(/\{\{NEXT_ACTIONS\}\}/g, "- Register ICYFLAMZE CORE project\n- Stage Obsidian vault note\n- Generate Season 1 summary\n- Generate sync report\n- Review staged Obsidian note manually\n- Prepare Season 1 IP Bible");

  const destPath = path.join(stagingDir, `ICYFLAMZE_CORE_OBSIDIAN_STAGE_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Obsidian staged note generated: outputs/icyflamze_core/obsidian_staging/ICYFLAMZE_CORE_OBSIDIAN_STAGE_${dateStr}.md`);
  writeLog(`Generated Obsidian staged note at ${destPath}`);

  if (WRITE_STAGING_OUTPUT) {
    const stageDestPath = path.join(WRITE_STAGING_OUTPUT, `ICYFLAMZE_CORE_OBSIDIAN_STAGE_${dateStr}.md`);
    fs.writeFileSync(stageDestPath, content, 'utf-8');
    console.log(`✅ Staged note copied to Obsidian write-gateway: outputs/write_staging/ICYFLAMZE_CORE_OBSIDIAN_STAGE_${dateStr}.md`);
    writeLog(`Copied Obsidian staged note to write_staging folder`);
  }
}

function handleSeasonSummary(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'season-one-summary-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let content = fs.readFileSync(templatePath, 'utf-8');

  content = content
    .replace(/\{\{SEASON_TITLE\}\}/g, config.SEASON_ONE_TITLE)
    .replace(/\{\{LOGLINE\}\}/g, "In a pressure-cooked city, a street-smart creative technologist merges scientific discipline and hip-hop mythology to build an autonomous cultural empire.")
    .replace(/\{\{EPISODE_ARC\}\}/g, 
`- Episode 1: The Core Wakes - The birth of the Street Scholar under city pressure.
- Episode 2: Strategy on the Board - Strategic chess moves in the music underground.
- Episode 3: Two Lighters Up - Finding fire between street survival and high tech.
- Episode 4: Formulas and Soundwaves - Merging equations with deep bass.
- Episode 5: The Blue-Gold Flame - Ignition of the AI-era music-tech revolution.
- Episode 6: Legacy of the Architect - Sealing the system sovereignty.`)
    .replace(/\{\{EPISODE_1_TITLE\}\}/g, "The Core Wakes")
    .replace(/\{\{EPISODE_1_DESCRIPTION\}\}/g, "Under intense urban pressure, Icyflamze activates the AI panels of Brilliantaire OS, igniting the blue-gold flame that begins his evolution into the Street Scholar.")
    .replace(/\{\{SYMBOLS\}\}/g, "chess, strategy, lighters, books, formulas, AI panels, soundwaves, city pressure, blue-gold flame")
    .replace(/\{\{TONE\}\}/g, "Futuristic, cerebral, gritty, elevated, strategic")
    .replace(/\{\{TRAILER_DIRECTION\}\}/g, "Fast cuts of neon-blue chessboards, anime-styled cityscapes under rain, blue-gold lighters striking, soundwave patterns vibrating to heavy bass, and formulas crawling across transparent AI panels.")
    .replace(/\{\{NEXT_BUILD\}\}/g, "Season 1 IP Bible");

  const destPath = path.join(reportsDir, `icyflamze_core_season_one_summary_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Season one summary report generated: outputs/icyflamze_core/reports/icyflamze_core_season_one_summary_${dateStr}.md`);
  writeLog(`Generated Season 1 summary at ${destPath}`);
}

function handleSyncReport(dateStr: string) {
  ensureDirectories();
  const templatePath = path.join(templatesDir, 'sync-report-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let content = fs.readFileSync(templatePath, 'utf-8');

  const registryRelPath = `outputs/icyflamze_core/registry/icyflamze_core_project_registry_${dateStr}.md`;
  const obsidianStageRelPath = `outputs/icyflamze_core/obsidian_staging/ICYFLAMZE_CORE_OBSIDIAN_STAGE_${dateStr}.md`;
  const seasonSummaryRelPath = `outputs/icyflamze_core/reports/icyflamze_core_season_one_summary_${dateStr}.md`;

  const registryExists = fs.existsSync(path.join(REPO_ROOT, registryRelPath));
  const obsidianStageExists = fs.existsSync(path.join(REPO_ROOT, obsidianStageRelPath));
  const seasonSummaryExists = fs.existsSync(path.join(REPO_ROOT, seasonSummaryRelPath));

  content = content
    .replace(/\{\{REGISTRY_PATH\}\}/g, registryExists ? registryRelPath : 'Not generated')
    .replace(/\{\{OBSIDIAN_STAGE_PATH\}\}/g, obsidianStageExists ? obsidianStageRelPath : 'Not generated')
    .replace(/\{\{SEASON_SUMMARY_PATH\}\}/g, seasonSummaryExists ? seasonSummaryRelPath : 'Not generated')
    .replace(/\{\{LOCAL_DOCS_UPDATED\}\}/g, 'PROJECTS.md, SYSTEM_STATUS.md, NEXT_ACTIONS.md, README.md, COMMANDS.md')
    .replace(/\{\{DIRECT_VAULT_WRITE\}\}/g, config.ALLOW_OBSIDIAN_DIRECT_WRITE ? 'Allowed' : 'Blocked')
    .replace(/\{\{MANUAL_APPROVAL_REQUIRED\}\}/g, config.REQUIRE_MANUAL_APPROVAL_FOR_OBSIDIAN_WRITE ? 'Yes' : 'No')
    .replace(/\{\{NEXT_PHASE\}\}/g, 'Season 1 IP Bible');

  const destPath = path.join(reportsDir, `icyflamze_core_sync_report_${dateStr}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Sync report generated: outputs/icyflamze_core/reports/icyflamze_core_sync_report_${dateStr}.md`);
  writeLog(`Generated sync report at ${destPath}`);
}

function handleStatus() {
  const latestRegistry = getLatestFile(registryDir, 'icyflamze_core_project_registry_');
  const latestStaged = getLatestFile(stagingDir, 'ICYFLAMZE_CORE_OBSIDIAN_STAGE_');
  const latestSeason = getLatestFile(reportsDir, 'icyflamze_core_season_one_summary_');
  const latestSync = getLatestFile(reportsDir, 'icyflamze_core_sync_report_');

  console.log("=========================================");
  console.log("📊 ICYFLAMZE CORE: System Staging Status");
  console.log("=========================================");
  console.log(`- Latest Registry File:       ${latestRegistry}`);
  console.log(`- Latest Obsidian Staged Note: ${latestStaged}`);
  console.log(`- Latest Season Summary:      ${latestSeason}`);
  console.log(`- Latest Sync Report:          ${latestSync}`);
  console.log(`- Direct Obsidian Write:      ${config.ALLOW_OBSIDIAN_DIRECT_WRITE ? 'Yes' : 'No (Blocked)'}`);
  console.log(`- Next Recommended Phase:     Season 1 IP Bible`);
  console.log("=========================================");
  writeLog("Status queried");
}

function printHelp() {
  console.log("=========================================");
  console.log("🔥 ICYFLAMZE CORE COMMANDS: Brilliantaire OS");
  console.log("=========================================");
  console.log("\nUsage: npm run icyflamze-core -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help              Print this list of available commands");
  console.log("  registry          Generate local project registry file");
  console.log("  obsidian-stage    Generate Obsidian staged note in write_staging");
  console.log("  season-summary    Generate Season 1 summary report");
  console.log("  sync-report       Generate integration sync status report");
  console.log("  status            Print latest files and configuration states");
  console.log("\nExample runs:");
  console.log("  npm run icyflamze-core -- \"help\"");
  console.log("  npm run icyflamze-core -- \"registry\"");
  console.log("  npm run icyflamze-core -- \"obsidian-stage\"");
  console.log("  npm run icyflamze-core -- \"season-summary\"");
  console.log("  npm run icyflamze-core -- \"sync-report\"");
  console.log("  npm run icyflamze-core -- \"status\"");
  console.log("=========================================");
}

const command = process.argv[2]?.trim().toLowerCase();

try {
  const dateStr = getFormattedDate();
  switch (command) {
    case 'registry':
      handleRegistry(dateStr);
      break;
    case 'obsidian-stage':
      handleObsidianStage(dateStr);
      break;
    case 'season-summary':
      handleSeasonSummary(dateStr);
      break;
    case 'sync-report':
      handleSyncReport(dateStr);
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
      console.log("💡 Run 'npm run icyflamze-core-help' to see available commands.");
      writeLog(`Attempted unknown command: ${command}`);
      process.exit(1);
  }
} catch (error: any) {
  console.error(`❌ Action failed: ${error.message}`);
  writeLog(`Error: ${error.message}`);
  process.exit(1);
}
