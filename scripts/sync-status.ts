import fs from 'fs';
import path from 'path';
import { REPO_ROOT, OBSIDIAN_INGEST_OUTPUT, BACKUPS_ROOT } from '../config/paths.js';

interface MatchedLines {
  todo: string[];
  next: string[];
  decision: string[];
  blocked: string[];
}

interface IngestedFile {
  filePath: string;
  title: string;
  lastModified: string;
  matchedLines: MatchedLines;
  relevanceScore: number;
}

interface IngestReport {
  timestamp: string;
  vaultsScanned: string[];
  filesScannedCount: number;
  files: IngestedFile[];
}

function backupFile(sourcePath: string) {
  if (!fs.existsSync(sourcePath)) return;
  if (!fs.existsSync(BACKUPS_ROOT)) {
    fs.mkdirSync(BACKUPS_ROOT, { recursive: true });
  }
  const basename = path.basename(sourcePath);
  const backupPath = path.join(BACKUPS_ROOT, `${basename}.bak`);
  fs.copyFileSync(sourcePath, backupPath);
  console.log(`  💾 Backed up ${basename} to outputs/backups/${basename}.bak`);
}

function updateFileWithSnapshot(filePath: string, snapshotContent: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Target file ${filePath} does not exist.`);
    return;
  }

  backupFile(filePath);

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const sectionHeader = '## Obsidian Intelligence Snapshot';
  
  let newContent = '';
  if (fileContent.includes(sectionHeader)) {
    // Replace existing section
    const parts = fileContent.split(sectionHeader);
    const beforeSection = parts[0];
    const afterSection = parts[1];
    
    // Check if there is a next heading in the remainder
    const nextHeadingIndex = afterSection.search(/\n## /);
    if (nextHeadingIndex !== -1) {
      const restOfFile = afterSection.substring(nextHeadingIndex);
      newContent = `${beforeSection.trim()}\n\n${snapshotContent.trim()}\n\n${restOfFile.trim()}\n`;
    } else {
      newContent = `${beforeSection.trim()}\n\n${snapshotContent.trim()}\n`;
    }
  } else {
    // Append to end of file
    newContent = `${fileContent.trim()}\n\n${snapshotContent.trim()}\n`;
  }

  fs.writeFileSync(filePath, newContent);
  console.log(`  ✅ Updated ${path.basename(filePath)} with Obsidian Snapshot.`);
}

function sync() {
  console.log("=========================================");
  console.log("🔄 SYNCING STATUS: Local Repo Updates");
  console.log("=========================================");

  const reportPath = path.join(OBSIDIAN_INGEST_OUTPUT, 'ingest_report.json');
  if (!fs.existsSync(reportPath)) {
    console.error("❌ Ingest report json does not exist. Run ingest first!");
    process.exit(1);
  }

  const reportData: IngestReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  const timestamp = reportData.timestamp;
  const vaults = reportData.vaultsScanned;

  // Extract variables
  const topFiles = reportData.files.slice(0, 5);
  
  const extractedActions: string[] = [];
  const extractedBlockers: string[] = [];
  const extractedDecisions: string[] = [];

  for (const file of reportData.files) {
    file.matchedLines.todo.forEach(t => extractedActions.push(`${t} (in [${file.title}](file://${file.filePath}))`));
    file.matchedLines.next.forEach(n => extractedActions.push(`${n} (in [${file.title}](file://${file.filePath}))`));
    file.matchedLines.blocked.forEach(b => extractedBlockers.push(`${b} (in [${file.title}](file://${file.filePath}))`));
    file.matchedLines.decision.forEach(d => extractedDecisions.push(`${d} (in [${file.title}](file://${file.filePath}))`));
  }

  // Build Snapshot String
  let snapshot = `## Obsidian Intelligence Snapshot\n\n`;
  snapshot += `- **Last Ingest:** ${new Date(timestamp).toLocaleString()}\n`;
  snapshot += `- **Vaults Scanned:**\n`;
  if (vaults.length > 0) {
    vaults.forEach(v => snapshot += `  - \`${v}\`\n`);
  } else {
    snapshot += `  - (None)\n`;
  }
  
  snapshot += `- **Top Relevant Files:**\n`;
  if (topFiles.length > 0) {
    topFiles.forEach(f => snapshot += `  - [${f.title}](file://${f.filePath}) (Score: ${f.relevanceScore})\n`);
  } else {
    snapshot += `  - (None)\n`;
  }

  snapshot += `- **Extracted Next Actions:**\n`;
  const actionSlice = extractedActions.slice(0, 10);
  if (actionSlice.length > 0) {
    actionSlice.forEach(act => {
      // Format as checkbox
      const cleanAct = act.replace(/^-\s*\[[ xX]?\]\s*/, '').replace(/^-\s*/, '');
      snapshot += `  - [ ] ${cleanAct}\n`;
    });
  } else {
    snapshot += `  - (None)\n`;
  }

  snapshot += `- **Extracted Blockers:**\n`;
  const blockerSlice = extractedBlockers.slice(0, 5);
  if (blockerSlice.length > 0) {
    blockerSlice.forEach(b => {
      const cleanB = b.replace(/^-\s*/, '');
      snapshot += `  - ⚠️ ${cleanB}\n`;
    });
  } else {
    snapshot += `  - (None)\n`;
  }

  snapshot += `- **Extracted Decisions:**\n`;
  const decisionSlice = extractedDecisions.slice(0, 5);
  if (decisionSlice.length > 0) {
    decisionSlice.forEach(d => {
      const cleanD = d.replace(/^-\s*/, '');
      snapshot += `  - ⚖️ ${cleanD}\n`;
    });
  } else {
    snapshot += `  - (None)\n`;
  }

  // Update repo files
  updateFileWithSnapshot(path.join(REPO_ROOT, 'SYSTEM_STATUS.md'), snapshot);
  updateFileWithSnapshot(path.join(REPO_ROOT, 'PROJECTS.md'), snapshot);
  updateFileWithSnapshot(path.join(REPO_ROOT, 'NEXT_ACTIONS.md'), snapshot);

  console.log("=========================================");
  console.log("🎉 STATUS SYNC COMPLETED: Repo updated safely.");
  console.log("=========================================");
}

sync();
