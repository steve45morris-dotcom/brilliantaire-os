import type { AgentAdapter } from './types.js';
import { createShellAdapter } from './shell.js';
import { createGeminiAdapter } from './gemini.js';
import { createCodexAdapter } from './codex.js';
import { ADAPTER_REGISTRY_CONFIG } from '../../config/orchestrator-adapters.js';

export function resolveAdapter(name: string): AgentAdapter {
  const entry = ADAPTER_REGISTRY_CONFIG.find(e => e.name === name);
  if (!entry) {
    throw new Error(`unknown adapter: "${name}"`);
  }

  switch (entry.kind) {
    case 'shell':
      return createShellAdapter({
        adapterName: 'shell',
        executable: 'true',
        fixedArgs: [],
        timeoutMs: 30000,
        sandboxMode: 'read-only',
      });
    case 'gemini':
      return createGeminiAdapter();
    case 'codex':
      return createCodexAdapter();
    default:
      throw new Error(`adapter kind "${entry.kind}" is not registered yet — see Task 6/7`);
  }
}
