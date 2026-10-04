import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { blockMinutes, bufferMinutes, computeInsights, dropBlock, planDay, type PlannerMission, type SessionSample } from './planner';
import { elapsedSeconds, focusActionSchema, saveSchema, windowSchema, type PlanBlock } from './types';
import { addDays, dayWindow, formatTimer, localDate, workWindow } from './local';
import { acceptsApiToken } from '../auth/token-routes';
import { resolveTier } from '../api/rate-limit';

// A fake Supabase client: every table query resolves to what `tables` holds,
// whatever filters are chained on; RPCs go to `rpc`.
const { getUser, rpc, tables, queries } = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  tables: {} as Record<string, { data: unknown; error: unknown }>,
  queries: [] as { table: string; calls: [string, unknown[]][] }[],
}));
vi.mock('../auth/supabase-server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser },
    rpc,
    from(table: string) {
      const q = { table, calls: [] as [string, unknown[]][] };
      queries.push(q);
      const result = () => tables[table] ?? { data: [], error: null };
      const chain: any = new Proxy(
        {},
        {
          get(_t, prop: string) {
            if (prop === 'then') return (ok: any, bad: any) => Promise.resolve(result()).then(ok, bad);
            if (prop === 'maybeSingle') return () => Promise.resolve(tables[table] ?? { data: null, error: null });
            return (...args: unknown[]) => {
              q.calls.push([prop, args]);
              return chain;
            };
          },
        }
      );
      return chain;
    },
  }),
}));

const timelineRoute = await import('../../app/api/timeline/route');
const proposeRoute = await import('../../app/api/timeline/propose/route');
const saveRoute = await import('../../app/api/timeline/save/route');
const focusRoute = await import('../../app/api/focus/route');
const startRoute = await import('../../app/api/focus/start/route');
const actionRoute = await import('../../app/api/focus/[id]/route');
const reviewRoute = await import('../../app/api/review/route');

const START = '2026-10-04T09:00:00.000Z';
const at = (minutes: number) => new Date(Date.parse(START) + minutes * 60_000).toISOString();
const mission = (over: Partial<PlannerMission> & { id: string }): PlannerMission => ({
  name: over.id,
  projectName: 'Launch',
  priority: 'P2',
  status: 'Staged',
  estimatedMinutes: null,
  stepsLeft: 1,
  stepsTotal: 1,
  ...over,
});
const USUAL = { bufferScale: 1, message: 'usual' };
const summary = (blocks: PlanBlock[]) => blocks.map((b) => `${b.kind}:${b.missionId ?? ''}:${(Date.parse(b.end) - Date.parse(b.start)) / 60_000}`);

