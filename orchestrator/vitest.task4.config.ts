import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['orchestrator/claims/**/*.test.ts'],
  },
});
