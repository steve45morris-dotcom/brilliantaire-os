import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMissionSchema, updateProjectSchema } from './manage';
import { parseSteps } from '../../components/dashboard/forms';

const getUser = vi.fn();
const rpc = vi.fn();
vi.mock('../auth/supabase-server', () => ({
  createServerSupabaseClient: async () => ({ auth: { getUser }, rpc }),
}));

const projects = await import('../../app/api/projects/route');
const project = await import('../../app/api/projects/[id]/route');
const projectMissions = await import('../../app/api/projects/[id]/missions/route');
const mission = await import('../../app/api/missions/[id]/route');
const missionSteps = await import('../../app/api/missions/[id]/steps/route');
const step = await import('../../app/api/actions/[id]/route');

const ID = '00000000-0000-4000-8000-000000000001';
const ctx = (id = ID) => ({ params: Promise.resolve({ id }) });
const req = (method: string, body?: unknown) =>
  new NextRequest('http://localhost/api/x', { method, body: body === undefined ? undefined : JSON.stringify(body) });

beforeEach(() => {
  getUser.mockReset().mockResolvedValue({ data: { user: { id: 'auth-1' } } });
  rpc.mockReset().mockResolvedValue({ data: { ok: true }, error: null });
});

describe('input validation', () => {
  it('trims mission names and steps, and caps steps at 50', () => {
    expect(createMissionSchema.parse({ name: ' Ep 1 ', steps: [' Outline ', 'Record'] })).toEqual({
      name: 'Ep 1',
      steps: ['Outline', 'Record'],
    });
    expect(createMissionSchema.parse({ name: 'Ep 1' }).steps).toEqual([]);
    expect(createMissionSchema.safeParse({ name: 'Ep 1', steps: ['ok', '  '] }).success).toBe(false);
    expect(createMissionSchema.safeParse({ name: 'Ep 1', steps: Array(51).fill('x') }).success).toBe(false);
  });

  it('requires at least one field when updating a project', () => {
    expect(updateProjectSchema.safeParse({}).success).toBe(false);
    expect(updateProjectSchema.safeParse({ priority: 'P0' }).success).toBe(false);
    expect(updateProjectSchema.safeParse({ priority: 'P1' }).success).toBe(true);
  });

  it('turns the steps box into one step per non-blank line', () => {
    expect(parseSteps('  Outline \n\n Book guest\n   \nRecord')).toEqual(['Outline', 'Book guest', 'Record']);
  });
});

describe('routes call the matching database function', () => {
  it.each([
    ['create project', () => projects.POST(req('POST', { name: ' Podcast ', priority: 'P1' })), 201,
      'create_project', { project_name: 'Podcast', project_priority: 'P1' }],
    ['rename project', () => project.PATCH(req('PATCH', { name: 'Podcast S2' }), ctx()), 200,
      'update_project', { target_project_id: ID, project_name: 'Podcast S2', project_priority: null }],
    ['reprioritise project', () => project.PATCH(req('PATCH', { priority: 'P3' }), ctx()), 200,
      'update_project', { target_project_id: ID, project_name: null, project_priority: 'P3' }],
    ['delete project', () => project.DELETE(req('DELETE'), ctx()), 200,
      'delete_project', { target_project_id: ID }],
    ['create mission', () => projectMissions.POST(req('POST', { name: 'Ep 1', steps: ['Outline'] }), ctx()), 201,
      'create_mission', { target_project_id: ID, mission_name: 'Ep 1', step_texts: ['Outline'] }],
    ['rename mission', () => mission.PATCH(req('PATCH', { name: 'Episode 1' }), ctx()), 200,
      'rename_mission', { target_mission_id: ID, mission_name: 'Episode 1' }],
    ['delete mission', () => mission.DELETE(req('DELETE'), ctx()), 200,
      'delete_mission', { target_mission_id: ID }],
    ['add step', () => missionSteps.POST(req('POST', { text: 'Edit audio' }), ctx()), 201,
      'add_step', { target_mission_id: ID, step_text: 'Edit audio' }],
    ['rename step', () => step.PATCH(req('PATCH', { text: 'Edit the audio' }), ctx()), 200,
      'rename_step', { target_action_id: ID, step_text: 'Edit the audio' }],
    ['delete step', () => step.DELETE(req('DELETE'), ctx()), 200,
      'delete_step', { target_action_id: ID }],
  ])('%s', async (_label, call, status, fn, args) => {
    const response = await call();
    expect(response.status).toBe(status);
    expect(rpc).toHaveBeenCalledWith(fn, args);
  });
});

describe('error handling', () => {
  it('answers a malformed id like a missing row, without calling the database', async () => {
    expect((await project.DELETE(req('DELETE'), ctx('not-a-uuid'))).status).toBe(404);
    expect((await step.PATCH(req('PATCH', { text: 'x' }), ctx('../users'))).status).toBe(404);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects bad input before calling the database', async () => {
    expect((await projects.POST(req('POST', { name: '   ' }))).status).toBe(400);
    expect((await project.PATCH(req('PATCH', {}), ctx())).status).toBe(400);
    expect((await missionSteps.POST(req('POST', { text: 'x'.repeat(513) }), ctx())).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('returns 401 when signed out', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await projects.POST(req('POST', { name: 'Podcast' }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('maps "not found" to 404 and shows the database’s own validation message', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: 'P0002', message: 'project not found' } });
    expect((await project.DELETE(req('DELETE'), ctx())).status).toBe(404);

    rpc.mockResolvedValueOnce({ data: null, error: { code: '22023', message: 'a workspace can have at most 100 projects' } });
    const capped = await projects.POST(req('POST', { name: 'One too many' }));
    expect(capped.status).toBe(400);
    expect((await capped.json()).error.message).toBe('a workspace can have at most 100 projects');
  });

  it('hides unexpected database errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    rpc.mockResolvedValue({ data: null, error: { code: '42883', message: 'function create_project does not exist' } });
    const response = await projects.POST(req('POST', { name: 'Podcast' }));
    expect(response.status).toBe(500);
    expect((await response.json()).error.message).not.toContain('create_project');
  });
});
