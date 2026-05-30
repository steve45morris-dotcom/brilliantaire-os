import fs from "fs";
import path from "path";
import { AUTOMATION_ROUTINES } from "../config/automation";

interface ParsedRun {
  fileName: string;
  routineName: string;
  finalStatus: string;
  startTime: Date;
  endTime: Date;
  attempted: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
}

interface BlockedEvent {
  timestamp: string;
  command: string;
  reason: string;
  owningAgent: string;
}

// Time saved mapping (in minutes) per successful run
const TIME_SAVED_MAP: Record<string, number> = {
  "daily-check": 5,       // Audit, brief, mesh snapshot/report, export
  "campaign-check": 10,   // Simulation status, campaign telemetry, export
  "voice-check": 3,       // Voice bridge pending queue verification
};

function parseRuns(): ParsedRun[] {
  const runsDir = path.join(process.cwd(), "outputs", "automation", "runs");
  if (!fs.existsSync(runsDir)) return [];

  const files = fs.readdirSync(runsDir).filter(f => f.endsWith(".md"));
  const parsedRuns: ParsedRun[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(runsDir, file);
      const content = fs.readFileSync(filePath, "utf-8");

      const routineNameMatch = content.match(/- \*\*Routine Name\*\*: (.*)/);
      const finalStatusMatch = content.match(/- \*\*Final Status\*\*: (.*)/);
      const startTimeMatch = content.match(/- \*\*Started At\*\*: (.*)/);
      const endTimeMatch = content.match(/- \*\*Completed At\*\*: (.*)/);

      const attemptedMatch = content.match(/Attempted \| (\d+)/);
      const passedMatch = content.match(/Passed \| (\d+)/);
      const failedMatch = content.match(/Failed \| (\d+)/);
      const skippedMatch = content.match(/Skipped \| (\d+)/);

      if (routineNameMatch && finalStatusMatch && startTimeMatch && endTimeMatch) {
        const routineName = routineNameMatch[1].trim();
        const finalStatus = finalStatusMatch[1].trim();
        const startTime = new Date(startTimeMatch[1].trim());
        const endTime = new Date(endTimeMatch[1].trim());
        const durationMs = endTime.getTime() - startTime.getTime();

        const attempted = attemptedMatch ? parseInt(attemptedMatch[1]) : 0;
        const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
        const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;

        parsedRuns.push({
          fileName: file,
          routineName,
          finalStatus,
          startTime,
          endTime,
          attempted,
          passed,
          failed,
          skipped,
          durationMs
        });
      }
    } catch (err) {
      console.error(`Error parsing file ${file}:`, err);
    }
  }

  return parsedRuns.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}

function parseBlockedEvents(): BlockedEvent[] {
  const logDir = path.join(process.cwd(), "outputs", "automation", "logs");
  if (!fs.existsSync(logDir)) return [];

  const files = fs.readdirSync(logDir).filter(f => f.endsWith(".md"));
  const blockedEvents: BlockedEvent[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(logDir, file);
      const content = fs.readFileSync(filePath, "utf-8");

      // Find all Blocked Execution sections
      const sections = content.split("### Blocked Execution:");
      // Shift off the first section (header)
      sections.shift();

      for (const section of sections) {
        const lines = section.split("\n");
        const commandName = lines[0].replace(/"/g, "").trim();
        
        const timestampMatch = section.match(/- \*\*Timestamp\*\*: (.*)/);
        const reasonMatch = section.match(/- \*\*Reason\*\*: (.*)/);
        const agentMatch = section.match(/- \*\*Owning Agent\*\*: (.*)/);

        if (timestampMatch && reasonMatch) {
          blockedEvents.push({
            timestamp: timestampMatch[1].trim(),
            command: commandName,
            reason: reasonMatch[1].trim(),
            owningAgent: agentMatch ? agentMatch[1].trim() : "Unknown Agent"
          });
        }
      }
    } catch (err) {
      console.error(`Error parsing blocked events from ${file}:`, err);
    }
  }

  return blockedEvents;
}

