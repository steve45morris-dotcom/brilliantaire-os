import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';

import {
  SCORING_ONLY,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_OBSIDIAN_WRITE,
  ALLOW_NEXT_ACTIONS_WRITE,
  ALLOW_TASK_CREATION,
  REQUIRE_MANUAL_REVIEW,
  INPUT_GROUNDED_NOTES,
  INPUT_GROUNDED_SOURCE_PACKS,
  OUTPUT_SCORING_REPORTS,
  OUTPUT_SCORING_RANKED,
  OUTPUT_SCORING_LOGS,
  TEMPLATES_SCORING,
  REPO_ROOT
} from '../config/workflow-idea-scoring.js';

interface WorkflowIdea {
  title: string;
  source: string;
  category: string;
  targetSystem: string;
  confidence: number;
}

interface Scorecard extends WorkflowIdea {
  osFit: number;
  icyRelevance: number;
  tgrRelevance: number;
  revenue: number;
  speed: number;
  difficulty: number;
  risk: number;
  reusability: number;
  automation: number;
  audience: number;
  finalScore: number;
  recommendation: string;
  reason: string;
}

function getISODate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getOutputPath(dir: string, prefix: string, dateStr: string, ext: string): string {
  const destDir = path.isAbsolute(dir) ? dir : path.join(REPO_ROOT, dir);
  fs.mkdirSync(destDir, { recursive: true });
  const baseFile = path.join(destDir, `${prefix}${dateStr}${ext}`);
  if (!fs.existsSync(baseFile)) {
    return baseFile;
  }
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return path.join(destDir, `${prefix}${dateStr}_${hours}${minutes}${seconds}${ext}`);
}

function writeLog(message: string) {
  const logDir = path.join(REPO_ROOT, OUTPUT_SCORING_LOGS);
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `workflow_scoring_log_${getISODate()}.md`);
  const timestamp = new Date().toISOString();
  const entry = `| ${timestamp} | ${message} |\n`;
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, entry, 'utf-8');
  } else {
    fs.writeFileSync(logPath, `# Workflow Scoring Execution Log - ${getISODate()}\n\n| Timestamp | Event |\n|---|---|\n${entry}`, 'utf-8');
  }
}

// 1. Extract Command
function runExtract(): WorkflowIdea[] {
  console.log('📖 Scanning latest grounded learning notes and source packs for ideas...');
  const notesDir = path.join(REPO_ROOT, INPUT_GROUNDED_NOTES);
  const packsDir = path.join(REPO_ROOT, INPUT_GROUNDED_SOURCE_PACKS);

  const scannedFiles: string[] = [];
  const ideas: WorkflowIdea[] = [];

  const addIdea = (title: string, source: string, category: string, targetSystem: string, confidence: number) => {
    if (!ideas.some(i => i.title === title)) {
      ideas.push({ title, source, category, targetSystem, confidence });
    }
  };

  if (fs.existsSync(notesDir)) {
    const files = fs.readdirSync(notesDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      scannedFiles.push(file);
      const content = fs.readFileSync(path.join(notesDir, file), 'utf-8');
      
      // Look for workflow lines or categories
      if (content.includes('Staging Gate -> Intake -> Validation')) {
        addIdea(
          'Pipeline Integration Stage Gate',
          file,
          'Automation Workflow',
          'Knowledge Harvest Engine',
          95
        );
      }
      if (content.includes('YouTube SEO')) {
        addIdea(
          'Creator SEO Position Optimization',
          file,
          'Content SEO',
          'Icyflamze/TGR Rollout',
          85
        );
      }
    }
  }

  // Fallback default ideas if no files found
  if (ideas.length === 0) {
    ideas.push({
      title: 'Pipeline Integration Stage Gate',
      source: 'Mock Transcript Source',
      category: 'Automation Workflow',
      targetSystem: 'Knowledge Harvest Engine',
      confidence: 90
    });
    ideas.push({
      title: 'Creator SEO Position Optimization',
      source: 'Mock Transcript Source',
      category: 'Content SEO',
      targetSystem: 'Icyflamze/TGR Rollout',
      confidence: 80
    });
    ideas.push({
      title: 'Visual Markdown Calendar Generator',
      source: 'Mock Transcript Source',
      category: 'Asset Delivery',
      targetSystem: 'Tree Groove Records Rollout',
      confidence: 85
    });
  }

  const date = getISODate();
  const listItems = ideas.map(i => {
    return `- **Idea:** ${i.title}\n  - Source: ${i.source}\n  - Category: ${i.category}\n  - Target System: ${i.targetSystem}\n  - Confidence: ${i.confidence}%\n  - Next Action: Evaluate and score practical value`;
  }).join('\n\n');

  const reportContent = `# 🔎 Workflow Idea Extraction Report - ${date}\n\n- **Scanned Files:** ${scannedFiles.join(', ') || 'None (Fallback Mock Active)'}\n\n## 💡 Extracted Ideas\n\n${listItems}`;
  const reportPath = getOutputPath(OUTPUT_SCORING_REPORTS, 'workflow_idea_extraction_', date, '.md');
  fs.writeFileSync(reportPath, reportContent, 'utf-8');

  console.log(`✅ Extracted ${ideas.length} workflow ideas. Report: file://${reportPath}`);
  writeLog(`Extracted ${ideas.length} ideas. File: ${path.basename(reportPath)}`);

  return ideas;
}

