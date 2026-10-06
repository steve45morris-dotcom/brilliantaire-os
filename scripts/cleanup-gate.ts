import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  CLEANUP_STAGING_ONLY,
  ALLOW_DIRECT_DELETE,
  ALLOW_RM_COMMANDS,
  REQUIRE_QUARANTINE_FIRST,
  REQUIRE_MANUAL_APPROVAL,
  ALLOW_PROJECT_AUTO_REGISTER,
  TARGET_DUPLICATE_FOLDERS,
  DUPLICATE_PATTERN,
  PROJECT_DRIFT_SCAN_ROOTS
} from '../config/cleanup-gate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Helper to get formatted date
function getISODate(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper to compute MD5 hash of file content
function getFileMD5(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch {
    return '';
  }
}

// Function to find unregistered project directories
function scanProjectDrift() {
  const projectsMdPath = path.join(REPO_ROOT, 'PROJECTS.md');
  const registered: string[] = [];
  
  if (fs.existsSync(projectsMdPath)) {
    const lines = fs.readFileSync(projectsMdPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*\|\s*\*\*([^*]+)\*\*\s*\|/);
      if (match) {
        registered.push(match[1].trim());
      }
    }
  }

  const registeredLower = new Set(registered.map(r => r.toLowerCase()));
  const unregisteredDirs: { path: string; name: string; type: string; activity: string; action: string; signature: string }[] = [];

  for (const root of PROJECT_DRIFT_SCAN_ROOTS) {
    if (!fs.existsSync(root)) continue;
    
    try {
      const entries = fs.readdirSync(root, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
        
        const projectPath = path.join(root, entry.name);
        const nameLower = entry.name.toLowerCase();
        
        // Exclude one-system folder as it's the root workspace wrapper
        if (entry.name === 'one-system') continue;

        // Perform name mapping logic
        let isRegistered = registeredLower.has(nameLower);
        if (!isRegistered) {
          // Fuzzy check: replace dashes and underscores
          const normalized = nameLower.replace(/[-_]/g, ' ');
          for (const reg of registered) {
            const regNorm = reg.toLowerCase().replace(/[-_]/g, ' ');
            if (normalized === regNorm || normalized.includes(regNorm) || regNorm.includes(normalized)) {
              isRegistered = true;
              break;
            }
          }
        }

        if (!isRegistered) {
          // Identify signature files
          const subFiles = fs.readdirSync(projectPath);
          let type = 'unknown';
          let signature = 'none';

          if (subFiles.includes('package.json')) {
            type = 'node';
            signature = 'package.json';
          } else if (subFiles.includes('requirements.txt') || subFiles.includes('pyproject.toml')) {
            type = 'python';
            signature = subFiles.includes('requirements.txt') ? 'requirements.txt' : 'pyproject.toml';
          } else if (subFiles.includes('pubspec.yaml')) {
            type = 'flutter';
            signature = 'pubspec.yaml';
          } else if (subFiles.includes('Cargo.toml')) {
            type = 'rust';
            signature = 'Cargo.toml';
          } else if (subFiles.includes('go.mod')) {
            type = 'go';
            signature = 'go.mod';
          } else if (subFiles.some(f => f.endsWith('.md'))) {
            type = 'docs';
            signature = subFiles.find(f => f.endsWith('.md')) || 'readme';
          }

          // Check activity
          let activity = 'unknown';
          try {
            const stats = fs.statSync(projectPath);
            const mtimeDiff = Date.now() - stats.mtimeMs;
            const daysDiff = mtimeDiff / (1000 * 60 * 60 * 24);
            activity = daysDiff <= 7 ? 'recent' : 'stale';
          } catch {}

          // Recommended Action
          let action = 'inspect manually';
          if (activity === 'stale') {
            action = 'archive';
          } else if (type !== 'unknown') {
            action = 'add to PROJECTS.md';
          }

          unregisteredDirs.push({
            path: projectPath,
            name: entry.name,
            type,
            activity,
            action,
            signature
          });
        }
      }
    } catch {}
  }

  return { registeredCount: registered.length, unregisteredDirs };
}

