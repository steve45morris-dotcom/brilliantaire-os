import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['orchestrator/adapters/codex.test.ts'],
  },
});