describe('planning a day', () => {
  it('sizes blocks and buffers within their limits', () => {
    expect([blockMinutes({ estimatedMinutes: null }), blockMinutes({ estimatedMinutes: 3 }), blockMinutes({ estimatedMinutes: 47 }), blockMinutes({ estimatedMinutes: 600 })]).toEqual([30, 10, 45, 240]);
    expect([bufferMinutes(30, 1), bufferMinutes(60, 1), bufferMinutes(60, 2), bufferMinutes(240, 2)]).toEqual([5, 10, 25, 45]);
  });

  it('puts running missions first, then by priority, with buffers and a break after 90 minutes', () => {
    const plan = planDay(
      [
        mission({ id: 'p3', priority: 'P3' }),
        mission({ id: 'p1a', priority: 'P1', estimatedMinutes: 60 }),
        mission({ id: 'run', status: 'Running', estimatedMinutes: 45 }),
        mission({ id: 'done', status: 'Completed' }),
        mission({ id: 'ticked', stepsLeft: 0, stepsTotal: 2 }),
        mission({ id: 'p1b', priority: 'P1' }),
      ],
      { start: START, end: at(8 * 60) },
      USUAL
    );
    expect(summary(plan.blocks)).toEqual([
      'mission:run:45', 'buffer::10',
      'mission:p1a:60', 'buffer::10',
      'break::15',
      'mission:p1b:30', 'buffer::5',
      'mission:p3:30',
    ]);
    expect(plan.blocks[0].start).toBe(START);
    expect(plan.unscheduled).toEqual([]);
    expect(plan.reason).toBe('usual');
  });

  it('lists missions that do not fit and explains an empty plan', () => {
    const plan = planDay([mission({ id: 'a', estimatedMinutes: 50 }), mission({ id: 'b', estimatedMinutes: 30 })], { start: START, end: at(60) }, USUAL);
    expect(summary(plan.blocks)).toEqual(['mission:a:50']);
    expect(plan.unscheduled).toEqual([{ missionId: 'b', title: 'b', minutes: 30 }]);

    expect(planDay([], { start: START, end: at(60) }, USUAL).reason).toMatch(/No open missions/);
    expect(planDay([mission({ id: 'big', estimatedMinutes: 240 })], { start: START, end: at(60) }, USUAL).reason).toMatch(/fit/);
  });

  it('grows buffers when habits say so', () => {
    const plan = planDay([mission({ id: 'a', estimatedMinutes: 60 }), mission({ id: 'b' })], { start: START, end: at(300) }, { bufferScale: 2, message: 'longer' });
    expect(summary(plan.blocks)).toEqual(['mission:a:60', 'buffer::25', 'mission:b:30']);
  });

  it('drops a mission with its buffer, moving later blocks up and never leaving a dangling buffer or break', () => {
    const blocks = planDay([mission({ id: 'a', estimatedMinutes: 90 }), mission({ id: 'b' }), mission({ id: 'c' })], { start: START, end: at(400) }, USUAL).blocks;
    expect(summary(blocks)).toEqual(['mission:a:90', 'buffer::20', 'break::15', 'mission:b:30', 'buffer::5', 'mission:c:30']);
    expect(summary(dropBlock(blocks, 3))).toEqual(['mission:a:90', 'buffer::20', 'break::15', 'mission:c:30']);
    expect(summary(dropBlock(blocks, 5))).toEqual(['mission:a:90', 'buffer::20', 'break::15', 'mission:b:30']);
    const first = dropBlock(blocks, 0);
    expect(summary(first)).toEqual(['mission:b:30', 'buffer::5', 'mission:c:30']);
    expect([first[0].start, first[2].end]).toEqual([START, at(65)]);
    expect(dropBlock(blocks, 3)[3].start).toBe(blocks[3].start);
    expect(dropBlock(blocks, 1)).toBe(blocks);
  });
});

describe('learning from focus sessions', () => {
  const NOW = Date.parse('2026-10-04T20:00:00Z');
  const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();
  const s = (d: number, planned: number | null, minutes: number | null, outcome: SessionSample['outcome'] = 'done'): SessionSample => ({
    startedAt: daysAgo(d),
    plannedMinutes: planned,
    focusSeconds: minutes === null ? null : minutes * 60,
    outcome,
  });

  it('keeps usual buffers until there are three finished, planned sessions', () => {
    const i = computeInsights([s(1, 30, 60), s(2, 30, 60), s(3, null, 60), s(4, 30, 60, 'stopped'), s(5, 30, null, null)], NOW);
    expect(i).toMatchObject({ samples: 2, ratio: null, bufferScale: 1, sessionsLast7Days: 4, focusMinutesLast7Days: 240 });
  });

  it('grows buffers by how far sessions run over, up to double, and never shrinks them', () => {
    const over = computeInsights([s(1, 30, 45), s(2, 60, 90), s(3, 20, 30)], NOW);
    expect(over).toMatchObject({ samples: 3, ratio: 1.5, bufferScale: 1.5 });
    expect(over.message).toMatch(/50% over plan.*50% longer/);

    expect(computeInsights([s(1, 10, 60), s(2, 10, 60), s(3, 10, 60)], NOW).bufferScale).toBe(2);

    const fast = computeInsights([s(1, 60, 30), s(2, 60, 30), s(3, 60, 30)], NOW);
    expect(fast).toMatchObject({ ratio: 0.5, bufferScale: 1 });
    expect(fast.message).toMatch(/50% faster/);
  });

  it('ignores sessions older than 14 days', () => {
    expect(computeInsights([s(15, 30, 60), s(16, 30, 60), s(20, 30, 60)], NOW)).toMatchObject({ samples: 0, sessionsLast7Days: 0 });
  });

  it('counts focus time without pauses', () => {
    const base = { startedAt: '2026-10-04T09:00:00Z', pausedSeconds: 120, endedAt: null, focusSeconds: null };
    expect(elapsedSeconds({ ...base, pausedAt: null }, Date.parse('2026-10-04T09:10:00Z'))).toBe(480);
    expect(elapsedSeconds({ ...base, pausedAt: '2026-10-04T09:05:00Z' }, Date.parse('2026-10-04T09:30:00Z'))).toBe(180);
    expect(elapsedSeconds({ ...base, pausedAt: null, endedAt: '2026-10-04T10:00:00Z', focusSeconds: 999 })).toBe(999);
  });
});