// Function to scan target directories for duplicate briefs
function scanDuplicates() {
  const duplicateCandidates: {
    folder: string;
    canonical: string;
    duplicate: string;
    pattern: string;
    confidence: string;
    action: string;
  }[] = [];

  for (const folder of TARGET_DUPLICATE_FOLDERS) {
    if (!fs.existsSync(folder)) continue;

    try {
      const files = fs.readdirSync(folder);
      for (const file of files) {
        const filePath = path.join(folder, file);
        if (!fs.statSync(filePath).isFile()) continue;

        const match = file.match(DUPLICATE_PATTERN);
        if (match) {
          // File has timestamp suffix, e.g. name_1780073595.md
          const baseName = file.replace(DUPLICATE_PATTERN, '.md');
          const canonicalPath = path.join(folder, baseName);
          
          let confidence = '50%';
          let pattern = 'Timestamp suffix match only';
          let action = 'quarantine';

          if (fs.existsSync(canonicalPath)) {
            const canonicalMD5 = getFileMD5(canonicalPath);
            const duplicateMD5 = getFileMD5(filePath);

            if (canonicalMD5 && canonicalMD5 === duplicateMD5) {
              confidence = '100%';
              pattern = 'Exact content + timestamp suffix match';
            } else {
              confidence = '90%';
              pattern = 'Base name + timestamp suffix match';
            }
          }

          duplicateCandidates.push({
            folder,
            canonical: baseName,
            duplicate: file,
            pattern,
            confidence,
            action
          });
        }
      }
    } catch {}
  }

  return duplicateCandidates;
}

// Subcommands implementation
function runScanDuplicates() {
  console.log("🔍 Scanning target folders for duplicates...");
  const candidates = scanDuplicates();
  
  const scanDate = getISODate();
  const templatePath = path.join(REPO_ROOT, 'templates', 'cleanup', 'duplicate-cleanup-plan-template.md');
  let template = '';
  
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = "# 📋 Duplicate Cleanup Plan\nScan Date: {{SCAN_DATE}}\nFolders Scanned:\n{{FOLDERS_SCANNED}}\n\n## Duplicate Candidates Found\n{{DUPLICATE_CANDIDATES_TABLE}}";
  }

  const foldersScanned = TARGET_DUPLICATE_FOLDERS.map(f => `- \`${f}\``).join('\n');
  let tableContent = '';
  
  if (candidates.length > 0) {
    tableContent = candidates.map(c => 
      `| [${c.canonical}](file://${path.join(c.folder, c.canonical)}) | [\`${c.duplicate}\`](file://${path.join(c.folder, c.duplicate)}) | ${c.pattern} | ${c.confidence} | ${c.action} |`
    ).join('\n');
  } else {
    tableContent = "| None | None | - | - | - |";
  }

  const report = template
    .replace('{{SCAN_DATE}}', scanDate)
    .replace('{{FOLDERS_SCANNED}}', foldersScanned)
    .replace('{{DUPLICATE_CANDIDATES_TABLE}}', tableContent);

  const reportDir = path.join(REPO_ROOT, 'outputs', 'cleanup', 'reports');
  fs.mkdirSync(reportDir, { recursive: true });
  
  const reportPath = path.join(reportDir, `duplicate_cleanup_scan_${scanDate}.md`);
  fs.writeFileSync(reportPath, report, 'utf-8');

  console.log(`✅ Scan complete. Report written to: file://${reportPath}`);
  console.log(`Detected duplicate candidates: ${candidates.length}`);
}

