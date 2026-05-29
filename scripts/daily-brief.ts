import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { REPO_ROOT, DAILY_BRIEF_OUTPUT, OBSIDIAN_INGEST_OUTPUT } from '../config/paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface IngestReport {
  timestamp: string;
  vaultsScanned: string[];
  filesScannedCount: number;
  files: any[];
}

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseMarkdownFile(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
}

function generateBrief() {
  console.log("=========================================");
  console.log("📅 GENERATING DAILY BRIEF");
  console.log("=========================================");

  const dateStr = getFormattedDate();
  const briefFileName = `daily_brief_${dateStr}.md`;
  const finalPath = path.join(DAILY_BRIEF_OUTPUT, briefFileName);

  const systemStatusRaw = parseMarkdownFile(path.join(REPO_ROOT, 'SYSTEM_STATUS.md'));
  const projectsRaw = parseMarkdownFile(path.join(REPO_ROOT, 'PROJECTS.md'));
  const decisionsRaw = parseMarkdownFile(path.join(REPO_ROOT, 'DECISIONS.md'));
  const nextActionsRaw = parseMarkdownFile(path.join(REPO_ROOT, 'NEXT_ACTIONS.md'));

  // Read latest ingest report if available
  let reportData: IngestReport | null = null;
  const ingestReportPath = path.join(OBSIDIAN_INGEST_OUTPUT, 'ingest_report.json');
  if (fs.existsSync(ingestReportPath)) {
    reportData = JSON.parse(fs.readFileSync(ingestReportPath, 'utf-8'));
  }

  // Parse Phase
  let currentPhase = 'Phase 3A: Knowledge Ingestion & Obsidian Read-Only Gateway';
  const phaseMatch = systemStatusRaw.match(/-\s+\*\*Current Phase:\*\*\s*(.*)/i);
  if (phaseMatch) {
    currentPhase = phaseMatch[1].trim();
  }

  // Parse Active Projects
  const activeProjects: string[] = [];
  const projectsLines = projectsRaw.split('\n');
  for (const line of projectsLines) {
    if (line.includes('|') && !line.includes('---') && !line.includes('Project Name')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 4) {
        const name = parts[1].replace(/\*\*/g, '');
        const status = parts[3];
        if (status === 'Active' || status === 'Building' || status === 'Planning') {
          activeProjects.push(`- **${name}** (${status}) - Purpose: ${parts[2]}`);
        }
      }
    }
  }

  // Parse Top 5 Priorities (From high priority projects or actions)
  const topPriorities: string[] = [];
  for (const line of projectsLines) {
    if (line.includes('|') && !line.includes('---') && !line.includes('Project Name')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 6) {
        const name = parts[1].replace(/\*\*/g, '');
        const priority = parts[4];
        const nextAction = parts[5];
        if (priority === 'Critical' || priority === 'High') {
          topPriorities.push(`🔥 **${name}** - Next Action: ${nextAction}`);
        }
      }
    }
  }
  const prioritiesSlice = topPriorities.slice(0, 5);

  // Parse Decisions Needing Review (from decisions log, let's take the first 3 decisions)
  const decisions: string[] = [];
  const decisionsLines = decisionsRaw.split('\n');
  for (const line of decisionsLines) {
    if (line.includes('|') && !line.includes('---') && !line.includes('Decision')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 6) {
        const name = parts[1].replace(/\*\*/g, '');
        const reversal = parts[5];
        decisions.push(`- **${name}** (Reversal condition: *${reversal}*)`);
      }
    }
  }

  // Parse Blockers (Look in status raw or ingest report)
  const blockers: string[] = [];
  const risksSection = systemStatusRaw.split(/##\s+⚠️\s+Current\s+Risks/i)[1];
  if (risksSection) {
    const lines = risksSection.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('##')) break;
      if (line.trim().startsWith('-')) {
        blockers.push(`- ${line.replace(/^-\s*/, '').trim()}`);
      }
    }
  }
  if (reportData) {
    for (const file of reportData.files) {
      file.matchedLines.blocked.forEach((b: string) => {
        blockers.push(`- ⚠️ ${b.replace(/^-\s*/, '').trim()} (in [${file.title}](file://${file.filePath}))`);
      });
    }
  }

  // Extract Opportunities
  const moneyOpps: string[] = [
    "- **ProfBetGeng Analytics Optimization:** Execute betting odds analysis scripts to identify high-signal opportunities.",
    "- **Tree Groove Records Distribution:** Finalize digital release pathways to maximize launch day revenues."
  ];

  const creativeOpps: string[] = [
    "- **Icyflamze Lyrical Integration:** Run VibeVoice voice synthesis checks on new verse drafts.",
    "- **Sporty No Go Take My Soul Rollout:** Prepare video overlays and metadata descriptions for TikTok & YouTube launches."
  ];

  const techOpps: string[] = [
    "- **Antigravity CLI Plugins:** Test new schema bounds and validate sandbox file boundaries.",
    "- **Prompt Vault Consolidation:** Export standard React 19 app-router and Tailwind design prompt sets to local Markdown vaults."
  ];

  // Green Flag Execution Steps (unblocked items)
  const greenFlags: string[] = [
    "- **Self-Audit Verification:** Run local workspace verification before committing changes.",
    "- **Telemetry compilation:** Feed local outputs back into the daily operating brief."
  ];

  // Next 7 Moves (Extract from NEXT_ACTIONS.md or combination)
  const next7: string[] = [];
  const actionLines = nextActionsRaw.split('\n');
  let inDoNow = false;
  let inDoNext = false;
  for (const line of actionLines) {
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
      const task = line.replace(/^-\s*\[[ xX]?\]\s*/, '').trim();
      if (task) {
        next7.push(`- [ ] ${task}`);
      }
    }
  }

  // Add default tasks if list is short
  if (next7.length < 7) {
    next7.push("- [ ] Compile Obsidian Ingest JSON logs for active workspace");
    next7.push("- [ ] Run system validations and clean build folder");
    next7.push("- [ ] Review Decision Log and resolve reversal metrics");
  }
  const movesSlice = next7.slice(0, 7);

  // Compile Brief
  let brief = `# 🛰️ Daily Operating Brief - ${dateStr}\n\n`;
  
  brief += `## 🛠️ System Status\n`;
  brief += `- **System Name:** Brilliantaire OS\n`;
  brief += `- **Current Phase:** ${currentPhase}\n`;
  brief += `- **Status:** Operational\n\n`;

  brief += `## 📂 Active Projects\n`;
  brief += activeProjects.join('\n') + '\n\n';

  brief += `## 🔥 Top 5 Priorities\n`;
  if (prioritiesSlice.length > 0) {
    brief += prioritiesSlice.join('\n') + '\n\n';
  } else {
    brief += `- (None)\n\n`;
  }

  brief += `## ⚖️ Decisions Needing Review\n`;
  if (decisions.length > 0) {
    brief += decisions.slice(0, 3).join('\n') + '\n\n';
  } else {
    brief += `- (None)\n\n`;
  }

  brief += `## ⚠️ Blockers & Risks\n`;
  if (blockers.length > 0) {
    brief += blockers.slice(0, 5).join('\n') + '\n\n';
  } else {
    brief += `- ✅ No blockers or risks identified.\n\n`;
  }

  brief += `## 💸 Money-Making Opportunities\n`;
  brief += moneyOpps.join('\n') + '\n\n';

  brief += `## 🎨 Creative Opportunities\n`;
  brief += creativeOpps.join('\n') + '\n\n';

  brief += `## 💻 Tech Build Opportunities\n`;
  brief += techOpps.join('\n') + '\n\n';

  brief += `## 🟩 Green Flag Execution Steps\n`;
  brief += greenFlags.join('\n') + '\n\n';

  brief += `## ⏭️ Next 7 Moves\n`;
  brief += movesSlice.map((m, idx) => `  ${idx + 1}. ${m.replace(/^- (\[ \])?\s*/, '')}`).join('\n') + '\n';

  // Save File
  fs.writeFileSync(finalPath, brief);
  console.log(`🎉 Daily brief saved successfully to outputs/daily_briefs/${briefFileName}`);

  // Terminal Output
  console.log(`\n📅 OPERATIONAL REPORT: ${dateStr}`);
  console.log("-----------------------------------------");
  console.log(`• Phase:      ${currentPhase}`);
  console.log(`• Projects:   ${activeProjects.length} Active`);
  console.log(`• Blockers:   ${blockers.length} Logged`);
  console.log(`• Next Moves: 7 Consolidated Actions`);
  console.log("-----------------------------------------");
  console.log("\n🔥 TOP 5 PRIORITIES:");
  prioritiesSlice.forEach(p => console.log(`  ${p}`));
  console.log("\n⚡ NEXT 7 MOVES:");
  movesSlice.forEach((m, idx) => console.log(`  ${idx + 1}. ${m.replace(/^- (\[ \])?\s*/, '')}`));
  console.log("=========================================");
}

generateBrief();
