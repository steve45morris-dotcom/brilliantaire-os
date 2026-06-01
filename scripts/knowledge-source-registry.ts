import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';

import {
  REGISTRY_ONLY,
  MANUAL_URL_INTAKE_ONLY,
  ALLOW_CHANNEL_SCRAPING,
  ALLOW_VIDEO_DOWNLOAD,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_OBSIDIAN_WRITE,
  REQUIRE_NOTEBOOKLM_STAGING,
  REQUIRE_MANUAL_REVIEW,
  APPROVED_CREATORS,
  APPROVED_CATEGORIES,
  PRIORITY_LABELS,
  TRANSCRIPT_STATUS_LABELS,
  WORKFLOW_VALUE_LABELS,
  SOURCE_REGISTRY_DIR,
  SOURCE_REGISTRY_REPORTS_DIR,
  SOURCE_REGISTRY_STAGED_DIR,
  SOURCE_REGISTRY_LOG_DIR
} from '../config/knowledge-source-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = '/Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os';

function getScanDate(): string {
  return '2026-06-01'; // Fixed local anchor date
}

function getOutputPath(dir: string, prefix: string, dateStr: string, ext: string): string {
  const destDir = path.isAbsolute(dir) ? dir : path.join(REPO_ROOT, dir);
  const baseFile = path.join(destDir, `${prefix}${dateStr}${ext}`);
  if (!fs.existsSync(baseFile)) {
    return baseFile;
  }
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return path.join(destDir, `${prefix}${dateStr}_${hours}${minutes}${seconds}${ext}`);
}

function findLatestFile(dir: string, prefix: string, suffix: string): string | null {
  const fullDir = path.isAbsolute(dir) ? dir : path.join(REPO_ROOT, dir);
  if (!fs.existsSync(fullDir)) return null;
  try {
    const files = fs.readdirSync(fullDir);
    const matched = files.filter(f => f.startsWith(prefix) && f.endsWith(suffix)).sort();
    if (matched.length > 0) {
      return path.join(fullDir, matched[matched.length - 1]);
    }
  } catch {}
  return null;
}

function countFilesInDir(dir: string, ext: string): number {
  const fullDir = path.isAbsolute(dir) ? dir : path.join(REPO_ROOT, dir);
  if (!fs.existsSync(fullDir)) return 0;
  try {
    const files = fs.readdirSync(fullDir);
    return files.filter(f => f.endsWith(ext)).length;
  } catch {
    return 0;
  }
}

function writeLog(message: string) {
  const logDir = path.join(REPO_ROOT, SOURCE_REGISTRY_LOG_DIR);
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `registry_log_2026-06-01.md`);
  const timestamp = new Date().toISOString();
  const entry = `| ${timestamp} | ${message} |\n`;
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, entry, 'utf-8');
  } else {
    fs.writeFileSync(logPath, `# Knowledge Source Registry Execution Log - 2026-06-01\n\n| Timestamp | Event |\n|---|---|\n${entry}`, 'utf-8');
  }
}

