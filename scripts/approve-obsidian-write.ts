import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  OBSIDIAN_INGEST_OUTPUT,
  WRITE_STAGING_OUTPUT,
  WRITE_LOG_OUTPUT,
  OBSIDIAN_SAFE_WRITE_FOLDER_NAME
} from '../config/paths.js';

interface IngestReport {
  timestamp: string;
  vaultsScanned: string[];
}

function getLatestIngestVault(): string | null {
  const reportPath = path.join(OBSIDIAN_INGEST_OUTPUT, 'ingest_report.json');
  if (!fs.existsSync(reportPath)) return null;
  try {
    const data: IngestReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    if (data.vaultsScanned && data.vaultsScanned.length > 0) {
      return data.vaultsScanned[0];
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

function updateFrontmatterStatus(content: string, writtenTime: string): string {
  if (content.includes('status: staged')) {
    return content
      .replace('status: staged', 'status: approved_written')
      .replace('requires_approval: true', `requires_approval: false\nwritten_at: ${writtenTime}`);
  }
  return content;
}

function approve() {
  console.log("=========================================");
  console.log("🔐 EXECUTING APPROVED OBSIDIAN WRITE");
  console.log("=========================================");

  const vaultPath = getLatestIngestVault();
  if (!vaultPath) {
    console.error("❌ Active Obsidian vault path not found. Run ingest first.");
    process.exit(1);
  }

  if (!fs.existsSync(vaultPath)) {
    console.error(`❌ Vault path ${vaultPath} does not exist on disk.`);
    process.exit(1);
  }

  // Create Obsidian safe write structures
  const safeBase = path.join(vaultPath, OBSIDIAN_SAFE_WRITE_FOLDER_NAME);
  const subfolders = {
    daily: path.join(safeBase, 'daily'),
    'next-actions': path.join(safeBase, 'next-actions'),
    decisions: path.join(safeBase, 'decisions'),
    projects: path.join(safeBase, 'projects'),
    logs: path.join(safeBase, 'logs')
  };

  for (const dir of Object.values(subfolders)) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Read staged files
  if (!fs.existsSync(WRITE_STAGING_OUTPUT)) {
    console.error("❌ Staging directory does not exist. Run stage-write first.");
    process.exit(1);
  }

  const stagedFiles = fs.readdirSync(WRITE_STAGING_OUTPUT).filter(f => f.endsWith('.md'));
  if (stagedFiles.length === 0) {
    console.warn("⚠️ No staged files found in outputs/write_staging/.");
    process.exit(0);
  }

  const writtenTime = new Date().toISOString();
  const timestampSuffix = Math.floor(Date.now() / 1000);
  
  const writtenDetails: string[] = [];
  const skippedDetails: string[] = [];

  for (const filename of stagedFiles) {
    const sourcePath = path.join(WRITE_STAGING_OUTPUT, filename);
    const content = fs.readFileSync(sourcePath, 'utf-8');
    const updatedContent = updateFrontmatterStatus(content, writtenTime);

    // Determine target subfolder
    let subfolderKey: keyof typeof subfolders = 'logs';
    if (filename.startsWith('daily_brief_')) subfolderKey = 'daily';
    else if (filename.startsWith('next_actions_')) subfolderKey = 'next-actions';
    else if (filename.startsWith('decisions_snapshot_')) subfolderKey = 'decisions';
    else if (filename.startsWith('project_snapshot_')) subfolderKey = 'projects';

    const targetDir = subfolders[subfolderKey];
    let destFilename = filename;
    let targetPath = path.join(targetDir, destFilename);

    // Safety rule: do not overwrite. Append timestamp suffix if file exists.
    if (fs.existsSync(targetPath)) {
      const ext = path.extname(filename);
      const base = path.basename(filename, ext);
      destFilename = `${base}_${timestampSuffix}${ext}`;
      targetPath = path.join(targetDir, destFilename);
    }

    fs.writeFileSync(targetPath, updatedContent);
    writtenDetails.push(`- Staged: \`${filename}\` -> Written: \`${path.join(OBSIDIAN_SAFE_WRITE_FOLDER_NAME, subfolderKey, destFilename)}\``);
  }

  // Create repo-side JSON logs
  if (!fs.existsSync(WRITE_LOG_OUTPUT)) {
    fs.mkdirSync(WRITE_LOG_OUTPUT, { recursive: true });
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const repoLogFile = path.join(WRITE_LOG_OUTPUT, `write_log_${dateStr}.json`);
  const logData = {
    date: dateStr,
    timestamp: writtenTime,
    vault: vaultPath,
    stagedFilesCount: stagedFiles.length,
    writtenFiles: writtenDetails,
    skippedFiles: skippedDetails,
    warnings: skippedDetails.length > 0 ? "Skipped some operations" : "None"
  };
  fs.writeFileSync(repoLogFile, JSON.stringify(logData, null, 2));

  // Write Obsidian-side log file
  const obsLogFilename = `write_log_${dateStr}.md`;
  const obsLogPath = path.join(subfolders.logs, obsLogFilename);
  let obsLogContent = `# 📝 Safe Write Log: ${dateStr}\n\n`;
  obsLogContent += `- **Timestamp:** ${writtenTime}\n`;
  obsLogContent += `- **Staged Files Written:** ${stagedFiles.length}\n`;
  obsLogContent += `\n## Written Files\n`;
  writtenDetails.forEach(line => obsLogContent += `${line}\n`);
  
  fs.writeFileSync(obsLogPath, obsLogContent);

  // Print results
  console.log("✅ Success! Vault Write Executed Safely.");
  console.log("\n📁 WRITTEN FILES:");
  writtenDetails.forEach(line => console.log(`  ${line}`));
  if (skippedDetails.length > 0) {
    console.log("\n⚠️ SKIPPED FILES:");
    skippedDetails.forEach(line => console.log(`  ${line}`));
  }
  console.log(`\n• Repo log written to: outputs/write_logs/write_log_${dateStr}.json`);
  console.log(`• Vault log written to: ${OBSIDIAN_SAFE_WRITE_FOLDER_NAME}/logs/${obsLogFilename}`);
  console.log("=========================================");
}

approve();
