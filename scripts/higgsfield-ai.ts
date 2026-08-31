import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_DIRECT_HIGGSFIELD_API,
  ALLOW_AUTONOMOUS_RENDER,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_DIRECT_OBSIDIAN_WRITE,
  REQUIRE_MANUAL_APPROVAL,
  REQUIRE_RENDER_REVIEW,
  MAX_PROMPT_LENGTH,
  MAX_SCENE_DESCRIPTIONS,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  outputFolders,
  supportedRenderTypes,
  approvedVisualStyles,
  icyflamzeCoreIntegrationPoints,
  REPO_ROOT
} from '../config/higgsfield-ai.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSafeWritePath(dir: string, baseName: string, ext: string): string {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  let targetPath = path.join(dir, `${baseName}${ext}`);
  if (fs.existsSync(targetPath)) {
    const timestampSuffix = Math.floor(Date.now() / 1000);
    targetPath = path.join(dir, `${baseName}_${timestampSuffix}${ext}`);
  }
  return targetPath;
}

function logEvent(action: string, detail: string) {
  const logDir = outputFolders.logs;
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(logDir, `higgsfield_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function containsUnsafeText(text: string): boolean {
  const dangerousPatterns = [
    /rm\s+-rf/i,
    /sudo\s+/i,
    /chmod\s+/i,
    /chown\s+/i,
    /mkfs/i,
    />\s*\/dev\/sda/i,
    /eval\(/i
  ];
  return dangerousPatterns.some(pattern => pattern.test(text));
}

function generateRequestId(): string {
  const dateStr = getFormattedDate().replace(/-/g, '');
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `HF-${dateStr}-${suffix}`;
}

// 1. Create Render Request
async function handleCreateRenderRequest(renderType: string, description: string) {
  if (!renderType) {
    console.error("❌ Error: Missing render type. Usage: npm run higgsfield-ai -- \"create-render <TYPE> <DESCRIPTION>\"");
    console.error(`   Supported types: ${supportedRenderTypes.join(', ')}`);
    process.exit(1);
  }

  if (!supportedRenderTypes.includes(renderType)) {
    console.error(`❌ Error: Unsupported render type "${renderType}".`);
    console.error(`   Supported types: ${supportedRenderTypes.join(', ')}`);
    process.exit(1);
  }

  if (!description) {
    console.error("❌ Error: Missing scene description.");
    process.exit(1);
  }

  if (description.length > MAX_PROMPT_LENGTH) {
    console.error(`❌ Error: Description length (${description.length}) exceeds maximum (${MAX_PROMPT_LENGTH}).`);
    process.exit(1);
  }

  if (containsUnsafeText(description)) {
    console.error("❌ Error: Unsafe content detected in description.");
    process.exit(1);
  }

  await announceIntent(`Staging Higgsfield AI render request: ${renderType}`);
  console.log(`🎬 Staging render request for type: "${renderType}"`);

  const templatePath = path.join(REPO_ROOT, 'templates', 'higgsfield_ai', 'render-request-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  const requestId = generateRequestId();
  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{REQUEST_ID\}\}/g, requestId)
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{RENDER_TYPE\}\}/g, renderType)
    .replace(/\{\{VISUAL_STYLE\}\}/g, approvedVisualStyles[0])
    .replace(/\{\{SCENE_DESCRIPTION\}\}/g, description)
    .replace(/\{\{COLOR_PALETTE\}\}/g, 'black, gold, neon blue')
    .replace(/\{\{CAMERA_MOVEMENT\}\}/g, '(specify in review)')
    .replace(/\{\{LIGHTING\}\}/g, '(specify in review)')
    .replace(/\{\{DURATION\}\}/g, '(specify in review)')
    .replace(/\{\{PIPELINE_TARGET\}\}/g, icyflamzeCoreIntegrationPoints[0])
    .replace(/\{\{EPISODE_REF\}\}/g, '(link during review)')
    .replace(/\{\{ASSET_QUEUE_ID\}\}/g, '(assign during review)')
    .replace(/\{\{VOICEOVER_SCRIPT\}\}/g, '(compose during narrator sync)')
    .replace(/\{\{TTS_QUEUE_REF\}\}/g, '(link during narrator sync)')
    .replace(/\{\{SYNC_MODE\}\}/g, 'manual');

  const safePath = getSafeWritePath(
    outputFolders.renderRequests,
    `render_request_${sanitizeFilename(renderType)}_${getFormattedDate()}`,
    '.md'
  );
  fs.writeFileSync(safePath, template);

  const msg = `Created render request ${requestId}: ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('CREATE_RENDER_REQUEST', msg);
  await announceCompletion(`Higgsfield render request staged: ${requestId}`, '10');
}

// 2. Create Scene Description
async function handleCreateScene(title: string, composition: string) {
  if (!title) {
    console.error("❌ Error: Missing scene title. Usage: npm run higgsfield-ai -- \"create-scene <TITLE> <COMPOSITION>\"");
    process.exit(1);
  }

  if (!composition) {
    console.error("❌ Error: Missing visual composition description.");
    process.exit(1);
  }

  if (containsUnsafeText(composition)) {
    console.error("❌ Error: Unsafe content detected.");
    process.exit(1);
  }

  await announceIntent(`Creating scene description: ${title}`);
  console.log(`🎨 Creating scene description: "${title}"`);

  const templatePath = path.join(REPO_ROOT, 'templates', 'higgsfield_ai', 'scene-description-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  const sceneId = `SC-${getFormattedDate().replace(/-/g, '')}-${Math.floor(Math.random() * 9000) + 1000}`;
  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{SCENE_TITLE\}\}/g, title)
    .replace(/\{\{SCENE_ID\}\}/g, sceneId)
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{VISUAL_STYLE\}\}/g, approvedVisualStyles[0])
    .replace(/\{\{DURATION\}\}/g, '(specify in review)')
    .replace(/\{\{VISUAL_COMPOSITION\}\}/g, composition)
    .replace(/\{\{CHARACTER_DIRECTIVES\}\}/g, '(add character specs from IP Bible)')
    .replace(/\{\{ENVIRONMENT\}\}/g, '(describe environment and atmosphere)')
    .replace(/\{\{MOTION_NOTES\}\}/g, '(add motion and transition directives)')
    .replace(/\{\{IP_BIBLE_REF\}\}/g, '(link to IP Bible section)')
    .replace(/\{\{BRAND_PILLARS\}\}/g, 'street intelligence, scientific thinking, AI systems')
    .replace(/\{\{VISUAL_TAGS\}\}/g, 'anime cyber aesthetic, black, gold, neon blue');

  const safePath = getSafeWritePath(
    outputFolders.sceneDescriptions,
    `scene_${sanitizeFilename(title)}_${getFormattedDate()}`,
    '.md'
  );
  fs.writeFileSync(safePath, template);

  const msg = `Created scene ${sceneId}: ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('CREATE_SCENE', msg);
  await announceCompletion(`Scene description staged: ${sceneId}`, '10');
}

// 3. Create Storyboard
async function handleCreateStoryboard(title: string) {
  if (!title) {
    console.error("❌ Error: Missing storyboard title. Usage: npm run higgsfield-ai -- \"create-storyboard <TITLE>\"");
    process.exit(1);
  }

  await announceIntent(`Creating storyboard: ${title}`);
  console.log(`📋 Creating storyboard: "${title}"`);

  const sceneDir = outputFolders.sceneDescriptions;
  let sceneCount = 0;
  let sceneSequence = 'No scene descriptions found. Create scenes first with `create-scene`.';
  let syncMap = '| (none) | - | - | - |';

  if (fs.existsSync(sceneDir)) {
    const sceneFiles = fs.readdirSync(sceneDir).filter(f => f.endsWith('.md'));
    sceneCount = sceneFiles.length;
    if (sceneCount > 0) {
      sceneSequence = sceneFiles.map((f, i) => `${i + 1}. [${f}](../scene_descriptions/${f})`).join('\n');
      syncMap = sceneFiles.map((f, i) => `| ${i + 1} | (set timing) | (add narrator line) | (link TTS ref) |`).join('\n');
    }
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'higgsfield_ai', 'storyboard-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  const storyboardId = `SB-${getFormattedDate().replace(/-/g, '')}-${Math.floor(Math.random() * 9000) + 1000}`;
  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{STORYBOARD_TITLE\}\}/g, title)
    .replace(/\{\{STORYBOARD_ID\}\}/g, storyboardId)
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{SCENE_COUNT\}\}/g, String(sceneCount))
    .replace(/\{\{TOTAL_DURATION\}\}/g, '(calculate after scene review)')
    .replace(/\{\{VISUAL_STYLE\}\}/g, approvedVisualStyles[0])
    .replace(/\{\{SCENE_SEQUENCE\}\}/g, sceneSequence)
    .replace(/\{\{SYNC_MAP\}\}/g, syncMap)
    .replace(/\{\{EPISODE_REF\}\}/g, '(link to ICYFLAMZE CORE episode)')
    .replace(/\{\{ASSET_QUEUE_REFS\}\}/g, '(link asset queue entries)')
    .replace(/\{\{IP_BIBLE_SECTIONS\}\}/g, '(reference IP Bible sections)')
    .replace(/\{\{NOTES\}\}/g, '');

  const safePath = getSafeWritePath(
    outputFolders.storyboards,
    `storyboard_${sanitizeFilename(title)}_${getFormattedDate()}`,
    '.md'
  );
  fs.writeFileSync(safePath, template);

  const msg = `Created storyboard ${storyboardId}: ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('CREATE_STORYBOARD', msg);
  await announceCompletion(`Storyboard staged: ${storyboardId}`, '10');
}