// 1. Add Source Julian
function runAddSourceJulian() {
  console.log('📖 Adding staged source record for creator: Julian Goldie...');
  
  const creator = 'Julian Goldie';
  const sourceUrl = 'https://www.youtube.com/@JulianGoldieSEO';
  const categories = 'AI automation, SEO, content systems';
  const priority = 'high';
  const transcriptStatus = 'needed';
  const notebookLmRouting = REQUIRE_NOTEBOOKLM_STAGING ? 'pending' : 'bypassed';
  const obsidianExport = ALLOW_OBSIDIAN_WRITE ? 'pending' : 'blocked_read_only';
  const workflowValue = 'needs_review';
  const nextAction = 'Verify latest video URLs manually';

  // Load Template
  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/source_registry/source-registry-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 📖 Approved Creator Source Record\n- **Creator:** {{creator}}\n- **Source URL:** {{sourceUrl}}\n- **Categories:** {{categories}}\n- **Priority:** {{priority}}\n- **Transcript Status:** {{transcriptStatus}}\n- **NotebookLM Routing:** {{notebookLmRouting}}\n- **Obsidian Export:** {{obsidianExport}}\n- **Workflow Value:** {{workflowValue}}\n- **Next Action:** {{nextAction}}`;
  }

  const outputContent = template
    .replace('{{creator}}', creator)
    .replace('{{sourceUrl}}', sourceUrl)
    .replace('{{categories}}', categories)
    .replace('{{priority}}', priority)
    .replace('{{transcriptStatus}}', transcriptStatus)
    .replace('{{notebookLmRouting}}', notebookLmRouting)
    .replace('{{obsidianExport}}', obsidianExport)
    .replace('{{workflowValue}}', workflowValue)
    .replace('{{nextAction}}', nextAction);

  const destDir = path.join(REPO_ROOT, SOURCE_REGISTRY_STAGED_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(SOURCE_REGISTRY_STAGED_DIR, 'julian_goldie_source_record_', getScanDate(), '.md');
  fs.writeFileSync(destPath, outputContent, 'utf-8');

  console.log(`✅ Staged creator source record generated: file://${destPath}`);
  writeLog(`Staged creator source record generated: ${path.basename(destPath)}`);
}

