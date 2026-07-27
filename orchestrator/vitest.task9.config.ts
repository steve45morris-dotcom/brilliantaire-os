import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['orchestrator/phase1/**/*.test.ts'],
  },
});
