import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OutcomeRecord } from './types.js';
import { SharedMemoryManager } from './memory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

export const REPORTS_DIR = path.join(REPO_ROOT, 'reports');

export class OutcomeIntelligenceEngine {
  private memoryManager: SharedMemoryManager;

  constructor() {
    this.memoryManager = new SharedMemoryManager();
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
  }

  // Track outcome metrics
  trackOutcome(
    objective: string,
    actionTaken: string,
    skillsUsed: string[],
    outputQualityScore: number,
    result: 'success' | 'failure',
    meta: {
      workflowUsed?: string;
      businessImpact?: string;
      revenueImpact?: number;
      nextRecommendation?: string;
    } = {}
  ): OutcomeRecord {
    const record: OutcomeRecord = {
      id: `out-${Date.now()}`,
      timestamp: new Date().toISOString(),
      objective,
      actionTaken,
      skillsUsed,
      outputQualityScore,
      result,
      ...meta
    };

    // Save to shared memory outcomes.json
    this.memoryManager.logOutcome(record);
    return record;
  }

  // Get daily outcome summary
  generateDailyOutcomeSummary(): string {
    const outcomes = this.memoryManager.getOutcomes();
    const today = new Date().toISOString().split('T')[0];
    const todayOutcomes = outcomes.filter((o) => o.timestamp.startsWith(today));

    if (todayOutcomes.length === 0) {
      return `# Daily Outcome Summary - ${today}\n\nNo operational outcomes recorded today.`;
    }

    const successful = todayOutcomes.filter((o) => o.result === 'success');
    const failed = todayOutcomes.filter((o) => o.result === 'failure');
    const totalQuality = todayOutcomes.reduce((acc, o) => acc + o.outputQualityScore, 0);
    const avgQuality = Number((totalQuality / todayOutcomes.length).toFixed(1));
    const revenueImpact = todayOutcomes.reduce((acc, o) => acc + (o.revenueImpact || 0), 0);

    let summaryText = `# Daily Outcome Summary - ${today}\n\n`;
    summaryText += `## Operational Summary\n`;
    summaryText += `- **Total Tasks Executed:** ${todayOutcomes.length}\n`;
    summaryText += `- **Success Rate:** ${((successful.length / todayOutcomes.length) * 100).toFixed(0)}%\n`;
    summaryText += `- **Average Output Quality:** ${avgQuality}/100\n`;
    summaryText += `- **Revenue Logged:** $${revenueImpact.toFixed(2)}\n\n`;

    summaryText += `## Completed Missions\n`;
    successful.forEach((o) => {
      summaryText += `### ✓ ${o.objective}\n`;
      summaryText += `- **Action Taken:** ${o.actionTaken}\n`;
      summaryText += `- **Workflow Used:** ${o.workflowUsed || 'One-shot execution'}\n`;
      summaryText += `- **Skills Utilized:** ${o.skillsUsed.join(', ')}\n`;
      summaryText += `- **Quality Score:** ${o.outputQualityScore}/100\n`;
      if (o.businessImpact) summaryText += `- **Business Impact:** ${o.businessImpact}\n`;
      summaryText += `\n`;
    });

    if (failed.length > 0) {
      summaryText += `## Failed Missions (Requires Rectification)\n`;
      failed.forEach((o) => {
        summaryText += `### ✗ ${o.objective}\n`;
        summaryText += `- **Failure Action:** ${o.actionTaken}\n`;
        summaryText += `- **Skills Used:** ${o.skillsUsed.join(', ')}\n`;
        if (o.nextRecommendation) summaryText += `- **Recommendation:** ${o.nextRecommendation}\n`;
        summaryText += `\n`;
      });
    }

    // Write to reports directory
    fs.writeFileSync(path.join(REPORTS_DIR, `daily-outcome-${today}.md`), summaryText, 'utf-8');
    return summaryText;
  }

  // Generate weekly improvement report
  generateWeeklyImprovementReport(): string {
    const outcomes = this.memoryManager.getOutcomes();
    
    // Sort and take outcomes from past 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyOutcomes = outcomes.filter((o) => new Date(o.timestamp) >= oneWeekAgo);

    if (weeklyOutcomes.length === 0) {
      return `# Weekly Improvement Report\n\nNo operational telemetry logs found for the past week.`;
    }

    const successes = weeklyOutcomes.filter((o) => o.result === 'success');
    const failures = weeklyOutcomes.filter((o) => o.result === 'failure');
    const successRate = (successes.length / weeklyOutcomes.length) * 100;
    const avgQuality = weeklyOutcomes.reduce((acc, o) => acc + o.outputQualityScore, 0) / weeklyOutcomes.length;

    let report = `# Weekly Improvement Report\n\n`;
    report += `## Weekly Metrics Overview\n`;
    report += `- **Total Executions:** ${weeklyOutcomes.length}\n`;
    report += `- **Overall Success Rate:** ${successRate.toFixed(1)}%\n`;
    report += `- **Average Output Quality:** ${avgQuality.toFixed(1)}/100\n\n`;

    report += `## Detected Improvements\n`;
    if (successRate > 80) {
      report += `- **Reliability:** High execution reliability established. System shows solid pattern stability.\n`;
    } else {
      report += `- **Reliability Warning:** Low execution reliability. Staged testing workflows are highly recommended.\n`;
    }
    
    if (avgQuality >= 85) {
      report += `- **Quality standards:** High quality standards. Code and content output align with project specs.\n`;
    }

    // Capture lessons learned
    const lessons = this.memoryManager.getLessonsLearned();
    report += `\n## Lessons Learned Ingested\n`;
    lessons.forEach((l) => {
      report += `- ${l}\n`;
    });

    fs.writeFileSync(path.join(REPORTS_DIR, 'weekly-improvement-report.md'), report, 'utf-8');
    return report;
  }