// 4. Create Narrator Sync Package
async function handleNarratorSync(storyboardRef: string) {
  if (!storyboardRef) {
    console.error("❌ Error: Missing storyboard reference. Usage: npm run higgsfield-ai -- \"narrator-sync <STORYBOARD_FILE>\"");
    process.exit(1);
  }

  await announceIntent(`Creating narrator sync package for: ${storyboardRef}`);
  console.log(`🎙️ Creating narrator sync package for: "${storyboardRef}"`);

  const storyboardPath = path.join(outputFolders.storyboards, storyboardRef);
  let timingMap = '| 1 | 00:00 | (end) | (add line) | (add cue) |';
  let voiceoverScript = '(Compose voice-over script aligned to storyboard scenes)';

  if (fs.existsSync(storyboardPath)) {
    console.log(`📄 Found storyboard: ${storyboardRef}`);
  } else {
    console.warn(`⚠️ Storyboard file not found at expected path. Creating sync package with placeholder timing.`);
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'higgsfield_ai', 'narrator-sync-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  const packageId = `NS-${getFormattedDate().replace(/-/g, '')}-${Math.floor(Math.random() * 9000) + 1000}`;
  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{PACKAGE_TITLE\}\}/g, `Narrator Sync - ${storyboardRef}`)
    .replace(/\{\{PACKAGE_ID\}\}/g, packageId)
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{STORYBOARD_REF\}\}/g, storyboardRef)
    .replace(/\{\{VOICE_PROFILE\}\}/g, '(set voice profile from TTS model registry)')
    .replace(/\{\{VOICEOVER_SCRIPT\}\}/g, voiceoverScript)
    .replace(/\{\{TIMING_MAP\}\}/g, timingMap)
    .replace(/\{\{TTS_QUEUE_REF\}\}/g, '(link to narrator TTS queue entry)')
    .replace(/\{\{TTS_MODEL\}\}/g, '(set from narrator TTS model registry)')
    .replace(/\{\{AUDIO_FORMAT\}\}/g, 'wav')
    .replace(/\{\{RENDER_STATUS\}\}/g, 'pending')
    .replace(/\{\{ALIGNMENT_NOTES\}\}/g, '(add alignment notes after audio render)');

  const safePath = getSafeWritePath(
    outputFolders.narratorSync,
    `narrator_sync_${sanitizeFilename(storyboardRef)}_${getFormattedDate()}`,
    '.md'
  );
  fs.writeFileSync(safePath, template);

  const msg = `Created narrator sync package ${packageId}: ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('NARRATOR_SYNC', msg);
  await announceCompletion(`Narrator sync package staged: ${packageId}`, '10');
}

// 5. Export to Obsidian
async function handleObsidianExport() {
  if (ALLOW_DIRECT_OBSIDIAN_WRITE) {
    console.error("❌ Safety violation: Direct Obsidian write is enabled but should be disabled.");
    process.exit(1);
  }

  await announceIntent('Staging Higgsfield AI summary for Obsidian export');
  console.log('📝 Staging Obsidian export summary...');

  const dateStr = getFormattedDate();
  let renderCount = 0;
  let sceneCount = 0;
  let storyboardCount = 0;
  let syncCount = 0;

  if (fs.existsSync(outputFolders.renderRequests)) {
    renderCount = fs.readdirSync(outputFolders.renderRequests).filter(f => f.endsWith('.md')).length;
  }
  if (fs.existsSync(outputFolders.sceneDescriptions)) {
    sceneCount = fs.readdirSync(outputFolders.sceneDescriptions).filter(f => f.endsWith('.md')).length;
  }
  if (fs.existsSync(outputFolders.storyboards)) {
    storyboardCount = fs.readdirSync(outputFolders.storyboards).filter(f => f.endsWith('.md')).length;
  }
  if (fs.existsSync(outputFolders.narratorSync)) {
    syncCount = fs.readdirSync(outputFolders.narratorSync).filter(f => f.endsWith('.md')).length;
  }

  const exportContent = `# Higgsfield AI - Obsidian Export Summary

