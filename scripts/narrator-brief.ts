import * as fs from 'fs';
import * as path from 'path';

// Helper to pad numbers
const pad = (n: number) => String(n).padStart(2, '0');

function getTimestampStr(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function getLatestFile(dirPath: string): string | null {
  if (!fs.existsSync(dirPath)) return null;
  try {
    const files = fs.readdirSync(dirPath);
    let latestFile: string | null = null;
    let latestMtime = 0;
    for (const file of files) {
      if (file.startsWith('.')) continue;
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && stat.mtimeMs > latestMtime) {
        latestMtime = stat.mtimeMs;
        latestFile = fullPath;
      }
    }
    return latestFile;
  } catch (e) {
    return null;
  }
}

function extractSection(content: string, header: string): string {
  const lines = content.split('\n');
  let inSection = false;
  const sectionLines: string[] = [];
  for (const line of lines) {
    if (line.trim().startsWith(header)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (line.trim().startsWith('##')) {
        break;
      }
      sectionLines.push(line);
    }
  }
  return sectionLines.join('\n').trim();
}

function extractActions(content: string, completed: boolean, limit: number): string {
  const lines = content.split('\n');
  const matched: string[] = [];
  const prefix = completed ? '- [x]' : '- [ ]';
  for (const line of lines) {
    if (line.trim().startsWith(prefix)) {
      matched.push(line.trim());
    }
  }
  
  if (completed) {
    // For completed actions, take the last N to show recent work
    return matched.slice(-limit).join('\n') || 'None';
  } else {
    // For open actions, take the first N to show next steps
    return matched.slice(0, limit).join('\n') || 'None';
  }
}

function loadTemplate(templateName: string): string {
  const rootDir = process.cwd();
  const templatePath = path.join(rootDir, 'templates/narrator_briefs', templateName);
  if (!fs.existsSync(templatePath)) {
    console.error(`[ERR] Template not found: ${templatePath}`);
    process.exit(1);
  }
  return fs.readFileSync(templatePath, 'utf-8');
}

// ─── Command Handlers ─────────────────────────────────────────────────────────

function handleOperator(card: any, rootDir: string, now: Date, timestampStr: string) {
  let template = loadTemplate('operator-brief-template.md');
  
  // Read risks from SYSTEM_STATUS.md
  let risks = 'No risk data available.';
  const systemStatusPath = path.join(rootDir, 'SYSTEM_STATUS.md');
  if (fs.existsSync(systemStatusPath)) {
    const content = fs.readFileSync(systemStatusPath, 'utf-8');
    risks = extractSection(content, '## ⚠️ Current Risks');
  }

  // Read next 5 actions from NEXT_ACTIONS.md
  let next5 = 'No action checklist available.';
  const nextActionsPath = path.join(rootDir, 'NEXT_ACTIONS.md');
  if (fs.existsSync(nextActionsPath)) {
    const content = fs.readFileSync(nextActionsPath, 'utf-8');
    next5 = extractActions(content, false, 5);
  }

  const sourcesFormatted = (card.sources_used || []).map((s: string) => `- ${s}`).join('\n') || '- None';

  template = template
    .replace(/{{GENERATED_AT}}/g, now.toISOString())
    .replace(/{{HEADLINE}}/g, card.headline || '—')
    .replace(/{{WHAT_HAPPENED}}/g, card.what_we_did || '—')
    .replace(/{{WHY_IT_MATTERS}}/g, card.what_it_is || '—')
    .replace(/{{WHAT_REMAINS}}/g, card.whats_left || '—')
    .replace(/{{RISKS}}/g, risks)
    .replace(/{{NEXT_5_ACTIONS}}/g, next5)
    .replace(/{{SOURCES_USED}}/g, sourcesFormatted)
    .replace(/{{SAFETY_MODE}}/g, card.safety_mode || '—');

  const outDir = path.join(rootDir, 'outputs/narrator/operator_briefs');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `operator_brief_${timestampStr}.md`);
  fs.writeFileSync(outFile, template, 'utf-8');
  console.log(`[OK] Operator Brief compiled: ${outFile}`);
}

function handleDashboard(card: any, rootDir: string, now: Date, timestampStr: string) {
  let template = loadTemplate('dashboard-feed-template.md');

  const compactSummary = `${card.what_we_did || ''} ${card.what_it_is || ''} ${card.whats_left || ''}`.trim();
  
  // Format key metrics as a readable list
  const metrics = card.key_metrics || {};
  const metricsLines = Object.entries(metrics)
    .map(([key, val]) => `- **${key.replace(/_/g, ' ')}:** ${val}`)
    .join('\n') || '- No metrics available';

  const sourcesFormatted = (card.sources_used || []).map((s: string) => `- ${s}`).join('\n') || '- None';

  template = template
    .replace(/{{GENERATED_AT}}/g, now.toISOString())
    .replace(/{{HEADLINE}}/g, card.headline || '—')
    .replace(/{{STATUS_COLOR}}/g, (card.status_color || 'green').toUpperCase())
    .replace(/{{MOOD}}/g, (card.mood || 'nominal').toUpperCase())
    .replace(/{{COMPACT_SUMMARY}}/g, compactSummary || '—')
    .replace(/{{KEY_METRICS}}/g, metricsLines)
    .replace(/{{SOURCES_USED}}/g, sourcesFormatted);

  const outDir = path.join(rootDir, 'outputs/narrator/dashboard_feed');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `dashboard_narration_feed_${timestampStr}.md`);
  fs.writeFileSync(outFile, template, 'utf-8');
  console.log(`[OK] Dashboard Narration Feed compiled: ${outFile}`);
}