function runStageQuarantine() {
  console.log("📦 Staging duplicate quarantine plan...");
  const candidates = scanDuplicates();
  const stagingDate = getISODate();
  
  const templatePath = path.join(REPO_ROOT, 'templates', 'cleanup', 'quarantine-report-template.md');
  let template = '';
  
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = "# 🛡️ Duplicate Quarantine Report\nStaging Date: {{STAGING_DATE}}\nStatus: {{APPROVAL_STATUS}}\n\n## Quarantine Queue\n{{QUARANTINE_QUEUE_TABLE}}";
  }

  let tableContent = '';
  if (candidates.length > 0) {
    tableContent = candidates.map(c => {
      const source = path.join(c.folder, c.duplicate);
      const destination = path.join(REPO_ROOT, 'outputs', 'cleanup', 'quarantine', c.duplicate);
      return `| \`${source}\` | \`${destination}\` | Timestamped duplicate brief | ${c.confidence} | \`${source}\` | PENDING |`;
    }).join('\n');
  } else {
    tableContent = "| None | None | - | - | - | - |";
  }

  const report = template
    .replace('{{STAGING_DATE}}', stagingDate)
    .replace('{{APPROVAL_STATUS}}', 'PENDING_MANUAL_APPROVAL')
    .replace('{{QUARANTINE_QUEUE_TABLE}}', tableContent);

  const stagingDir = path.join(REPO_ROOT, 'outputs', 'cleanup', 'staging');
  fs.mkdirSync(stagingDir, { recursive: true });
  
  const stagingPath = path.join(stagingDir, `duplicate_quarantine_plan_${stagingDate}.md`);
  fs.writeFileSync(stagingPath, report, 'utf-8');

  console.log(`✅ Staging plan written to: file://${stagingPath}`);
}

function runRestorePlan() {
  console.log("🔄 Generating safety restore rollback plan...");
  const candidates = scanDuplicates();
  const genDate = getISODate();

  const templatePath = path.join(REPO_ROOT, 'templates', 'cleanup', 'restore-script-template.md');
  let template = '';

  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = "#!/bin/bash\n# Generation Date: {{GENERATED_DATE}}\n# {{SAFETY_NOTE}}\n{{RESTORE_COMMANDS}}";
  }

  let commandsContent = '';
  if (candidates.length > 0) {
    commandsContent = candidates.map(c => {
      const source = path.join(c.folder, c.duplicate);
      const destination = path.join(REPO_ROOT, 'outputs', 'cleanup', 'quarantine', c.duplicate);
      return `# Restore: ${c.duplicate}\n# cp "${destination}" "${source}"`;
    }).join('\n\n');
  } else {
    commandsContent = '# No restore actions staged.';
  }

  const script = template
    .replace('{{GENERATED_DATE}}', genDate)
    .replace('{{SAFETY_NOTE}}', 'This script copies files from quarantine back to their original directories. Execute ONLY under manual supervision.')
    .replace('{{RESTORE_COMMANDS}}', commandsContent);

  const restoreDir = path.join(REPO_ROOT, 'outputs', 'cleanup', 'restore_scripts');
  fs.mkdirSync(restoreDir, { recursive: true });

  const restorePath = path.join(restoreDir, `restore_duplicate_briefs_${genDate}.sh`);
  fs.writeFileSync(restorePath, script, 'utf-8');

  // Make sure files are not direct executable on user system without approval, so we keep it as a standard .sh script text.
  console.log(`✅ Restore rollback plan written to: file://${restorePath}`);
}

