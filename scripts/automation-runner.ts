import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { AUTOMATION_ROUTINES } from "../config/automation";

function runCommand(command: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    // Execute command through Safe Command Router
    exec(`npm run command -- "${command}"`, (error, stdout, stderr) => {
      resolve({
        code: error ? (error.code ?? 1) : 0,
        stdout,
        stderr
      });
    });
  });
}

async function main() {
  const routineName = process.argv[2];
  if (!routineName) {
    console.error("Error: No routine name provided.");
    process.exit(1);
  }

  const routine = AUTOMATION_ROUTINES[routineName];
  if (!routine) {
    console.error(`Error: Unknown routine "${routineName}".`);
    process.exit(1);
  }

  if (!routine.enabled) {
    console.error(`Error: Routine "${routineName}" is disabled.`);
    process.exit(1);
  }

  console.log(`[Automation Runner] Starting routine: "${routine.name}"`);

  const startTime = new Date();
  const startStr = startTime.toISOString();
  
  let attempted = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  
  let execLog = "";
  let stopRunning = false;
  
  const cmdResults: { command: string; status: string; output: string }[] = [];

  for (const cmd of routine.commands) {
    if (stopRunning) {
      skipped++;
      cmdResults.push({
        command: cmd,
        status: "SKIPPED",
        output: "Skipped due to prior command failure."
      });
      continue;
    }

    attempted++;
    console.log(`[Automation Runner] Running command: "${cmd}"`);
    
    const res = await runCommand(cmd);
    const cmdOutput = (res.stdout + "\n" + res.stderr).trim();
    
    if (res.code === 0) {
      passed++;
      cmdResults.push({
        command: cmd,
        status: "PASSED",
        output: cmdOutput
      });
    } else {
      failed++;
      cmdResults.push({
        command: cmd,
        status: "FAILED",
        output: cmdOutput
      });
      if (routine.stopOnFailure) {
        stopRunning = true;
      }
    }
  }

  const endTime = new Date();
  const endStr = endTime.toISOString();
  
  const finalStatus = failed > 0 ? "FAILED" : "PASSED";
  
  // Format execution log for markdown
  execLog = cmdResults.map((r) => {
    return `### Command: \`${r.command}\`\n- **Status**: ${r.status === "PASSED" ? "🟢 PASSED" : r.status === "FAILED" ? "🔴 FAILED" : "🟡 SKIPPED"}\n- **Output**:\n\`\`\`text\n${r.output}\n\`\`\``;
  }).join("\n\n");

  const nextAction = failed > 0 
    ? `Review the failure in routine ${routine.name}. The command router outputs show the issues. Retrying after fixing configurations is recommended.`
    : `Routine ${routine.name} completed successfully. No immediate manual action required. System is stable.`;

  // Read templates
  const templateDir = path.join(process.cwd(), "templates", "automation");
  const runTemplatePath = path.join(templateDir, "automation-run-template.md");
  const summaryTemplatePath = path.join(templateDir, "automation-summary-template.md");

  let runTemplate = "";
  let summaryTemplate = "";
  try {
    runTemplate = fs.readFileSync(runTemplatePath, "utf-8");
    summaryTemplate = fs.readFileSync(summaryTemplatePath, "utf-8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error reading templates:", msg);
    process.exit(1);
  }

  // Populate templates
  const replaceAll = (text: string) => {
    return text
      .replace(/{{ROUTINE_NAME}}/g, routine.name)
      .replace(/{{RISK_LEVEL}}/g, routine.riskLevel.toUpperCase())
      .replace(/{{OWNING_AGENT}}/g, routine.owningAgent)
      .replace(/{{START_TIME}}/g, startStr)
      .replace(/{{END_TIME}}/g, endStr)
      .replace(/{{FINAL_STATUS}}/g, finalStatus)
      .replace(/{{EXEC_LOG}}/g, execLog)
      .replace(/{{STAT_ATTEMPTED}}/g, String(attempted))
      .replace(/{{STAT_PASSED}}/g, String(passed))
      .replace(/{{STAT_FAILED}}/g, String(failed))
      .replace(/{{STAT_SKIPPED}}/g, String(skipped))
      .replace(/{{NEXT_ACTION}}/g, nextAction);
  };

  const runContent = replaceAll(runTemplate);
  const summaryContent = replaceAll(summaryTemplate);

  // Write outputs
  const outputDir = path.join(process.cwd(), "outputs", "automation");
  const logDir = path.join(outputDir, "logs");
  const runDir = path.join(outputDir, "runs");

  // Ensure directories exist
  fs.mkdirSync(logDir, { recursive: true });
  fs.mkdirSync(runDir, { recursive: true });

  const yyyy = startTime.getFullYear();
  const mm = String(startTime.getMonth() + 1).padStart(2, '0');
  const dd = String(startTime.getDate()).padStart(2, '0');
  const hh = String(startTime.getHours()).padStart(2, '0');
  const min = String(startTime.getMinutes()).padStart(2, '0');
  const ss = String(startTime.getSeconds()).padStart(2, '0');

  const logPath = path.join(logDir, `automation_log_${yyyy}-${mm}-${dd}.md`);
  const runPath = path.join(runDir, `automation_run_${yyyy}-${mm}-${dd}_${hh}${min}${ss}.md`);

  // Log file: append or write
  let dailyLogContent = "";
  if (fs.existsSync(logPath)) {
    dailyLogContent = fs.readFileSync(logPath, "utf-8") + "\n\n";
  } else {
    dailyLogContent = `# Daily Automation Log for ${yyyy}-${mm}-${dd}\n\n`;
  }
  dailyLogContent += `## Run Details: ${routine.name} (${startStr})\n\n` + runContent;
  
  fs.writeFileSync(logPath, dailyLogContent, "utf-8");
  fs.writeFileSync(runPath, summaryContent, "utf-8");

  console.log(`[Automation Runner] Log saved to: ${logPath}`);
  console.log(`[Automation Runner] Summary saved to: ${runPath}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Automation Runner crashed:", err);
  process.exit(1);
});
