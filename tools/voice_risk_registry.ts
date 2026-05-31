// tools/voice_risk_registry.ts
// Compiles and outputs the Voice Command Risk Registry report.

import fs from "node:fs/promises";
import path from "node:path";
import { RISK_LEVELS } from "../config/sentinel_safety";

interface VoiceRegistryEntry {
  phrase: string;
  command: string;
  riskLevel: string;
  autoExecute: boolean;
  requiresConfirmation: boolean;
  owner: string;
  notes: string;
}

const VOICE_COMMANDS: VoiceRegistryEntry[] = [
  // Core status & help commands (L0)
  {
    phrase: "show daily brief",
    command: "npm run daily-brief",
    riskLevel: "L0",
    autoExecute: true,
    requiresConfirmation: false,
    owner: "Action Router",
    notes: "Displays the summarized daily actions queue.",
  },
  {
    phrase: "show next actions",
    command: "npm run next",
    riskLevel: "L0",
    autoExecute: true,
    requiresConfirmation: false,
    owner: "Action Router",
    notes: "Prints the ranked task matrix.",
  },
  {
    phrase: "show agents",
    command: "npm run agents",
    riskLevel: "L0",
    autoExecute: true,
    requiresConfirmation: false,
    owner: "OS Architect",
    notes: "Lists active productivity agent roles.",
  },
  {
    phrase: "show campaign help",
    command: "npm run campaign-help",
    riskLevel: "L0",
    autoExecute: true,
    requiresConfirmation: false,
    owner: "Creative Revenue Strategist",
    notes: "Prints help instructions for revenue campaigns.",
  },
  {
    phrase: "show status",
    command: "npm run status",
    riskLevel: "L0",
    autoExecute: true,
    requiresConfirmation: false,
    owner: "OS Architect",
    notes: "Basic system diagnostics readout.",
  },
  {
    phrase: "show tunnel status",
    command: "npm run tunnel-status",
    riskLevel: "L0",
    autoExecute: true,
    requiresConfirmation: false,
    owner: "Workflow Auditor",
    notes: "Verifies if the public tunnel proxy daemon is running.",
  },

  // Audit / local operations (L1 / L2)
  {
    phrase: "run audit",
    command: "npm run audit",
    riskLevel: "L1",
    autoExecute: true,
    requiresConfirmation: false,
    owner: "Workflow Auditor",
    notes: "Runs standard TypeScript/ESLint workspace diagnostics.",
  },
  {
    phrase: "scan obsidian",
    command: "npm run ingest",
    riskLevel: "L2",
    autoExecute: false,
    requiresConfirmation: true,
    owner: "Knowledge Librarian",
    notes: "Ingests Obsidian vault notes in read-only mode.",
  },
  {
    phrase: "stage write",
    command: "npm run stage-write",
    riskLevel: "L2",
    autoExecute: false,
    requiresConfirmation: true,
    owner: "Knowledge Librarian",
    notes: "Stages markdown files to the write_staging output directory.",
  },
  {
    phrase: "run knowledge intake",
    command: "npm run sentinel:knowledge-router",
    riskLevel: "L2",
    autoExecute: false,
    requiresConfirmation: true,
    owner: "Knowledge Librarian",
    notes: "Intakes external knowledge resources and stages them.",
  },

  // High-level campaign creations (L2 / L3)
  {
    phrase: "create sporty brief",
    command: "npm run campaign brief sporty",
    riskLevel: "L2",
    autoExecute: false,
    requiresConfirmation: true,
    owner: "Creative Revenue Strategist",
    notes: "Drafts high-contrast campaign brief parameters.",
  },
  {
    phrase: "create sporty calendar",
    command: "npm run campaign calendar sporty",
    riskLevel: "L2",
    autoExecute: false,
    requiresConfirmation: true,
    owner: "Creative Revenue Strategist",
    notes: "Generates timeline schedules for release rollout.",
  },
  {
    phrase: "create sporty street script",
    command: "npm run campaign street-script sporty",
    riskLevel: "L2",
    autoExecute: false,
    requiresConfirmation: true,
    owner: "Creative Revenue Strategist",
    notes: "Generates voice script files for Icyflamze release.",
  },
  {
    phrase: "create sporty checklist",
    command: "npm run campaign checklist sporty",
    riskLevel: "L2",
    autoExecute: false,
    requiresConfirmation: true,
    owner: "Creative Revenue Strategist",
    notes: "Creates task execution checklists for launch.",
  },

  // Destructive, Write, Tunnel operations (L3 / L4)
  {
    phrase: "approve write",
    command: "npm run approve-write",
    riskLevel: "L3",
    autoExecute: false,
    requiresConfirmation: true,
    owner: "Knowledge Librarian",
    notes: "Performs actual file writes from staging to the live Obsidian vault.",
  },
  {
    phrase: "stop tunnel",
    command: "npm run sentinel:tunnel-log stop",
    riskLevel: "L3",
    autoExecute: true,
    requiresConfirmation: false,
    owner: "Workflow Auditor",
    notes: "Allowed without confirmation under VOICE_CAN_STOP_TUNNEL policy to secure public entry points quickly.",
  },
  {
    phrase: "start tunnel",
    command: "npm run sentinel:tunnel-log start",
    riskLevel: "L3",
    autoExecute: false,
    requiresConfirmation: true,
    owner: "Workflow Auditor",
    notes: "Voice execution is BLOCKED under VOICE_CAN_START_TUNNEL policy. Requires direct CLI/UI confirmation.",
  },
  {
    phrase: "run notebooklm bridge",
    command: "npm run notebooklm-bridge",
    riskLevel: "L3",
    autoExecute: false,
    requiresConfirmation: true,
    owner: "Knowledge Librarian",
    notes: "Syncs staging notes with NotebookLM MCP gateway. Execution is currently disabled.",
  },
];

