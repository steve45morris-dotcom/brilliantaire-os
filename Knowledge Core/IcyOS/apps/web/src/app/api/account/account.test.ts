import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/auth/request-auth', () => ({
  authenticateRequest: vi.fn(),
}));

vi.mock('../../../lib/billing/server', () => ({
  getServiceDb: vi.fn(() => ({
    auth: { admin: { deleteUser: vi.fn().mockResolvedValue({}) } },
  })),
}));

import { authenticateRequest } from '../../../lib/auth/request-auth';
import { DELETE } from './route';
import { GET } from './export/route';

const mockAuth = authenticateRequest as ReturnType<typeof vi.fn>;

function mockDb(overrides: Record<string, unknown> = {}) {
  return {
    db: {
      rpc: vi.fn().mockResolvedValue({ data: overrides.data ?? { deleted: true }, error: overrides.error ?? null }),
    },
    authUserId: 'user-123',
    via: overrides.via ?? 'session',
  };
}

function req(method = 'DELETE') {
  return new Request('http://localhost/api/account', { method });
}

describe('DELETE /api/account', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes the account for a session user', async () => {
    const auth = mockDb();
    mockAuth.mockResolvedValue(auth);

    const res = await DELETE(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.deleted).toBe(true);
    expect(auth.db.rpc).toHaveBeenCalledWith('delete_account');
  });

  it('rejects token-based deletion', async () => {
    mockAuth.mockResolvedValue(mockDb({ via: 'token' }));

    const res = await DELETE(req());
    expect(res.status).toBe(403);
  });

  it('returns 500 when the RPC fails', async () => {
    mockAuth.mockResolvedValue(mockDb({ error: { message: 'boom', code: 'XXXXX' } }));

    const res = await DELETE(req());
    expect(res.status).toBe(500);
  });
});

describe('GET /api/account/export', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a JSON download', async () => {
    const exportData = { projects: [], missions: [], exported_at: '2026-10-04' };
    mockAuth.mockResolvedValue(mockDb({ data: exportData }));

    const res = await GET(new Request('http://localhost/api/account/export'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('icyos-export.json');
    expect(body.projects).toEqual([]);
  });

  it('returns 500 when export fails', async () => {
    mockAuth.mockResolvedValue(mockDb({ error: { message: 'boom', code: 'XXXXX' } }));

    const res = await GET(new Request('http://localhost/api/account/export'));
    expect(res.status).toBe(500);
  });
});
