import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createNoteSchema, updateNoteSchema } from './types';
import { acceptsApiToken } from '../auth/token-routes';
import { resolveTier } from '../api/rate-limit';

const { getUser, rpc, single } = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), single: vi.fn() }));
vi.mock('../auth/supabase-server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser },
    rpc,
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: single }) }) }),
  }),
}));

const listRoute = await import('../../app/api/knowledge/route');
const noteRoute = await import('../../app/api/knowledge/[id]/route');

const NOTE = '00000000-0000-4000-8000-0000000000c1';
const PROJECT = '00000000-0000-4000-8000-0000000000d1';
const row = { id: NOTE, title: 'Pricing', body: 'Tier at $29', project_id: PROJECT, project_name: 'Launch', pinned: false, created_at: '2026-10-04T10:00:00Z', updated_at: '2026-10-04T11:00:00Z' };
const req = (url: string, method = 'GET', body?: unknown) =>
  new NextRequest(`http://localhost${url}`, { method, body: body === undefined ? undefined : JSON.stringify(body) });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('knowledge routes', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'auth-1' } } });
    rpc.mockReset();
    single.mockReset();
  });

  it('lists and searches through search_notes', async () => {
    rpc.mockResolvedValue({ data: [{ id: NOTE, title: 'Pricing', excerpt: 'Tier at $29', project_id: null, project_name: null, pinned: true, updated_at: row.updated_at }], error: null });
    const res = await listRoute.GET(req('/api/knowledge?q=%20tier%20'));
    expect((await res.json()).data.notes).toEqual([{ id: NOTE, title: 'Pricing', excerpt: 'Tier at $29', projectId: null, projectName: null, pinned: true, updatedAt: row.updated_at }]);
    expect(rpc).toHaveBeenCalledWith('search_notes', { query: ' tier ' });

    await listRoute.GET(req('/api/knowledge'));
    expect(rpc).toHaveBeenLastCalledWith('search_notes', { query: null });
    expect((await listRoute.GET(req(`/api/knowledge?q=${'x'.repeat(201)}`))).status).toBe(400);
  });

  it('creates a note and maps it for the page', async () => {
    rpc.mockResolvedValue({ data: row, error: null });
    const res = await listRoute.POST(req('/api/knowledge', 'POST', { title: ' Pricing ', body: 'Tier at $29', projectId: PROJECT }));
    expect(res.status).toBe(201);
    expect((await res.json()).data).toMatchObject({ id: NOTE, body: 'Tier at $29', projectName: 'Launch', pinned: false });
    expect(rpc).toHaveBeenCalledWith('create_note', { note_title: 'Pricing', note_body: 'Tier at $29', target_project_id: PROJECT });
  });

  it('updates only what is sent, and null removes the project', async () => {
    rpc.mockResolvedValue({ data: row, error: null });
    await noteRoute.PATCH(req(`/api/knowledge/${NOTE}`, 'PATCH', { pinned: true }), params(NOTE));
    expect(rpc).toHaveBeenLastCalledWith('update_note', { target_note_id: NOTE, note_title: null, note_body: null, target_project_id: null, clear_project: false, note_pinned: true });
    await noteRoute.PATCH(req(`/api/knowledge/${NOTE}`, 'PATCH', { projectId: null, body: '' }), params(NOTE));
    expect(rpc).toHaveBeenLastCalledWith('update_note', { target_note_id: NOTE, note_title: null, note_body: '', target_project_id: null, clear_project: true, note_pinned: null });
    expect((await noteRoute.PATCH(req(`/api/knowledge/${NOTE}`, 'PATCH', {}), params(NOTE))).status).toBe(400);
  });

  it('reads one note, and answers 404 for missing, foreign or malformed ids', async () => {
    single.mockResolvedValueOnce({ data: { ...row, body: undefined, content: 'Full text', project_name: undefined, projects: { name: 'Launch' } }, error: null });
    const res = await noteRoute.GET(req(`/api/knowledge/${NOTE}`), params(NOTE));
    expect((await res.json()).data).toMatchObject({ body: 'Full text', projectName: 'Launch' });

    single.mockResolvedValueOnce({ data: null, error: null });
    expect((await noteRoute.GET(req(`/api/knowledge/${NOTE}`), params(NOTE))).status).toBe(404);
    expect((await noteRoute.GET(req('/api/knowledge/nope'), params('nope'))).status).toBe(404);

    rpc.mockResolvedValue({ data: null, error: { code: 'P0002', message: 'note not found' } });
    expect((await noteRoute.DELETE(req(`/api/knowledge/${NOTE}`, 'DELETE'), params(NOTE))).status).toBe(404);
    expect((await noteRoute.PATCH(req(`/api/knowledge/${NOTE}`, 'PATCH', { title: 'x' }), params(NOTE))).status).toBe(404);
  });

  it('refuses signed-out callers and bad input before the database', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await listRoute.GET(req('/api/knowledge'))).status).toBe(401);
    for (const body of [{ title: '  ' }, { title: 'x', body: 'y'.repeat(20001) }, { title: 'x', projectId: 'nope' }]) {
      expect(createNoteSchema.safeParse(body).success, JSON.stringify(body).slice(0, 40)).toBe(false);
    }
    expect(updateNoteSchema.safeParse({ title: '' }).success).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('lets personal access tokens use notes', () => {
    expect(acceptsApiToken('/api/knowledge') && acceptsApiToken(`/api/knowledge/${NOTE}`)).toBe(true);
    expect(resolveTier('/api/knowledge', 'POST')).toBe('write');
  });
});
