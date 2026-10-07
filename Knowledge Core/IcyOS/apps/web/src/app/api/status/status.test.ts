import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { StatusResponse } from './route';

describe('GET /api/status', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns operational when all checks pass', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    const { GET } = await import('./route');
    const res = await GET();
    const body: StatusResponse = await res.json();

    expect(res.status).toBe(200);
    expect(body.overall).toBe('operational');
    expect(body.services).toHaveLength(3);
    expect(body.services.map((s) => s.name)).toEqual(['Application', 'Database', 'Authentication']);
    expect(body.uptime_pct).toBe(100);
    expect(body.checked_at).toBeTruthy();

    vi.unstubAllGlobals();
  });

  it('returns degraded when a service is slow or not ok', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', mockFetch);

    const { GET } = await import('./route');
    const res = await GET();
    const body: StatusResponse = await res.json();

    expect(body.overall).toBe('degraded');
    expect(body.services.some((s) => s.status === 'degraded')).toBe(true);

    vi.unstubAllGlobals();
  });

  it('returns down when a service fetch throws', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('connection refused'));
    vi.stubGlobal('fetch', mockFetch);

    const { GET } = await import('./route');
    const res = await GET();
    const body: StatusResponse = await res.json();

    expect(body.overall).toBe('down');
    expect(body.services.some((s) => s.status === 'down')).toBe(true);

    vi.unstubAllGlobals();
  });

  it('marks services down when env vars are missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');

    const { GET } = await import('./route');
    const res = await GET();
    const body: StatusResponse = await res.json();

    expect(body.services.find((s) => s.name === 'Database')?.status).toBe('down');
    expect(body.services.find((s) => s.name === 'Authentication')?.status).toBe('down');
    expect(body.services.find((s) => s.name === 'Application')?.status).toBe('operational');
  });

  it('sets no-cache headers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    const { GET } = await import('./route');
    const res = await GET();

    expect(res.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');

    vi.unstubAllGlobals();
  });
});