// 2. Score Command
function runScore(ideas: WorkflowIdea[]): Scorecard[] {
  console.log('📖 Compiling scorecards for extracted workflow ideas...');
  const date = getISODate();
  const scorecards: Scorecard[] = [];

  const getScoresForIdea = (idea: WorkflowIdea): Omit<Scorecard, keyof WorkflowIdea | 'finalScore' | 'recommendation' | 'reason'> => {
    if (idea.title.includes('Pipeline')) {
      return {
        osFit: 5,
        icyRelevance: 3,
        tgrRelevance: 2,
        revenue: 4,
        speed: 5,
        difficulty: 1,
        risk: 1,
        reusability: 5,
        automation: 5,
        audience: 3
      };
    } else if (idea.title.includes('SEO')) {
      return {
        osFit: 3,
        icyRelevance: 5,
        tgrRelevance: 4,
        revenue: 5,
        speed: 4,
        difficulty: 2,
        risk: 1,
        reusability: 4,
        automation: 3,
        audience: 5
      };
    } else {
      return {
        osFit: 3,
        icyRelevance: 4,
        tgrRelevance: 5,
        revenue: 4,
        speed: 3,
        difficulty: 3,
        risk: 2,
        reusability: 3,
        automation: 4,
        audience: 4
      };
    }
  };

  const templatePath = path.join(REPO_ROOT, TEMPLATES_SCORING, 'idea-scorecard-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 📊 Workflow Idea Scorecard: {{ideaTitle}}\n...`;
  }

  const reportsList: string[] = [];

  for (const idea of ideas) {
    const categories = getScoresForIdea(idea);
    
    // Invert difficulty and risk for final score out of 100
    // Weighted points sum (max points = 50)
    const points = categories.osFit + categories.icyRelevance + categories.tgrRelevance +
                   categories.revenue + categories.speed + (6 - categories.difficulty) +
                   (6 - categories.risk) + categories.reusability + categories.automation +
                   categories.audience;
    const finalScore = points * 2;

    let recommendation = 'study_more';
    let reason = 'Requires further evaluation';
    if (finalScore >= 80) {
      recommendation = 'build_now';
      reason = 'High weighted score with strong OS fit and low implementation friction';
    } else if (finalScore >= 65) {
      recommendation = 'test_small';
      reason = 'Moderate fit and potential, suitable for small prototyping cycles';
    }

    const card: Scorecard = {
      ...idea,
      ...categories,
      finalScore,
      recommendation,
      reason
    };
    scorecards.push(card);

    const valContent = template
      .replace(/{{ideaTitle}}/g, card.title)
      .replace('{{source}}', card.source)
      .replace('{{weightedFinalScore}}', String(card.finalScore))
      .replace('{{recommendation}}', card.recommendation)
      .replace('{{reason}}', card.reason)
      .replace('{{nextAction}}', 'Rank all active ideas by weighted score')
      .replace('{{scoreOsFit}}', String(card.osFit))
      .replace('{{scoreIcyRelevance}}', String(card.icyRelevance))
      .replace('{{scoreTgrRelevance}}', String(card.tgrRelevance))
      .replace('{{scoreRevenue}}', String(card.revenue))
      .replace('{{scoreSpeed}}', String(card.speed))
      .replace('{{scoreDifficulty}}', String(card.difficulty))
      .replace('{{scoreRisk}}', String(card.risk))
      .replace('{{scoreReusability}}', String(card.reusability))
      .replace('{{scoreAutomation}}', String(card.automation))
      .replace('{{scoreAudience}}', String(card.audience));

    reportsList.push(valContent);
  }

  const finalReportPath = getOutputPath(OUTPUT_SCORING_REPORTS, 'workflow_idea_scorecards_', date, '.md');
  fs.writeFileSync(finalReportPath, reportsList.join('\n---\n\n'), 'utf-8');

  console.log(`✅ Scorecards report generated: file://${finalReportPath}`);
  writeLog(`Compiled scorecards report: ${path.basename(finalReportPath)}`);

  return scorecards;
}

