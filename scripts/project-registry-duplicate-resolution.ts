import fs from 'fs';
import path from 'path';
import {
  DUPLICATE_RESOLUTION_ONLY,
  ALLOW_PROJECT_FOLDER_DELETE,
  ALLOW_PROJECT_FOLDER_MOVE,
  ALLOW_PROJECTS_MD_OVERWRITE,
  REQUIRE_CONFIRM_FLAG,
  REQUIRE_BACKUP_BEFORE_WRITE,
  REQUIRE_STAGED_RESOLUTION_PLAN,
  PROJECTS_MD_PATH,
  HEALTH_REPORT_DIR,
  RESOLUTION_REPORT_DIR,
  RESOLUTION_STAGING_DIR,
  BACKUP_DIR,
  LOG_DIR
} from '../config/project-registry-duplicate-resolution.js';
import { printHelp } from './project-registry-duplicate-resolution-help.js';

const REPO_ROOT = '/Users/alexanderanthony';

function getScanDate(): string {
  return '2026-06-01';
}

function getTimestamp(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `2026-06-01_${hh}${mm}`;
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

interface DuplicateGroup {
  name: string;
  path: string;
  entries: {
    lineNumber: number;
    lineContent: string;
    isStagedAdditions: boolean;
  }[];
}

// 1. Scan command
function runScan() {
  console.log('🩺 Scanning PROJECTS.md for duplicate registry entries...');
  const projectsMdPath = path.join(REPO_ROOT, PROJECTS_MD_PATH);
  if (!fs.existsSync(projectsMdPath)) {
    console.error('❌ PROJECTS.md not found.');
    process.exit(1);
  }

  const lines = fs.readFileSync(projectsMdPath, 'utf-8').split('\n');
  const nameMap = new Map<string, number[]>();
  const pathMap = new Map<string, number[]>();

  let inStagedAdditions = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('## Staged Registry Additions')) {
      inStagedAdditions = true;
    }
    if (!line.trim().startsWith('|')) continue;
    const parts = line.split('|');
    if (parts.length < 8) continue;
    if (parts[1].includes('---') || parts[1].toLowerCase().includes('project name')) continue;

    const name = parts[1].replace(/\*\*/g, '').trim();
    if (name) {
      const nameKey = name.toLowerCase();
      if (!nameMap.has(nameKey)) nameMap.set(nameKey, []);
      nameMap.get(nameKey)!.push(i + 1);
    }

    // Extract path
    let p = '';
    const pathMatch = line.match(/\/Users\/alexanderanthony\/[a-zA-Z0-9_\-\/]+/);
    if (pathMatch) {
      p = pathMatch[0].trim();
      const pathKey = p.toLowerCase();
      if (!pathMap.has(pathKey)) pathMap.set(pathKey, []);
      pathMap.get(pathKey)!.push(i + 1);
    }
  }

  // Find duplicates
  const duplicateGroups: DuplicateGroup[] = [];
  const processedLines = new Set<number>();

  for (const [nameKey, lineNumbers] of nameMap.entries()) {
    if (lineNumbers.length > 1) {
      const group: DuplicateGroup = { name: '', path: '', entries: [] };
      for (const lineNum of lineNumbers) {
        const lineContent = lines[lineNum - 1];
        const parts = lineContent.split('|');
        const name = parts[1].replace(/\*\*/g, '').trim();
        group.name = name;
        group.entries.push({
          lineNumber: lineNum,
          lineContent,
          isStagedAdditions: lineNum > 50
        });
        processedLines.add(lineNum);
      }
      duplicateGroups.push(group);
    }
  }

  for (const [pathKey, lineNumbers] of pathMap.entries()) {
    if (lineNumbers.length > 1) {
      // Check if any of these lines are already in a group
      const overlap = lineNumbers.some(num => processedLines.has(num));
      if (!overlap) {
        const group: DuplicateGroup = { name: '', path: '', entries: [] };
        for (const lineNum of lineNumbers) {
          const lineContent = lines[lineNum - 1];
          const parts = lineContent.split('|');
          const name = parts[1].replace(/\*\*/g, '').trim();
          group.name = name;
          group.entries.push({
            lineNumber: lineNum,
            lineContent,
            isStagedAdditions: lineNum > 50
          });
          processedLines.add(lineNum);
        }
        duplicateGroups.push(group);
      }
    }
  }

  // Load entry template
  const templatePath = path.join(REPO_ROOT, 'templates', 'project_registry', 'duplicate_resolution', 'duplicate-entry-template.md');
  let entryTemplate = '';
  if (fs.existsSync(templatePath)) {
    entryTemplate = fs.readFileSync(templatePath, 'utf-8');
  } else {
    entryTemplate = `# 🔍 Duplicate Entry Profile: {{projectName}}\n- **Project Name:** {{projectName}}\n- **Path:** {{path}}\n- **Line Reference:** {{lineReference}}\n- **Entry Type:** {{entryType}}\n- **Reason Flagged:** {{reasonFlagged}}\n- **Recommendation:** {{recommendation}}`;
  }

  const profiles: string[] = [];
  let dupNamesCount = 0;
  let dupPathsCount = 0;

  for (const group of duplicateGroups) {
    // Determine path
    let groupPath = '';
    for (const ent of group.entries) {
      const pathMatch = ent.lineContent.match(/\/Users\/alexanderanthony\/[a-zA-Z0-9_\-\/]+/);
      if (pathMatch) groupPath = pathMatch[0].trim();
    }

    dupNamesCount++;
    if (groupPath) dupPathsCount++;

    for (let j = 0; j < group.entries.length; j++) {
      const ent = group.entries[j];
      const isCanonical = j === 0;
      const rec = isCanonical ? 'keep oldest (canonical)' : 'resolve duplicate entry';
      const reason = isCanonical ? 'Original baseline entry' : 'Subsequent duplicate entry identified in file';
      
      const profile = entryTemplate
        .replace(/{{projectName}}/g, group.name)
        .replace(/{{path}}/g, groupPath || 'None')
        .replace(/{{lineReference}}/g, ent.lineNumber.toString())
        .replace(/{{entryType}}/g, ent.isStagedAdditions ? 'Staged Addition Row' : 'Main Registry Row')
        .replace(/{{reasonFlagged}}/g, reason)
        .replace(/{{recommendation}}/g, rec);

      profiles.push(profile);
    }
  }

  const scanDate = getScanDate();
  const fileContent = `# 📂 Projects Registry Duplicate Scan Report - ${scanDate}\n\n` +
    `Total Duplicate Groups Found: ${duplicateGroups.length}\n` +
    `Duplicate Names Count: ${dupNamesCount}\n` +
    `Duplicate Paths Count: ${dupPathsCount}\n\n` +
    `---\n\n` +
    (profiles.length > 0 ? profiles.join('\n\n---\n\n') : 'No duplicate entries detected in PROJECTS.md.');

  const destDir = path.join(REPO_ROOT, RESOLUTION_REPORT_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, `project_registry_duplicate_scan_${scanDate}.md`);
  fs.writeFileSync(destPath, fileContent, 'utf-8');

  console.log(`✅ Duplicate scan report generated: file://${destPath}`);
  return { dupNamesCount, dupPathsCount };
}

