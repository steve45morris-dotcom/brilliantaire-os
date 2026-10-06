#!/usr/bin/env tsx
/**
 * claude-project-scanner.ts
 * Workspace auto-discovery tool for Claude session context.
 *
 * Walks the workspace from root, discovers every project (Node, TS, Next.js,
 * Python, shell, Go), reads context signals per project, and writes a single
 * claude-project-context.md to the repo root that can be pasted into Claude
 * as a complete session briefing.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = "/Users/alexanderanthony";
const OUTPUT = path.join(ROOT, "claude-project-context.md");

// Directories to skip entirely
const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", "__pycache__",
  ".cache", "venv", "venv_stable", ".venv", ".nvm", ".pyenv", ".rustup",
  ".cargo", "Library", "Applications", "Movies", "Music", "Pictures",
  "Public", ".Trash", "nltk_data", "lfs", "coverage", ".pm2",
  "siyuan", "siyuan-repo", "LTX-Video", ".electron-gyp",
]);

// Max depth to walk
const MAX_DEPTH = 4;

// Lines to read from context files
const CONTEXT_LINE_LIMIT = 60;

interface Project {
  dir: string;
  relDir: string;
  type: string[];
  name: string;
  description: string;
  scripts: Record<string, string>;
  gitBranch: string;
  gitCommit: string;
  nextActions: string;
  readmeSnippet: string;
  todoSnippet: string;
  mainFiles: string[];
}

function readLines(filePath: string, max: number): string {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n").slice(0, max);
    return lines.join("\n");
  } catch {
    return "";
  }
}

function fileExists(p: string): boolean {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function dirExists(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function gitInfo(dir: string): { branch: string; commit: string } {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: dir, stdio: ["pipe", "pipe", "pipe"], timeout: 3000,
    }).toString().trim();
    const commit = execSync("git rev-parse --short HEAD", {
      cwd: dir, stdio: ["pipe", "pipe", "pipe"], timeout: 3000,
    }).toString().trim();
    return { branch, commit };
  } catch {
    return { branch: "", commit: "" };
  }
}

function detectProjectTypes(dir: string): string[] {
  const types: string[] = [];
  if (fileExists(path.join(dir, "next.config.ts")) || fileExists(path.join(dir, "next.config.js"))) types.push("Next.js");
  if (fileExists(path.join(dir, "package.json"))) types.push("Node");
  if (fileExists(path.join(dir, "tsconfig.json"))) types.push("TypeScript");
  if (fileExists(path.join(dir, "requirements.txt")) || fileExists(path.join(dir, "pyproject.toml")) || fileExists(path.join(dir, "setup.py"))) types.push("Python");
  if (fileExists(path.join(dir, "go.mod"))) types.push("Go");
  if (fileExists(path.join(dir, "Cargo.toml"))) types.push("Rust");
  if (fileExists(path.join(dir, "Taskfile.yml")) || fileExists(path.join(dir, "Taskfile.yaml"))) types.push("Task");
  if (fileExists(path.join(dir, "Dockerfile"))) types.push("Docker");
  if (fileExists(path.join(dir, "docker-compose.yml"))) types.push("Compose");
  return types;
}

function isProject(dir: string): boolean {
  return (
    fileExists(path.join(dir, "package.json")) ||
    fileExists(path.join(dir, "tsconfig.json")) ||
    fileExists(path.join(dir, "requirements.txt")) ||
    fileExists(path.join(dir, "pyproject.toml")) ||
    fileExists(path.join(dir, "go.mod")) ||
    fileExists(path.join(dir, "Cargo.toml")) ||
    fileExists(path.join(dir, "next.config.ts")) ||
    fileExists(path.join(dir, "next.config.js"))
  );
}

function readPackageJson(dir: string): { name: string; description: string; scripts: Record<string, string> } {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
    return {
      name: raw.name || "",
      description: raw.description || "",
      scripts: raw.scripts || {},
    };
  } catch {
    return { name: "", description: "", scripts: {} };
  }
}

function discoverMainFiles(dir: string): string[] {
  const candidates = [
    "index.ts", "index.js", "index.py", "main.ts", "main.js", "main.py",
    "app.ts", "app.js", "app.py", "server.ts", "server.js",
  ];
  return candidates.filter(f => fileExists(path.join(dir, f)));
}

function scanDir(dir: string, depth: number, projects: Project[]): void {
  if (depth > MAX_DEPTH) return;

  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return;
  }

  if (isProject(dir) && dir !== ROOT) {
    const pkg = readPackageJson(dir);
    const types = detectProjectTypes(dir);
    const git = gitInfo(dir);
    const relDir = path.relative(ROOT, dir);

    const nextActionsPath = path.join(dir, "NEXT_ACTIONS.md");
    const readmePath = path.join(dir, "README.md");
    const todoPath = path.join(dir, "TODO.md");

    const project: Project = {
      dir,
      relDir: relDir || ".",
      type: types,
      name: pkg.name || path.basename(dir),
      description: pkg.description || "",
      scripts: pkg.scripts,
      gitBranch: git.branch,
      gitCommit: git.commit,
      nextActions: fileExists(nextActionsPath) ? readLines(nextActionsPath, CONTEXT_LINE_LIMIT) : "",
      readmeSnippet: fileExists(readmePath) ? readLines(readmePath, 20) : "",
      todoSnippet: fileExists(todoPath) ? readLines(todoPath, CONTEXT_LINE_LIMIT) : "",
      mainFiles: discoverMainFiles(dir),
    };

    projects.push(project);
    // Don't recurse into a project's internals beyond one level
    return;
  }

  for (const entry of entries) {
    if (entry.startsWith(".") && entry !== ".agents") continue;
    if (SKIP_DIRS.has(entry)) continue;

    const full = path.join(dir, entry);
    try {
      if (fs.statSync(full).isDirectory()) {
        scanDir(full, depth + 1, projects);
      }
    } catch {
      // skip unreadable
    }
  }
}

function formatScripts(scripts: Record<string, string>): string {
  const keys = Object.keys(scripts).slice(0, 20);
  if (keys.length === 0) return "  (none)";
  return keys.map(k => `  ${k}: ${scripts[k]}`).join("\n");
}

function formatSection(label: string, content: string): string {
  if (!content.trim()) return "";
  return `**${label}:**\n\`\`\`\n${content.trim()}\n\`\`\`\n`;
}

function buildRootContext(): string {
  const pkg = readPackageJson(ROOT);
  const git = gitInfo(ROOT);

  const rootScriptKeys = Object.keys(pkg.scripts);
  const rootScripts = rootScriptKeys.slice(0, 30).map(k => `  ${k}`).join("\n");

  const nextActions = fileExists(path.join(ROOT, "NEXT_ACTIONS.md"))
    ? readLines(path.join(ROOT, "NEXT_ACTIONS.md"), 80)
    : "";

  const systemStatus = fileExists(path.join(ROOT, "SYSTEM_STATUS.md"))
    ? readLines(path.join(ROOT, "SYSTEM_STATUS.md"), 40)
    : "";

  let out = `## ROOT WORKSPACE\n`;
  out += `- **Package:** ${pkg.name || "brilliantaire-os"}\n`;
  out += `- **Description:** ${pkg.description || "IcyOS — Brilliantaire OS"}\n`;
  out += `- **Git Branch:** ${git.branch}\n`;
  out += `- **Git Commit:** ${git.commit}\n`;
  out += `- **Total Scripts:** ${rootScriptKeys.length}\n`;
  out += `\n**Top Scripts (30):**\n${rootScripts}\n`;
  if (nextActions) out += `\n${formatSection("NEXT_ACTIONS (first 80 lines)", nextActions)}`;
  if (systemStatus) out += `\n${formatSection("SYSTEM_STATUS (first 40 lines)", systemStatus)}`;
  return out;
}

function buildProjectBlock(p: Project, index: number): string {
  let block = `---\n\n### [${index}] \`${p.relDir}\`\n`;
  block += `- **Name:** ${p.name}\n`;
  if (p.description) block += `- **Description:** ${p.description}\n`;
  block += `- **Types:** ${p.type.join(", ") || "unknown"}\n`;
  if (p.gitBranch) block += `- **Branch:** ${p.gitBranch} @ ${p.gitCommit}\n`;
  if (p.mainFiles.length > 0) block += `- **Entry files:** ${p.mainFiles.join(", ")}\n`;

  if (Object.keys(p.scripts).length > 0) {
    block += `\n**npm scripts:**\n${formatScripts(p.scripts)}\n`;
  }

  if (p.readmeSnippet) block += `\n${formatSection("README (first 20 lines)", p.readmeSnippet)}`;
  if (p.nextActions) block += `\n${formatSection("NEXT_ACTIONS", p.nextActions)}`;
  if (p.todoSnippet) block += `\n${formatSection("TODO", p.todoSnippet)}`;

  return block;
}

function main(): void {
  console.log("🔍 Claude Project Scanner — scanning workspace...\n");

  const projects: Project[] = [];
  scanDir(ROOT, 0, projects);

  // Sort: by directory name for determinism
  projects.sort((a, b) => a.relDir.localeCompare(b.relDir));

  const timestamp = new Date().toISOString();
  const lines: string[] = [];

  lines.push(`# Claude Project Context`);
  lines.push(`**Generated:** ${timestamp}`);
  lines.push(`**Root:** ${ROOT}`);
  lines.push(`**Projects discovered:** ${projects.length}`);
  lines.push(`\n> Paste this file into Claude as session context. Do not edit manually.\n`);
  lines.push(`---\n`);
  lines.push(buildRootContext());

  lines.push(`\n---\n\n## DISCOVERED PROJECTS (${projects.length})\n`);

  projects.forEach((p, i) => {
    lines.push(buildProjectBlock(p, i + 1));
  });

  lines.push(`\n---\n`);
  lines.push(`## VMM STATUS (as of scan)`);
  lines.push(`See: \`SUBSYSTEM_VERIFICATION_MATRIX.md\` and \`VERIFICATION_ROADMAP.md\`\n`);

  const output = lines.join("\n");
  fs.writeFileSync(OUTPUT, output, "utf8");

  console.log(`✅ Scan complete.`);
  console.log(`📄 Projects found: ${projects.length}`);
  console.log(`📝 Output written to: ${OUTPUT}`);
  console.log(`\nNext step: paste claude-project-context.md into your Claude session.\n`);
}

main();
