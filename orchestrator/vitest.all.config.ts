import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'orchestrator/**/*.test.ts',
      'scripts/orchestrator-phase0.test.ts',
    ],
  },
});