function handleVoice(card: any, rootDir: string, now: Date, timestampStr: string) {
  let template = loadTemplate('voice-script-template.md');

  const openingLine = `System operational brief for ${now.toLocaleDateString()}. Telemetry parsing verified.`;
  const mainSummary = `Regarding recent tasks: ${card.what_we_did || 'System executed default housekeeping routines.'} Under the current definition: ${card.what_it_is || 'Operating systems bounds are standard.'}`;
  const completionStatus = `Operating status is ${card.status_color || 'green'}, representing a ${card.mood || 'nominal'} system state.`;
  const nextMove = `Immediate tactical milestone: ${card.whats_left || 'Maintain monitoring cycles.'}`;
  const safetyReminder = `Security enforcement: Safety mode is set to output only. Direct Obsidian writes and CLI execution gates remain locked.`;

  template = template
    .replace(/{{GENERATED_AT}}/g, now.toISOString())
    .replace(/{{OPENING_LINE}}/g, openingLine)
    .replace(/{{TACTICAL_INTENT}}/g, card.headline || '—')
    .replace(/{{MAIN_SUMMARY}}/g, mainSummary)
    .replace(/{{COMPLETION_STATUS}}/g, completionStatus)
    .replace(/{{NEXT_MOVE}}/g, nextMove)
    .replace(/{{SAFETY_REMINDER}}/g, safetyReminder);

  const outDir = path.join(rootDir, 'outputs/narrator/voice_scripts');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `voice_narration_script_${timestampStr}.md`);
  fs.writeFileSync(outFile, template, 'utf-8');
  console.log(`[OK] Voice Narration Script compiled: ${outFile}`);
}

