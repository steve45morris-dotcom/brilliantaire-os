import { describe, it, expect, vi } from 'vitest';
import { apiFetch } from './client';

global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      success: true,
      data: { result: 'Structured task' },
      error: null,
      meta: { request_id: '123', timestamp: 'now', version: '1' }
    }),
  })
);

describe('API Client Response Handling', () => {
  it('should parse successful JSON response envelopes', async () => {
    const res = await apiFetch<{ result: string }>('/api/inbox/capture');
    expect(res.success).toBe(true);
    expect(res.data?.result).toBe('Structured task');
  });
});
