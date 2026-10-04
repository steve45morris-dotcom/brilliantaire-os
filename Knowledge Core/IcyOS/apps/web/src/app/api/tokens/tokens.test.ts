import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { hashToken } from '../../../lib/auth/api-tokens';
import { TOKEN_PATTERN } from '../../../lib/auth/token-routes';

const { getUser, rpc, list } = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), list: vi.fn() }));
vi.mock('../../../lib/auth/supabase-server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser },
    rpc,
    from: () => ({ select: () => ({ is: () => ({ order: list }) }) }),
  }),
}));

const tokens = await import('./route');
const token = await import('./[id]/route');

const ID = '00000000-0000-4000-8000-000000000001';
const post = (body: unknown) =>
  new NextRequest('http://localhost/api/tokens', { method: 'POST', body: JSON.stringify(body) });

beforeEach(() => {
  getUser.mockReset().mockResolvedValue({ data: { user: { id: 'auth-1' } } });
  rpc.mockReset().mockResolvedValue({ data: { id: ID }, error: null });
  list.mockReset().mockResolvedValue({ data: [], error: null });
});

describe('POST /api/tokens', () => {
  it('returns the new token once and stores only its hash and prefix', async () => {
    const before = Date.now();
    const response = await tokens.POST(post({ name: ' P.J.K. ', expiresInDays: 90 }));
    const body = (await response.json()).data;

    expect(response.status).toBe(201);
    expect(body.token).toMatch(TOKEN_PATTERN);
    expect(body).toMatchObject({ id: ID, name: 'P.J.K.', prefix: body.token.slice(0, 12) });

    const [fn, args] = rpc.mock.calls[0];
    expect(fn).toBe('create_api_token');
    expect(args).toMatchObject({ token_name: 'P.J.K.', token_hash: hashToken(body.token), token_prefix: body.prefix });
    expect(JSON.stringify(args)).not.toContain(body.token);
    const expires = Date.parse(args.expires_at);
    expect(expires - before).toBeGreaterThanOrEqual(90 * 86_400_000 - 1000);
    expect(expires - before).toBeLessThanOrEqual(90 * 86_400_000 + 1000);
  });

  it('allows tokens that never expire', async () => {
    await tokens.POST(post({ name: 'Forever', expiresInDays: null }));
    expect(rpc.mock.calls[0][1].expires_at).toBeNull();
  });

  it('rejects other lifetimes, blank names and signed-out users', async () => {
    expect((await tokens.POST(post({ name: 'x', expiresInDays: 7 }))).status).toBe(400);
    expect((await tokens.POST(post({ name: 'x' }))).status).toBe(400);
    expect((await tokens.POST(post({ name: '  ', expiresInDays: 30 }))).status).toBe(400);
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await tokens.POST(post({ name: 'x', expiresInDays: 30 }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('passes on the database’s limit message', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '22023', message: 'you can have at most 20 active tokens; revoke one first' } });
    const response = await tokens.POST(post({ name: 'x', expiresInDays: 30 }));
    expect(response.status).toBe(400);
    expect((await response.json()).error.message).toContain('at most 20');
  });
});

describe('GET /api/tokens and DELETE /api/tokens/[id]', () => {
  it('lists active tokens for a signed-in user', async () => {
    list.mockResolvedValue({ data: [{ id: ID, name: 'P.J.K.', prefix: 'icy_abcd1234' }], error: null });
    const response = await tokens.GET();
    expect((await response.json()).data[0].prefix).toBe('icy_abcd1234');

    getUser.mockResolvedValue({ data: { user: null } });
    expect((await tokens.GET()).status).toBe(401);
  });

  it('revokes a token, and answers 404 for someone else’s or a malformed id', async () => {
    const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
    const del = new NextRequest(`http://localhost/api/tokens/${ID}`, { method: 'DELETE' });

    expect((await token.DELETE(del, ctx(ID))).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('revoke_api_token', { token_id: ID });

    rpc.mockResolvedValue({ data: null, error: { code: 'P0002', message: 'token not found' } });
    expect((await token.DELETE(del, ctx(ID))).status).toBe(404);
    expect((await token.DELETE(del, ctx('nope'))).status).toBe(404);
  });
});
