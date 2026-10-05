#!/usr/bin/env npx tsx
/**
 * claude-session-bootstrap.ts
 * Interactive CLI intake for IcyOS project context.
 * Writes output to claude-session-bootstrap.md for pasting into Claude.
 *
 * Usage: npx tsx scripts/claude-session-bootstrap.ts
 */

import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  title: string;
  fields: Field[];
}

interface Field {
  key: string;
  label: string;
  hint?: string;
  multiline?: boolean;
}

interface Answers {
  [sectionId: string]: { [fieldKey: string]: string };
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: "identity",
    title: "PROJECT IDENTITY",
    fields: [
      { key: "projectName",       label: "Project name (canonical)" },
      { key: "subProjects",       label: "Active sub-projects",        hint: "e.g. sentinel-os, grinders-keep" },
      { key: "currentPhase",      label: "Current phase",              hint: "e.g. Phase 13I" },
      { key: "repoRoot",          label: "Repository root path" },
      { key: "runtime",           label: "Primary language / runtime" },
    ],
  },
  {
    id: "architecture",
    title: "ARCHITECTURE OVERVIEW",
    fields: [
      { key: "summary",           label: "System summary (2-4 sentences)",  multiline: true },
      { key: "activeSubsystems",  label: "Key subsystems in active development" },
      { key: "frozenSubsystems",  label: "Frozen / deprecated / aspirational subsystems" },
    ],
  },
  {
    id: "commands",
    title: "COMMAND & ROUTING SYSTEM",
    fields: [
      { key: "registryPath",      label: "Command registry file path" },
      { key: "routingStrategy",   label: "Routing strategy",            hint: "exact / fuzzy / task runner" },
      { key: "aliasesInUse",      label: "Aliases in use?",             hint: "yes / no / describe" },
      { key: "controlPlane",      label: "How is controlPlaneOnly enforced?", hint: "runtime / advisory / none" },
    ],
  },
  {
    id: "cip",
    title: "CIP BOUNDARIES & SAFETY MODEL",
    fields: [
      { key: "cipMeaning",        label: "What does a CIP boundary mean in this system?", multiline: true },
      { key: "pathValidation",    label: "Are read/write/execute paths validated at runtime?", hint: "yes / no / partial" },
      { key: "confirmTrigger",    label: "What triggers requiresConfirmation?" },
      { key: "autoExecution",     label: "Is autoExecution ever enabled, and when?" },
    ],
  },
  {
    id: "phases",
    title: "PHASE & FREEZE STATUS",
    fields: [
      { key: "activePhases",      label: "Currently active phases" },
      { key: "freezeMeaning",     label: "What does freezeStatus=maintenance-corrective mean operationally?" },
      { key: "freezeEnforced",    label: "Is freeze enforced or metadata-only?" },
      { key: "nextActionsPath",   label: "Path to NEXT_ACTIONS.md" },
      { key: "priority1",         label: "Current Priority 1 item in NEXT_ACTIONS.md" },
    ],
  },
  {
    id: "telemetry",
    title: "OUTPUT & TELEMETRY",
    fields: [
      { key: "telemetryPath",     label: "Telemetry write path(s)" },
      { key: "telemetryConsumer", label: "What consumes telemetry downstream?" },
      { key: "healthTools",       label: "Tools feeding healthIntegration" },
      { key: "verdictValidation", label: "Are exit verdicts validated anywhere?", hint: "COMPLETE / PARTIAL / NO_EVIDENCE" },
    ],
  },
  {
    id: "tests",
    title: "TEST COVERAGE",
    fields: [
      { key: "testRunner",        label: "Test runner in use" },
      { key: "testPaths",         label: "Where do tests live?" },
      { key: "passingCount",      label: "Current real passing test count (raw output only)" },
      { key: "webhookIncluded",   label: "Sentinel-os webhook tests included in count?", hint: "yes / no / unknown" },
      { key: "failingTests",      label: "Known failing or skipped tests" },
    ],
  },
  {
    id: "openIssues",
    title: "KNOWN OPEN ISSUES",
    fields: [
      {
        key: "issues",
        label: "List unresolved items Claude should know before building",
        hint: "e.g. Stripe secret not rotated, test count discrepancy",
        multiline: true,
      },
    ],
  },
  {
    id: "nextTask",
    title: "WHAT YOU WANT BUILT NEXT",
    fields: [
      { key: "taskDescription",   label: "Describe the next task",      multiline: true },
      { key: "taskType",          label: "Task type",                   hint: "new tool / fix / audit / expansion" },
      { key: "constraints",       label: "Constraints",                 hint: "read-only / no-network / controlPlaneOnly / etc." },
      { key: "filesToRead",       label: "Files Claude should read before starting" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIVIDER  = "─".repeat(62);
const HDIVIDER = "═".repeat(62);

function banner(): void {
  console.log("\n" + HDIVIDER);
  console.log("  ICYOS PROJECT CONTEXT INTAKE — Claude Session Bootstrap");
  console.log(HDIVIDER);
  console.log("  Answer each prompt. Press Enter to skip optional fields.");
  console.log("  For multiline fields, type END on its own line to finish.");
  console.log(HDIVIDER + "\n");
}

function sectionHeader(section: Section, index: number, total: number): void {
  console.log("\n" + DIVIDER);
  console.log(`  [${index}/${total}] ${section.title}`);
  console.log(DIVIDER);
}

async function askSingle(rl: readline.Interface, field: Field): Promise<string> {
  const hint   = field.hint ? ` (${field.hint})` : "";
  const prompt = `  ${field.label}${hint}:\n  > `;
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim()));
  });
}

