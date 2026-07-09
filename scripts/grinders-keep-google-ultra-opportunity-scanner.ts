import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';

import {
  GOOGLE_ULTRA_SCANNER_ONLY,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_AUTOMATED_GOOGLE_EXECUTION,
  REQUIRE_MANUAL_REVIEW,
  GOOGLE_ULTRA_WORKFLOW_TYPES,
  SCANNER_STATUS_LABELS,
  GOOGLE_ULTRA_SCAN_DIR,
  GOOGLE_ULTRA_SCAN_REPORTS_DIR,
  GOOGLE_ULTRA_SCAN_LOG_DIR,
  GOOGLE_ULTRA_SCAN_TEMPLATES_DIR
} from '../config/grinders-keep-google-ultra-opportunity-scanner.js';

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

function writeLog(message: string) {
  const logDir = path.join(REPO_ROOT, GOOGLE_ULTRA_SCAN_LOG_DIR);
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `scanner_log_2026-06-01.md`);
  const timestamp = new Date().toISOString();
  const entry = `| ${timestamp} | ${message} |\n`;
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, entry, 'utf-8');
  } else {
    fs.writeFileSync(logPath, `# Google Ultra Opportunity Scanner Execution Log - 2026-06-01\n\n| Timestamp | Event |\n|---|---|\n${entry}`, 'utf-8');
  }
}

// Parse PROJECTS.md to identify needs
interface ProjectNeed {
  projectName: string;
  purpose: string;
  notes: string;
  mappedWorkflow: string;
  confidenceScore: number;
}

function scanProjectNeeds(): ProjectNeed[] {
  const projectsPath = path.join(REPO_ROOT, 'PROJECTS.md');
  if (!fs.existsSync(projectsPath)) {
    return [];
  }
  const content = fs.readFileSync(projectsPath, 'utf-8');
  const lines = content.split('\n');
  const needs: ProjectNeed[] = [];

  for (const line of lines) {
    if (line.startsWith('|') && !line.includes('Project Name') && !line.includes('---|')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 8) {
        const projectName = parts[1].replace(/\*\*/g, '');
        const purpose = parts[2];
        const notes = parts[7];
        
        let mappedWorkflow = 'Gemini';
        let confidenceScore = 7;

        const nameLower = projectName.toLowerCase();
        if (nameLower.includes('tree groove')) {
          mappedWorkflow = 'YouTube, Docs, Google Vids';
          confidenceScore = 9;
        } else if (nameLower.includes('knowledge harvest')) {
          mappedWorkflow = 'NotebookLM, Drive, Sheets';
          confidenceScore = 9;
        } else if (nameLower.includes('icyflamze')) {
          mappedWorkflow = 'Gemini, Docs';
          confidenceScore = 8;
        } else if (nameLower.includes('profbetgeng')) {
          mappedWorkflow = 'Sheets, Drive';
          confidenceScore = 8;
        } else if (nameLower.includes('sporty')) {
          mappedWorkflow = 'YouTube, Gmail, Docs';
          confidenceScore = 9;
        } else if (nameLower.includes('brilliantier')) {
          mappedWorkflow = 'Antigravity, Drive';
          confidenceScore = 9;
        }

        needs.push({
          projectName,
          purpose,
          notes,
          mappedWorkflow,
          confidenceScore
        });
      }
    }
  }
  return needs;
}

async function runScan() {
  await announceIntent('Grinders Keep Google Ultra Opportunity Scanner Scan');
  console.log('🔍 Initializing Google Ultra Opportunity Scanner...');
  writeLog('Started opportunity scan sweep.');

  const needs = scanProjectNeeds();
  console.log(`Parsed ${needs.length} projects from PROJECTS.md.`);

  // Build mappings table markdown
  let mappingsTable = '| Project | Purpose | Mapped Google Workflow | Confidence Score | Staged Status |\n|---|---|---|---|---|\n';
  for (const need of needs) {
    mappingsTable += `| **${need.projectName}** | ${need.purpose} | ${need.mappedWorkflow} | ${need.confidenceScore}/10 | staged |\n`;
  }

  // Load and compile opportunity scan template
  const templatesDir = path.join(REPO_ROOT, GOOGLE_ULTRA_SCAN_TEMPLATES_DIR);
  const scanTemplatePath = path.join(templatesDir, 'opportunity-scan-template.md');
  
  if (!fs.existsSync(scanTemplatePath)) {
    console.error(`❌ Error: Template not found at ${scanTemplatePath}`);
    process.exit(1);
  }

  let scanReport = fs.readFileSync(scanTemplatePath, 'utf-8');
  scanReport = scanReport
    .replace(/{{dateScanned}}/g, getScanDate())
    .replace(/{{status}}/g, 'complete')
    .replace(/{{totalNeeds}}/g, String(needs.length))
    .replace(/{{totalMapped}}/g, String(needs.filter(n => n.mappedWorkflow !== 'Gemini').length))
    .replace(/{{mappingsTable}}/g, mappingsTable);

  const scanOutPath = getOutputPath(GOOGLE_ULTRA_SCAN_REPORTS_DIR, 'google_ultra_opportunity_scan_', getScanDate(), '.md');
  fs.mkdirSync(path.dirname(scanOutPath), { recursive: true });
  fs.writeFileSync(scanOutPath, scanReport, 'utf-8');
  
  console.log(`✅ Staged scan report at ${scanOutPath}`);
  writeLog(`Opportunity scan report staged at ${path.basename(scanOutPath)}.`);

  // Also write the JSON manifest
  const manifestOutPath = getOutputPath(GOOGLE_ULTRA_SCAN_REPORTS_DIR, 'google_ultra_opportunities_manifest_', getScanDate(), '.json');
  fs.writeFileSync(manifestOutPath, JSON.stringify({
    dateScanned: getScanDate(),
    status: 'complete',
    totalProjects: needs.length,
    opportunities: needs.map(n => ({
      project: n.projectName,
      need: n.purpose,
      workflows: n.mappedWorkflow.split(', '),
      confidence: n.confidenceScore
    }))
  }, null, 2), 'utf-8');
  console.log(`✅ Staged JSON manifest at ${manifestOutPath}`);

  await announceCompletion('Opportunity scan sweep completed successfully', '15');
}

