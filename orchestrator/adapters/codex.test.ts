import { describe, it, expect } from 'vitest';
import { createCodexAdapter } from './codex.js';

describe('codex adapter', () => {
  it('reports adapterName "codex" and a read-only sandbox mode', () => {
    const adapter = createCodexAdapter();
    expect(adapter.adapterName).toBe('codex');
    expect(adapter.sandboxMode).toBe('read-only');
  });

  it('constructs argv without any shell-interpreted string', () => {
    const adapter = createCodexAdapter();
    const args = adapter.buildArgs({ runDir: '/tmp/run', repoRoot: '/tmp/repo', promptOrInstructionPath: '/tmp/run/instruction.md' });
    expect(Array.isArray(args)).toBe(true);
    expect(args.every(a => typeof a === 'string')).toBe(true);
  });
});