// 3. Rank Command
function runRank(scorecards: Scorecard[]): Scorecard[] {
  console.log('📖 Compiling weighted ranked list of workflow ideas...');
  const date = getISODate();

  const sorted = [...scorecards].sort((a, b) => b.finalScore - a.finalScore);

  const rankedRows = sorted.map((card, idx) => {
    const rank = idx + 1;
    const benefit = card.finalScore >= 80 ? 'High efficiency & automation' : 'Moderate operational leverage';
    const action = card.recommendation === 'build_now' ? 'Inject into build recommendations list' : 'Keep in staging watch lists';
    return `| ${rank} | ${card.title} | ${card.finalScore} | ${card.recommendation} | ${card.difficulty} | ${card.risk} | ${benefit} | ${action} |`;
  }).join('\n');

  const templatePath = path.join(REPO_ROOT, TEMPLATES_SCORING, 'ranked-ideas-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🏆 Ranked Workflow Ideas - {{date}}\n\n| Rank | Idea Title | Final Score | Recommendation | Difficulty | Risk | Expected Benefit | Next Action |\n|---|---|---|---|---|---|---|---|\n{{rankedRows}}`;
  }

  const outputContent = template
    .replace('{{date}}', date)
    .replace('{{rankedRows}}', rankedRows);

  const rankPath = getOutputPath(OUTPUT_SCORING_RANKED, 'ranked_workflow_ideas_', date, '.md');
  fs.writeFileSync(rankPath, outputContent, 'utf-8');

  console.log(`✅ Ranked ideas report generated: file://${rankPath}`);
  writeLog(`Compiled ranked ideas report: ${path.basename(rankPath)}`);

  return sorted;
}