describe('local dates', () => {
  it('turns local dates and clock times into instants', () => {
    expect(localDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    const day = dayWindow('2026-10-04');
    expect(Date.parse(day.start)).toBe(new Date(2026, 9, 4).getTime());
    expect(Date.parse(day.end)).toBe(new Date(2026, 9, 5).getTime());
    expect([formatTimer(75), formatTimer(3725), formatTimer(-3)]).toEqual(['1:15', '1:02:05', '0:00']);
  });

  it('starts today\'s window from now, rounded up to 5 minutes, and refuses one already over', () => {
    const now = new Date(2026, 9, 4, 13, 2);
    expect(workWindow('2026-10-04', '09:00', '17:00', now)).toEqual({ start: new Date(2026, 9, 4, 13, 5).toISOString(), end: new Date(2026, 9, 4, 17, 0).toISOString() });
    expect(workWindow('2026-10-05', '09:00', '17:00', now)!.start).toBe(new Date(2026, 9, 5, 9, 0).toISOString());
    expect(workWindow('2026-10-04', '09:00', '13:10', now)).toBeNull();
    expect(workWindow('2026-10-05', '17:00', '09:00', now)).toBeNull();
  });
});

describe('day planning routes', () => {
  const MISSION = '00000000-0000-4000-8000-0000000000a1';
  const SESSION = '00000000-0000-4000-8000-0000000000b1';
  const post = (url: string, body: unknown) => new NextRequest(`http://localhost${url}`, { method: 'POST', body: JSON.stringify(body) });
  const get = (url: string) => new NextRequest(`http://localhost${url}`);
  const sessionRow = { id: SESSION, mission_id: MISSION, started_at: START, paused_at: null, paused_seconds: 0, ended_at: null, planned_minutes: 30, focus_seconds: null, outcome: null };
  const workspace = {
    id: 'w1',
    name: 'Mine',
    created_at: START,
    projects: [
      {
        id: 'p1', name: 'Launch', priority: 'P1', created_at: START,
        sprints: [{ id: 's1', sprint_name: 'Sprint 1', created_at: START, missions: [
          { id: MISSION, name: 'Write copy', status: 'Staged', estimated_minutes: 45, created_at: START, actions: [{ id: 'a1', command: 'Draft', position: 0, completed_at: null, created_at: START }] },
        ] }],
      },
    ],
  };

  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'auth-1' } } });
    rpc.mockReset();
    queries.length = 0;
    for (const k of Object.keys(tables)) delete tables[k];
  });

  it('refuses signed-out callers and bad query strings', async () => {
    expect((await timelineRoute.GET(get('/api/timeline?date=today'))).status).toBe(400);
    expect((await reviewRoute.GET(get('/api/review?date=2026-10-04'))).status).toBe(400);
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await timelineRoute.GET(get('/api/timeline?date=2026-10-04'))).status).toBe(401);
    expect((await focusRoute.GET(get('/api/focus'))).status).toBe(401);
  });

  it('returns the saved plan with blocks in order, or null', async () => {
    expect((await (await timelineRoute.GET(get('/api/timeline?date=2026-10-04'))).json()).data).toEqual({ plan: null });
    tables.timelines = {
      data: {
        plan_date: '2026-10-04', approved_at: START,
        timeline_blocks: [
          { kind: 'buffer', mission_id: null, title: null, start_time: at(45), end_time: at(55), position: 1 },
          { kind: 'mission', mission_id: MISSION, title: 'Write copy', start_time: START, end_time: at(45), position: 0 },
        ],
      },
      error: null,
    };
    const { plan } = (await (await timelineRoute.GET(get('/api/timeline?date=2026-10-04'))).json()).data;
    expect(plan.blocks.map((b: PlanBlock) => b.title)).toEqual(['Write copy', 'Buffer']);
    expect(queries[queries.length - 1].calls).toContainEqual(['eq', ['plan_date', '2026-10-04']]);
  });

  it('proposes a plan from the caller\'s missions without saving', async () => {
    tables.workspaces = { data: workspace, error: null };
    const res = await proposeRoute.POST(post('/api/timeline/propose', { date: '2026-10-04', start: START, end: at(240) }));
    expect(res.status).toBe(200);
    const plan = (await res.json()).data;
    expect(summary(plan.blocks)).toEqual([`mission:${MISSION}:45`]);
    expect(rpc).not.toHaveBeenCalled();
    expect((await proposeRoute.POST(post('/api/timeline/propose', { date: '2026-10-04', start: at(60), end: START }))).status).toBe(400);
  });

  it('saves a plan through save_day_plan and maps its errors', async () => {
    const blocks = [{ kind: 'mission', missionId: MISSION, title: 'Write copy', start: START, end: at(45) }];
    rpc.mockResolvedValueOnce({ data: { plan_date: '2026-10-04', blocks: 1 }, error: null });
    expect((await saveRoute.POST(post('/api/timeline/save', { date: '2026-10-04', blocks }))).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('save_day_plan', {
      plan_date: '2026-10-04',
      blocks: [{ kind: 'mission', mission_id: MISSION, title: 'Write copy', start: START, end: at(45) }],
    });

    rpc.mockResolvedValueOnce({ data: null, error: { code: 'P0002', message: 'mission not found' } });
    expect((await saveRoute.POST(post('/api/timeline/save', { date: '2026-10-04', blocks }))).status).toBe(404);
    rpc.mockResolvedValueOnce({ data: null, error: { code: '22023', message: 'blocks must be in order and not overlap' } });
    const bad = await saveRoute.POST(post('/api/timeline/save', { date: '2026-10-04', blocks }));
    expect([bad.status, (await bad.json()).error.message]).toEqual([400, 'blocks must be in order and not overlap']);

    expect(saveSchema.safeParse({ date: '2026-10-04', blocks: [] }).success).toBe(false);
  });

  it('starts, pauses and finishes focus sessions', async () => {
    rpc.mockResolvedValueOnce({ data: sessionRow, error: null });
    const started = await startRoute.POST(post('/api/focus/start', { missionId: MISSION, plannedMinutes: 30 }));
    expect(started.status).toBe(201);
    expect((await started.json()).data).toMatchObject({ id: SESSION, missionId: MISSION, plannedMinutes: 30, pausedSeconds: 0 });
    expect(rpc).toHaveBeenLastCalledWith('start_focus', { target_mission_id: MISSION, planned_minutes: 30 });

    const params = Promise.resolve({ id: SESSION });
    rpc.mockResolvedValueOnce({ data: { ...sessionRow, paused_at: at(10) }, error: null });
    expect((await (await actionRoute.POST(post(`/api/focus/${SESSION}`, { action: 'pause' }), { params })).json()).data.pausedAt).toBe(at(10));
    expect(rpc).toHaveBeenLastCalledWith('pause_focus', { target_session_id: SESSION });

    rpc.mockResolvedValueOnce({ data: { ...sessionRow, ended_at: at(40), focus_seconds: 2100, outcome: 'done' }, error: null });
    const done = await actionRoute.POST(post(`/api/focus/${SESSION}`, { action: 'finish', outcome: 'done' }), { params: Promise.resolve({ id: SESSION }) });
    expect((await done.json()).data).toMatchObject({ outcome: 'done', focusSeconds: 2100 });
    expect(rpc).toHaveBeenLastCalledWith('finish_focus', { target_session_id: SESSION, outcome: 'done' });

    expect((await actionRoute.POST(post('/api/focus/nope', { action: 'pause' }), { params: Promise.resolve({ id: 'nope' }) })).status).toBe(404);
    expect(focusActionSchema.safeParse({ action: 'finish' }).success).toBe(false);
  });

  it('shows the active session and the next planned mission', async () => {
    tables.sessions = { data: sessionRow, error: null };
    tables.workspaces = { data: workspace, error: null };
    tables.timelines = {
      data: { plan_date: '2026-10-04', approved_at: START, timeline_blocks: [{ kind: 'mission', mission_id: MISSION, title: 'Write copy', start_time: START, end_time: '2999-01-01T00:00:00Z', position: 0 }] },
      error: null,
    };
    const body = (await (await focusRoute.GET(get('/api/focus?date=2026-10-04'))).json()).data;
    expect(body.active).toMatchObject({ id: SESSION });
    expect(body.missions).toEqual([{ id: MISSION, name: 'Write copy', projectName: 'Launch', estimatedMinutes: 45 }]);
    expect(body.nextPlannedMissionId).toBe(MISSION);
  });

  it('reviews a day and saves the reflection', async () => {
    tables.actions = { data: [{ command: 'Draft', completed_at: at(20), mission_id: MISSION, missions: { name: 'Write copy' } }], error: null };
    tables.sessions = { data: [{ mission_id: MISSION, focus_seconds: 1800, started_at: START }], error: null };
    const window = dayWindow('2026-10-04');
    const res = await reviewRoute.GET(get(`/api/review?date=2026-10-04&start=${encodeURIComponent(window.start)}&end=${encodeURIComponent(window.end)}`));
    const day = (await res.json()).data;
    expect(day.stats).toMatchObject({ stepsDone: [{ command: 'Draft', missionName: 'Write copy', completedAt: at(20) }], focusSessions: 1, focusMinutes: 30 });
    expect(day.review).toBeNull();

    rpc.mockResolvedValueOnce({ data: { review_date: '2026-10-04' }, error: null });
    expect((await reviewRoute.POST(post('/api/review', { date: '2026-10-04', score: 7, wentWell: ' shipped ', gotInWay: '' }))).status).toBe(200);
    expect(rpc).toHaveBeenLastCalledWith('save_review', { review_date: '2026-10-04', score: 7, went_well: 'shipped', got_in_way: null, next_time: null });
    expect((await reviewRoute.POST(post('/api/review', { date: '2026-10-04', score: 11 }))).status).toBe(400);
  });

  it('lets personal access tokens use the day routes, rate limited as reads and writes', () => {
    for (const p of ['/api/timeline', '/api/timeline/propose', '/api/timeline/save', '/api/focus', '/api/focus/start', `/api/focus/${SESSION}`, '/api/review']) {
      expect(acceptsApiToken(p), p).toBe(true);
    }
    expect(acceptsApiToken('/api/focus/not-a-uuid')).toBe(false);
    expect(resolveTier('/api/timeline/propose', 'POST')).toBe('write');
    expect(resolveTier('/api/review', 'GET')).toBe('read');
    expect(windowSchema.safeParse({ start: START, end: at(49 * 60) }).success).toBe(false);
  });
});