async function generateReport() {
  const outputDir = path.join(process.cwd(), "reports", "voice_dispatch");
  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "voice_risk_registry.md");

  let markdown = `# 🎙️ VOICE COMMAND RISK REGISTRY\n\n`;
  markdown += `*Generated automatically by Sentinel OS Voice Risk Registry compiler.*\n`;
  markdown += `*System Risk Reference:* L0 (Low) to L4 (Critical)\n\n`;

  markdown += `## 🔒 Risk Levels Reference\n\n`;
  markdown += `| Level | Description | Confirmation Required |\n`;
  markdown += `| :--- | :--- | :---: |\n`;
  for (const [lvl, config] of Object.entries(RISK_LEVELS)) {
    markdown += `| **${lvl}** | ${config.description} | ${config.requiresConfirmation ? "🔴 YES" : "🟢 NO"} |\n`;
  }
  markdown += `\n`;

  markdown += `## 📋 Command Mappings & Gate Matrix\n\n`;
  markdown += `| Voice Phrase | Mapped Command | Risk | Auto-Execute | Requires Confirm | Owner | Notes |\n`;
  markdown += `| :--- | :--- | :---: | :---: | :---: | :--- | :--- |\n`;

  for (const cmd of VOICE_COMMANDS) {
    const autoStr = cmd.autoExecute ? "🟢 YES" : "🔴 NO";
    const confStr = cmd.requiresConfirmation ? "🔴 YES" : "🟢 NO";
    markdown += `| \`${cmd.phrase}\` | \`${cmd.command}\` | **${cmd.riskLevel}** | ${autoStr} | ${confStr} | ${cmd.owner} | ${cmd.notes} |\n`;
  }

  markdown += `\n---\n*Authorized by Chief Systems Architect under One System Governance Protocol.*`;

  await fs.writeFile(outputPath, markdown, "utf8");
  console.log(`[VOICE-RISK] Voice command risk registry successfully written to: ${outputPath}`);
}

generateReport().catch((err) => {
  console.error("Error generating voice risk registry report:", err);
  process.exit(1);
});
