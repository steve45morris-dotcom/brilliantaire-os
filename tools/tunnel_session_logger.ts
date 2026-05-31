// tools/tunnel_session_logger.ts
// Logs public tunnel session activations and terminations for auditing.

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

interface TunnelSession {
  timestamp: string;
  action: string; // 'start' | 'stop' | 'status'
  requestedBy: string; // 'UI' | 'CLI' | 'voice' | 'system'
  port: number;
  tunnelUrl: string;
  status: string; // 'active' | 'stopped' | 'failed'
  riskLevel: string; // L3
  confirmationStatus: string; // 'confirmed' | 'blocked' | 'bypass_attempt'
  stoppedAt?: string;
  notes: string;
}

// Simple argv parser
const args = process.argv.slice(2);
const actionArg = args[0] || "audit";
const portArg = parseInt(args[1] || "3000", 10);
const byArg = args[2] || "CLI";
const urlArg = args[3] || "N/A";
const statusArg = args[4] || "active";
const notesArg = args[5] || "Tunnel session sweep check.";

async function logSession() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const outputDir = path.join(process.cwd(), "reports", "tunnel_sessions");
  await fs.mkdir(outputDir, { recursive: true });

  const logPath = path.join(outputDir, `tunnel_session_log_${today}.md`);

  const entry: TunnelSession = {
    timestamp: new Date().toISOString(),
    action: actionArg,
    requestedBy: byArg,
    port: portArg,
    tunnelUrl: urlArg,
    status: statusArg,
    riskLevel: "L3",
    confirmationStatus: actionArg === "start" && byArg === "voice" ? "BLOCKED" : "CONFIRMED",
    notes: notesArg,
  };

  if (actionArg === "stop") {
    entry.stoppedAt = new Date().toISOString();
    entry.status = "stopped";
  }

  let fileExists = fsSync.existsSync(logPath);
  let content = "";

  if (!fileExists) {
    content += `# 🌐 PUBLIC TUNNEL SESSION LOG - ${today}\n\n`;
    content += `*Generated automatically by Sentinel OS Tunnel Session Logger.*\n`;
    content += `*Security Policy:* All public tunnels mapped to L3 risk level gates.\n\n`;
    content += `| Timestamp | Action | Requested By | Port | Tunnel URL | Status | Risk | Confirmation | Stopped At | Notes |\n`;
    content += `| :--- | :--- | :--- | :---: | :--- | :--- | :---: | :--- | :--- | :--- |\n`;
  }

  const stoppedAtStr = entry.stoppedAt ? `\`${entry.stoppedAt}\`` : "N/A";
  const urlStr = entry.tunnelUrl !== "N/A" ? `[Link](${entry.tunnelUrl})` : "N/A";

  content += `| \`${entry.timestamp}\` | **${entry.action.toUpperCase()}** | ${entry.requestedBy} | ${entry.port} | ${urlStr} | \`${entry.status}\` | **${entry.riskLevel}** | ${entry.confirmationStatus === "BLOCKED" ? "🔴 BLOCKED" : "🟢 APPROVED"} | ${stoppedAtStr} | ${entry.notes} |\n`;

  await fs.appendFile(logPath, content, "utf8");
  console.log(`[TUNNEL-LOG] Session log updated successfully at: ${logPath}`);
}

logSession().catch((err) => {
  console.error("Error writing to tunnel session log:", err);
  process.exit(1);
});