function handleObsidian(card: any, rootDir: string, now: Date, timestampStr: string) {
  let template = loadTemplate('obsidian-brief-template.md');

  // Title & Date
  const title = `AI Briefing - ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  // System Status
  let systemStatus = 'No active capabilities listed.';
  const systemStatusPath = path.join(rootDir, 'SYSTEM_STATUS.md');
  if (fs.existsSync(systemStatusPath)) {
    const content = fs.readFileSync(systemStatusPath, 'utf-8');
    systemStatus = extractSection(content, '## 🔋 Active Capabilities');
  }

  // Source Summary from latest_snapshot.md
  let sourceSummary = 'No source snapshot content.';
  const latestSnapshotPath = path.join(rootDir, 'outputs/narrator/source_snapshots/latest_snapshot.md');
  if (fs.existsSync(latestSnapshotPath)) {
    const content = fs.readFileSync(latestSnapshotPath, 'utf-8');
    sourceSummary = extractSection(content, '## Sources Scan');
  }

  // Actions from NEXT_ACTIONS.md
  let completedActions = 'None';
  let openActions = 'None';
  const nextActionsPath = path.join(rootDir, 'NEXT_ACTIONS.md');
  if (fs.existsSync(nextActionsPath)) {
    const content = fs.readFileSync(nextActionsPath, 'utf-8');
    completedActions = extractActions(content, true, 5);
    openActions = extractActions(content, false, 10);
  }

  // Risks from SYSTEM_STATUS.md
  let risks = 'No risk data available.';
  if (fs.existsSync(systemStatusPath)) {
    const content = fs.readFileSync(systemStatusPath, 'utf-8');
    risks = extractSection(content, '## ⚠️ Current Risks');
  }

  // Next recommended phase from README.md
  let nextRecommended = 'No recommendation listed.';
  const readmePath = path.join(rootDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    const content = fs.readFileSync(readmePath, 'utf-8');
    nextRecommended = extractSection(content, '## 🚀 Next Phase Recommendation');
  }

  // Formatted tags
  const tagsList = [
    'stage/briefs',
    'status/staged',
    'safety/output_only'
  ];
  const tagsFormatted = tagsList.map(t => `  - ${t}`).join('\n');

  template = template
    .replace(/{{TITLE}}/g, title)
    .replace(/{{DATE}}/g, now.toISOString())
    .replace(/{{TAGS}}/g, tagsFormatted)
    .replace(/{{STATUS}}/g, 'staged_for_obsidian_review')
    .replace(/{{SYSTEM_STATUS}}/g, systemStatus)
    .replace(/{{SOURCE_SUMMARY}}/g, sourceSummary)
    .replace(/{{COMPLETED_ACTIONS}}/g, completedActions)
    .replace(/{{OPEN_ACTIONS}}/g, openActions)
    .replace(/{{RISKS}}/g, risks)
    .replace(/{{NEXT_RECOMMENDED_PHASE}}/g, nextRecommended);

  const outDir = path.join(rootDir, 'outputs/narrator/briefs');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `obsidian_narrator_brief_${timestampStr}.md`);
  fs.writeFileSync(outFile, template, 'utf-8');
  console.log(`[OK] Obsidian Staged Narrator Brief compiled: ${outFile}`);
}

function handleStatus(rootDir: string) {
  const cardPath = path.join(rootDir, 'outputs/narrator_card.json');
  const snapshotPath = path.join(rootDir, 'outputs/narrator/source_snapshots/latest_snapshot.md');

  const cardExists = fs.existsSync(cardPath) ? 'YES' : 'NO';
  const snapshotExists = fs.existsSync(snapshotPath) ? 'YES' : 'NO';

  const latestOperator = getLatestFile(path.join(rootDir, 'outputs/narrator/operator_briefs')) || 'none';
  const latestDashboard = getLatestFile(path.join(rootDir, 'outputs/narrator/dashboard_feed')) || 'none';
  const latestVoice = getLatestFile(path.join(rootDir, 'outputs/narrator/voice_scripts')) || 'none';
  const latestObsidian = getLatestFile(path.join(rootDir, 'outputs/narrator/briefs')) || 'none';

  const missingInputs: string[] = [];
  if (cardExists === 'NO') missingInputs.push('outputs/narrator_card.json');
  if (snapshotExists === 'NO') missingInputs.push('outputs/narrator/source_snapshots/latest_snapshot.md');

  console.log('\n=========================================');
  console.log('🧭 AI Narrator Brief Status Report');
  console.log('=========================================');
  console.log(`Latest Narrator Card Exists: ${cardExists}`);
  console.log(`Latest Source Snapshot Exists: ${snapshotExists}`);
  console.log('-----------------------------------------');
  console.log(`Latest Operator Brief   : ${latestOperator ? path.basename(latestOperator) : 'none'}`);
  console.log(`Latest Dashboard Feed   : ${latestDashboard ? path.basename(latestDashboard) : 'none'}`);
  console.log(`Latest Voice Script     : ${latestVoice ? path.basename(latestVoice) : 'none'}`);
  console.log(`Latest Obsidian Brief   : ${latestObsidian ? path.basename(latestObsidian) : 'none'}`);
  console.log('-----------------------------------------');
  console.log(`Missing Inputs          : ${missingInputs.join(', ') || 'none'}`);
  console.log(`Next Recommended Action : ${missingInputs.length > 0 ? 'Run narrator-sources and ai_narrator.py once.' : 'Review staged Obsidian briefs.'}`);
  console.log('=========================================\n');
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────

function main() {
  const rootDir = process.cwd();
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase().trim() : 'help';

  const validCommands = ['help', 'operator', 'dashboard', 'voice', 'obsidian', 'all', 'status'];

  if (!validCommands.includes(command)) {
    console.error(`[ERR] Unknown command: "${command}". Run "npm run narrator-brief-help" for options.`);
    process.exit(1);
  }

  if (command === 'help') {
    // Sourced help script
    const helpPath = path.join(rootDir, 'dist/scripts/narrator-brief-help.js');
    // If not compiled yet, run direct ts file via spawn/tsx or print fallback
    console.log('Run "npm run narrator-brief-help" to see available options.');
    return;
  }

  if (command === 'status') {
    handleStatus(rootDir);
    return;
  }

  // Load narrator card input
  const cardPath = path.join(rootDir, 'outputs/narrator_card.json');
  if (!fs.existsSync(cardPath) && command !== 'status') {
    console.error(`[ERR] Required input file missing: ${cardPath}. Please run narrator task first.`);
    process.exit(1);
  }

  let card = {};
  try {
    card = JSON.parse(fs.readFileSync(cardPath, 'utf-8'));
  } catch (e) {
    console.error(`[ERR] Failed to parse narrator card JSON: ${e}`);
    process.exit(1);
  }

  const now = new Date();
  const timestampStr = getTimestampStr(now);

  if (command === 'operator' || command === 'all') {
    handleOperator(card, rootDir, now, timestampStr);
  }
  if (command === 'dashboard' || command === 'all') {
    handleDashboard(card, rootDir, now, timestampStr);
  }
  if (command === 'voice' || command === 'all') {
    handleVoice(card, rootDir, now, timestampStr);
  }
  if (command === 'obsidian' || command === 'all') {
    handleObsidian(card, rootDir, now, timestampStr);
  }
}

main();
