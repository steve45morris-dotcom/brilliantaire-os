import * as fs from 'fs';
import * as path from 'path';
import { APPROVED_SOURCES } from '../config/narrator-sources.js';

// Helper to pad numbers
const pad = (n: number) => String(n).padStart(2, '0');

function getLatestFile(dirPath: string): string | null {
  if (!fs.existsSync(dirPath)) return null;
  try {
    const files = fs.readdirSync(dirPath);
    let latestFile: string | null = null;
    let latestMtime = 0;

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && !file.startsWith('.')) {
        if (stat.mtimeMs > latestMtime) {
          latestMtime = stat.mtimeMs;
          latestFile = fullPath;
        }
      }
    }
    return latestFile;
  } catch (e) {
    return null;
  }
}

function getFileContent(filePath: string | null): string {
  if (!filePath || !fs.existsSync(filePath)) return '*(no content)*';
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Limit size to prevent huge context, but keep it substantial
    if (content.length > 5000) {
      return content.substring(0, 5000) + '\n...[truncated]';
    }
    return content;
  } catch (e) {
    return `*(error reading file: ${e})*`;
  }
}

function run() {
  const rootDir = process.cwd();
  const sourcesFound: string[] = [];
  const sourcesMissing: string[] = [];

  // Categorize and locate files
  const resolvedPaths: { [key: string]: string | null } = {};

  for (const src of APPROVED_SOURCES) {
    const fullPath = path.join(rootDir, src);
    if (src.endsWith('/')) {
      // It's a directory
      if (fs.existsSync(fullPath)) {
        const latest = getLatestFile(fullPath);
        if (latest) {
          resolvedPaths[src] = latest;
          sourcesFound.push(`${src} (latest: ${path.basename(latest)})`);
        } else {
          resolvedPaths[src] = null;
          sourcesMissing.push(`${src} (directory exists but empty)`);
        }
      } else {
        resolvedPaths[src] = null;
        sourcesMissing.push(`${src} (directory missing)`);
      }
    } else {
      // It's a single file
      if (fs.existsSync(fullPath)) {
        resolvedPaths[src] = fullPath;
        sourcesFound.push(src);
      } else {
        resolvedPaths[src] = null;
        sourcesMissing.push(src);
      }
    }
  }

  // Load template
  const templatePath = path.join(rootDir, 'templates/narrator/source-snapshot-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`Error: Template not found at ${templatePath}`);
    process.exit(1);
  }
  let template = fs.readFileSync(templatePath, 'utf-8');

  // Format date strings
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const generatedAt = now.toISOString();

  // Populate snippets
  const systemStatusContent = getFileContent(resolvedPaths['SYSTEM_STATUS.md']);
  const projectsContent = getFileContent(resolvedPaths['PROJECTS.md']);
  const nextActionsContent = getFileContent(resolvedPaths['NEXT_ACTIONS.md']);
  const commandsContent = getFileContent(resolvedPaths['COMMANDS.md']);

  const latestTelemetry = getFileContent(resolvedPaths['outputs/mesh_telemetry/reports/'] || resolvedPaths['outputs/mesh_telemetry/snapshots/']);
  const latestAutomation = getFileContent(resolvedPaths['outputs/automation/logs/'] || resolvedPaths['outputs/automation/runs/']);
  const latestCommand = getFileContent(resolvedPaths['outputs/command_logs/']);
  const latestCampaign = getFileContent(resolvedPaths['outputs/campaigns/validation_reports/']);
  const latestRelease = getFileContent(resolvedPaths['outputs/manual_release/runbooks/'] || resolvedPaths['outputs/manual_release/checklists/']);
  const latestKnowledge = getFileContent(resolvedPaths['outputs/knowledge_harvest/workflow_ideas/'] || resolvedPaths['outputs/notebooklm_bridge/workflow_ideas/']);

  // Replacements
  template = template
    .replace('{{GENERATED_AT}}', generatedAt)
    .replace('{{SOURCES_FOUND}}', sourcesFound.map(s => `- ${s}`).join('\n') || 'None')
    .replace('{{SOURCES_MISSING}}', sourcesMissing.map(s => `- ${s}`).join('\n') || 'None')
    .replace('{{SYSTEM_STATUS_CONTENT}}', systemStatusContent)
    .replace('{{PROJECTS_CONTENT}}', projectsContent)
    .replace('{{NEXT_ACTIONS_CONTENT}}', nextActionsContent)
    .replace('{{COMMANDS_CONTENT}}', commandsContent)
    .replace('{{LATEST_TELEMETRY_REPORT}}', latestTelemetry)
    .replace('{{LATEST_AUTOMATION_LOG}}', latestAutomation)
    .replace('{{LATEST_COMMAND_LOG}}', latestCommand)
    .replace('{{LATEST_CAMPAIGN_VALIDATION_REPORT}}', latestCampaign)
    .replace('{{LATEST_MANUAL_RELEASE_RUNBOOK}}', latestRelease)
    .replace('{{LATEST_KNOWLEDGE_WORKFLOW_IDEAS}}', latestKnowledge);

  // Write snapshot files
  const snapshotDir = path.join(rootDir, 'outputs/narrator/source_snapshots');
  fs.mkdirSync(snapshotDir, { recursive: true });

  const customSnapshotPath = path.join(snapshotDir, `narrator_source_snapshot_${dateStr}.md`);
  const latestSnapshotPath = path.join(snapshotDir, 'latest_snapshot.md');

  fs.writeFileSync(customSnapshotPath, template, 'utf-8');
  fs.writeFileSync(latestSnapshotPath, template, 'utf-8');

  console.log(`[OK] Source snapshot generated: ${customSnapshotPath}`);
  console.log(`[OK] Copied to: ${latestSnapshotPath}`);
}

run();
