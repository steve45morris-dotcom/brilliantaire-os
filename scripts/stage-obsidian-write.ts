import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  REPO_ROOT,
  DAILY_BRIEF_OUTPUT,
  OBSIDIAN_INGEST_OUTPUT,
  WRITE_STAGING_OUTPUT,
  OBSIDIAN_SAFE_WRITE_FOLDER_NAME
} from '../config/paths.js';

interface IngestReport {
  timestamp: string;
  vaultsScanned: string[];
  files: any[];
}

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLatestDailyBrief(): { name: string; content: string } | null {
  if (!fs.existsSync(DAILY_BRIEF_OUTPUT)) return null;
  const files = fs.readdirSync(DAILY_BRIEF_OUTPUT)
    .filter(f => f.startsWith('daily_brief_') && f.endsWith('.md'))
    .sort(); // Natural sort puts the latest date at the end
  
  if (files.length === 0) return null;
  const latestName = files[files.length - 1];
  const content = fs.readFileSync(path.join(DAILY_BRIEF_OUTPUT, latestName), 'utf-8');
  return { name: latestName, content };
}

function getTargetVault(): string {
  const reportPath = path.join(OBSIDIAN_INGEST_OUTPUT, 'ingest_report.json');
  if (fs.existsSync(reportPath)) {
    try {
      const data: IngestReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      if (data.vaultsScanned && data.vaultsScanned.length > 0) {
        return data.vaultsScanned[0];
      }
    } catch (e) {
      // Ignore parse error
    }
  }
  return 'Unknown Vault';
}

function cleanMarkdownOfFrontmatter(content: string): string {
  // If the file already starts with frontmatter, strip it to prevent double frontmatter
  if (content.trim().startsWith('---')) {
    const parts = content.split('---');
    if (parts.length >= 3) {
      return parts.slice(2).join('---').trim();
    }
  }
  return content.trim();
}

function stage() {
  console.log("=========================================");
  console.log("📤 STAGING OBSIDIAN WRITE: Verification");
  console.log("=========================================");

  const targetVault = getTargetVault();
  const dateStr = getFormattedDate();
  const isoTimestamp = new Date().toISOString();

  // Create staging directory if missing
  if (!fs.existsSync(WRITE_STAGING_OUTPUT)) {
    fs.mkdirSync(WRITE_STAGING_OUTPUT, { recursive: true });
  }

  // 1. Daily Brief
  const latestBrief = getLatestDailyBrief();
  let briefContent = '';
  if (latestBrief) {
    briefContent = cleanMarkdownOfFrontmatter(latestBrief.content);
  } else {
    briefContent = `# Operating Brief\n\nNo brief generated today.`;
  }

  // 2. Next Actions
  const nextActionsPath = path.join(REPO_ROOT, 'NEXT_ACTIONS.md');
  const nextActionsContent = fs.existsSync(nextActionsPath)
    ? cleanMarkdownOfFrontmatter(fs.readFileSync(nextActionsPath, 'utf-8'))
    : '# Next Actions\n\nNone.';

  // 3. Decisions
  const decisionsPath = path.join(REPO_ROOT, 'DECISIONS.md');
  const decisionsContent = fs.existsSync(decisionsPath)
    ? cleanMarkdownOfFrontmatter(fs.readFileSync(decisionsPath, 'utf-8'))
    : '# Decisions Log\n\nNone.';

  // 4. Projects
  const projectsPath = path.join(REPO_ROOT, 'PROJECTS.md');
  const projectsContent = fs.existsSync(projectsPath)
    ? cleanMarkdownOfFrontmatter(fs.readFileSync(projectsPath, 'utf-8'))
    : '# Projects Matrix\n\nNone.';

  const frontmatter = `---
source: brilliantaire-os
phase: Phase 3B
status: staged
created: ${isoTimestamp}
target: Obsidian safe write folder
requires_approval: true
---

`;

  const filesToStage = [
    { name: `daily_brief_${dateStr}.md`, content: briefContent },
    { name: `next_actions_${dateStr}.md`, content: nextActionsContent },
    { name: `decisions_snapshot_${dateStr}.md`, content: decisionsContent },
    { name: `project_snapshot_${dateStr}.md`, content: projectsContent }
  ];

  console.log(`📡 Targeting Vault: ${targetVault}`);
  console.log(`📡 Destination Folder: ${OBSIDIAN_SAFE_WRITE_FOLDER_NAME}/\n`);

  for (const file of filesToStage) {
    const destPath = path.join(WRITE_STAGING_OUTPUT, file.name);
    fs.writeFileSync(destPath, frontmatter + file.content);
    console.log(`  ✅ Staged file: outputs/write_staging/${file.name}`);
  }

  console.log("\n=========================================");
  console.log("🎉 STAGING COMPLETE: Files are ready to write.");
  console.log("👉 Run this command to execute the approved write:");
  console.log("   npm run approve-write");
  console.log("=========================================");
}

stage();
