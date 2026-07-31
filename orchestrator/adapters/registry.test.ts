import { describe, it, expect } from 'vitest';
import { resolveAdapter } from './registry.js';

describe('resolveAdapter', () => {
  it('resolves "shell" and "gemini" by name without the caller importing their implementation modules', () => {
    expect(resolveAdapter('shell').adapterName).toBe('shell');
    expect(resolveAdapter('gemini').adapterName).toBe('gemini');
  });

  it('throws a clear error for an unknown adapter name', () => {
    expect(() => resolveAdapter('nonexistent')).toThrow(/unknown adapter/i);
  });
});
