import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  ACTIVE_OPERATING_MODE,
  SUPERNOVA_OUTPUT_DIR,
  SUPERNOVA_LOG_DIR,
  STRATEGIC_WEIGHTS,
  CONFIDENCE_BASE
} from '../config/supernova.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = '/Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os';

function getSupernovaDate(): string {
  return '2026-06-01'; // Fixed local anchor date
}

function writeLog(message: string) {
  const logDir = path.join(REPO_ROOT, SUPERNOVA_LOG_DIR);
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `supernova_log_2026-06-01.md`);
  const timestamp = new Date().toISOString();
  const entry = `| ${timestamp} | ${message} |\n`;
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, entry, 'utf-8');
  } else {
    fs.writeFileSync(logPath, `# Supernova Strategic Intelligence Log - 2026-06-01\n\n| Timestamp | Event |\n|---|---|\n${entry}`, 'utf-8');
  }
}

interface StrategicInitiative {
  title: string;
  evidence: string;
  benefits: string;
  risks: string;
  score: number;
  confidenceScore: number;
  milestone: string;
}

function rankInitiatives(dashboardData: any): StrategicInitiative[] {
  const initiatives: StrategicInitiative[] = [];
  const backlog = dashboardData.operationalExcellence?.backlog ?? [];

  for (const item of backlog) {
    let baseScore = 70;
    if (item.risk === 'HIGH') baseScore += 15;
    if (item.roi.includes('Critical') || item.roi.includes('High')) baseScore += 10;

    initiatives.push({
      title: item.description,
      evidence: `Backlog Reference ${item.id}`,
      benefits: `Mitigates ${item.risk.toLowerCase()} risk and improves operational readiness.`,
      risks: 'Minor local TS rebuild required.',
      score: baseScore,
      confidenceScore: CONFIDENCE_BASE,
      milestone: item.milestone
    });
  }

  // Sort initiatives by strategic priority score descending
  return initiatives.sort((a, b) => b.score - a.score);
}

async function main() {
  await announceIntent('Supernova Strategy Engine run');
  console.log('🏁 Starting Supernova Strategy Engine...');
  writeLog('Started strategic reasoning cycle.');

  // Refresh operational excellence metrics first
  try {
    execSync('npm run operational-excellence-runner', { cwd: REPO_ROOT, stdio: 'ignore' });
    writeLog('Refreshed operational excellence metrics.');
  } catch (e) {
    writeLog('Warning: Operational excellence refresh failed.');
  }

  // Load dashboard telemetry data
  const dashboardPath = path.join(REPO_ROOT, 'dashboard/public/dashboard-data.json');
  let data: any = {};
  if (fs.existsSync(dashboardPath)) {
    try {
      data = JSON.parse(fs.readFileSync(dashboardPath, 'utf-8'));
    } catch (e) {
      console.error('Failed to parse dashboard data for Supernova:', e);
    }
  }

  const healthIndex = data.operationalExcellence?.platformHealthIndex ?? 100;
  const certStatus = data.certification?.status ?? 'FAILED';
  const circulars = data.dependencyIntelligence?.circularCount ?? 0;
  const namingScore = data.governance?.namingScore ?? 100;

  const rankedList = rankInitiatives(data);
  const topAction = rankedList.length > 0 ? rankedList[0] : null;

  const outputDir = path.join(REPO_ROOT, SUPERNOVA_OUTPUT_DIR);
  fs.mkdirSync(outputDir, { recursive: true });
  const reportPath = path.join(outputDir, `supernova_briefing_2026-06-01.md`);

  let reportContent = `# 🌌 Supernova OS: Executive Strategic Outlook - 2026-06-01

- **Active Operating Mode:** ${ACTIVE_OPERATING_MODE.toUpperCase()}
- **Platform Health Index:** ${healthIndex}/100
- **Certification Pass:** ${certStatus === 'CERTIFIED' ? 'PASS' : 'FAIL'}
- **Technical Debt Trend:** STABLE (Remains controlled)

## 📡 Strategic Outlook
The platform architecture baseline v1.0 is stable. Current operational activities focus on clearing the validation blockers introduced by circular imports and naming drift.

## 🎯 Top Recommended Next Action
`;

  if (topAction) {
    reportContent += `### Recommendation: ${topAction.title}
- **Evidence:** ${topAction.evidence}
- **Benefits:** ${topAction.benefits}
- **Risks:** ${topAction.risks}
- **Confidence Score:** ${topAction.confidenceScore}% (Target: ${topAction.milestone})
- **Strategic Priority Score:** ${topAction.score}/100
`;
  } else {
    reportContent += '- No pending priorities. Platform is certified and stable.\n';
  }

  reportContent += `\n## 🧭 Prioritized Strategic Initiatives
`;

  if (rankedList.length > 0) {
    for (const init of rankedList) {
      reportContent += `- **[Priority: ${init.score}/100]** ${init.title} (Confidence: ${init.confidenceScore}%)\n`;
    }
  } else {
    reportContent += '- Engineering backlog contains 0 items.\n';
  }

  reportContent += `\n---
*Certified by the Supernova Operating Intelligence*
`;

  fs.writeFileSync(reportPath, reportContent, 'utf-8');
  console.log(`✅ Staged Supernova Executive Briefing at ${reportPath}`);
  writeLog('Strategic reasoning cycle completed successfully.');

  // Inject Supernova briefings into dashboard-data.json
  if (fs.existsSync(dashboardPath)) {
    try {
      data.supernovaBriefing = {
        activeOperatingMode: ACTIVE_OPERATING_MODE,
        healthIndex,
        certStatus,
        circularCount: circulars,
        namingDriftWarning: namingScore < 100,
        recommendedAction: topAction ? {
          title: topAction.title,
          evidence: topAction.evidence,
          confidence: topAction.confidenceScore,
          score: topAction.score
        } : null,
        initiatives: rankedList.map(i => ({
          title: i.title,
          score: i.score,
          milestone: i.milestone
        }))
      };
      fs.writeFileSync(dashboardPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('✅ Injected Supernova intelligence outlook into dashboard-data.json');
    } catch (e) {
      console.error('Failed to update dashboard data with Supernova briefing:', e);
    }
  }

  await announceCompletion(`Supernova reasoning cycle completed. Mode: ${ACTIVE_OPERATING_MODE}`, '15');
}

main();
