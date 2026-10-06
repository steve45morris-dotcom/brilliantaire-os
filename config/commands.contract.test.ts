import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { COMMAND_CATEGORIES, COMMAND_REGISTRY, COMMAND_REGISTRY_FORMAT_VERSION } from "./commands";

/**
 * The contract with P.J.K. in the sentinel-os repo, which reads this repo's
 * files as plain text:
 *  - config/commands.ts, through lib/pjk-toolbox.ts (parseRegistry below is a
 *    copy of its reader, keep the two in step);
 *  - NEXT_ACTIONS.md and SYSTEM_STATUS.md, through lib/pjk-brilliantaire.ts.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f: string) => fs.readFileSync(path.join(root, f), "utf8");

function parseRegistry(source: string) {
  const out: { name: string; aliases: string[]; description: string; category: string; risk: string; exact: boolean; enabled: boolean }[] = [];
  const str = (block: string, key: string) => block.match(new RegExp(`${key}:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`))?.[2] ?? "";
  for (const m of source.matchAll(/\{([^{}]*?\bname:\s*['"][^'"]+['"][^{}]*?)\}/g)) {
    const b = m[1];
    const name = str(b, "name");
    const risk = str(b, "riskLevel");
    if (!name || !["low", "medium", "high"].includes(risk)) continue;
    const aliases = [...(b.match(/aliases:\s*\[([^\]]*)\]/)?.[1] ?? "").matchAll(/['"]([^'"]+)['"]/g)].map((a) => a[1].toLowerCase());
    out.push({ name, aliases, description: str(b, "description"), category: str(b, "category") || "other", risk, exact: /requiresExactName:\s*true/.test(b), enabled: !/enabled:\s*false/.test(b) });
  }
  return out;
}

/** P.J.K.'s reader before it knew `category` (sentinel-os up to #47): the keys it reads must still come out the same. */
function parseRegistryBeforeCategory(source: string) {
  return parseRegistry(source).map(({ category: _category, ...rest }) => rest);
}

const unescape = (s: string) => s.replace(/\\(.)/g, "$1");

describe("command registry as P.J.K. reads it", () => {
  const parsed = parseRegistry(read("config/commands.ts"));

  it("is format version 1 (P.J.K. checks this number before reading)", () => {
    expect(COMMAND_REGISTRY_FORMAT_VERSION).toBe(1);
    expect(read("config/commands.ts")).toMatch(/export const COMMAND_REGISTRY_FORMAT_VERSION = \d+;/);
  });

  it("reads every command, in order", () => {
    expect(parsed.map((c) => c.name)).toEqual(COMMAND_REGISTRY.map((c) => c.name));
  });

  it("reads each command's aliases, description, category, risk and flags exactly", () => {
    parsed.forEach((p, i) => {
      const c = COMMAND_REGISTRY[i];
      expect({ ...p, description: unescape(p.description) }).toEqual({
        name: c.name,
        aliases: c.aliases.map((a) => a.toLowerCase()),
        description: c.description,
        category: c.category,
        risk: c.riskLevel,
        exact: c.requiresExactName,
        enabled: c.enabled
      });
    });
  });

  it("gives every command one of the known categories", () => {
    for (const c of COMMAND_REGISTRY) expect(COMMAND_CATEGORIES, c.name).toContain(c.category);
    const used = new Set(COMMAND_REGISTRY.map((c) => c.category));
    for (const cat of COMMAND_CATEGORIES) expect(used, `category "${cat}" has no commands; drop it from COMMAND_CATEGORIES`).toContain(cat);
  });

  it("still reads the same for a P.J.K. that doesn't know `category` (no format bump needed)", () => {
    const before = parseRegistryBeforeCategory(read("config/commands.ts"));
    expect(before.map((c) => c.name)).toEqual(COMMAND_REGISTRY.map((c) => c.name));
    before.forEach((p, i) => expect(p.risk, p.name).toBe(COMMAND_REGISTRY[i].riskLevel));
  });

  it("never gives one command name two risk levels, exact-name rules or categories", () => {
    const seen = new Map<string, string>();
    for (const c of COMMAND_REGISTRY) {
      const rule = `${c.riskLevel}/${c.requiresExactName}/${c.category}`;
      expect(seen.get(c.name) ?? rule, c.name).toBe(rule);
      seen.set(c.name, rule);
    }
  });
});

/**
 * The Grinders Keep evidence pipeline: registered in 506433a (July 2026) ahead
 * of implementation and never written. Its config/ and templates/ files exist;
 * the scripts don't, on the Mac or anywhere else. Each target here may only be
 * removed from this list, never added to it; delete a line once its file lands.
 */
const KNOWN_MISSING_SCRIPTS = [
  "evidence-collection-execution-guide", "evidence-collection-intake-lock", "evidence-collection-queue",
  "evidence-collection-session-logger", "evidence-collection-workbench", "evidence-completion-tracker",
  "evidence-detector", "evidence-first-item-collection-packet", "evidence-intake-validator",
  "evidence-loop-closure-auditor", "evidence-pack-builder", "evidence-proof-review-board",
  "evidence-revalidation-trigger", "evidence-session-import-bridge", "evidence-tracker-manual-rerun-planner",
  "evidence-tracker-sync-adapter", "first-evidence-attempt-reviewer", "first-evidence-completion-detector",
  "first-evidence-importer-gate", "first-evidence-manual-completion-loop", "manual-evidence-action-board",
].flatMap((s) => [`scripts/grinders-keep-${s}.ts`, `scripts/grinders-keep-${s}-help.ts`]);

describe("command registry is runnable", () => {
  const scripts = (JSON.parse(read("package.json")) as { scripts: Record<string, string> }).scripts;
  const missing = new Set<string>();
  const unmapped: string[] = [];
  for (const c of COMMAND_REGISTRY) {
    const run = scripts[c.npmScript];
    if (!run) {
      unmapped.push(`${c.name}: no npm script "${c.npmScript}"`);
      continue;
    }
    const target = run.match(/\btsx (scripts\/\S+)/)?.[1];
    if (target && !fs.existsSync(path.join(root, target))) missing.add(target);
  }

  it("maps every command to an npm script", () => {
    expect(unmapped).toEqual([]);
  });

  it("finds every command's script on disk, apart from the known-missing list", () => {
    const fresh = [...missing].filter((t) => !KNOWN_MISSING_SCRIPTS.includes(t));
    expect(fresh, `command(s) whose script is missing:\n${fresh.join("\n")}`).toEqual([]);
  });

  it("keeps the known-missing list honest: drop entries once their script lands", () => {
    const landed = KNOWN_MISSING_SCRIPTS.filter((t) => !missing.has(t));
    expect(landed, `now present, remove from KNOWN_MISSING_SCRIPTS:\n${landed.join("\n")}`).toEqual([]);
  });
});

describe("status files as P.J.K. reads them", () => {
  it("NEXT_ACTIONS.md keeps its Do Now and Do Next checklists", () => {
    const md = read("NEXT_ACTIONS.md");
    expect(md).toMatch(/^## Do Now\s*$/m);
    expect(md).toMatch(/^## Do Next\s*$/m);
    expect(md).toMatch(/^- \[[ xX]\] \S/m);
  });

  it("SYSTEM_STATUS.md keeps its Current Phase line", () => {
    expect(read("SYSTEM_STATUS.md")).toMatch(/^- \*\*Current Phase:\*\* \S/m);
  });
});
