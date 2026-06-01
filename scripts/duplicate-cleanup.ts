import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  CLEANUP_SCAN_ONLY,
  ALLOW_FILE_DELETION,
  ALLOW_SOURCE_MODIFICATION,
  ALLOW_MODEL_DIRECTORY_SCAN,
  ALLOW_SECRET_FILE_SCAN,
  REQUIRE_MANUAL_REVIEW,
  ALLOWED_SCAN_ROOTS,
  EXCLUDED_ROOTS,
  cleanupFolders,
  REPO_ROOT
} from '../config/duplicate-cleanup.js';

const NOW = new Date('2026-06-01T11:07:17-07:00');

interface FileInfo {
  absPath: string;
  relPath: string;
  fileName: string;
  dir: string;
  baseName: string;
  size: number;
  mtime: Date;
  ageDays: number;
  hash?: string;
}

// Ensure all output folders exist
function ensureDirs() {
  Object.values(cleanupFolders).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function getFormattedDate(date: Date = NOW): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isExcluded(filePath: string): boolean {
  const resolvedPath = path.resolve(filePath);
  return EXCLUDED_ROOTS.some(excluded => {
    const resolvedExcluded = path.resolve(excluded);
    if (resolvedPath === resolvedExcluded) return true;
    if (resolvedPath.startsWith(resolvedExcluded + path.sep)) return true;
    return false;
  });
}

function getBaseName(fileName: string): string {
  // Strip timestamp suffix like _YYYY-MM-DD or _YYYY-MM-DD_HH-MM-SS or _10digits
  const stripped = fileName.replace(/_(\d{4}-\d{2}-\d{2}(?:_\d{2}-\d{2}-\d{2})?|\d{10,13})(?=\.[^.]+|$)/g, '');
  return stripped;
}

function scanRoots(): FileInfo[] {
  const fileList: FileInfo[] = [];

  function traverse(dir: string) {
    if (isExcluded(dir)) return;
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        if (isExcluded(fullPath)) continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (stat.isFile()) {
          const relPath = path.relative(REPO_ROOT, fullPath);
          const ageMs = NOW.getTime() - stat.mtime.getTime();
          const ageDays = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));

          fileList.push({
            absPath: fullPath,
            relPath,
            fileName: item,
            dir: path.dirname(fullPath),
            baseName: getBaseName(item),
            size: stat.size,
            mtime: stat.mtime,
            ageDays
          });
        }
      }
    } catch (err) {
      // Skip folders we cannot read
    }
  }

  ALLOWED_SCAN_ROOTS.forEach(root => {
    if (fs.existsSync(root)) {
      traverse(root);
    }
  });

  return fileList;
}

