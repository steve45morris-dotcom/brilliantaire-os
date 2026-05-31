import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  FORBIDDEN_FOLDERS,
  FORBIDDEN_EXTENSIONS,
  SENSITIVE_FILES,
  MAX_TRACKED_FILE_SIZE_BYTES,
  MAX_TRACKED_FILE_SIZE_MB
} from '../config/git-asset-policy';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Helper to check if file is binary to avoid checking conflict markers
function isBinaryFile(filePath: string): boolean {
  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.pdf', '.onnx', '.wav', '.mp3',
    '.mp4', '.mov', '.zip', '.tar.gz', '.7z', '.bin', '.pt', '.pth',
    '.ckpt', '.safetensors', '.ico', '.woff', '.woff2', '.eot', '.ttf'
  ];
  const ext = path.extname(filePath).toLowerCase();
  if (binaryExtensions.includes(ext)) {
    return true;
  }
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(8000);
    const bytesRead = fs.readSync(fd, buffer, 0, 8000, 0);
    fs.closeSync(fd);
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) {
        return true;
      }
    }
    return false;
  } catch (_) {
    return true;
  }
}

export function runAudit(): { success: boolean; reportPath: string; logPath: string; summary: any } {
  const dateStr = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toISOString();
  
  const reportsDir = path.join(REPO_ROOT, 'outputs', 'git_audits', 'reports');
  const logsDir = path.join(REPO_ROOT, 'outputs', 'git_audits', 'logs');
  
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });

  const reportPath = path.join(reportsDir, `git_asset_audit_${dateStr}.md`);
  const logPath = path.join(logsDir, `audit_run_${dateStr}.log`);

  const logLines: string[] = [`Git Asset Audit log started at ${timestamp}`];
  const log = (msg: string) => {
    console.log(msg);
    logLines.push(msg);
  };

  log('🔍 Starting Git Asset Audit...');

  // Get tracked files list
  let trackedFiles: string[] = [];
  try {
    const out = execSync('git ls-files', { cwd: REPO_ROOT, encoding: 'utf-8' });
    trackedFiles = out.split('\n').map(f => f.trim()).filter(Boolean);
  } catch (err: any) {
    log(`❌ Error running git ls-files: ${err.message}`);
    process.exit(1);
  }

  log(`Scanned ${trackedFiles.length} tracked files in repository.`);

  const forbiddenTracked: string[] = [];
  const largeTracked: { path: string; sizeMB: number }[] = [];
  const sensitiveTracked: string[] = [];
  const conflictMarkersFound: { path: string; line: number; type: string }[] = [];

  for (const file of trackedFiles) {
    const fullPath = path.join(REPO_ROOT, file);
    
    // Check if path exists locally (some tracked files might be deleted in working directory)
    if (!fs.existsSync(fullPath)) {
      continue;
    }

    // 1. Check forbidden folders
    const isForbiddenFolder = FORBIDDEN_FOLDERS.some(folder => {
      // e.g. 'local_assets/'
      const normalizedFolder = folder.replace(/\/$/, '');
      const relativeParts = file.split('/');
      return relativeParts.includes(normalizedFolder) || file.startsWith(folder);
    });

    // 2. Check forbidden file extensions
    const isForbiddenExtension = FORBIDDEN_EXTENSIONS.some(ext => file.endsWith(ext));

    if (isForbiddenFolder || isForbiddenExtension) {
      forbiddenTracked.push(file);
      log(`🚫 Forbidden tracked file: ${file}`);
    }

    // 3. Check tracked files size
    try {
      const stats = fs.statSync(fullPath);
      if (stats.size > MAX_TRACKED_FILE_SIZE_BYTES) {
        const sizeMB = parseFloat((stats.size / (1024 * 1024)).toFixed(2));
        largeTracked.push({ path: file, sizeMB });
        log(`⚖️  Large tracked file (>25MB): ${file} (${sizeMB} MB)`);
      }
    } catch (_) {}

    // 4. Check sensitive files
    const isSensitive = SENSITIVE_FILES.some(sensitive => {
      const filename = path.basename(file);
      return filename === sensitive;
    });
    if (isSensitive) {
      sensitiveTracked.push(file);
      log(`🔐 Sensitive tracked file: ${file}`);
    }

    // 5. Check merge conflict markers in text files
    if (!isBinaryFile(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        // Both start and end conflict markers must be present to count as a merge conflict
        if (content.includes('<<<<<<<') && content.includes('>>>>>>>')) {
          const lines = content.split('\n');
          let hasConflict = false;
          for (let i = 0; i < lines.length; i++) {
            const rawLine = lines[i];
            if (rawLine.startsWith('<<<<<<<') || rawLine === '=======' || rawLine.startsWith('>>>>>>>')) {
              conflictMarkersFound.push({ path: file, line: i + 1, type: rawLine.substring(0, 7) });
              hasConflict = true;
            }
          }
          if (hasConflict) {
            log(`⚠️  Merge conflict marker found in: ${file}`);
          }
        }
      } catch (_) {}
    }
  }

  // 6. Check ignored staged assets
  const ignoredStaged: string[] = [];
  try {
    const stagedOut = execSync('git diff --cached --name-only', { cwd: REPO_ROOT, encoding: 'utf-8' });
    const stagedFiles = stagedOut.split('\n').map(f => f.trim()).filter(Boolean);
    
    for (const stagedFile of stagedFiles) {
      try {
        // git check-ignore returns exit code 0 if file is ignored
        execSync(`git check-ignore "${stagedFile}"`, { cwd: REPO_ROOT, stdio: 'ignore' });
        ignoredStaged.push(stagedFile);
        log(`🛠️  Ignored but staged asset: ${stagedFile}`);
      } catch (_) {
        // Not ignored
      }
    }
  } catch (_) {}

  // Determine Risk Level
  const totalViolations =
    forbiddenTracked.length +
    largeTracked.length +
    sensitiveTracked.length +
    conflictMarkersFound.length +
    ignoredStaged.length;
  
  const riskLevel = totalViolations > 0 ? 'HIGH' : 'LOW';
  const success = totalViolations === 0;

  // Build recommendation list
  let recommendations = '';
  if (success) {
    recommendations = '- No actions required. Repository tracking complies with system rules.\n';
  } else {
    if (forbiddenTracked.length > 0) {
      recommendations += '### 🚫 Forbidden Files Resolution\n';
      recommendations += 'Remove these files from git tracking (while keeping them locally) and verify they match `.gitignore` rules:\n';
      recommendations += '```bash\n';
      forbiddenTracked.forEach(file => {
        recommendations += `git rm --cached "${file}"\n`;
      });
      recommendations += '```\n\n';
    }
    if (largeTracked.length > 0) {
      recommendations += '### ⚖️  Large Tracked Files Resolution\n';
      recommendations += 'Remove these files from git tracking, move them outside the repository or into a local assets cache folder that is in `.gitignore`, and verify:\n';
      recommendations += '```bash\n';
      largeTracked.forEach(item => {
        recommendations += `git rm --cached "${item.path}"\n`;
      });
      recommendations += '```\n\n';
    }
    if (sensitiveTracked.length > 0) {
      recommendations += '### 🔐 Sensitive Files Resolution\n';
      recommendations += 'CRITICAL: Remove sensitive files from git tracking, revoke any exposed credentials or API tokens immediately, and verify they are listed in `.gitignore`:\n';
      recommendations += '```bash\n';
      sensitiveTracked.forEach(file => {
        recommendations += `git rm --cached "${file}"\n`;
      });
      recommendations += '```\n\n';
    }
    if (conflictMarkersFound.length > 0) {
      recommendations += '### ⚠️  Conflict Markers Resolution\n';
      recommendations += 'Open the flagged files, resolve the conflicting edits programmatically, remove conflict markers, compile/test the changes, and stage them:\n';
      conflictMarkersFound.forEach(marker => {
        recommendations += `- [ ] Resolve ${marker.type} in [${marker.path}](file://${path.join(REPO_ROOT, marker.path)}#L${marker.line}) (Line ${marker.line})\n`;
      });
      recommendations += '\n';
    }
    if (ignoredStaged.length > 0) {
      recommendations += '### 🛠️  Ignored Staged Assets Resolution\n';
      recommendations += 'Unstage the ignored assets from git staging index:\n';
      recommendations += '```bash\n';
      ignoredStaged.forEach(file => {
        recommendations += `git restore --staged "${file}"\n`;
      });
      recommendations += '```\n\n';
    }
    recommendations += '### ⚠️  General Recovery Rule\n';
    recommendations += 'Verify all fixes locally and re-run safety checks. Do NOT perform force pushes to push local commits to origin.\n';
  }

  // Format templates lists
  const forbiddenTrackedList = forbiddenTracked.length > 0
    ? forbiddenTracked.map(f => `- 🚫 \`${f}\``).join('\n')
    : '*No forbidden tracked files detected.*';
    
  const largeTrackedList = largeTracked.length > 0
    ? largeTracked.map(item => `- ⚖️ \`${item.path}\` (${item.sizeMB} MB)`).join('\n')
    : '*No large tracked files detected.*';

  const sensitiveTrackedList = sensitiveTracked.length > 0
    ? sensitiveTracked.map(f => `- 🔐 \`${f}\``).join('\n')
    : '*No sensitive files currently tracked.*';

  const conflictsList = conflictMarkersFound.length > 0
    ? conflictMarkersFound.map(m => `- ⚠️ \`${m.path}\` line ${m.line} (${m.type})`).join('\n')
    : '*No active conflict markers found.*';

  const ignoredStagedList = ignoredStaged.length > 0
    ? ignoredStaged.map(f => `- 🛠️ \`${f}\``).join('\n')
    : '*No ignored files currently staged.*';

  // Read template and compile
  const templatePath = path.join(REPO_ROOT, 'templates', 'git_audits', 'git-asset-audit-template.md');
  if (!fs.existsSync(templatePath)) {
    log(`❌ Template file not found: ${templatePath}`);
    process.exit(1);
  }

  let templateContent = fs.readFileSync(templatePath, 'utf-8');
  templateContent = templateContent
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{TIMESTAMP}}/g, timestamp)
    .replace(/{{RISK_LEVEL}}/g, riskLevel)
    .replace(/{{TOTAL_SCANNED}}/g, trackedFiles.length.toString())
    .replace(/{{FORBIDDEN_TRACKED_COUNT}}/g, forbiddenTracked.length.toString())
    .replace(/{{LARGE_TRACKED_COUNT}}/g, largeTracked.length.toString())
    .replace(/{{SENSITIVE_TRACKED_COUNT}}/g, sensitiveTracked.length.toString())
    .replace(/{{CONFLICT_MARKERS_COUNT}}/g, conflictMarkersFound.length.toString())
    .replace(/{{IGNORED_STAGED_COUNT}}/g, ignoredStaged.length.toString())
    .replace(/{{FORBIDDEN_FILES_LIST}}/g, forbiddenTrackedList)
    .replace(/{{LARGE_FILES_LIST}}/g, largeTrackedList)
    .replace(/{{SENSITIVE_FILES_LIST}}/g, sensitiveTrackedList)
    .replace(/{{CONFLICT_MARKERS_LIST}}/g, conflictsList)
    .replace(/{{IGNORED_STAGED_LIST}}/g, ignoredStagedList)
    .replace(/{{MAX_SIZE}}/g, MAX_TRACKED_FILE_SIZE_MB.toString())
    .replace(/{{RECOMMENDED_FIXES}}/g, recommendations);

  fs.writeFileSync(reportPath, templateContent);
  log(`📝 Saved report: ${reportPath}`);

  // Write log file
  fs.writeFileSync(logPath, logLines.join('\n'));

  return {
    success,
    reportPath,
    logPath,
    summary: {
      totalScanned: trackedFiles.length,
      forbiddenTrackedCount: forbiddenTracked.length,
      largeTrackedCount: largeTracked.length,
      sensitiveTrackedCount: sensitiveTracked.length,
      conflictMarkersCount: conflictMarkersFound.length,
      ignoredStagedCount: ignoredStaged.length,
      riskLevel
    }
  };
}

const result = runAudit();
if (!result.success) {
  console.error('❌ Audit Failed: Safety checks triggered. Review the report.');
  process.exit(1);
} else {
  console.log('✅ Audit Passed: System complies with Git Asset Policies.');
  process.exit(0);
}