- **Export Date:** ${dateStr}
- **Bridge Mode:** ${BRIDGE_MODE}
- **Integration Target:** ${INTEGRATION_TARGET}

## Asset Inventory

| Asset Type | Count | Status |
|---|---|---|
| Render Requests | ${renderCount} | staged |
| Scene Descriptions | ${sceneCount} | staged |
| Storyboards | ${storyboardCount} | staged |
| Narrator Sync Packages | ${syncCount} | staged |

## Visual Style Profile

${approvedVisualStyles.map(s => `- ${s}`).join('\n')}

## ICYFLAMZE CORE Pipeline Links

${icyflamzeCoreIntegrationPoints.map(p => `- ${p}`).join('\n')}

## Next Actions

- [ ] Review all staged render requests for brand alignment
- [ ] Validate scene descriptions against IP Bible
- [ ] Confirm narrator sync timing maps
- [ ] Submit approved renders to ICYFLAMZE CORE asset queue

---

*Staged for Obsidian export via Approved Write Gateway. Direct vault write is disabled.*
`;

  const safePath = getSafeWritePath(
    outputFolders.obsidianExports,
    `higgsfield_obsidian_export_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, exportContent);

  const msg = `Obsidian export staged: ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('OBSIDIAN_EXPORT', msg);
  await announceCompletion('Higgsfield AI Obsidian export staged', '10');
}

// 6. Status Report
async function handleStatus() {
  console.log(`\n🎬 ${PROJECT_NAME} - Bridge Status Report`);
  console.log(`${'─'.repeat(50)}`);
  console.log(`  Tool Type:         ${TOOL_TYPE}`);
  console.log(`  Bridge Mode:       ${BRIDGE_MODE}`);
  console.log(`  Integration:       ${INTEGRATION_TARGET}`);
  console.log(`  API Enabled:       ${ALLOW_DIRECT_HIGGSFIELD_API}`);
  console.log(`  Auto Render:       ${ALLOW_AUTONOMOUS_RENDER}`);
  console.log(`  External API:      ${ALLOW_EXTERNAL_API_CALLS}`);
  console.log(`  Manual Approval:   ${REQUIRE_MANUAL_APPROVAL}`);
  console.log(`  Render Review:     ${REQUIRE_RENDER_REVIEW}`);
  console.log(`${'─'.repeat(50)}`);

  const folders = [
    { name: 'Render Requests', dir: outputFolders.renderRequests },
    { name: 'Scene Descriptions', dir: outputFolders.sceneDescriptions },
    { name: 'Storyboards', dir: outputFolders.storyboards },
    { name: 'Approved Renders', dir: outputFolders.approvedRenders },
    { name: 'Narrator Sync', dir: outputFolders.narratorSync },
    { name: 'Obsidian Exports', dir: outputFolders.obsidianExports },
    { name: 'Logs', dir: outputFolders.logs }
  ];

  console.log('\n  📁 Output Directories:');
  for (const folder of folders) {
    let count = 0;
    if (fs.existsSync(folder.dir)) {
      count = fs.readdirSync(folder.dir).filter(f => f.endsWith('.md')).length;
    }
    const status = fs.existsSync(folder.dir) ? `${count} files` : 'not created';
    console.log(`     ${folder.name.padEnd(22)} ${status}`);
  }

  console.log('\n  🎨 Supported Render Types:');
  for (const rt of supportedRenderTypes) {
    console.log(`     - ${rt}`);
  }

  console.log('\n  🖌️  Approved Visual Styles:');
  for (const vs of approvedVisualStyles) {
    console.log(`     - ${vs}`);
  }

  console.log('\n  🔗 ICYFLAMZE CORE Integration Points:');
  for (const ip of icyflamzeCoreIntegrationPoints) {
    console.log(`     - ${ip}`);
  }

  console.log('');
  logEvent('STATUS', 'Status report generated');
}

// Main dispatcher
async function main() {
  if (ALLOW_DIRECT_HIGGSFIELD_API) {
    console.error("❌ Safety gate: ALLOW_DIRECT_HIGGSFIELD_API is enabled. This is not permitted in manual-first mode.");
    process.exit(1);
  }

  if (ALLOW_AUTONOMOUS_RENDER) {
    console.error("❌ Safety gate: ALLOW_AUTONOMOUS_RENDER is enabled. This is not permitted.");
    process.exit(1);
  }

  if (ALLOW_EXTERNAL_API_CALLS) {
    console.error("❌ Safety gate: ALLOW_EXTERNAL_API_CALLS is enabled. This is not permitted in manual-first mode.");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const fullCommand = args.join(' ').trim();

  if (!fullCommand) {
    console.error("❌ Error: No command provided. Run `npm run higgsfield-ai-help` for usage.");
    process.exit(1);
  }

  const parts = fullCommand.split(/\s+/);
  const command = parts[0];
  const restArgs = parts.slice(1).join(' ');

  switch (command) {
    case 'create-render': {
      const renderParts = restArgs.split(/\s+/);
      const renderType = renderParts[0] || '';
      const description = renderParts.slice(1).join(' ');
      await handleCreateRenderRequest(renderType, description);
      break;
    }
    case 'create-scene': {
      const sceneParts = restArgs.split(/\s+/);
      const title = sceneParts[0] || '';
      const composition = sceneParts.slice(1).join(' ');
      await handleCreateScene(title, composition);
      break;
    }
    case 'create-storyboard':
      await handleCreateStoryboard(restArgs);
      break;
    case 'narrator-sync':
      await handleNarratorSync(restArgs);
      break;
    case 'obsidian-export':
      await handleObsidianExport();
      break;
    case 'status':
      await handleStatus();
      break;
    default:
      console.error(`❌ Unknown command: "${command}". Run \`npm run higgsfield-ai-help\` for usage.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`❌ Fatal error: ${err.message}`);
  process.exit(1);
});