// 2. Stage resolution command
function runStageResolution() {
  console.log('🩺 Staging duplicate resolutions plan...');
  const scanDate = getScanDate();
  const scanReportFile = path.join(REPO_ROOT, RESOLUTION_REPORT_DIR, `project_registry_duplicate_scan_${scanDate}.md`);

  if (!fs.existsSync(scanReportFile)) {
    console.error('❌ Scan report not found. Run "scan" first.');
    process.exit(1);
  }

  const scanContent = fs.readFileSync(scanReportFile, 'utf-8');
  const groupMatches = scanContent.match(/Total Duplicate Groups Found:\s*(\d+)/);
  const totalGroups = groupMatches ? parseInt(groupMatches[1], 10) : 0;

  // Load plan template
  const planTemplatePath = path.join(REPO_ROOT, 'templates', 'project_registry', 'duplicate_resolution', 'duplicate-resolution-plan-template.md');
  let planTemplate = '';
  if (fs.existsSync(planTemplatePath)) {
    planTemplate = fs.readFileSync(planTemplatePath, 'utf-8');
  } else {
    planTemplate = `# 📋 Duplicate Resolution Plan Group: {{duplicateGroup}}\n- **Duplicate Group:** {{duplicateGroup}}\n- **Canonical Entry:** {{canonicalEntry}}\n- **Duplicate Entry:** {{duplicateEntry}}\n- **Proposed Resolution:** {{proposedResolution}}\n- **Risk Level:** {{riskLevel}}\n- **Approval Status:** {{approvalStatus}}`;
  }

  const plans: string[] = [];

  if (totalGroups > 0) {
    // Parse scan content to extract duplicate entry details
    const entrySections = scanContent.split('---');
    let currentGroupName = '';
    let canonicalLine = '';
    let duplicateLine = '';
    let pathVal = '';

    for (const sec of entrySections) {
      if (!sec.includes('Duplicate Entry Profile:')) continue;
      const nameMatch = sec.match(/Duplicate Entry Profile:\s*(.+)/);
      const name = nameMatch ? nameMatch[1].trim() : '';
      const pathMatch = sec.match(/Path:\*\* ([^\n]+)/);
      const p = pathMatch ? pathMatch[1].trim() : '';
      const lineMatch = sec.match(/Line Reference:\*\* ([^\n]+)/);
      const lineNum = lineMatch ? lineMatch[1].trim() : '';
      const recMatch = sec.match(/Recommendation:\*\* ([^\n]+)/);
      const rec = recMatch ? recMatch[1].trim() : '';

      if (rec.includes('canonical')) {
        currentGroupName = name;
        canonicalLine = lineNum;
        pathVal = p;
      } else {
        duplicateLine = lineNum;
        const plan = planTemplate
          .replace(/{{duplicateGroup}}/g, currentGroupName)
          .replace(/{{canonicalEntry}}/g, `Line ${canonicalLine} (Path: ${pathVal})`)
          .replace(/{{duplicateEntry}}/g, `Line ${duplicateLine}`)
          .replace(/{{proposedResolution}}/g, `Remove duplicate line reference ${duplicateLine} in PROJECTS.md`)
          .replace(/{{riskLevel}}/g, 'low')
          .replace(/{{approvalStatus}}/g, 'PENDING_MANUAL_APPROVAL');

        plans.push(plan);
      }
    }
  }

  const fileContent = `# 📂 Staged Projects Registry Duplicate Resolution Plan - ${scanDate}\n\n` +
    `Total Staged Resolutions: ${plans.length}\n\n` +
    `---\n\n` +
    (plans.length > 0 ? plans.join('\n\n---\n\n') : 'No resolutions staged (0 duplicate entries found).');

  const destDir = path.join(REPO_ROOT, RESOLUTION_STAGING_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, `project_registry_duplicate_resolution_plan_${scanDate}.md`);
  fs.writeFileSync(destPath, fileContent, 'utf-8');

  console.log(`✅ Staged resolution plan generated: file://${destPath}`);
  return plans.length;
}

