import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/auth/request-auth', () => ({
  authenticateRequest: vi.fn(),
}));

const cancel = vi.fn();

vi.mock('../../../lib/billing/server', () => ({
  getServiceDb: vi.fn(() => ({
    auth: { admin: { deleteUser: vi.fn().mockResolvedValue({}) } },
  })),
  getStripe: vi.fn(() => ({ subscriptions: { cancel } })),
}));

import { authenticateRequest } from '../../../lib/auth/request-auth';
import { DELETE } from './route';
import { GET } from './export/route';

const mockAuth = authenticateRequest as ReturnType<typeof vi.fn>;

function mockDb(overrides: Record<string, unknown> = {}) {
  return {
    db: {
      rpc: vi.fn().mockResolvedValue({ data: overrides.data ?? { deleted: true }, error: overrides.error ?? null }),
      from: vi.fn(() => ({
        select: () => ({ maybeSingle: async () => ({ data: overrides.subscription ?? null }) }),
      })),
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

  it('cancels a live Stripe subscription before deleting', async () => {
    const auth = mockDb({ subscription: { stripe_subscription_id: 'sub_1', status: 'active' } });
    mockAuth.mockResolvedValue(auth);
    cancel.mockResolvedValue({});

    const res = await DELETE(req());
    expect(res.status).toBe(200);
    expect(cancel).toHaveBeenCalledWith('sub_1');
    expect(auth.db.rpc).toHaveBeenCalledWith('delete_account');
  });

  it('keeps the account when Stripe cannot cancel', async () => {
    const auth = mockDb({ subscription: { stripe_subscription_id: 'sub_1', status: 'past_due' } });
    mockAuth.mockResolvedValue(auth);
    cancel.mockRejectedValue(Object.assign(new Error('network down'), { code: 'api_connection_error' }));

    const res = await DELETE(req());
    expect(res.status).toBe(502);
    expect(auth.db.rpc).not.toHaveBeenCalled();
  });

  it('deletes when the subscription is already gone from Stripe', async () => {
    const auth = mockDb({ subscription: { stripe_subscription_id: 'sub_1', status: 'active' } });
    mockAuth.mockResolvedValue(auth);
    cancel.mockRejectedValue(Object.assign(new Error('No such subscription'), { code: 'resource_missing' }));

    const res = await DELETE(req());
    expect(res.status).toBe(200);
    expect(auth.db.rpc).toHaveBeenCalledWith('delete_account');
  });

  it('skips Stripe for trials and ended subscriptions', async () => {
    for (const subscription of [{ stripe_subscription_id: null, status: 'trialing' }, { stripe_subscription_id: 'sub_1', status: 'canceled' }]) {
      mockAuth.mockResolvedValue(mockDb({ subscription }));
      expect((await DELETE(req())).status).toBe(200);
    }
    expect(cancel).not.toHaveBeenCalled();
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