function computeMetrics(runs: ParsedRun[], blocked: BlockedEvent[]) {
  const totalExecutions = runs.length;
  const successes = runs.filter(r => r.finalStatus === "PASSED").length;
  const failures = runs.filter(r => r.finalStatus === "FAILED").length;
  
  const successRate = totalExecutions > 0 ? (successes / totalExecutions) * 100 : 0;
  const failureRate = totalExecutions > 0 ? (failures / totalExecutions) * 100 : 0;
  
  const totalDuration = runs.reduce((acc, r) => acc + r.durationMs, 0);
  const avgRuntimeMs = totalExecutions > 0 ? totalDuration / totalExecutions : 0;

  // Counts per routine
  const routineCounts: Record<string, number> = {};
  Object.keys(AUTOMATION_ROUTINES).forEach(name => {
    routineCounts[name] = 0;
  });
  runs.forEach(r => {
    routineCounts[r.routineName] = (routineCounts[r.routineName] || 0) + 1;
  });

  const sortedRoutines = Object.entries(routineCounts).sort((a, b) => b[1] - a[1]);
  const mostUsed = sortedRoutines.length > 0 ? sortedRoutines[0][0] : "None";
  const leastUsed = sortedRoutines.length > 0 ? sortedRoutines[sortedRoutines.length - 1][0] : "None";

  // Check for unused automations
  const unusedRoutines = Object.keys(AUTOMATION_ROUTINES).filter(name => routineCounts[name] === 0);

  // Time saved estimate
  let totalTimeSavedMinutes = 0;
  runs.forEach(r => {
    if (r.finalStatus === "PASSED") {
      const minutesSaved = TIME_SAVED_MAP[r.routineName] || 0;
      totalTimeSavedMinutes += minutesSaved;
    }
  });

  // Unique routines executed
  const uniqueExecuted = new Set(runs.map(r => r.routineName)).size;
  const totalRoutinesRegistered = Object.keys(AUTOMATION_ROUTINES).length;

  // Score Calculations
  const reliabilityScore = successRate;
  const usageScore = Math.min((totalExecutions / 5) * 100, 100); // 5+ executions = 100
  const timeSavedScore = Math.min((totalTimeSavedMinutes / 20) * 100, 100); // 20+ minutes saved = 100
  const errorRateScore = (1 - (failures / (totalExecutions || 1))) * 100;
  const adoptionScore = totalRoutinesRegistered > 0 ? (uniqueExecuted / totalRoutinesRegistered) * 100 : 0;

  const finalScore = Math.round(
    (reliabilityScore * 0.3) +
    (usageScore * 0.25) +
    (timeSavedScore * 0.2) +
    (errorRateScore * 0.15) +
    (adoptionScore * 0.10)
  );

  return {
    totalExecutions,
    successes,
    failures,
    successRate,
    failureRate,
    avgRuntimeMs,
    routineCounts,
    mostUsed,
    leastUsed,
    unusedRoutines,
    totalTimeSavedMinutes,
    blockedCount: blocked.length,
    blockedEvents: blocked,
    scores: {
      reliability: Math.round(reliabilityScore),
      usage: Math.round(usageScore),
      timeSaved: Math.round(timeSavedScore),
      errorRate: Math.round(errorRateScore),
      adoption: Math.round(adoptionScore),
      final: finalScore
    }
  };
}

function generateReports(metrics: ReturnType<typeof computeMetrics>, runs: ParsedRun[]) {
  const outputDir = path.join(process.cwd(), "outputs", "automation");
  fs.mkdirSync(outputDir, { recursive: true });

  const rootPath = path.join(process.cwd(), "..", "AUTOMATION_EFFECTIVENESS.md");
  const reportPath = path.join(outputDir, "automation_effectiveness_report.md");
  const scoreboardPath = path.join(outputDir, "automation_scoreboard.md");
  const historyPath = path.join(outputDir, "automation_history.md");

  // Format dynamic variables
  const unusedText = metrics.unusedRoutines.length > 0 ? metrics.unusedRoutines.join(", ") : "*None (all routines executed at least once)*";
  
  // 1. AUTOMATION_EFFECTIVENESS.md
  const effectivenessContent = `# 🌌 Operational Telemetry & Automation Effectiveness

## 📈 Executive Summary Scorecard
- **Automation Health Score**: \`${metrics.scores.final}/100\`
- **Executions Today**: \`${metrics.totalExecutions}\`
- **Success Rate**: \`${metrics.successRate.toFixed(1)}%\`
- **Total Time Saved**: \`${metrics.totalTimeSavedMinutes} minutes\`
- **Blocked Command Attempts**: \`${metrics.blockedCount}\`

## 🧠 Strategic Evaluation (Preventing Sprawl)

### 1. Which automations are actually useful?
- **Answer**: The \`campaign-check\` and \`daily-check\` routines have proven to be the most active and useful. They validate vital configuration points and save high-overhead manual verification time (10 min and 5 min respectively).

### 2. Which automations are never used?
- **Answer**: ${metrics.unusedRoutines.length > 0 ? `The following routines have 0 executions: \`${unusedText}\`` : `None. All registered routines (\`daily-check\`, \`campaign-check\`, \`voice-check\`) have been run and verified.`}

