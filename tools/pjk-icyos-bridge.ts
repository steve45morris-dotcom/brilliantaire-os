/**
 * P.J.K. ↔ IcyOS bridge.
 *
 * Syncs data between the local Brilliantaire OS (NEXT_ACTIONS.md,
 * SYSTEM_STATUS.md) and the hosted IcyOS platform via its personal access
 * token API.
 *
 * Lives in this repo (not sentinel-os) because CLAUDE.md requires sentinel-os
 * changes go through the standalone repo. P.J.K. calls this bridge; the
 * bridge calls IcyOS.
 *
 * Usage:
 *   npx tsx tools/pjk-icyos-bridge.ts sync     # push NEXT_ACTIONS → IcyOS missions
 *   npx tsx tools/pjk-icyos-bridge.ts status    # pull IcyOS workspace → stdout
 *   npx tsx tools/pjk-icyos-bridge.ts complete <action-id>  # tick a step
 *
 * Env:
 *   ICYOS_TOKEN  — icy_… personal access token (required)
 *   ICYOS_URL    — base URL (default http://localhost:3000)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IcyOS } from './icyos-client.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Parse NEXT_ACTIONS.md
// ---------------------------------------------------------------------------

interface ParsedAction {
  section: string; // "Do Now" | "Do Next"
  text: string;
  done: boolean;
}

function parseNextActions(): ParsedAction[] {
  const md = fs.readFileSync(path.join(ROOT, 'NEXT_ACTIONS.md'), 'utf8');
  const items: ParsedAction[] = [];
  let section = '';

  for (const line of md.split('\n')) {
    const heading = line.match(/^## (.+)/);
    if (heading) { section = heading[1].trim(); continue; }

    const item = line.match(/^- \[([ xX])\] (.+)/);
    if (item && (section === 'Do Now' || section === 'Do Next')) {
      items.push({ section, text: item[2].trim(), done: item[1] !== ' ' });
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// Parse SYSTEM_STATUS.md
// ---------------------------------------------------------------------------

function parseCurrentPhase(): string {
  const md = fs.readFileSync(path.join(ROOT, 'SYSTEM_STATUS.md'), 'utf8');
  const match = md.match(/^\- \*\*Current Phase:\*\* (.+)/m);
  return match ? match[1].trim() : 'unknown';
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function requireToken(): IcyOS {
  const token = process.env.ICYOS_TOKEN;
  const base = process.env.ICYOS_URL ?? 'http://localhost:3000';
  if (!token) {
    console.error('Set ICYOS_TOKEN to an icy_… personal access token.');
    console.error('Create one in IcyOS → Settings → API Tokens, then:');
    console.error('  pjkkey ICYOS_TOKEN');
    process.exit(1);
  }
  return new IcyOS({ baseUrl: base, token });
}

async function cmdStatus() {
  const api = requireToken();
  const ws = await api.workspace();
  const phase = parseCurrentPhase();

  console.log(`Phase: ${phase}`);
  console.log(`Workspace: ${ws.workspace.name}`);
  console.log();

  for (const p of ws.projects) {
    console.log(`[${p.priority}] ${p.name}`);
    for (const m of p.missions) {
      const total = m.steps.length;
      const done = m.steps.filter((s) => s.completed).length;
      console.log(`  ${m.status === 'completed' ? '✓' : '○'} ${m.name} (${done}/${total})`);
      for (const s of m.steps) {
        console.log(`    ${s.completed ? '[x]' : '[ ]'} ${s.text}`);
      }
    }
    console.log();
  }
}

async function cmdSync() {
  const api = requireToken();
  const actions = parseNextActions();
  const ws = await api.workspace();
  const phase = parseCurrentPhase();

  // Find or create a project for the current phase
  const projectName = `Phase: ${phase}`;
  let project = ws.projects.find((p) => p.name === projectName);

  if (!project) {
    console.log(`Creating project "${projectName}"…`);
    project = await api.createProject(projectName, 'P1');
  }

  // Group actions by section → mission
  const sections = new Map<string, ParsedAction[]>();
  for (const a of actions) {
    const list = sections.get(a.section) ?? [];
    list.push(a);
    sections.set(a.section, list);
  }

  for (const [section, items] of sections) {
    const existing = project.missions?.find((m) => m.name === section);
    if (existing) {
      console.log(`Mission "${section}" already exists — skipping creation.`);
      continue;
    }

    const stepTexts = items.map((i) => i.text);
    console.log(`Creating mission "${section}" with ${stepTexts.length} steps…`);
    await api.createMission(project.id, section, stepTexts);
  }

  console.log('Sync complete.');
}

async function cmdComplete(actionId: string) {
  const api = requireToken();
  await api.completeStep(actionId, true);
  console.log(`Step ${actionId} marked complete.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case 'status':
    cmdStatus().catch((e) => { console.error(String(e)); process.exit(1); });
    break;
  case 'sync':
    cmdSync().catch((e) => { console.error(String(e)); process.exit(1); });
    break;
  case 'complete':
    if (!args[0]) { console.error('Usage: pjk-icyos-bridge.ts complete <action-id>'); process.exit(1); }
    cmdComplete(args[0]).catch((e) => { console.error(String(e)); process.exit(1); });
    break;
  default:
    console.log('P.J.K. ↔ IcyOS Bridge');
    console.log();
    console.log('Commands:');
    console.log('  status    Pull workspace overview from IcyOS');
    console.log('  sync      Push NEXT_ACTIONS.md to IcyOS as missions');
    console.log('  complete  Mark an IcyOS step as done');
    console.log();
    console.log('Env: ICYOS_TOKEN (required), ICYOS_URL (default localhost:3000)');
}
