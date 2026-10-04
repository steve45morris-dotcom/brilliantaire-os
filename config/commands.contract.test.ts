import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { COMMAND_REGISTRY, COMMAND_REGISTRY_FORMAT_VERSION } from "./commands";

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
  const out: { name: string; aliases: string[]; description: string; risk: string; exact: boolean; enabled: boolean }[] = [];
  const str = (block: string, key: string) => block.match(new RegExp(`${key}:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`))?.[2] ?? "";
  for (const m of source.matchAll(/\{([^{}]*?\bname:\s*['"][^'"]+['"][^{}]*?)\}/g)) {
    const b = m[1];
    const name = str(b, "name");
    const risk = str(b, "riskLevel");
    if (!name || !["low", "medium", "high"].includes(risk)) continue;
    const aliases = [...(b.match(/aliases:\s*\[([^\]]*)\]/)?.[1] ?? "").matchAll(/['"]([^'"]+)['"]/g)].map((a) => a[1].toLowerCase());
    out.push({ name, aliases, description: str(b, "description"), risk, exact: /requiresExactName:\s*true/.test(b), enabled: !/enabled:\s*false/.test(b) });
  }
  return out;
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

  it("reads each command's aliases, description, risk and flags exactly", () => {
    parsed.forEach((p, i) => {
      const c = COMMAND_REGISTRY[i];
      expect({ ...p, description: unescape(p.description) }).toEqual({
        name: c.name,
        aliases: c.aliases.map((a) => a.toLowerCase()),
        description: c.description,
        risk: c.riskLevel,
        exact: c.requiresExactName,
        enabled: c.enabled
      });
    });
  });

  it("never gives one command name two risk levels or exact-name rules", () => {
    const seen = new Map<string, string>();
    for (const c of COMMAND_REGISTRY) {
      const rule = `${c.riskLevel}/${c.requiresExactName}`;
      expect(seen.get(c.name) ?? rule, c.name).toBe(rule);
      seen.set(c.name, rule);
    }
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
