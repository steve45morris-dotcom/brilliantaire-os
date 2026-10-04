import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NextRequest } from 'next/server';
import { SAMPLE_MISSION, needsFirstRunCheck, onboardingSchema } from './first-run';

const getUser = vi.fn();
const rpc = vi.fn();
vi.mock('../auth/supabase-server', () => ({
  createServerSupabaseClient: async () => ({ auth: { getUser }, rpc }),
}));

const { POST } = await import('../../app/api/onboarding/route');

const post = (body: unknown) =>
  new NextRequest('http://localhost/api/onboarding', { method: 'POST', body: JSON.stringify(body) });

describe('first-run check', () => {
  it('applies to app pages but not to setup, billing, legal, auth or API routes', () => {
    for (const path of ['/', '/dashboard', '/timeline', '/settings', '/onboardingx']) {
      expect(needsFirstRunCheck(path)).toBe(true);
    }
    for (const path of ['/onboarding', '/billing', '/login', '/auth/callback', '/terms', '/privacy', '/api/onboarding', '/api/missions']) {
      expect(needsFirstRunCheck(path)).toBe(false);
    }
  });
});

describe('onboarding input', () => {
  it('trims names and applies defaults', () => {
    expect(onboardingSchema.parse({ workspaceName: '  Acme ', projectName: 'Launch' })).toEqual({
      workspaceName: 'Acme',
      projectName: 'Launch',
      projectPriority: 'P2',
      includeSampleMission: true,
    });
  });

  it('rejects blank or overlong names and unknown priorities', () => {
    expect(onboardingSchema.safeParse({ workspaceName: '   ', projectName: 'x' }).success).toBe(false);
    expect(onboardingSchema.safeParse({ workspaceName: 'x', projectName: 'y'.repeat(256) }).success).toBe(false);
    expect(onboardingSchema.safeParse({ workspaceName: 'x', projectName: 'y', projectPriority: 'P0' }).success).toBe(false);
  });

  it('shows the same sample mission the database creates', () => {
    const migration = readFileSync(resolve(__dirname, '../../../../../supabase/migrations/20_onboarding.sql'), 'utf8');
    expect(migration).toContain(`'${SAMPLE_MISSION.name}'`);
    for (const action of SAMPLE_MISSION.actions) expect(migration).toContain(`'${action}'`);
  });
});

describe('POST /api/onboarding', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'auth-1' } } });
    rpc.mockReset().mockResolvedValue({
      data: { created: true, workspace_id: 'ws-1', project_id: 'p-1', sprint_id: 's-1', mission_id: 'm-1' },
      error: null,
    });
  });

  it('creates the workspace through complete_onboarding and marks the user as set up', async () => {
    const response = await POST(post({ workspaceName: ' Acme ', projectName: 'Launch', projectPriority: 'P1' }));

    expect(response.status).toBe(201);
    expect((await response.json()).data.workspace_id).toBe('ws-1');
    expect(rpc).toHaveBeenCalledWith('complete_onboarding', {
      workspace_name: 'Acme',
      project_name: 'Launch',
      project_priority: 'P1',
      include_sample_mission: true,
    });
    expect(response.cookies.get('icyos_onboarded')).toMatchObject({ value: 'auth-1', httpOnly: true, path: '/' });
  });

  it('returns 200 with the existing workspace when the user is already set up', async () => {
    rpc.mockResolvedValue({ data: { created: false, workspace_id: 'ws-1' }, error: null });
    const response = await POST(post({ workspaceName: 'Acme', projectName: 'Launch' }));
    expect(response.status).toBe(200);
    expect((await response.json()).data.created).toBe(false);
  });

  it('rejects invalid input and signed-out users without calling the database', async () => {
    expect((await POST(post({ workspaceName: '', projectName: 'Launch' }))).status).toBe(400);

    getUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(post({ workspaceName: 'Acme', projectName: 'Launch' }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('hides database errors behind a generic message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    rpc.mockResolvedValue({ data: null, error: { message: 'function complete_onboarding does not exist' } });

    const response = await POST(post({ workspaceName: 'Acme', projectName: 'Launch' }));
    expect(response.status).toBe(500);
    expect((await response.json()).error.message).not.toContain('complete_onboarding');
  });
});