async function runReport() {
  await announceIntent('Grinders Keep Google Ultra Opportunity Scanner Report Compilation');
  console.log('🛰️ Compiling Google Ultra Opportunity Staging Report...');
  writeLog('Started opportunity report compilation.');

  const needs = scanProjectNeeds();
  const templatesDir = path.join(REPO_ROOT, GOOGLE_ULTRA_SCAN_TEMPLATES_DIR);
  
  // Compile Opportunities List
  let opportunitiesList = '';
  for (const need of needs) {
    opportunitiesList += `### 💡 ${need.projectName} Workflow Expansion\n`;
    opportunitiesList += `- **Verified Need:** ${need.purpose}\n`;
    opportunitiesList += `- **Mapped Workflows:** ${need.mappedWorkflow}\n`;
    opportunitiesList += `- **Monetization Confidence:** ${need.confidenceScore}/10\n`;
    opportunitiesList += `- **Manual Instructions:** Stage task lists mapping project needs to manual ${need.mappedWorkflow} steps.\n\n`;
  }

  // Load and compile templates
  const reportTemplatePath = path.join(templatesDir, 'opportunity-report-template.md');
  const nextActionsTemplatePath = path.join(templatesDir, 'opportunity-next-actions-template.md');
  const safetyTemplatePath = path.join(templatesDir, 'opportunity-safety-checklist-template.md');

  if (!fs.existsSync(reportTemplatePath) || !fs.existsSync(nextActionsTemplatePath) || !fs.existsSync(safetyTemplatePath)) {
    console.error('❌ Error: One or more templates are missing in the templates folder.');
    process.exit(1);
  }

  let reportContent = fs.readFileSync(reportTemplatePath, 'utf-8');
  reportContent = reportContent
    .replace(/{{dateScanned}}/g, getScanDate())
    .replace(/{{priority}}/g, 'High')
    .replace(/{{totalWorkflows}}/g, String(needs.length))
    .replace(/{{opportunitiesList}}/g, opportunitiesList);

  let nextActionsContent = fs.readFileSync(nextActionsTemplatePath, 'utf-8');
  nextActionsContent = nextActionsContent
    .replace(/{{dateScanned}}/g, getScanDate())
    .replace(/{{projectName}}/g, 'Brilliantaire OS / Tree Groove Records');

  let safetyContent = fs.readFileSync(safetyTemplatePath, 'utf-8');
  safetyContent = safetyContent.replace(/{{dateScanned}}/g, getScanDate());

  const reportsDir = path.join(REPO_ROOT, GOOGLE_ULTRA_SCAN_REPORTS_DIR);
  
  const reportOut = getOutputPath(reportsDir, 'google_ultra_opportunity_report_', getScanDate(), '.md');
  const nextOut = getOutputPath(reportsDir, 'opportunity_next_actions_', getScanDate(), '.md');
  const safetyOut = getOutputPath(reportsDir, 'opportunity_safety_checklist_', getScanDate(), '.md');

  fs.writeFileSync(reportOut, reportContent, 'utf-8');
  fs.writeFileSync(nextOut, nextActionsContent, 'utf-8');
  fs.writeFileSync(safetyOut, safetyContent, 'utf-8');

  console.log(`✅ Compiled Opportunity Report: ${reportOut}`);
  console.log(`✅ Compiled Next Actions: ${nextOut}`);
  console.log(`✅ Compiled Safety Checklist: ${safetyOut}`);

  writeLog(`Opportunity staging reports compiled successfully.`);
  await announceCompletion('Opportunity reports compiled successfully', '15');
}

function runStatus() {
  console.log('\n📊 Grinders Keep Google Ultra Opportunity Scanner - Status Dashboard\n');
  const reportsDir = path.join(REPO_ROOT, GOOGLE_ULTRA_SCAN_REPORTS_DIR);
  if (!fs.existsSync(reportsDir)) {
    console.log('Status: INACTIVE (No reports generated yet)');
    return;
  }
  
  const files = fs.readdirSync(reportsDir);
  const reportsCount = files.filter(f => f.startsWith('google_ultra_opportunity_report')).length;
  const scansCount = files.filter(f => f.startsWith('google_ultra_opportunity_scan')).length;

  console.log(`Total Scans Staged: ${scansCount}`);
  console.log(`Total Opportunity Reports Staged: ${reportsCount}`);
  console.log('Safety Isolation Status: SAFE (100% Offline, No API execution active)');
  console.log('Approval Status: Awaiting Manual Review\n');
}

// CLI Command Router
const args = process.argv.slice(2);
const cmd = args[0]?.toLowerCase() || 'status';

(async () => {
  switch (cmd) {
    case 'scan':
      await runScan();
      break;
    case 'report':
      await runReport();
      break;
    case 'status':
      runStatus();
      break;
    case 'help':
    default:
      console.log('Usage: tsx scripts/grinders-keep-google-ultra-opportunity-scanner.ts [scan|report|status|help]');
      break;
  }
})();