  // Generate bottleneck report
  generateBottleneckReport(): string {
    const outcomes = this.memoryManager.getOutcomes();
    const failures = outcomes.filter((o) => o.result === 'failure');

    let report = `# Operational Bottleneck Report\n\n`;
    
    if (failures.length === 0) {
      report += `## Status: Stable\nNo execution bottlenecks or mission failures recorded in history.`;
      fs.writeFileSync(path.join(REPORTS_DIR, 'bottleneck-report.md'), report, 'utf-8');
      return report;
    }

    // Count failure frequencies for skills
    const skillFailures: Record<string, number> = {};
    const workflowFailures: Record<string, number> = {};

    failures.forEach((f) => {
      f.skillsUsed.forEach((s: string) => {
        skillFailures[s] = (skillFailures[s] || 0) + 1;
      });
      if (f.workflowUsed) {
        workflowFailures[f.workflowUsed] = (workflowFailures[f.workflowUsed] || 0) + 1;
      }
    });

    report += `## High-Frequency Failures\n\n`;
    report += `### Vulnerable Skills\n`;
    Object.keys(skillFailures)
      .sort((a, b) => skillFailures[b] - skillFailures[a])
      .forEach((skill) => {
        report += `- **${skill}**: Failed ${skillFailures[skill]} times during missions.\n`;
      });

    report += `\n### Unstable Workflows\n`;
    Object.keys(workflowFailures)
      .sort((a, b) => workflowFailures[b] - workflowFailures[a])
      .forEach((wf) => {
        report += `- **${wf}**: Failed ${workflowFailures[wf]} times.\n`;
      });

    report += `\n## Recommendations for Skill Lifecycle Manager\n`;
    Object.keys(skillFailures).forEach((skill) => {
      if (skillFailures[skill] >= 3) {
        report += `- **Re-Evaluate Skill:** Skill \`${skill}\` has crossed the failure threshold (>= 3). Recommend marking as \`deprecated\` or triggering a \`Monitor -> Improve\` cycle.\n`;
      }
    });

    fs.writeFileSync(path.join(REPORTS_DIR, 'bottleneck-report.md'), report, 'utf-8');
    return report;
  }

  // Generate high-performing workflow report
  generateHighPerformingWorkflowReport(): string {
    const outcomes = this.memoryManager.getOutcomes();
    
    // Group by workflow and calculate success rates
    const workflowStats: Record<string, { runs: number; successes: number; qualitySum: number }> = {};

    outcomes.forEach((o) => {
      if (!o.workflowUsed) return;
      if (!workflowStats[o.workflowUsed]) {
        workflowStats[o.workflowUsed] = { runs: 0, successes: 0, qualitySum: 0 };
      }
      const stats = workflowStats[o.workflowUsed];
      stats.runs += 1;
      if (o.result === 'success') {
        stats.successes += 1;
      }
      stats.qualitySum += o.outputQualityScore;
    });

    let report = `# High-Performing Workflows Report\n\n`;
    report += `| Workflow Name | Executions | Success Rate | Avg Quality Score | Performance Grade |\n`;
    report += `|---|---|---|---|---|\n`;

    Object.keys(workflowStats)
      .sort((a, b) => {
        const srA = workflowStats[a].successes / workflowStats[a].runs;
        const srB = workflowStats[b].successes / workflowStats[b].runs;
        return srB - srA;
      })
      .forEach((wf) => {
        const stats = workflowStats[wf];
        const successRate = (stats.successes / stats.runs) * 100;
        const avgQuality = stats.qualitySum / stats.runs;
        
        let grade = 'C';
        if (successRate >= 90 && avgQuality >= 85) grade = 'A+';
        else if (successRate >= 80 && avgQuality >= 80) grade = 'A';
        else if (successRate >= 60 && avgQuality >= 70) grade = 'B';

        report += `| **${wf}** | ${stats.runs} | ${successRate.toFixed(0)}% | ${avgQuality.toFixed(1)} | **${grade}** |\n`;
      });

    fs.writeFileSync(path.join(REPORTS_DIR, 'high-performing-workflows.md'), report, 'utf-8');
    return report;
  }
}
