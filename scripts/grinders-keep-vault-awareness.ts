import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { outputDirectories } from '../config/grinders-keep-core-brief-engine.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function runVaultAwareness() {
  const dateStr = getFormattedDate();
  console.log(`🗄️ Running Grinders Keep Vault Awareness Layer v0.1 for ${dateStr} (Real Data Enforcement Mode)...`);
  await announceIntent("Scanning vaults and directories with real boundaries");

  const targets = [
    { path: path.join(REPO_ROOT, 'AlexanderOSVault'), role: 'Primary Creative Vault', expectedType: 'vault' },
    { path: path.join(REPO_ROOT, 'Obsidian'), role: 'Fallback Obsidian vault', expectedType: 'vault' },
    { path: path.join(REPO_ROOT, 'staging', 'knowledge_harvest'), role: 'Staging area for incoming knowledge harvest files', expectedType: 'folder' },
    { path: path.join(REPO_ROOT, 'staging', 'notebooklm_bridge'), role: 'Staging area for NotebookLM bridge interaction', expectedType: 'folder' },
    { path: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge'), role: 'Outputs from NotebookLM bridge execution', expectedType: 'folder' },
    { path: path.join(REPO_ROOT, 'reports', 'knowledge_harvest'), role: 'Knowledge harvest final audit reports', expectedType: 'folder' },
    { path: path.join(REPO_ROOT, 'outputs', 'grinders_keep'), role: 'Grinders Keep generated output files and briefs', expectedType: 'folder' }
  ];

  let finalReport = `# Multi-Vault Awareness Survey - ${dateStr}\n\n`;

  for (const target of targets) {
    const targetRelative = path.relative(REPO_ROOT, target.path) || target.path;
    let exists = false;
    try {
      exists = fs.existsSync(target.path);
    } catch (e) {
      // Ignore
    }

    finalReport += `## Target: ${targetRelative}\n`;
    finalReport += `- **Expected Role:** ${target.role}\n`;

    if (!exists) {
      finalReport += `- **Evidence Status:**\n`;
      finalReport += `* source_status: missing\n`;
      finalReport += `* evidence_status: unavailable\n`;
      finalReport += `* confidence_score_1_to_10: 1\n`;
      finalReport += `* impact: Local context and telemetry files from ${targetRelative} are unavailable for R&D brief parsing.\n`;
      finalReport += `* suggested_next_action: Initialize ${targetRelative} directory manually or run corresponding CLI staging command.\n`;
    } else {
      let files: string[] = [];
      try {
        files = fs.readdirSync(target.path).filter(f => !f.startsWith('.'));
      } catch (e) {
        // Unreadable
      }

      finalReport += `- **Evidence Status:**\n`;
      finalReport += `* source_status: found\n`;
      finalReport += `* evidence_status: available\n`;
      finalReport += `* confidence_score_1_to_10: ${files.length > 0 ? 10 : 5}\n`;
      finalReport += `- **Useful Files Detected:** ${files.slice(0, 5).join(', ') || 'none'}\n`;
      finalReport += `- **Routing Suggestion:** Standard read-only index mappings active.\n`;
    }
    finalReport += `\n---\n\n`;
  }

  // Ensure output directory exists
  fs.mkdirSync(outputDirectories.vaultAwareness, { recursive: true });
  const outputFile = path.join(outputDirectories.vaultAwareness, `grinders_keep_vault_awareness_${dateStr}.md`);
  fs.writeFileSync(outputFile, finalReport, 'utf-8');

  console.log(`✅ Saved vault awareness output to: ${outputFile}`);
  await announceCompletion("Vault awareness scan complete", "10");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runVaultAwareness().catch(err => {
    console.error(`❌ Error in Vault Awareness: ${err}`);
    process.exit(1);
  });
}
