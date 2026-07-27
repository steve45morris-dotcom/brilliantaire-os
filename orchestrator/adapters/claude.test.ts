import { describe, it, expect } from 'vitest';
import { createClaudeAdapter } from './claude.js';

describe('claude adapter', () => {
  it('reports adapterName "claude"', () => {
    const adapter = createClaudeAdapter();
    expect(adapter.adapterName).toBe('claude');
  });

  it('constructs argv without any shell-interpreted string', () => {
    const adapter = createClaudeAdapter();
    const args = adapter.buildArgs({ runDir: '/tmp/run', repoRoot: '/tmp/repo', promptOrInstructionPath: '/tmp/run/instruction.md' });
    expect(args.every(a => typeof a === 'string')).toBe(true);
  });
});