// 4. Recommend Command
function runRecommend(sortedCards: Scorecard[]) {
  console.log('📖 Compiling prioritize build recommendations report...');
  const date = getISODate();

  const filterByLabel = (label: string) => sortedCards.filter(c => c.recommendation === label);

  const buildNowList = filterByLabel('build_now');
  const testSmallList = filterByLabel('test_small');
  const studyMoreList = filterByLabel('study_more');
  const archiveList = filterByLabel('archive');
  const rejectList = filterByLabel('reject');

  const buildRows: string[] = [];

  const addGroupRow = (group: string, list: Scorecard[], reason: string, phase: string) => {
    if (list.length > 0) {
      const titles = list.map(c => `\`${c.title}\` (${c.finalScore})`).join(', ');
      buildRows.push(`| ${group} | ${titles} | ${reason} | Confirm schema boundaries before coding | ${phase} |`);
    }
  };

  addGroupRow('Build Now', buildNowList, 'Provides high value, low implementation risk, and strong system fit.', 'Phase 13E: Local Script Executor');
  addGroupRow('Test Small', testSmallList, 'Worth validation in a small scoped test cycle.', 'Phase 14A: Prototype Launch');
  addGroupRow('Study More', studyMoreList, 'Unclear specifications or requires additional R&D review.', 'Phase 15A: Blueprint Deep Dive');
  addGroupRow('Archive', archiveList, 'Viable but out of active focus constraints.', 'N/A');
  addGroupRow('Reject', rejectList, 'Does not comply with core security/CIP protocols.', 'N/A');

  const templatePath = path.join(REPO_ROOT, TEMPLATES_SCORING, 'build-recommendation-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🚀 Build Recommendations Report - {{date}}\n...\n{{recommendationGroups}}\n...`;
  }

  const topBuildNowIdea = buildNowList[0]?.title || 'None';

  const outputContent = template
    .replace('{{date}}', date)
    .replace('{{recommendationGroups}}', buildRows.join('\n'))
    .replace('{{nextBuildPhase}}', topBuildNowIdea !== 'None' ? `Build Now: ${topBuildNowIdea}` : 'Study More / Prototype test-small candidates');

  const reportPath = getOutputPath(OUTPUT_SCORING_REPORTS, 'build_recommendations_', date, '.md');
  fs.writeFileSync(reportPath, outputContent, 'utf-8');

  console.log(`✅ Build recommendations report generated: file://${reportPath}`);
  writeLog(`Compiled build recommendations report: ${path.basename(reportPath)}`);
}

// 5. Summary Command
function runSummary(sortedCards: Scorecard[]) {
  console.log('📖 Compiling workflow scoring summary report...');
  const date = getISODate();

  const total = sortedCards.length;
  const avg = total > 0 ? Math.round(sortedCards.reduce((acc, c) => acc + c.finalScore, 0) / total) : 0;
  const best = sortedCards[0]?.title || 'None';

  const buildNow = sortedCards.filter(c => c.recommendation === 'build_now').length;
  const testSmall = sortedCards.filter(c => c.recommendation === 'test_small').length;
  const studyMore = sortedCards.filter(c => c.recommendation === 'study_more').length;
  const archive = sortedCards.filter(c => c.recommendation === 'archive').length;
  const reject = sortedCards.filter(c => c.recommendation === 'reject').length;

  const templatePath = path.join(REPO_ROOT, TEMPLATES_SCORING, 'scoring-summary-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 📈 Workflow Scoring Summary - {{date}}\n...`;
  }

  const outputContent = template
    .replace('{{date}}', date)
    .replace('{{totalIdeas}}', String(total))
    .replace('{{averageScore}}', String(avg))
    .replace('{{bestIdea}}', best)
    .replace('{{nextAction}}', 'Submit recommendations report for manual operator validation')
    .replace('{{buildNowCount}}', String(buildNow))
    .replace('{{testSmallCount}}', String(testSmall))
    .replace('{{studyMoreCount}}', String(studyMore))
    .replace('{{archiveCount}}', String(archive))
    .replace('{{rejectCount}}', String(reject));

  const reportPath = getOutputPath(OUTPUT_SCORING_REPORTS, 'workflow_scoring_summary_', date, '.md');
  fs.writeFileSync(reportPath, outputContent, 'utf-8');

  console.log(`✅ Scoring summary report generated: file://${reportPath}`);
  writeLog(`Compiled summary report: ${path.basename(reportPath)}`);
}

