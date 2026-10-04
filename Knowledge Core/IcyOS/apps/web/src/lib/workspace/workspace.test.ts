import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { shapeOverview, type WorkspaceRow } from './overview';

const getUser = vi.fn();
const rpc = vi.fn();
const query = vi.fn();
const select = vi.fn();
vi.mock('../auth/supabase-server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser },
    rpc,
    from: () => ({ select: (cols: string) => { select(cols); return { order: () => ({ limit: () => ({ maybeSingle: query }) }) }; } }),
  }),
}));

const { GET: getWorkspace } = await import('../../app/api/workspace/route');
const GET = () => getWorkspace(new NextRequest('http://localhost/api/workspace'));
const { POST } = await import('../../app/api/actions/complete/route');

const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const T = (minute: number) => `2026-10-04T12:${String(minute).padStart(2, '0')}:00Z`;

function row(): WorkspaceRow {
  return {
    id: ID(1), name: 'Acme', created_at: T(0),
    projects: [
      { id: ID(2), name: 'Someday', priority: 'P3', created_at: T(1), sprints: [] },
      {
        id: ID(3), name: 'Launch', priority: 'P1', created_at: T(2),
        sprints: [{
          id: ID(4), sprint_name: 'Sprint 1', created_at: T(2),
          missions: [
            { id: ID(6), name: 'Second', status: 'Completed', created_at: T(4), actions: null },
            {
              id: ID(5), name: 'First', status: 'Running', created_at: T(3),
              actions: [
                { id: ID(9), command: 'third', position: 3, completed_at: null, created_at: T(3) },
                { id: ID(7), command: 'first', position: 1, completed_at: T(5), created_at: T(3) },
                { id: ID(8), command: 'second', position: 2, completed_at: null, created_at: T(3) },
              ],
            },
          ],
        }],
      },
    ],
  };
}

describe('shapeOverview', () => {
  it('orders projects by priority, missions by age and steps by position', () => {
    const view = shapeOverview(row());

    expect(view.workspace).toEqual({ id: ID(1), name: 'Acme' });
    expect(view.projects.map((p) => p.name)).toEqual(['Launch', 'Someday']);
    expect(view.projects[0].missions.map((m) => m.name)).toEqual(['First', 'Second']);
    expect(view.projects[0].missions[0]).toMatchObject({ sprintName: 'Sprint 1', stepsDone: 1 });
    expect(view.projects[0].missions[0].steps.map((s) => s.command)).toEqual(['first', 'second', 'third']);
    expect(view.projects[1].missions).toEqual([]);
    expect(view.totals).toEqual({ projects: 2, missions: 2, activeMissions: 1, stepsDone: 1, steps: 3 });
  });

  it('handles a user with no workspace and an unnamed workspace', () => {
    expect(shapeOverview(null)).toEqual({
      workspace: null,
      projects: [],
      totals: { projects: 0, missions: 0, activeMissions: 0, stepsDone: 0, steps: 0 },
    });
    expect(shapeOverview({ id: ID(1), name: null, created_at: T(0), projects: null }).workspace?.name).toBe('My workspace');
  });
});

describe('GET /api/workspace', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'auth-1' } } });
    query.mockReset().mockResolvedValue({ data: row(), error: null });
    select.mockReset();
  });

  it('returns the signed-in user’s workspace read through RLS in one query', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.totals.steps).toBe(3);
    expect(select).toHaveBeenCalledTimes(1);
    expect(select.mock.calls[0][0]).toMatch(/actions \( id, command, position, completed_at/);
  });

  it('returns 401 when signed out and a generic 500 when the query fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    query.mockResolvedValue({ data: null, error: { message: 'column actions.position does not exist' } });
    const failed = await GET();
    expect(failed.status).toBe(500);
    expect((await failed.json()).error.message).not.toContain('position');

    getUser.mockResolvedValue({ data: { user: null } });
    expect((await GET()).status).toBe(401);
  });
});

describe('POST /api/actions/complete', () => {
  const post = (body: unknown) =>
    new NextRequest('http://localhost/api/actions/complete', { method: 'POST', body: JSON.stringify(body) });

  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'auth-1' } } });
    rpc.mockReset().mockResolvedValue({
      data: { action_id: ID(7), completed_at: T(9), mission_id: ID(5), mission_status: 'Running', steps_done: 2, steps_total: 3 },
      error: null,
    });
  });

  it('ticks a step through set_action_completed and returns the mission status', async () => {
    const response = await POST(post({ actionId: ID(7), completed: true }));

    expect(response.status).toBe(200);
    expect((await response.json()).data.mission_status).toBe('Running');
    expect(rpc).toHaveBeenCalledWith('set_action_completed', { action_id: ID(7), completed: true });
  });

  it('returns 404 for a step the user does not own', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'P0002', message: 'action not found' } });
    expect((await POST(post({ actionId: ID(7), completed: true }))).status).toBe(404);
  });

  it('rejects bad input and signed-out users without calling the database', async () => {
    expect((await POST(post({ actionId: 'not-a-uuid', completed: true }))).status).toBe(400);
    expect((await POST(post({ actionId: ID(7), completed: 'yes' }))).status).toBe(400);

    getUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(post({ actionId: ID(7), completed: true }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('hides other database errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    rpc.mockResolvedValue({ data: null, error: { code: '42883', message: 'function set_action_completed does not exist' } });
    const response = await POST(post({ actionId: ID(7), completed: false }));
    expect(response.status).toBe(500);
    expect((await response.json()).error.message).not.toContain('set_action_completed');
  });
});