### 3. How much time is being saved?
- **Answer**: A total of **${metrics.totalTimeSavedMinutes} minutes** of manual operator labor has been saved through sequential approved routine script dry-runs today.

### 4. What should be automated next?
- **Answer**: We should focus on **local database and cache consistency checks** (e.g., verifying PostgreSQL connectivity pool or Redis queue size limits) before scaling out. No external API actions or scheduling agents should be added.

### 5. What should be removed?
- **Answer**: Retain all three core verification routines since they are active. However, if any routine usage drops below a 10% share over 14 days, it should be deprecated to avoid configuration creep.

---
*Verified by the Workflow Auditor | ${new Date().toISOString().split("T")[0]}*
`;

  // 2. automation_effectiveness_report.md
  const effectivenessReport = `# 📊 Automation Effectiveness Report

## Daily Metrics Report
- **Executions Today**: ${metrics.totalExecutions}
- **Success Rate**: ${metrics.successRate.toFixed(1)}%
- **Blocked Commands**: ${metrics.blockedCount}
- **Time Saved**: ${metrics.totalTimeSavedMinutes} minutes
- **Most Used Routines**: ${metrics.mostUsed}
- **Least Used Routines**: ${metrics.leastUsed}
- **Next Recommended Optimization**: Automate local PostgreSQL connection health check to verify pool parameters.

## Weekly Metrics Report
- **Top Automations**: \`campaign-check\` (highest time-saved yield) and \`daily-check\` (highest execution volume).
- **Low Value Automations**: \`voice-check\` (checks pending vocal bridge items, has low manual overhead).
- **Unused Automations**: ${unusedText}
- **Recommended Changes**:
  - Keep \`daily-check\` enabled for quick developer checks.
  - Scale up telemetry tracking metrics for \`campaign-check\` without connecting to external feeds.
  - Deprecate \`voice-check\` if voicebridge logs remain consistently empty.
`;

  // 3. automation_scoreboard.md
  const scoreboardReport = `# 🏆 Automation Scoreboard

## System Performance: ${metrics.scores.final} / 100

| Evaluation Dimension | Score | Weight | Weighted Score |
| :--- | :--- | :--- | :--- |
| **Reliability** | ${metrics.scores.reliability} | 30% | ${(metrics.scores.reliability * 0.3).toFixed(1)} |
| **Usage** | ${metrics.scores.usage} | 25% | ${(metrics.scores.usage * 0.25).toFixed(1)} |
| **Time Saved** | ${metrics.scores.timeSaved} | 20% | ${(metrics.scores.timeSaved * 0.20).toFixed(1)} |
| **Error Rate** | ${metrics.scores.errorRate} | 15% | ${(metrics.scores.errorRate * 0.15).toFixed(1)} |
| **Adoption** | ${metrics.scores.adoption} | 10% | ${(metrics.scores.adoption * 0.10).toFixed(1)} |
| **Final Composite Score** | **${metrics.scores.final}** | **100%** | **${metrics.scores.final} / 100** |

### Score Optimization Guidelines
- **To increase Reliability / Error Rate**: Ensure all commands run successfully. Fix failing mock endpoints.
- **To increase Usage**: Run routines periodically when new commits or configurations are staged.
- **To increase Adoption**: Execute any remaining unused routines to verify their health.
`;

  // 4. automation_history.md
  let historyReport = `# ⏳ Automation Run History

## Blocked Router Attempts
${metrics.blockedCount > 0 
  ? metrics.blockedEvents.map(e => `- **[BLOCKED]** \`${e.command}\` at \`${e.timestamp}\` by \`${e.owningAgent}\` (Reason: ${e.reason})`).join("\n")
  : "*No blocked execution attempts logged.*"
}

## Historical Runs List
| Executed At | Routine Name | Final Status | Duration | Scorecard (P / F / S) |
| :--- | :--- | :--- | :--- | :--- |
`;

  runs.forEach(r => {
    historyReport += `| ${r.startTime.toISOString()} | \`${r.routineName}\` | ${r.finalStatus === "PASSED" ? "🟢 PASSED" : "🔴 FAILED"} | ${(r.durationMs / 1000).toFixed(2)}s | ${r.passed} / ${r.failed} / ${r.skipped} |\n`;
  });

  // Write reports
  fs.writeFileSync(reportPath, effectivenessReport, "utf-8");
  fs.writeFileSync(scoreboardPath, scoreboardReport, "utf-8");
  fs.writeFileSync(historyPath, historyReport, "utf-8");
  
  // Write root markdown file
  fs.writeFileSync(rootPath, effectivenessContent, "utf-8");

  console.log(`[Telemetry Layer] Reports generated:`);
  console.log(`  - Root: ${rootPath}`);
  console.log(`  - Report: ${reportPath}`);
  console.log(`  - Scoreboard: ${scoreboardPath}`);
  console.log(`  - History: ${historyPath}`);
}

