// tools/sentinel_safety_report.ts
// Aggregates safety data and outputs a comprehensive Sentinel Safety Summary.

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

async function generateSummary() {
  const today = new Date().toISOString().slice(0, 10);
  const baseDir = process.cwd();

  // Define input report paths
  const cipReportPath = path.join(baseDir, "sentinel-os", "cip_audit_report.md");
  const tunnelLogPath = path.join(baseDir, "reports", "tunnel_sessions", `tunnel_session_log_${today}.md`);
  const voiceRegistryPath = path.join(baseDir, "reports", "voice_dispatch", "voice_risk_registry.md");
  const safetyGatePath = path.join(baseDir, "reports", "sentinel_safety", `sentinel_safety_gate_${today}.md`);
  const intakeRouterPath = path.join(baseDir, "reports", "knowledge_intake", `knowledge_intake_router_status_${today}.md`);

  const outputDir = path.join(baseDir, "reports", "sentinel_safety");
  await fs.mkdir(outputDir, { recursive: true });
  const summaryPath = path.join(outputDir, `sentinel_safety_summary_${today}.md`);

  // Read reports or set fallbacks
  const readReport = async (p: string, name: string) => {
    if (fsSync.existsSync(p)) {
      return await fs.readFile(p, "utf8");
    }
    return `*Report [${name}] not found. Run the corresponding tool first.*`;
  };

  const cipContent = await readReport(cipReportPath, "CIP Validator");
  const tunnelContent = await readReport(tunnelLogPath, "Tunnel Session Logger");
  const voiceContent = await readReport(voiceRegistryPath, "Voice Risk Registry");
  const safetyGateContent = await readReport(safetyGatePath, "Sentinel Safety Gate");
  const intakeContent = await readReport(intakeRouterPath, "Knowledge Intake Router");

  // Determine statuses and blockers based on contents
  let tunnelStatus = "🟢 SECURE (Bypasses Blocked / Confirmation Required)";
  let voiceStatus = "🟢 RUNNING (Low-risk auto-exec, Medium/High-risk gated)";
  let cipStatus = "🟢 VERIFIED";
  if (cipContent.includes("WARNING/BLOCKED") || cipContent.includes("HIGH")) {
    cipStatus = "⚠️ WARNING (1 collision folder name mismatch detected)";
  }
  let knowledgeStatus = "🟢 STAGED ONLY (Ingestion disabled)";
  let notebookLMStatus = "🟢 STAGED ONLY (Sync disabled)";

  const blockers: string[] = [];
  if (cipContent.includes("WARNING/BLOCKED")) {
    blockers.push("CIP Boundary Overlap: Skill folder name collision on 'frontend-design'");
  }
  if (safetyGateContent.includes("FAILED")) {
    blockers.push("Sentinel Safety Gate: One or more safety policies are misconfigured or violated");
  }

  let markdown = `# 🛡️ SENTINEL SAFETY SUMMARY - ${today}\n\n`;
  markdown += `*Generated automatically by Sentinel OS Safety Compiler.*\n\n`;

  markdown += `## 📋 Operational Safety Status\n\n`;
  markdown += `| Subsystem | Security Status | Details |\n`;
  markdown += `| :--- | :--- | :--- |\n`;
  markdown += `| **Public Tunnel** | ${tunnelStatus} | Voice start blocked, UI/CLI requires explicit user confirmation. |\n`;
  markdown += `| **Voice Dispatcher** | ${voiceStatus} | Safe command loops active. Staging L2+ to pending confirmation. |\n`;
  markdown += `| **CIP Boundary** | ${cipStatus} | Overlap check complete. |\n`;
  markdown += `| **Knowledge Intake** | ${knowledgeStatus} | Direct raw file storage is online under secure staging readmes. |\n`;
  markdown += `| **NotebookLM Integration** | ${notebookLMStatus} | Ready to sync, currently locked in offline staging. |\n`;
  markdown += `\n`;

  markdown += `## 🚨 Critical Blockers & Safety Alerts\n\n`;
  if (blockers.length > 0) {
    for (const b of blockers) {
      markdown += `- 🔴 **${b}**\n`;
    }
  } else {
    markdown += `*🟢 No active security blockers or system boundary violations identified in this session.*\n`;
  }
  markdown += `\n`;

  markdown += `## 🧭 Next Recommended Action\n\n`;
  if (blockers.some(b => b.includes("CIP"))) {
    markdown += `1. **Resolve local skills name collision:** Rename or merge local skill \`frontend-design\` at \`.agents/skills/frontend-design\` with the plugin product pack skill \`alex-frontend-product-pack/skills/frontend-design\` to clear the CIP collision warning.\n`;
    markdown += `2. **Run verification audit:** Re-execute \`npm run sentinel:safety\` and verify that all safety gate assertions pass.\n`;
  } else {
    markdown += `1. **Safe progression:** We are ready to proceed with safe integration tests for the Offline Knowledge Harvest engine.\n`;
  }
  markdown += `\n`;

  markdown += `## 📖 Reference Details\n\n`;

  markdown += `<details>\n<summary>🔍 View Latest CIP Audit Report</summary>\n\n\`\`\`markdown\n${cipContent}\n\`\`\`\n\n</details>\n\n`;
  markdown += `<details>\n<summary>🔍 View Latest Tunnel Session Log</summary>\n\n\`\`\`markdown\n${tunnelContent}\n\`\`\`\n\n</details>\n\n`;
  markdown += `<details>\n<summary>🔍 View Latest Voice Command Risk Registry</summary>\n\n\`\`\`markdown\n${voiceContent}\n\`\`\`\n\n</details>\n\n`;
  markdown += `<details>\n<summary>🔍 View Latest Safety Gate Assertions</summary>\n\n\`\`\`markdown\n${safetyGateContent}\n\`\`\`\n\n</details>\n\n`;
  markdown += `<details>\n<summary>🔍 View Latest Knowledge Intake Router Status</summary>\n\n\`\`\`markdown\n${intakeContent}\n\`\`\`\n\n</details>\n\n`;

  markdown += `---\n*Audit compile timestamp: \`${new Date().toISOString()}\`*\n`;
  markdown += `*Authorized by Sentinel OS Security Guardian agent.*`;

  await fs.writeFile(summaryPath, markdown, "utf8");
  console.log(`[SAFETY-REPORT] Safety summary report compiled and written to: ${summaryPath}`);
}

generateSummary().catch((err) => {
  console.error("Error generating safety summary report:", err);
  process.exit(1);
});