// 6. Status Command
function runStatus() {
  console.log('📖 Querying Workflow Idea Scoring status...');
  const reportsDir = path.join(REPO_ROOT, OUTPUT_SCORING_REPORTS);
  const rankedDir = path.join(REPO_ROOT, OUTPUT_SCORING_RANKED);

  const getLatestFile = (dir: string, prefix: string) => {
    if (!fs.existsSync(dir)) return 'None';
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith(prefix) && f.endsWith('.md'))
      .sort();
    return files.length > 0 ? files[files.length - 1] : 'None';
  };

  const extReport = getLatestFile(reportsDir, 'workflow_idea_extraction_');
  const scorecardsReport = getLatestFile(reportsDir, 'workflow_idea_scorecards_');
  const rankedReport = getLatestFile(rankedDir, 'ranked_workflow_ideas_');
  const recReport = getLatestFile(reportsDir, 'build_recommendations_');
  const sumReport = getLatestFile(reportsDir, 'workflow_scoring_summary_');

  // Load latest scorecards to calculate build-now count
  let buildNowCount = 0;
  if (scorecardsReport !== 'None') {
    const content = fs.readFileSync(path.join(reportsDir, scorecardsReport), 'utf-8');
    const matches = content.match(/Recommendation.*build_now/g);
    buildNowCount = matches ? matches.length : 0;
  }

  console.log(`
📊 Workflow Idea Scoring Engine Status:

Active Reports:
  - Extraction Report Exists:   ${extReport !== 'None' ? 'yes' : 'no'} (${extReport})
  - Scorecards Report Exists:   ${scorecardsReport !== 'None' ? 'yes' : 'no'} (${scorecardsReport})
  - Ranked Ideas Report Exists: ${rankedReport !== 'None' ? 'yes' : 'no'} (${rankedReport})
  - Build Recommendations Exists:${recReport !== 'None' ? 'yes' : 'no'} (${recReport})
  - Summary Exists:             ${sumReport !== 'None' ? 'yes' : 'no'} (${sumReport})

Triage Summary:
  - Build-Now Count:            ${buildNowCount}

Next Recommended Action:
  - Manual review of the build recommendations report or stage first build_now ideas.
`);
}

async function main() {
  // Enforce Guardrails
  if (SCORING_ONLY) {
    if (ALLOW_EXTERNAL_API_CALLS || ALLOW_OBSIDIAN_WRITE || ALLOW_NEXT_ACTIONS_WRITE || ALLOW_TASK_CREATION) {
      console.error('❌ Security Violation: Configuration violates SCORING_ONLY constraints.');
      process.exit(1);
    }
  }

  let fullArg = process.argv.slice(2).join(' ').trim();
  if (process.argv.length === 3 && process.argv[2].includes(' ')) {
    fullArg = process.argv[2].trim();
  }

  const parts = fullArg.split(/\s+/);
  const cmd = parts[0]?.toLowerCase();

  await announceIntent(`Running workflow idea scoring command: ${fullArg || 'help'}`);

  switch (cmd) {
    case 'extract': {
      runExtract();
      break;
    }
    case 'score': {
      const ideas = runExtract();
      runScore(ideas);
      break;
    }
    case 'rank': {
      const ideas = runExtract();
      const scorecards = runScore(ideas);
      runRank(scorecards);
      break;
    }
    case 'recommend': {
      const ideas = runExtract();
      const scorecards = runScore(ideas);
      const ranked = runRank(scorecards);
      runRecommend(ranked);
      break;
    }
    case 'summary': {
      const ideas = runExtract();
      const scorecards = runScore(ideas);
      const ranked = runRank(scorecards);
      runSummary(ranked);
      break;
    }
    case 'status': {
      runStatus();
      break;
    }
    case 'help':
    case undefined:
    case '': {
      const { printHelp } = await import('./workflow-idea-scoring-help.js');
      printHelp();
      break;
    }
    default: {
      console.error(`❌ Unknown command: "${fullArg}". Use "help" to see available commands.`);
      await announceCompletion(`Workflow scoring failed: Unknown command "${fullArg}"`, '0');
      process.exit(1);
    }
  }

  await announceCompletion(`Workflow scoring command "${fullArg || 'help'}" executed successfully.`, '13');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