function runProjectDrift() {
  console.log("🧭 Running project registry drift check...");
  const { registeredCount, unregisteredDirs } = scanProjectDrift();
  const scanDate = getISODate();

  const templatePath = path.join(REPO_ROOT, 'templates', 'cleanup', 'project-drift-template.md');
  let template = '';

  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = "# 🧭 Project Registry Drift Report\nScan Date: {{SCAN_DATE}}\nRegistered: {{REGISTERED_COUNT}}\nUnregistered Found: {{DRIFT_COUNT}}\n\n## Unregistered Local Directories Detected\n{{DRIFT_TABLE}}";
  }

  let tableContent = '';
  if (unregisteredDirs.length > 0) {
    tableContent = unregisteredDirs.map(d =>
      `| \`${d.path}\` | \`${d.signature}\` | ${d.type} | ${d.activity} | ${d.action} |`
    ).join('\n');
  } else {
    tableContent = "| None | None | - | - | - |";
  }

  const report = template
    .replace('{{SCAN_DATE}}', scanDate)
    .replace('{{REGISTERED_COUNT}}', registeredCount.toString())
    .replace('{{DRIFT_COUNT}}', unregisteredDirs.length.toString())
    .replace('{{DRIFT_TABLE}}', tableContent);

  const reportDir = path.join(REPO_ROOT, 'outputs', 'cleanup', 'reports');
  fs.mkdirSync(reportDir, { recursive: true });

  const reportPath = path.join(reportDir, `project_registry_drift_${scanDate}.md`);
  fs.writeFileSync(reportPath, report, 'utf-8');

  console.log(`✅ Project drift check complete. Report written to: file://${reportPath}`);
  console.log(`Detected unregistered directories: ${unregisteredDirs.length}`);
}

function runStatus() {
  console.log("=================================================================");
  console.log("📊 STATUS DASHBOARD: DUPLICATE CLEANUP GATE");
  console.log("=================================================================");
  
  const scanDate = getISODate();
  const scanPath = path.join(REPO_ROOT, 'outputs', 'cleanup', 'reports', `duplicate_cleanup_scan_${scanDate}.md`);
  const stagingPath = path.join(REPO_ROOT, 'outputs', 'cleanup', 'staging', `duplicate_quarantine_plan_${scanDate}.md`);
  const restorePath = path.join(REPO_ROOT, 'outputs', 'cleanup', 'restore_scripts', `restore_duplicate_briefs_${scanDate}.sh`);
  const driftPath = path.join(REPO_ROOT, 'outputs', 'cleanup', 'reports', `project_registry_drift_${scanDate}.md`);

  const candidates = scanDuplicates();
  const { unregisteredDirs } = scanProjectDrift();

  console.log(`Latest Duplicate Scan Report: ${fs.existsSync(scanPath) ? `file://${scanPath} (FOUND)` : 'NOT FOUND (Run scan-duplicates)'}`);
  console.log(`Latest Quarantine Plan:       ${fs.existsSync(stagingPath) ? `file://${stagingPath} (FOUND)` : 'NOT FOUND (Run stage-quarantine)'}`);
  console.log(`Latest Restore Plan:          ${fs.existsSync(restorePath) ? `file://${restorePath} (FOUND)` : 'NOT FOUND (Run restore-plan)'}`);
  console.log(`Latest Project Drift Report:  ${fs.existsSync(driftPath) ? `file://${driftPath} (FOUND)` : 'NOT FOUND (Run project-drift)'}`);
  console.log("-----------------------------------------------------------------");
  console.log(`Duplicate Candidates Count:  ${candidates.length}`);
  console.log(`Unregistered Project Count:  ${unregisteredDirs.length}`);
  console.log("-----------------------------------------------------------------");
  console.log("Next Recommended Action:     Review staging report & restore-plan script.");
  console.log("=================================================================");
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.error("🚨 Missing cleanup subcommand. Use -- 'help' or -- 'status' to review parameters.");
    process.exit(1);
  }

  switch (command) {
    case 'scan-duplicates':
      runScanDuplicates();
      break;
    case 'stage-quarantine':
      runStageQuarantine();
      break;
    case 'restore-plan':
      runRestorePlan();
      break;
    case 'project-drift':
      runProjectDrift();
      break;
    case 'status':
      runStatus();
      break;
    case 'help':
      // Invoke the help file behavior directly to keep consistency
      import('./cleanup-gate-help.js');
      break;
    default:
      console.error(`🚨 Unknown subcommand: ${command}`);
      console.error("Run npm run cleanup-gate-help to check active registry command map.");
      process.exit(1);
  }
}

main();