async function askMultiline(rl: readline.Interface, field: Field): Promise<string> {
  const hint = field.hint ? ` (${field.hint})` : "";
  console.log(`  ${field.label}${hint}:`);
  console.log("  (Type END on its own line when done)");
  const lines: string[] = [];
  return new Promise((resolve) => {
    const onLine = (line: string) => {
      if (line.trim() === "END") {
        rl.removeListener("line", onLine);
        resolve(lines.join("\n").trim());
      } else {
        lines.push(line);
      }
    };
    rl.on("line", onLine);
    process.stdout.write("  > ");
  });
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(answers: Answers, timestamp: string): string {
  const lines: string[] = [];

  lines.push("# Claude Session Bootstrap");
  lines.push(`**Generated:** ${timestamp}`);
  lines.push(`**Project:** ${answers["identity"]?.["projectName"] ?? "Unknown"}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("> Paste this file as your first message in a new Claude session.");
  lines.push("> Claude will use this to skip re-orientation and start building immediately.");
  lines.push("");

  for (const section of SECTIONS) {
    lines.push(`## ${section.title}`);
    lines.push("");

    const sectionAnswers = answers[section.id] ?? {};
    let hasContent = false;

    for (const field of section.fields) {
      const value = sectionAnswers[field.key];
      if (value && value.length > 0) {
        hasContent = true;
        lines.push(`**${field.label}:**`);
        if (field.multiline && value.includes("\n")) {
          lines.push("");
          lines.push(value);
        } else {
          lines.push(value);
        }
        lines.push("");
      }
    }

    if (!hasContent) {
      lines.push("_Not provided._");
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  lines.push("_End of bootstrap context._");
  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  banner();

  const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout,
  });

  const answers: Answers = {};

  for (let i = 0; i < SECTIONS.length; i++) {
    const section = SECTIONS[i];
    sectionHeader(section, i + 1, SECTIONS.length);
    answers[section.id] = {};

    for (const field of section.fields) {
      const value = field.multiline
        ? await askMultiline(rl, field)
        : await askSingle(rl, field);
      answers[section.id][field.key] = value;
    }
  }

  rl.close();

  // ── Write output ────────────────────────────────────────────────────────────
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const markdown   = renderMarkdown(answers, timestamp);

  const outputPath = path.resolve(process.cwd(), "claude-session-bootstrap.md");
  fs.writeFileSync(outputPath, markdown, "utf8");

  console.log("\n" + HDIVIDER);
  console.log("  DONE");
  console.log(HDIVIDER);
  console.log(`\n  Output written to:\n  ${outputPath}\n`);
  console.log("  Next step: paste the contents of that file as your");
  console.log("  first message in a new Claude session.\n");
  console.log(HDIVIDER + "\n");
}

main().catch((err) => {
  console.error("Bootstrap error:", err);
  process.exit(1);
});
