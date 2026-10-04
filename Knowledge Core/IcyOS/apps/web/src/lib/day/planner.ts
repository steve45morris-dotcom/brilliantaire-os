import type { Insights, PlanBlock, ProposedPlan, UnscheduledMission } from './types';

// The day planner and the habits behind it. Pure, so both are tested directly.
// This is the "timeline with buffers that adapt to how you actually work"
// from P.J.K.'s old copy of IcyOS, rebuilt on IcyOS's real missions and focus
// sessions.

export interface PlannerMission {
  id: string;
  name: string;
  projectName: string;
  priority: 'P1' | 'P2' | 'P3';
  status: string;
  estimatedMinutes: number | null;
  stepsLeft: number;
  stepsTotal: number;
}

export const DEFAULT_MINUTES = 30;
const BREAK_EVERY = 90;
const BREAK_MINUTES = 15;
const ACTIVE = new Set(['Staged', 'Approved', 'Running']);
const PRIORITY = { P1: 0, P2: 1, P3: 2 } as const;

const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const iso = (ms: number) => new Date(ms).toISOString();

/** How long a mission block is: its estimate, or 30 minutes, in 5-minute steps from 10 minutes to 4 hours. */
export function blockMinutes(m: Pick<PlannerMission, 'estimatedMinutes'>): number {
  return clamp(round5(m.estimatedMinutes ?? DEFAULT_MINUTES), 10, 240);
}

/** The buffer after a mission: a fifth of its length, scaled by habits, 5 to 45 minutes. */
export function bufferMinutes(missionMinutes: number, bufferScale: number): number {
  return clamp(round5(missionMinutes * 0.2 * bufferScale), 5, 45);
}

/**
 * Lays open missions into the window: missions in progress first, then by
 * project priority, keeping their order otherwise. A buffer follows each
 * mission and a 15-minute break comes after every 90 minutes of focus.
 * Missions that don't fit are listed, not dropped.
 */
export function planDay(missions: PlannerMission[], window: { start: string; end: string }, insights: Pick<Insights, 'bufferScale' | 'message'>): ProposedPlan {
  const start = Date.parse(window.start);
  const end = Date.parse(window.end);
  const open = missions
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => ACTIVE.has(m.status) && (m.stepsTotal === 0 || m.stepsLeft > 0))
    .sort((a, b) =>
      Number(b.m.status === 'Running') - Number(a.m.status === 'Running') ||
      PRIORITY[a.m.priority] - PRIORITY[b.m.priority] ||
      a.i - b.i
    )
    .map(({ m }) => m);

  const blocks: PlanBlock[] = [];
  const unscheduled: UnscheduledMission[] = [];
  let cursor = start;
  let sinceBreak = 0;

  for (const m of open) {
    const minutes = blockMinutes(m);
    if (sinceBreak >= BREAK_EVERY && cursor + (BREAK_MINUTES + minutes) * 60_000 <= end) {
      blocks.push({ kind: 'break', missionId: null, title: 'Break', start: iso(cursor), end: iso(cursor + BREAK_MINUTES * 60_000) });
      cursor += BREAK_MINUTES * 60_000;
      sinceBreak = 0;
    }
    if (cursor + minutes * 60_000 > end) {
      unscheduled.push({ missionId: m.id, title: m.name, minutes });
      continue;
    }
    blocks.push({ kind: 'mission', missionId: m.id, title: m.name, start: iso(cursor), end: iso(cursor + minutes * 60_000) });
    cursor += minutes * 60_000;
    sinceBreak += minutes;

    const buffer = bufferMinutes(minutes, insights.bufferScale);
    if (cursor + buffer * 60_000 <= end) {
      blocks.push({ kind: 'buffer', missionId: null, title: 'Buffer', start: iso(cursor), end: iso(cursor + buffer * 60_000) });
      cursor += buffer * 60_000;
    }
  }
  while (blocks.length && blocks[blocks.length - 1].kind !== 'mission') blocks.pop();

  const reason = !open.length
    ? 'No open missions to plan. Add some on the dashboard or in the Inbox.'
    : !blocks.length
      ? 'None of your open missions fit in that time.'
      : insights.message;
  return { blocks, unscheduled, bufferScale: insights.bufferScale, reason };
}

export interface SessionSample {
  startedAt: string;
  plannedMinutes: number | null;
  focusSeconds: number | null;
  outcome: 'done' | 'stopped' | null;
}

/**
 * What recent focus sessions say about estimates. With at least three
 * finished sessions that had a plan in the last 14 days, buffers grow by how
 * far sessions run over (up to double), and never shrink below the usual size.
 */
export function computeInsights(sessions: SessionSample[], now = Date.now()): Insights {
  const since14 = now - 14 * 86_400_000;
  const since7 = now - 7 * 86_400_000;
  const finished = sessions.filter((s) => s.focusSeconds !== null && Date.parse(s.startedAt) >= since14);
  const samples = finished.filter((s) => s.outcome === 'done' && s.plannedMinutes && s.focusSeconds! > 0);
  const recent = finished.filter((s) => Date.parse(s.startedAt) >= since7);
  const focusMinutesLast7Days = Math.round(recent.reduce((n, s) => n + (s.focusSeconds ?? 0), 0) / 60);

  let ratio: number | null = null;
  let bufferScale = 1;
  let message = 'Buffers are the usual size. Finish a few focus sessions and IcyOS will tune them to how you work.';
  if (samples.length >= 3) {
    ratio = samples.reduce((n, s) => n + s.focusSeconds! / 60 / s.plannedMinutes!, 0) / samples.length;
    ratio = Math.round(ratio * 100) / 100;
    bufferScale = clamp(ratio, 1, 2);
    const pct = Math.round((ratio - 1) * 100);
    message =
      pct >= 10
        ? `Your focus sessions ran ${pct}% over plan lately, so buffers are ${Math.round((bufferScale - 1) * 100)}% longer.`
        : pct <= -10
          ? `You've been finishing ${-pct}% faster than planned. Buffers stay the usual size.`
          : 'Your estimates have been on target, so buffers are the usual size.';
  }
  return { samples: samples.length, ratio, bufferScale, message, focusMinutesLast7Days, sessionsLast7Days: recent.length };
}

/**
 * A proposed plan without one mission block and the buffer right after it.
 * Later blocks move up to close the gap.
 */
export function dropBlock(blocks: PlanBlock[], index: number): PlanBlock[] {
  if (blocks[index]?.kind !== 'mission') return blocks;
  const count = blocks[index + 1]?.kind === 'buffer' ? 2 : 1;
  const after = blocks.slice(index + count);
  // A break no longer needed at the start, or right after another break, goes too.
  while (after[0]?.kind === 'break' && (index === 0 || blocks[index - 1].kind === 'break')) after.shift();
  const shift = after.length ? Date.parse(after[0].start) - Date.parse(blocks[index].start) : 0;
  const move = (iso: string) => new Date(Date.parse(iso) - shift).toISOString();
  const out = [...blocks.slice(0, index), ...after.map((b) => ({ ...b, start: move(b.start), end: move(b.end) }))];
  while (out.length && out[out.length - 1].kind !== 'mission') out.pop();
  return out;
}