function calculateHash(filePath: string): string {
  try {
    const data = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch (err) {
    return 'error-calculating-hash';
  }
}

// 1. Scan command logic
function handleScan(files: FileInfo[]) {
  // Group by (dir + baseName)
  const basenameGroups: { [key: string]: FileInfo[] } = {};
  files.forEach(f => {
    const key = path.join(f.dir, f.baseName);
    if (!basenameGroups[key]) {
      basenameGroups[key] = [];
    }
    basenameGroups[key].push(f);
  });

  const duplicateGroups = Object.entries(basenameGroups)
    .filter(([_, group]) => group.length > 1)
    .map(([key, group]) => group);

  // Timestamp variants
  const timestampVariants = files.filter(f => {
    // Check if filename contains a timestamp suffix pattern
    return /_(\d{4}-\d{2}-\d{2}(?:_\d{2}-\d{2}-\d{2})?|\d{10,13})(?=\.[^.]+|$)/.test(f.fileName);
  });

  // Group by size (for size > 0)
  const sizeGroups: { [key: number]: FileInfo[] } = {};
  files.forEach(f => {
    if (f.size > 0) {
      if (!sizeGroups[f.size]) {
        sizeGroups[f.size] = [];
      }
      sizeGroups[f.size].push(f);
    }
  });

  const sameSizeCandidates = Object.entries(sizeGroups)
    .filter(([_, group]) => group.length > 1)
    .map(([_, group]) => group);

  // Group by hash
  const hashGroups: { [key: string]: FileInfo[] } = {};
  // To optimize, only calculate hash for size duplicates
  sameSizeCandidates.forEach(group => {
    group.forEach(f => {
      if (!f.hash) {
        f.hash = calculateHash(f.absPath);
      }
      if (!hashGroups[f.hash]) {
        hashGroups[f.hash] = [];
      }
      if (!hashGroups[f.hash].includes(f)) {
        hashGroups[f.hash].push(f);
      }
    });
  });

  const sameHashCandidates = Object.entries(hashGroups)
    .filter(([_, group]) => group.length > 1)
    .map(([_, group]) => group);

  // Read template
  const templatePath = path.join(cleanupFolders.templates, 'duplicate-report-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let template = fs.readFileSync(templatePath, 'utf8');

  // Format replacements
  const dateStr = getFormattedDate();

  let dupGroupsStr = duplicateGroups.map((g, idx) => {
    let str = `### Group ${idx + 1}: ${path.basename(g[0].baseName)}\n`;
    g.forEach(f => {
      str += `- [${f.relPath}](file://${f.absPath}) (Size: ${f.size} bytes, Age: ${f.ageDays} days)\n`;
    });
    return str;
  }).join('\n');
  if (!dupGroupsStr) dupGroupsStr = '*No duplicate basename groups found.*';

  let timestampVariantsStr = timestampVariants.map(f => {
    return `- [${f.relPath}](file://${f.absPath}) (Age: ${f.ageDays} days)`;
  }).join('\n');
  if (!timestampVariantsStr) timestampVariantsStr = '*No timestamped variants found.*';

  let sameSizeStr = sameSizeCandidates.slice(0, 20).map((g, idx) => {
    let str = `- **Size: ${g[0].size} bytes**:\n`;
    g.forEach(f => {
      str += `  - [${f.relPath}](file://${f.absPath})\n`;
    });
    return str;
  }).join('\n');
  if (!sameSizeStr) sameSizeStr = '*No same-size candidates found.*';

  let sameHashStr = sameHashCandidates.slice(0, 20).map((g, idx) => {
    let str = `- **Hash: ${g[0].hash?.substring(0, 16)}...**:\n`;
    g.forEach(f => {
      str += `  - [${f.relPath}](file://${f.absPath})\n`;
    });
    return str;
  }).join('\n');
  if (!sameHashStr) sameHashStr = '*No same-hash candidates found.*';

  const excludedPathsStr = EXCLUDED_ROOTS.map(ex => `- \`${path.relative(REPO_ROOT, ex) || ex}\``).join('\n');

  const riskNotes = `1. Scan-only mode is ACTIVE. No files were removed.\n2. Basename groups identify files with timestamp differences that are likely redundant.\n3. Content hash matching has 100% confidence for duplicate contents.`;
  const nextAction = `Review the generated review list or quarantine index, and perform manual cleanup steps where appropriate.`;

  template = template
    .replace('{{SCAN_DATE}}', dateStr)
    .replace('{{FILES_SCANNED_COUNT}}', String(files.length))
    .replace('{{DUPLICATE_GROUPS_COUNT}}', String(duplicateGroups.length))
    .replace('{{TIMESTAMP_VARIANTS_COUNT}}', String(timestampVariants.length))
    .replace('{{SAME_SIZE_CANDIDATES_COUNT}}', String(sameSizeCandidates.length))
    .replace('{{SAME_HASH_CANDIDATES_COUNT}}', String(sameHashCandidates.length))
    .replace('{{EXCLUDED_PATHS}}', excludedPathsStr)
    .replace('{{DUPLICATE_GROUPS}}', dupGroupsStr)
    .replace('{{TIMESTAMP_VARIANTS}}', timestampVariantsStr)
    .replace('{{SAME_SIZE_CANDIDATES}}', sameSizeStr)
    .replace('{{SAME_HASH_CANDIDATES}}', sameHashStr)
    .replace('{{RISK_NOTES}}', riskNotes)
    .replace('{{NEXT_ACTION}}', nextAction);

  const outPath = path.join(cleanupFolders.reports, `duplicate_scan_report_${dateStr}.md`);
  fs.writeFileSync(outPath, template);
  console.log(`✅ Duplicate scan report generated: [duplicate_scan_report_${dateStr}.md](file://${outPath})`);
}

// 2. Stale command logic
function handleStale(files: FileInfo[]) {
  // Stale reports: in reports directory or containing 'report' in name, age > 30
  const staleReports = files.filter(f => {
    return (f.absPath.includes('/reports/') || f.fileName.toLowerCase().includes('report')) && f.ageDays > 30;
  });

  // Stale dry-run outputs: containing 'dry-run', 'dry_run', or 'dryrun', age > 30
  const staleDryRuns = files.filter(f => {
    const fn = f.fileName.toLowerCase();
    return (fn.includes('dry-run') || fn.includes('dry_run') || fn.includes('dryrun')) && f.ageDays > 30;
  });

  // Duplicated test outputs: filename contains 'test' AND is part of a duplicate group
  // First, find all duplicate groups by basename
  const basenameGroups: { [key: string]: FileInfo[] } = {};
  files.forEach(f => {
    const key = path.join(f.dir, f.baseName);
    if (!basenameGroups[key]) {
      basenameGroups[key] = [];
    }
    basenameGroups[key].push(f);
  });
  const dupPaths = new Set(
    Object.values(basenameGroups)
      .filter(g => g.length > 1)
      .flatMap(g => g.map(f => f.absPath))
  );

  const duplicatedTests = files.filter(f => {
    return f.fileName.toLowerCase().includes('test') && dupPaths.has(f.absPath);
  });

  // Orphan queue packets: session_metadata with no recordings
  const metadataFiles = files.filter(f => f.absPath.includes('voice_sessions/session_metadata'));
  const recordings = files.filter(f => f.absPath.includes('voice_sessions/manual_recordings'));

  const orphanQueuePackets = metadataFiles.filter(meta => {
    // Extract baseName before extension
    const metaBase = path.basename(meta.fileName, path.extname(meta.fileName));
    // Check if there is any recording that starts with this basename
    const matchingRec = recordings.some(rec => {
      const recBase = path.basename(rec.fileName, path.extname(rec.fileName));
      return recBase.startsWith(metaBase) || metaBase.startsWith(recBase);
    });
    return !matchingRec;
  });

  // Empty placeholder reports: size 0 bytes under outputs/
  const emptyPlaceholders = files.filter(f => {
    return f.size === 0 && f.absPath.includes('/outputs/') && (f.fileName.endsWith('.md') || f.fileName.endsWith('.json') || f.fileName.endsWith('.txt'));
  });

  // Load template
  const templatePath = path.join(cleanupFolders.templates, 'stale-artifact-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let template = fs.readFileSync(templatePath, 'utf8');

  // Build rows
  const allStaleRows: string[] = [];

  staleReports.forEach(f => {
    allStaleRows.push(`| [${f.fileName}](file://${f.absPath}) | ${f.ageDays} days | Report | Older than 30 days reports | Low | Manual cleanup recommended |`);
  });
  staleDryRuns.forEach(f => {
    allStaleRows.push(`| [${f.fileName}](file://${f.absPath}) | ${f.ageDays} days | Dry-Run Output | Older than 30 days dry-runs | Low | Manual cleanup recommended |`);
  });
  duplicatedTests.forEach(f => {
    allStaleRows.push(`| [${f.fileName}](file://${f.absPath}) | ${f.ageDays} days | Test Output | Duplicated test report | Low | Safe to remove variants |`);
  });
  orphanQueuePackets.forEach(f => {
    allStaleRows.push(`| [${f.fileName}](file://${f.absPath}) | ${f.ageDays} days | Orphan Queue | Metadata without recording | Medium | Confirm recording exists elsewhere |`);
  });
  emptyPlaceholders.forEach(f => {
    allStaleRows.push(`| [${f.fileName}](file://${f.absPath}) | ${f.ageDays} days | Empty Placeholder | Size is 0 bytes | Low | Delete if no longer needed |`);
  });

  let rowsStr = allStaleRows.join('\n');
  if (!rowsStr) rowsStr = '| None | N/A | N/A | No stale candidates found | N/A | N/A |';

  const dateStr = getFormattedDate();
  template = template
    .replace('{{SCAN_DATE}}', dateStr)
    .replace('{{STALE_REPORTS_COUNT}}', String(staleReports.length))
    .replace('{{STALE_DRY_RUNS_COUNT}}', String(staleDryRuns.length))
    .replace('{{ORPHAN_QUEUE_PACKETS_COUNT}}', String(orphanQueuePackets.length))
    .replace('{{EMPTY_PLACEHOLDERS_COUNT}}', String(emptyPlaceholders.length))
    .replace('{{STALE_CANDIDATES_ROWS}}', rowsStr)
    .replace('{{AGE_NOTES}}', `All candidates are evaluated using absolute timestamps. Reports/dry-runs older than 30 days are listed.`)
    .replace('{{NEXT_ACTION}}', `Check the candidates listed in the quarantine index before manually deleting.`);

  const outPath = path.join(cleanupFolders.reports, `stale_artifact_report_${dateStr}.md`);
  fs.writeFileSync(outPath, template);
  console.log(`✅ Stale artifact report generated: [stale_artifact_report_${dateStr}.md](file://${outPath})`);
}

// 3. Quarantine Index command logic
function handleQuarantineIndex(files: FileInfo[]) {
  // Find all duplicates and stale files
  const basenameGroups: { [key: string]: FileInfo[] } = {};
  files.forEach(f => {
    const key = path.join(f.dir, f.baseName);
    if (!basenameGroups[key]) {
      basenameGroups[key] = [];
    }
    basenameGroups[key].push(f);
  });
  const duplicates = Object.values(basenameGroups).filter(g => g.length > 1);

  // Collect quarantine candidates
  const quarantineCandidates: { file: FileInfo; reason: string; risk: string; action: string }[] = [];

  // Duplicates logic: keep the latest one, quarantine others
  duplicates.forEach(group => {
    // Sort by mtime descending (newest first)
    group.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    // The newest is kept, older ones are candidates
    const kept = group[0];
    const older = group.slice(1);
    older.forEach(f => {
      quarantineCandidates.push({
        file: f,
        reason: `Timestamp variant of newer file [${kept.fileName}](file://${kept.absPath})`,
        risk: 'Low',
        action: 'Staged for cleanup. Kept file is newer.'
      });
    });
  });

  // Stale dry runs
  const staleDryRuns = files.filter(f => {
    const fn = f.fileName.toLowerCase();
    return (fn.includes('dry-run') || fn.includes('dry_run') || fn.includes('dryrun')) && f.ageDays > 30;
  });
  staleDryRuns.forEach(f => {
    quarantineCandidates.push({
      file: f,
      reason: `Stale dry-run output (Age: ${f.ageDays} days)`,
      risk: 'Low',
      action: 'Safe to manually remove.'
    });
  });

  // Empty placeholder files
  const emptyFiles = files.filter(f => f.size === 0 && f.absPath.includes('/outputs/'));
  emptyFiles.forEach(f => {
    quarantineCandidates.push({
      file: f,
      reason: `Empty placeholder (0 bytes)`,
      risk: 'Low',
      action: 'Check if reference is required; otherwise delete.'
    });
  });

  // Orphan queue packets
  const metadataFiles = files.filter(f => f.absPath.includes('voice_sessions/session_metadata'));
  const recordings = files.filter(f => f.absPath.includes('voice_sessions/manual_recordings'));

  const orphans = metadataFiles.filter(meta => {
    const metaBase = path.basename(meta.fileName, path.extname(meta.fileName));
    return !recordings.some(rec => {
      const recBase = path.basename(rec.fileName, path.extname(rec.fileName));
      return recBase.startsWith(metaBase) || metaBase.startsWith(recBase);
    });
  });
  orphans.forEach(f => {
    quarantineCandidates.push({
      file: f,
      reason: `Orphan metadata without matching recordings`,
      risk: 'Medium',
      action: 'Verify if audio was lost or is still recording before deletion.'
    });
  });

  // De-duplicate quarantineCandidates list by absPath
  const seenPaths = new Set<string>();
  const uniqueCandidates = quarantineCandidates.filter(c => {
    if (seenPaths.has(c.file.absPath)) return false;
    seenPaths.add(c.file.absPath);
    return true;
  });

  // Read template
  const templatePath = path.join(cleanupFolders.templates, 'quarantine-index-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let template = fs.readFileSync(templatePath, 'utf8');

  // Format rows
  let rowsStr = uniqueCandidates.map(c => {
    return `| [${c.file.relPath}](file://${c.file.absPath}) | ${c.reason} | ${c.risk} | ${c.action} | Yes |`;
  }).join('\n');
  if (!rowsStr) rowsStr = '| None | N/A | N/A | No quarantine index candidates found | N/A |';

  const dateStr = getFormattedDate();
  template = template
    .replace('{{SCAN_DATE}}', dateStr)
    .replace('{{TOTAL_CANDIDATES}}', String(uniqueCandidates.length))
    .replace('{{QUARANTINE_ROWS}}', rowsStr);

  const outPath = path.join(cleanupFolders.quarantineIndex, `cleanup_quarantine_index_${dateStr}.md`);
  fs.writeFileSync(outPath, template);
  console.log(`✅ Quarantine index generated: [cleanup_quarantine_index_${dateStr}.md](file://${outPath})`);
}

// 4. Review List command logic
function handleReviewList(files: FileInfo[]) {
  // We classify candidates into High Confidence, Low Confidence, and Do Not Touch

  // High confidence: empty placeholders (size 0), stale reports/dryruns > 60 days
  const highConfidence: { file: FileInfo; reason: string; action: string }[] = [];
  const lowConfidence: { file: FileInfo; reason: string; action: string }[] = [];
  const doNotTouch: { file: FileInfo; reason: string }[] = [];

  // Group duplicates first
  const basenameGroups: { [key: string]: FileInfo[] } = {};
  files.forEach(f => {
    const key = path.join(f.dir, f.baseName);
    if (!basenameGroups[key]) {
      basenameGroups[key] = [];
    }
    basenameGroups[key].push(f);
  });
  const duplicatePaths = new Set(
    Object.values(basenameGroups).filter(g => g.length > 1).flatMap(g => g.map(f => f.absPath))
  );

  files.forEach(f => {
    const isConfig = f.absPath.includes('/config/') || f.fileName.endsWith('.config.ts');
    const isTemplate = f.absPath.includes('/templates/') || f.fileName.includes('-template.');
    const isGit = f.absPath.includes('/.git/') || f.absPath.includes('/.github/');
    const isSystem = f.fileName === 'package.json' || f.fileName === 'package-lock.json' || f.fileName === 'Taskfile.yml';

    if (isConfig || isTemplate || isGit || isSystem) {
      doNotTouch.push({
        file: f,
        reason: isConfig ? 'System configuration file' : isTemplate ? 'Output generation template' : 'Core OS project file'
      });
      return;
    }

    if (f.size === 0) {
      highConfidence.push({
        file: f,
        reason: 'Empty placeholder report (size is 0 bytes)',
        action: 'Delete file'
      });
      return;
    }

    const isReportOrDryRun = f.absPath.includes('/reports/') || f.fileName.toLowerCase().includes('report') || f.fileName.toLowerCase().includes('dry_run') || f.fileName.toLowerCase().includes('dry-run');
    if (isReportOrDryRun && f.ageDays > 60) {
      highConfidence.push({
        file: f,
        reason: `Obsolete report/dry-run older than 60 days (Age: ${f.ageDays} days)`,
        action: 'Delete file'
      });
      return;
    }

    // Duplicate variants sorted so older ones are candidate
    if (duplicatePaths.has(f.absPath)) {
      // Find the group
      const key = path.join(f.dir, f.baseName);
      const group = [...basenameGroups[key]].sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      if (f.absPath !== group[0].absPath) {
        // Not the newest
        lowConfidence.push({
          file: f,
          reason: `Older timestamp variant of [${group[0].fileName}](file://${group[0].absPath})`,
          action: 'Delete after verification of newer file'
        });
        return;
      }
    }

    // Other reports older than 30 days
    if (isReportOrDryRun && f.ageDays > 30) {
      lowConfidence.push({
        file: f,
        reason: `Stale report/dry-run older than 30 days (Age: ${f.ageDays} days)`,
        action: 'Verify contents and delete if redundant'
      });
    }
  });

  // Read template
  const templatePath = path.join(cleanupFolders.templates, 'cleanup-review-list-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let template = fs.readFileSync(templatePath, 'utf8');

  // Format sections
  let highRows = highConfidence.map(c => `| [${c.file.relPath}](file://${c.file.absPath}) | High | ${c.file.absPath.includes('/reports/') ? 'Report' : 'Empty File'} | ${c.action} | ${c.reason} | No |`).join('\n');
  if (!highRows) highRows = '| None | N/A | N/A | N/A | No high confidence candidates found | N/A |';

  let lowRows = lowConfidence.map(c => `| [${c.file.relPath}](file://${c.file.absPath}) | Low | Duplicate / Stale | ${c.action} | ${c.reason} | No |`).join('\n');
  if (!lowRows) lowRows = '| None | N/A | N/A | N/A | No low confidence candidates found | N/A |';

  let touchRows = doNotTouch.slice(0, 30).map(c => `| [${c.file.relPath}](file://${c.file.absPath}) | Critical | Protected | None | ${c.reason} | Yes (DO NOT TOUCH) |`).join('\n');
  if (!touchRows) touchRows = '| None | N/A | N/A | N/A | No do-not-touch files found | N/A |';

  const dateStr = getFormattedDate();
  template = template
    .replace('{{SCAN_DATE}}', dateStr)
    .replace('{{HIGH_CONFIDENCE_ROWS}}', highRows)
    .replace('{{LOW_CONFIDENCE_ROWS}}', lowRows)
    .replace('{{DO_NOT_TOUCH_ROWS}}', touchRows);

  const outPath = path.join(cleanupFolders.reviewLists, `cleanup_review_list_${dateStr}.md`);
  fs.writeFileSync(outPath, template);
  console.log(`✅ Cleanup review list generated: [cleanup_review_list_${dateStr}.md](file://${outPath})`);
}

// 5. Status command logic
function handleStatus(files: FileInfo[]) {
  ensureDirs();

  function getLatestFile(dir: string, pattern: RegExp): string {
    if (!fs.existsSync(dir)) return 'None';
    const items = fs.readdirSync(dir);
    const matches = items
      .filter(item => pattern.test(item))
      .map(item => ({ name: item, fullPath: path.join(dir, item), stat: fs.statSync(path.join(dir, item)) }))
      .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

    if (matches.length > 0) {
      return `[${matches[0].name}](file://${matches[0].fullPath})`;
    }
    return 'None';
  }

  const latestScan = getLatestFile(cleanupFolders.reports, /^duplicate_scan_report_/);
  const latestStale = getLatestFile(cleanupFolders.reports, /^stale_artifact_report_/);
  const latestIndex = getLatestFile(cleanupFolders.quarantineIndex, /^cleanup_quarantine_index_/);
  const latestList = getLatestFile(cleanupFolders.reviewLists, /^cleanup_review_list_/);

  // Group stats
  const basenameGroups: { [key: string]: FileInfo[] } = {};
  files.forEach(f => {
    const key = path.join(f.dir, f.baseName);
    if (!basenameGroups[key]) {
      basenameGroups[key] = [];
    }
    basenameGroups[key].push(f);
  });
  const duplicateGroupCount = Object.values(basenameGroups).filter(g => g.length > 1).length;

  // Stale stats
  const staleCount = files.filter(f => {
    const isReportOrDry = f.absPath.includes('/reports/') || f.fileName.toLowerCase().includes('report') || f.fileName.toLowerCase().includes('dry_run') || f.fileName.toLowerCase().includes('dry-run');
    return isReportOrDry && f.ageDays > 30;
  }).length;

  console.log("\n=========================================");
  console.log("🧹 DUPLICATE CLEANUP & QUARANTINE STATUS");
  console.log("=========================================");
  console.log(`- Latest Duplicate Scan Report: ${latestScan}`);
  console.log(`- Latest Stale Artifact Report: ${latestStale}`);
  console.log(`- Latest Quarantine Index:      ${latestIndex}`);
  console.log(`- Latest Review List:           ${latestList}`);
  console.log(`- Duplicate Group Count:        ${duplicateGroupCount}`);
  console.log(`- Stale Candidate Count:        ${staleCount}`);
  console.log(`- Files Excluded:               ${EXCLUDED_ROOTS.length}`);
  console.log(`- Next Recommended Action:      Run "scan" followed by "stale" commands.`);
  console.log("=========================================");
}

async function main() {
  ensureDirs();
  const args = process.argv.slice(2);
  const command = (args[0] || 'help').toLowerCase();

  // Scanned files
  const files = scanRoots();

  switch (command) {
    case 'scan':
      handleScan(files);
      break;
    case 'stale':
      handleStale(files);
      break;
    case 'quarantine-index':
      handleQuarantineIndex(files);
      break;
    case 'review-list':
      handleReviewList(files);
      break;
    case 'status':
      handleStatus(files);
      break;
    case 'help':
    default:
      console.log(`💡 Note: Try 'npm run duplicate-cleanup-help' for documentation.\n`);
      handleStatus(files);
      break;
  }
}

main().catch(err => {
  console.error("❌ Execution error in Duplicate Cleanup:", err);
  process.exit(1);
});