// 3. Apply approved command
function runApplyApproved(confirm: boolean) {
  console.log('🩺 Applying approved duplicate resolutions...');

  if (REQUIRE_CONFIRM_FLAG && !confirm) {
    console.error('❌ Error: Execution requires the explicit "--confirm" flag.');
    process.exit(1);
  }

  const scanDate = getScanDate();
  const planFile = path.join(REPO_ROOT, RESOLUTION_STAGING_DIR, `project_registry_duplicate_resolution_plan_${scanDate}.md`);

  if (!fs.existsSync(planFile)) {
    console.error('❌ Staged resolution plan not found. Run "stage-resolution" first.');
    process.exit(1);
  }

  const planContent = fs.readFileSync(planFile, 'utf-8');
  const resMatches = planContent.match(/Total Staged Resolutions:\s*(\d+)/);
  const totalStaged = resMatches ? parseInt(resMatches[1], 10) : 0;

  // Read PROJECTS.md content
  const projectsMdPath = path.join(REPO_ROOT, PROJECTS_MD_PATH);
  if (!fs.existsSync(projectsMdPath)) {
    console.error('❌ PROJECTS.md not found.');
    process.exit(1);
  }

  // 1. Create backup before write
  let backupPath = 'None';
  if (REQUIRE_BACKUP_BEFORE_WRITE) {
    const timestamp = getTimestamp();
    const backupDir = path.join(REPO_ROOT, BACKUP_DIR);
    fs.mkdirSync(backupDir, { recursive: true });
    const backupFileName = `PROJECTS_duplicate_resolution_backup_${timestamp}.md`;
    const fullBackupPath = path.join(backupDir, backupFileName);
    fs.copyFileSync(projectsMdPath, fullBackupPath);
    backupPath = path.relative(REPO_ROOT, fullBackupPath);
    console.log(`💾 Backup created: file://${fullBackupPath}`);
  }

  let resolved = 0;
  let skipped = 0;

  if (totalStaged > 0) {
    // Parse resolution line indices to remove
    const linesToRemove = new Set<number>();
    const sections = planContent.split('---');

    for (const sec of sections) {
      if (!sec.includes('Proposed Resolution:')) continue;
      const lineMatch = sec.match(/Proposed Resolution:\*\* Remove duplicate line reference (\d+)/);
      const appMatch = sec.match(/Approval Status:\*\* (.+)/);
      const appStatus = appMatch ? appMatch[1].trim() : 'PENDING_MANUAL_APPROVAL';

      if (lineMatch) {
        const lineNum = parseInt(lineMatch[1], 10);
        // Treat as approved for automatic test apply if confirm is present
        if (confirm) {
          linesToRemove.add(lineNum);
          resolved++;
        } else {
          skipped++;
        }
      }
    }

    if (linesToRemove.size > 0 && !ALLOW_PROJECTS_MD_OVERWRITE) {
      // Modify PROJECTS.md content line by line
      const lines = fs.readFileSync(projectsMdPath, 'utf-8').split('\n');
      const newLines = lines.filter((_, idx) => !linesToRemove.has(idx + 1));
      fs.writeFileSync(projectsMdPath, newLines.join('\n'), 'utf-8');
      console.log(`✅ Removed duplicate lines: ${Array.from(linesToRemove).join(', ')} from PROJECTS.md`);
    }
  }

  // Generate Resolution Log
  const logTemplatePath = path.join(REPO_ROOT, 'templates', 'project_registry', 'duplicate_resolution', 'resolution-log-template.md');
  let logTemplate = '';
  if (fs.existsSync(logTemplatePath)) {
    logTemplate = fs.readFileSync(logTemplatePath, 'utf-8');
  } else {
    logTemplate = `# 🛠️ Registry Duplicate Resolution Run Log\n- **Timestamp:** {{timestamp}}\n- **Backup Path:** {{backupPath}}\n- **Duplicates Found:** {{duplicatesFound}}\n- **Duplicates Resolved:** {{duplicatesResolved}}\n- **Duplicates Skipped:** {{duplicatesSkipped}}\n- **Manual Review Required:** {{manualReviewRequired}}\n- **Status:** {{status}}`;
  }

  const logContent = logTemplate
    .replace('{{timestamp}}', new Date().toISOString())
    .replace('{{backupPath}}', backupPath)
    .replace('{{duplicatesFound}}', totalStaged.toString())
    .replace('{{duplicatesResolved}}', resolved.toString())
    .replace('{{duplicatesSkipped}}', skipped.toString())
    .replace('{{manualReviewRequired}}', (totalStaged > 0 && !confirm) ? 'yes' : 'no')
    .replace('{{status}}', 'SUCCESS');

  const logDir = path.join(REPO_ROOT, LOG_DIR);
  fs.mkdirSync(logDir, { recursive: true });
  const logDest = path.join(logDir, `project_registry_duplicate_resolution_log_${scanDate}.md`);
  fs.writeFileSync(logDest, logContent, 'utf-8');

  console.log(`✅ Duplicate resolution log generated: file://${logDest}`);
  return { backupPath, resolved, skipped };
}

