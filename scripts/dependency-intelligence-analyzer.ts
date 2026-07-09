import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = '/Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os';

function writeLog(message: string) {
  const logDir = path.join(REPO_ROOT, 'outputs/dependency_intelligence/logs');
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `dependency_log_2026-06-01.md`);
  const timestamp = new Date().toISOString();
  const entry = `| ${timestamp} | ${message} |\n`;
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, entry, 'utf-8');
  } else {
    fs.writeFileSync(logPath, `# Dependency Intelligence Log - 2026-06-01\n\n| Timestamp | Event |\n|---|---|\n${entry}`, 'utf-8');
  }
}

interface DepNode {
  name: string;
  imports: string[];
  isOrphan: boolean;
  circularRefs: string[];
}

function analyzeDependencies(): DepNode[] {
  const scriptsDir = path.join(REPO_ROOT, 'scripts');
  if (!fs.existsSync(scriptsDir)) return [];
  const files = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.ts'));
  const nodes: DepNode[] = [];

  for (const file of files) {
    const filePath = path.join(scriptsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const importRegex = /import\s+.*from\s+'([^']+)'/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const imp = match[1];
      if (imp.startsWith('.') || imp.startsWith('..')) {
        imports.push(path.basename(imp).replace('.js', '').replace('.ts', ''));
      }
    }

    nodes.push({
      name: file.replace('.ts', ''),
      imports,
      isOrphan: false,
      circularRefs: []
    });
  }

  // Determine orphans (files never imported by other files)
  // and check circular references (simplified path cycle detection)
  for (const node of nodes) {
    const isImported = nodes.some(n => n.name !== node.name && n.imports.includes(node.name));
    // Check if it has imports but is never imported, and also check if it imports nothing
    // An orphan has no incoming dependencies from our script set
    node.isOrphan = !isImported;
    
    // Cycle check: simple direct check A -> B -> A
    for (const imp of node.imports) {
      const child = nodes.find(n => n.name === imp);
      if (child && child.imports.includes(node.name)) {
        node.circularRefs.push(child.name);
      }
    }
  }

  return nodes;
}

async function main() {
  await announceIntent('Dependency Intelligence Analysis run');
  console.log('🏁 Starting Dependency Intelligence Analysis...');
  writeLog('Started dependency analysis.');

  const nodes = analyzeDependencies();
  const orphans = nodes.filter(n => n.isOrphan);
  const circulars = nodes.filter(n => n.circularRefs.length > 0);

  const reportDir = path.join(REPO_ROOT, 'outputs/dependency_intelligence');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `dependency_report_2026-06-01.md`);

  let reportContent = `# 🧭 Dependency Intelligence Report - 2026-06-01

- **Scanned Modules count:** ${nodes.length}
- **Orphaned Modules detected:** ${orphans.length}
- **Circular References detected:** ${circulars.length}

## 🚨 Critical Architecture Violations
${circulars.length > 0 ? circulars.map(c => `- **${c.name}** has a circular loop with **${c.circularRefs.join(', ')}**`).join('\n') : '- No circular dependency loops detected.'}

## 🍂 Orphaned Modules Checklist
${orphans.length > 0 ? orphans.map(o => `- **${o.name}** is not imported by any local script`).join('\n') : '- No orphaned scripts detected.'}

## 📊 Detailed Node Dependency Matrix
| Module | Dependencies | Incoming Connections | Is Orphan |
|---|---|---|---|
`;

  for (const node of nodes) {
    const incoming = nodes.filter(n => n.imports.includes(node.name)).map(n => n.name).join(', ') || 'None';
    reportContent += `| **${node.name}** | ${node.imports.join(', ') || 'None'} | ${incoming} | ${node.isOrphan ? 'Yes' : 'No'} |\n`;
  }

  fs.writeFileSync(reportPath, reportContent, 'utf-8');
  console.log(`✅ Staged dependency intelligence report at ${reportPath}`);
  writeLog(`Dependency intelligence report compiled successfully.`);

  // Export to dashboard-data.json
  const dashboardPath = path.join(REPO_ROOT, 'dashboard/public/dashboard-data.json');
  if (fs.existsSync(dashboardPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dashboardPath, 'utf-8'));
      data.dependencyIntelligence = {
        totalModules: nodes.length,
        orphanedCount: orphans.length,
        circularCount: circulars.length,
        orphansList: orphans.map(o => o.name),
        circularsList: circulars.map(c => ({ module: c.name, loopsWith: c.circularRefs }))
      };
      fs.writeFileSync(dashboardPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('✅ Exported dependency analysis to dashboard-data.json');
    } catch (e) {
      console.error('Failed to write dashboard dependency data:', e);
    }
  }

  await announceCompletion('Dependency analysis completed successfully', '15');
}

main();