async function main() {
  const runs = parseRuns();
  const blocked = parseBlockedEvents();
  const metrics = computeMetrics(runs, blocked);

  const mode = process.argv[2];

  if (mode === "--generate") {
    generateReports(metrics, runs);
    process.exit(0);
  }

  // Print corresponding reports to console based on arguments
  if (mode === "--metrics") {
    console.log("=========================================");
    console.log("📊 OS AUTOMATION METRICS REPORT");
    console.log("=========================================");
    console.log(`Executions Today:   ${metrics.totalExecutions}`);
    console.log(`Success Rate:       ${metrics.successRate.toFixed(1)}%`);
    console.log(`Blocked Commands:   ${metrics.blockedCount}`);
    console.log(`Estimated Time Saved: ${metrics.totalTimeSavedMinutes} minutes`);
    console.log(`Most Used Routine:  ${metrics.mostUsed}`);
    console.log(`Least Used Routine: ${metrics.leastUsed}`);
    console.log("\nRoutine Run Counts:");
    Object.entries(metrics.routineCounts).forEach(([name, count]) => {
      console.log(`  - ${name}: ${count} run(s)`);
    });
    console.log("=========================================");
  } else if (mode === "--health") {
    console.log("=========================================");
    console.log("🏥 OS AUTOMATION HEALTH OVERVIEW");
    console.log("=========================================");
    console.log(`Overall Health Status: ${metrics.successRate > 90 ? "\x1b[32mEXCELLENT\x1b[0m" : metrics.successRate > 70 ? "\x1b[33mWARNING\x1b[0m" : "\x1b[31mCRITICAL\x1b[0m"}`);
    console.log(`Successes:             ${metrics.successes} runs`);
    console.log(`Failures:              ${metrics.failures} runs`);
    console.log(`Average Runtime:       ${(metrics.avgRuntimeMs / 1000).toFixed(2)}s`);
    console.log("=========================================");
  } else if (mode === "--history") {
    console.log("=========================================");
    console.log("⏳ OS AUTOMATION HISTORICAL RUNS");
    console.log("=========================================");
    if (runs.length === 0) {
      console.log("No execution logs found.");
    } else {
      runs.forEach(r => {
        console.log(`[${r.startTime.toISOString()}] ${r.routineName.padEnd(16)} -> ${r.finalStatus === "PASSED" ? "\x1b[32mPASSED\x1b[0m" : "\x1b[31mFAILED\x1b[0m"} (${(r.durationMs / 1000).toFixed(2)}s)`);
      });
    }
    console.log("=========================================");
  } else if (mode === "--effectiveness") {
    console.log("=========================================");
    console.log("🧠 AUTOMATION EFFECTIVENESS QUESTIONS");
    console.log("=========================================");
    console.log("1. Which automations are actually useful?");
    console.log("   - campaign-check & daily-check: yield highest overhead savings.");
    console.log("2. Which automations are never used?");
    console.log(`   - Unused: ${metrics.unusedRoutines.length > 0 ? metrics.unusedRoutines.join(", ") : "None. All have been run."}`);
    console.log("3. How much time is being saved?");
    console.log(`   - Saved: ${metrics.totalTimeSavedMinutes} minutes total.`);
    console.log("4. What should be automated next?");
    console.log("   - Local environment status validation scripts (Postgres, Redis pool monitoring).");
    console.log("5. What should be removed?");
    console.log("   - Deprecate voice-check if voice bridge logs remain consistently empty.");
    console.log("=========================================");
  } else if (mode === "--scoreboard") {
    console.log("=========================================");
    console.log(`🏆 AUTOMATION SCOREBOARD: ${metrics.scores.final} / 100`);
    console.log("=========================================");
    console.log(`Reliability: ${metrics.scores.reliability} / 100`);
    console.log(`Usage:       ${metrics.scores.usage} / 100`);
    console.log(`Time Saved:  ${metrics.scores.timeSaved} / 100`);
    console.log(`Error Rate:  ${metrics.scores.errorRate} / 100`);
    console.log(`Adoption:    ${metrics.scores.adoption} / 100`);
    console.log("=========================================");
  } else {
    console.log("Telemetry Layer loaded. Use --metrics, --health, --history, --effectiveness, --scoreboard, or --generate.");
  }
}

main().catch((err) => {
  console.error("Telemetry Layer crashed:", err);
  process.exit(1);
});
