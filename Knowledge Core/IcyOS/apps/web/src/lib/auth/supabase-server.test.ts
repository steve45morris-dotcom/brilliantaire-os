import { describe, it, expect, vi, beforeEach } from 'vitest';

const getUser = vi.fn();
const rpc = vi.fn();
vi.mock('next/headers', () => ({ cookies: async () => ({ getAll: () => [], set: () => {} }) }));
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser }, rpc }),
}));

const { getUserRole } = await import('./supabase-server');

describe('getUserRole', () => {
  beforeEach(() => {
    getUser.mockReset();
    rpc.mockReset();
    getUser.mockResolvedValue({ data: { user: { id: 'auth-uid-1' } } });
  });

  it('resolves the role in the database via current_user_role()', async () => {
    rpc.mockResolvedValue({ data: 'admin', error: null });

    await expect(getUserRole()).resolves.toBe('admin');
    expect(rpc).toHaveBeenCalledWith('current_user_role');
  });

  it('returns null when signed out, without querying roles', async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    await expect(getUserRole()).resolves.toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('falls back to viewer on an RPC error or an unknown value', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    rpc.mockResolvedValue({ data: null, error: { message: 'function does not exist' } });
    await expect(getUserRole()).resolves.toBe('viewer');

    rpc.mockResolvedValue({ data: 'superuser', error: null });
    await expect(getUserRole()).resolves.toBe('viewer');
  });
});