// 2. Priority Report
function runPriorityReport() {
  console.log('📖 Generating source priority report...');

  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/source_registry/source-priority-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🎯 Knowledge Harvest Source Priority Report\n- **Creator:** {{creator}}\n- **Source:** {{source}}\n- **Priority:** {{priority}}\n- **Reason:** {{reason}}\n- **Processing Order:** {{processingOrder}}\n- **Next Action:** {{nextAction}}`;
  }

  // Generate standard content
  const creator = 'Julian Goldie';
  const source = 'AI Agent Automation Channel';
  const priority = 'high';
  const reason = 'Julian Goldie is the approved starter creator for automation, SEO, and agent content.';
  const processingOrder = '1';
  const nextAction = 'Verify manual intake list and run transcript checks.';

  const recordSection = template
    .replace('{{creator}}', creator)
    .replace('{{source}}', source)
    .replace('{{priority}}', priority)
    .replace('{{reason}}', reason)
    .replace('{{processingOrder}}', processingOrder)
    .replace('{{nextAction}}', nextAction);

  const finalReport = `# Source Priority Report - 2026-06-01\n\n${recordSection}`;
  
  const destDir = path.join(REPO_ROOT, SOURCE_REGISTRY_REPORTS_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(SOURCE_REGISTRY_REPORTS_DIR, 'source_priority_report_', getScanDate(), '.md');
  fs.writeFileSync(destPath, finalReport, 'utf-8');

  console.log(`✅ Source priority report generated: file://${destPath}`);
  writeLog(`Source priority report generated: ${path.basename(destPath)}`);
}

// 3. Transcript Status
function runTranscriptStatus() {
  console.log('📖 Generating transcript status report...');

  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/source_registry/transcript-status-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🎙️ Knowledge Source Transcript Status Report\n- **Source:** {{source}}\n- **Transcript Status:** {{transcriptStatus}}\n- **Reason:** {{reason}}\n- **Required Action:** {{requiredAction}}\n- **Review Status:** {{reviewStatus}}`;
  }

  // Source 1
  const block1 = template
    .replace('{{source}}', 'Julian Goldie AI Agent Channel')
    .replace('{{transcriptStatus}}', 'needed')
    .replace('{{reason}}', 'Newly added creator source channel.')
    .replace('{{requiredAction}}', 'Locate manual video URLs and request transcription.')
    .replace('{{reviewStatus}}', 'needs_review');

  // Source 2
  const block2 = template
    .replace('{{source}}', 'Julian Goldie\'s AI SEO Strategy')
    .replace('{{transcriptStatus}}', 'available')
    .replace('{{reason}}', 'Video notes compiled in video_notes/.')
    .replace('{{requiredAction}}', 'None (proceed to NotebookLM staging).')
    .replace('{{reviewStatus}}', 'approved');

  const finalReport = `# Transcript Status Report - 2026-06-01\n\n## Staged Status Details:\n\n${block1}\n\n---\n\n${block2}`;

  const destDir = path.join(REPO_ROOT, SOURCE_REGISTRY_REPORTS_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(SOURCE_REGISTRY_REPORTS_DIR, 'transcript_status_report_', getScanDate(), '.md');
  fs.writeFileSync(destPath, finalReport, 'utf-8');

  console.log(`✅ Transcript status report generated: file://${destPath}`);
  writeLog(`Transcript status report generated: ${path.basename(destPath)}`);
}

// 4. Workflow Value
function runWorkflowValue() {
  console.log('📖 Generating workflow value report...');

  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/source_registry/workflow-value-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 💡 Knowledge Source Workflow Value Report\n- **Source:** {{source}}\n- **Workflow Value:** {{workflowValue}}\n- **OS Module:** {{osModule}}\n- **Icyflamze Use:** {{icyflamzeUse}}\n- **Tree Groove Records Use:** {{treeGrooveRecordsUse}}\n- **Difficulty:** {{difficulty}}\n- **Expected Benefit:** {{expectedBenefit}}\n- **Next Action:** {{nextAction}}`;
  }

  const block = template
    .replace('{{source}}', 'Julian Goldie\'s AI SEO Strategy')
    .replace('{{workflowValue}}', 'study_first')
    .replace('{{osModule}}', 'Knowledge Harvest Engine (Phase 13)')
    .replace('{{icyflamzeUse}}', 'Content automation scripts and SEO campaign systems.')
    .replace('{{treeGrooveRecordsUse}}', 'Distribution systems SEO optimization.')
    .replace('{{difficulty}}', 'medium')
    .replace('{{expectedBenefit}}', 'high')
    .replace('{{nextAction}}', 'Manual operator review and Obsidian staging approval.');

  const finalReport = `# Workflow Value Report - 2026-06-01\n\n${block}`;

  const destDir = path.join(REPO_ROOT, SOURCE_REGISTRY_REPORTS_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(SOURCE_REGISTRY_REPORTS_DIR, 'workflow_value_report_', getScanDate(), '.md');
  fs.writeFileSync(destPath, finalReport, 'utf-8');

  console.log(`✅ Workflow value report generated: file://${destPath}`);
  writeLog(`Workflow value report generated: ${path.basename(destPath)}`);
}

// 5. Source Pack Status
function runSourcePackStatus() {
  console.log('📖 Generating source pack status report...');

  const harvestPack = findLatestFile('outputs/knowledge_harvest/source_packs', 'notebooklm_source_pack_', '.md');
  const bridgePack = findLatestFile('outputs/notebooklm_bridge/source_packs', 'notebooklm_bridge_source_pack_', '.md');

  const sourceCount = (harvestPack ? 1 : 0) + (bridgePack ? 1 : 0);
  const missingSources = 'Julian Goldie staged creator channel (requires manual URL mapping).';
  const recommendedUpdate = 'Execute manual transcription link mapping and append to bridge source packs.';

  const finalReport = `# Source Pack Status Report - 2026-06-01

- **Latest Knowledge Harvest Source Pack:** ${harvestPack ? `file://${harvestPack}` : 'None found'}
- **Latest NotebookLM Bridge Source Pack:** ${bridgePack ? `file://${bridgePack}` : 'None found'}
- **Source Count:** ${sourceCount}
- **Missing Sources:** ${missingSources}
- **Recommended Source Pack Update:** ${recommendedUpdate}
`;

  const destDir = path.join(REPO_ROOT, SOURCE_REGISTRY_REPORTS_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(SOURCE_REGISTRY_REPORTS_DIR, 'source_pack_status_', getScanDate(), '.md');
  fs.writeFileSync(destPath, finalReport, 'utf-8');

  console.log(`✅ Source pack status report generated: file://${destPath}`);
  writeLog(`Source pack status report generated: ${path.basename(destPath)}`);
}

// 6. Status
function runStatus() {
  console.log('📖 Querying Knowledge Harvest source registry status...');

  const stagedCount = countFilesInDir(SOURCE_REGISTRY_STAGED_DIR, '.md');
  
  const latestPriority = findLatestFile(SOURCE_REGISTRY_REPORTS_DIR, 'source_priority_report_', '.md');
  const latestTranscript = findLatestFile(SOURCE_REGISTRY_REPORTS_DIR, 'transcript_status_report_', '.md');
  const latestWorkflow = findLatestFile(SOURCE_REGISTRY_REPORTS_DIR, 'workflow_value_report_', '.md');
  const latestPack = findLatestFile(SOURCE_REGISTRY_REPORTS_DIR, 'source_pack_status_', '.md');

  console.log(`
📊 Knowledge Harvest Source Registry Status:

Active Records & Reports:
  - Staged Source Count:         ${stagedCount}
  - Source Priority Report:      ${latestPriority ? 'yes' : 'no'}
  - Transcript Status Report:    ${latestTranscript ? 'yes' : 'no'}
  - Workflow Value Report:       ${latestWorkflow ? 'yes' : 'no'}
  - Source Pack Status Report:   ${latestPack ? 'yes' : 'no'}

Reports URLs:
  - Priority Report:             ${latestPriority ? `file://${latestPriority}` : 'NOT FOUND'}
  - Transcript Status Report:    ${latestTranscript ? `file://${latestTranscript}` : 'NOT FOUND'}
  - Workflow Value Report:       ${latestWorkflow ? `file://${latestWorkflow}` : 'NOT FOUND'}
  - Source Pack Status Report:   ${latestPack ? `file://${latestPack}` : 'NOT FOUND'}

Next Recommended Action:
  - Review newly added creator sources manually. Keep scraping/API integrations blocked.
`);
}

async function main() {
  let args: string[] = [];
  const argInput = process.argv[2]?.trim();
  if (argInput && argInput.includes(' ')) {
    args = argInput.split(/\s+/);
  } else {
    args = process.argv.slice(2).map(a => a.trim());
  }

  const command = args[0]?.toLowerCase();
  const subCommand = args[1]?.toLowerCase();
  const arg = command + (subCommand ? ' ' + subCommand : '');

  // Enforce Guardrails
  if (REGISTRY_ONLY) {
    if (ALLOW_CHANNEL_SCRAPING || ALLOW_VIDEO_DOWNLOAD || ALLOW_EXTERNAL_API_CALLS || ALLOW_OBSIDIAN_WRITE) {
      console.error('❌ Security Violation: Configuration violates REGISTRY_ONLY constraints.');
      process.exit(1);
    }
  }

  await announceIntent(`Running knowledge source registry command: ${arg || 'help'}`);

  switch (arg) {
    case 'add-source julian':
    case 'add-source': {
      runAddSourceJulian();
      break;
    }
    case 'priority-report': {
      runPriorityReport();
      break;
    }
    case 'transcript-status': {
      runTranscriptStatus();
      break;
    }
    case 'workflow-value': {
      runWorkflowValue();
      break;
    }
    case 'source-pack-status': {
      runSourcePackStatus();
      break;
    }
    case 'status': {
      runStatus();
      break;
    }
    case 'help':
    case undefined: {
      const { printHelp } = await import('./knowledge-source-registry-help.js');
      printHelp();
      break;
    }
    default: {
      console.error(`❌ Unknown command: "${arg}". Use "help" to see available commands.`);
      await announceCompletion(`Knowledge source registry failed: Unknown command "${arg}"`, '0');
      process.exit(1);
    }
  }

  await announceCompletion(`Knowledge source registry command "${arg || 'help'}" executed successfully.`, '13');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
