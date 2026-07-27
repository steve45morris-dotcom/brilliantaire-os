import { describe, it, expect } from 'vitest';
import { createGeminiAdapter } from './gemini.js';
import { DeferredAdapterError } from './types.js';

describe('gemini adapter (deferred)', () => {
  it('is registered with adapterName "gemini" but throws DeferredAdapterError on run()', async () => {
    const adapter = createGeminiAdapter();
    expect(adapter.adapterName).toBe('gemini');
    await expect(
      adapter.run({ runDir: '/tmp', repoRoot: '/tmp', promptOrInstructionPath: '' })
    ).rejects.toThrow(DeferredAdapterError);
  });
});
