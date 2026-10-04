import type { SupabaseClient } from '@supabase/supabase-js';
import { loadWorkspaceOverview } from '../workspace/overview';
import type { PlannerMission, SessionSample } from './planner';
import type { DayStats, FocusSession, PlanBlock, SavedPlan, SavedReview } from './types';

// Server-only reads for Timeline, Focus and Review. Every query runs as the
// caller, so RLS (migrations 17, 18 and 25) limits it to their own rows.

const SESSION_COLUMNS = 'id, mission_id, started_at, paused_at, paused_seconds, ended_at, planned_minutes, focus_seconds, outcome';

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`${what} failed: ${error?.message ?? 'no data'}`);
}

export function toSession(row: any): FocusSession {
  return {
    id: row.id,
    missionId: row.mission_id ?? null,
    startedAt: row.started_at,
    pausedAt: row.paused_at ?? null,
    pausedSeconds: row.paused_seconds ?? 0,
    endedAt: row.ended_at ?? null,
    plannedMinutes: row.planned_minutes ?? null,
    focusSeconds: row.focus_seconds ?? null,
    outcome: row.outcome ?? null,
  };
}

/** Open and finished missions with what the planner needs, in dashboard order. */
export async function loadPlannerMissions(db: SupabaseClient): Promise<PlannerMission[]> {
  const overview = await loadWorkspaceOverview(db);
  return overview.projects.flatMap((p) =>
    p.missions.map((m) => ({
      id: m.id,
      name: m.name,
      projectName: p.name,
      priority: p.priority,
      status: m.status,
      estimatedMinutes: m.estimatedMinutes,
      stepsLeft: m.steps.length - m.stepsDone,
      stepsTotal: m.steps.length,
    }))
  );
}

export async function loadPlan(db: SupabaseClient, date: string): Promise<SavedPlan | null> {
  const { data, error } = await db
    .from('timelines')
    .select('plan_date, approved_at, timeline_blocks ( kind, mission_id, title, start_time, end_time, position )')
    .eq('plan_date', date)
    .maybeSingle();
  if (error) fail('Loading the plan', error);
  if (!data) return null;
  const blocks: PlanBlock[] = [...((data as any).timeline_blocks ?? [])]
    .sort((a: any, b: any) => a.position - b.position)
    .map((b: any) => ({
      kind: b.kind,
      missionId: b.mission_id ?? null,
      title: b.title ?? (b.kind === 'break' ? 'Break' : b.kind === 'buffer' ? 'Buffer' : 'Mission'),
      start: b.start_time,
      end: b.end_time,
    }));
  return { date: (data as any).plan_date, approvedAt: (data as any).approved_at ?? null, blocks };
}

export async function loadActiveSession(db: SupabaseClient): Promise<FocusSession | null> {
  const { data, error } = await db
    .from('sessions')
    .select(SESSION_COLUMNS)
    .not('started_at', 'is', null)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) fail('Loading the focus session', error);
  return data ? toSession(data) : null;
}

/** Sessions started since a moment, newest first (at most 500). */
export async function loadSessionsSince(db: SupabaseClient, since: string): Promise<(FocusSession & SessionSample)[]> {
  const { data, error } = await db
    .from('sessions')
    .select(SESSION_COLUMNS)
    .gte('started_at', since)
    .order('started_at', { ascending: false })
    .limit(500);
  if (error) fail('Loading focus sessions', error);
  return (data ?? []).map(toSession);
}

/** What happened in a window: ticked steps, focus time, and how much of the plan got worked on. */
export async function loadDayStats(db: SupabaseClient, window: { start: string; end: string }, plan: SavedPlan | null): Promise<DayStats> {
  const [steps, sessions] = await Promise.all([
    db
      .from('actions')
      .select('command, completed_at, mission_id, missions ( name )')
      .gte('completed_at', window.start)
      .lt('completed_at', window.end)
      .order('completed_at', { ascending: true })
      .limit(500),
    db
      .from('sessions')
      .select('mission_id, focus_seconds, started_at')
      .gte('started_at', window.start)
      .lt('started_at', window.end)
      .limit(500),
  ]);
  if (steps.error) fail('Loading ticked steps', steps.error);
  if (sessions.error) fail('Loading focus sessions', sessions.error);

  const stepRows = (steps.data ?? []) as any[];
  const sessionRows = (sessions.data ?? []) as any[];
  const planned = new Set((plan?.blocks ?? []).filter((b) => b.kind === 'mission' && b.missionId).map((b) => b.missionId!));
  const worked = new Set([...stepRows.map((s) => s.mission_id), ...sessionRows.map((s) => s.mission_id)].filter(Boolean));

  return {
    stepsDone: stepRows.map((s) => ({ command: s.command, missionName: s.missions?.name ?? '', completedAt: s.completed_at })),
    focusSessions: sessionRows.length,
    focusMinutes: Math.round(sessionRows.reduce((n, s) => n + (s.focus_seconds ?? 0), 0) / 60),
    plannedMissions: planned.size,
    plannedMissionsWorked: [...planned].filter((id) => worked.has(id)).length,
  };
}

export async function loadReview(db: SupabaseClient, date: string): Promise<SavedReview | null> {
  const { data, error } = await db
    .from('reviews')
    .select('review_date, score, went_well, got_in_way, next_time')
    .eq('review_date', date)
    .maybeSingle();
  if (error) fail('Loading the review', error);
  if (!data) return null;
  const r = data as any;
  return { date: r.review_date, score: r.score, wentWell: r.went_well, gotInWay: r.got_in_way, nextTime: r.next_time };
}
