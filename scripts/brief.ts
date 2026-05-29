import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function readMarkdown(fileName: string): string {
  const filePath = path.join(rootDir, fileName);
  if (!fs.existsSync(filePath)) {
    return '';
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function parseSystemStatus(content: string) {
  let phase = 'Unknown';
  const risks: string[] = [];

  // Parse Phase
  const phaseMatch = content.match(/-\s+\*\*Current Phase:\*\*\s*(.*)/i);
  if (phaseMatch) {
    phase = phaseMatch[1].trim();
  }

  // Parse Risks section
  const risksSection = content.split(/##\s+⚠️\s+Current\s+Risks/i)[1];
  if (risksSection) {
    const lines = risksSection.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('##')) {
        break; // Next section
      }
      if (line.trim().startsWith('-')) {
        risks.push(line.replace(/^-\s*/, '').trim());
      }
    }
  }

  return { phase, risks };
}

function parseProjects(content: string) {
  const activeProjects: string[] = [];
  const topPriorities: string[] = [];

  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes('|') && !line.includes('---') && !line.includes('Project Name')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 7) {
        const name = parts[1].replace(/\*\*/g, '');
        const status = parts[3];
        const priority = parts[4];
        const nextAction = parts[5];

        if (status === 'Active' || status === 'Building') {
          activeProjects.push(`${name} (${status})`);
        }
        if (priority === 'Critical' || priority === 'High') {
          topPriorities.push(`${name} [Priority: ${priority}] - Next: ${nextAction}`);
        }
      }
    }
  }

  return { activeProjects, topPriorities };
}

function parseNextActions(content: string) {
  const actions: string[] = [];
  const lines = content.split('\n');
  let inDoNow = false;
  let inDoNext = false;

  for (const line of lines) {
    if (line.trim().startsWith('## Do Now')) {
      inDoNow = true;
      inDoNext = false;
      continue;
    } else if (line.trim().startsWith('## Do Next')) {
      inDoNow = false;
      inDoNext = true;
      continue;
    } else if (line.trim().startsWith('##')) {
      inDoNow = false;
      inDoNext = false;
    }

    if ((inDoNow || inDoNext) && line.trim().startsWith('-')) {
      const actionText = line.replace(/^-\s*\[[ xX]?\]\s*/, '').trim();
      if (actionText) {
        actions.push(actionText);
      }
    }
  }

  return actions.slice(0, 5);
}

function generateBrief() {
  const statusContent = readMarkdown('SYSTEM_STATUS.md');
  const projectsContent = readMarkdown('PROJECTS.md');
  const decisionsContent = readMarkdown('DECISIONS.md');
  const actionsContent = readMarkdown('NEXT_ACTIONS.md');

  const status = parseSystemStatus(statusContent);
  const projects = parseProjects(projectsContent);
  const nextActions = parseNextActions(actionsContent);

  console.log("=========================================");
  console.log("📡 OPERATIONAL BRIEF: Brilliantaire OS");
  console.log("=========================================");
  console.log(`\n• CURRENT PHASE: ${status.phase}`);
  
  console.log("\n• ACTIVE PROJECTS:");
  if (projects.activeProjects.length > 0) {
    projects.activeProjects.forEach(p => console.log(`  - ${p}`));
  } else {
    console.log("  (None)");
  }

  console.log("\n• TOP PRIORITIES:");
  if (projects.topPriorities.length > 0) {
    projects.topPriorities.forEach(tp => console.log(`  🔥 ${tp}`));
  } else {
    console.log("  (None)");
  }

  console.log("\n• NEXT 5 ACTIONS:");
  if (nextActions.length > 0) {
    nextActions.forEach((act, idx) => console.log(`  ${idx + 1}. ${act}`));
  } else {
    console.log("  (None)");
  }

  console.log("\n• RISKS & IMPEDIMENTS:");
  if (status.risks.length > 0) {
    status.risks.forEach(r => console.log(`  ⚠️ ${r}`));
  } else {
    console.log("  ✅ No active risks logged.");
  }
  console.log("\n=========================================");
}

generateBrief();
