import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

interface AgentSummary {
  name: string;
  purpose: string;
  trigger: string;
  filesOwned: string;
}

function parseAgents() {
  const filePath = path.join(rootDir, 'AGENTS.md');
  if (!fs.existsSync(filePath)) {
    console.error("❌ AGENTS.md not found.");
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const sections = content.split('\n## ');
  
  const agents: AgentSummary[] = [];

  for (const sec of sections) {
    // Skip intro
    if (sec.trim().startsWith('# ')) continue;

    const lines = sec.split('\n');
    const headerLine = lines[0].trim();
    if (!headerLine) continue;

    // Extract name (removing number prefix like "1. ")
    const name = headerLine.replace(/^\d+\.\s*/, '').trim();

    let purpose = '';
    let trigger = '';
    let filesOwned = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- **Purpose:**')) {
        purpose = trimmed.replace('- **Purpose:**', '').trim();
      } else if (trimmed.startsWith('- **Activation Trigger:**')) {
        trigger = trimmed.replace('- **Activation Trigger:**', '').trim();
      } else if (trimmed.startsWith('- **Files Owned:**')) {
        // Strip markdown links for terminal display, keeping basenames
        filesOwned = trimmed.replace('- **Files Owned:**', '')
          .replace(/\[([^\]]+)\]\(file:\/\/\/[^\)]+\)/g, '$1')
          .trim();
      }
    }

    if (name) {
      agents.push({ name, purpose, trigger, filesOwned });
    }
  }

  console.log("=========================================");
  console.log("🤖 ACTIVE AGENT COUNCIL: Brilliantaire OS");
  console.log("=========================================");

  for (const agent of agents) {
    console.log(`\n🔹 Agent:      ${agent.name}`);
    console.log(`   Purpose:    ${agent.purpose}`);
    console.log(`   Trigger:    ${agent.trigger}`);
    console.log(`   Files Owned: ${agent.filesOwned}`);
  }

  console.log("\n=========================================");
}

parseAgents();
