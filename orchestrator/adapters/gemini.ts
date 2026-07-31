import type { AgentAdapter, AgentInvocation, AdapterResult } from './types.js';
import { DeferredAdapterError } from './types.js';

export function createGeminiAdapter(): AgentAdapter {
  return {
    adapterName: 'gemini',
    executable: 'gemini',
    cwd: 'repo',
    timeoutMs: 0,
    sandboxMode: 'read-only',
    buildArgs(_invocation: AgentInvocation): string[] {
      throw new DeferredAdapterError('gemini');
    },
    buildEnv(): Record<string, string> {
      return {};
    },
    async run(_invocation: AgentInvocation): Promise<AdapterResult> {
      throw new DeferredAdapterError('gemini');
    },
  };
}