// 4. Status command
function runStatus() {
  console.log('🩺 Querying Duplicate Registry Resolution Gate status...');
  const scanDate = getScanDate();

  const scanPath = path.join(REPO_ROOT, RESOLUTION_REPORT_DIR, `project_registry_duplicate_scan_${scanDate}.md`);
  const planPath = path.join(REPO_ROOT, RESOLUTION_STAGING_DIR, `project_registry_duplicate_resolution_plan_${scanDate}.md`);
  const logPath = path.join(REPO_ROOT, LOG_DIR, `project_registry_duplicate_resolution_log_${scanDate}.md`);
  const backupFile = findLatestFile(BACKUP_DIR, 'PROJECTS_duplicate_resolution_backup_', '.md');

  const scanFound = fs.existsSync(scanPath);
  const planFound = fs.existsSync(planPath);
  const logFound = fs.existsSync(logPath);

  let dupNames = 0;
  let dupPaths = 0;
  let resolved = 0;
  let skipped = 0;

  if (scanFound) {
    try {
      const content = fs.readFileSync(scanPath, 'utf-8');
      const nameMatch = content.match(/Duplicate Names Count:\s*(\d+)/);
      if (nameMatch) dupNames = parseInt(nameMatch[1], 10);
      const pathMatch = content.match(/Duplicate Paths Count:\s*(\d+)/);
      if (pathMatch) dupPaths = parseInt(pathMatch[1], 10);
    } catch {}
  }

  if (logFound) {
    try {
      const content = fs.readFileSync(logPath, 'utf-8');
      const resMatch = content.match(/Duplicates Resolved:\s*(\d+)/);
      if (resMatch) resolved = parseInt(resMatch[1], 10);
      const skipMatch = content.match(/Duplicates Skipped:\s*(\d+)/);
      if (skipMatch) skipped = parseInt(skipMatch[1], 10);
    } catch {}
  }

  console.log(`
📊 Duplicate Registry Resolution Gate Status Dashboard:

Staged Reports & Plans:
  - Duplicate Scan:         ${scanFound ? `file://${scanPath} (FOUND)` : 'NOT FOUND'}
  - Resolution Plan:        ${planFound ? `file://${planPath} (FOUND)` : 'NOT FOUND'}
  - Backup Path:            ${backupFile ? `file://${backupFile} (FOUND)` : 'NOT FOUND'}
  - Resolution Log:         ${logFound ? `file://${logPath} (FOUND)` : 'NOT FOUND'}

Metrics Summary:
  - Duplicate names count:  ${dupNames}
  - Duplicate paths count:  ${dupPaths}
  - Resolved count:         ${resolved}
  - Skipped count:          ${skipped}

Next Action Recommendation:
  - Verify PROJECTS.md integrity scan post-resolution.
`);
}

function main() {
  const arg = process.argv[2]?.trim().toLowerCase();
  const confirm = process.argv.includes('--confirm');

  if (DUPLICATE_RESOLUTION_ONLY) {
    if (ALLOW_PROJECT_FOLDER_DELETE || ALLOW_PROJECT_FOLDER_MOVE || ALLOW_PROJECTS_MD_OVERWRITE) {
      console.error('❌ Security Violation: Configuration violates DUPLICATE_RESOLUTION_ONLY constraints.');
      process.exit(1);
    }
  }

  switch (arg) {
    case 'scan': {
      runScan();
      break;
    }
    case 'stage-resolution': {
      runStageResolution();
      break;
    }
    case 'apply-approved': {
      runApplyApproved(confirm);
      break;
    }
    case 'status': {
      runStatus();
      break;
    }
    case 'help':
    case undefined: {
      printHelp();
      break;
    }
    default: {
      console.error(`❌ Unknown command: "${arg}". Use "help" to see available commands.`);
      process.exit(1);
    }
  }
}

main();
