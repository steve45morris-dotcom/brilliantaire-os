import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['orchestrator/reconciliation/reconcile.test.ts', 'orchestrator/reporting/**/*.test.ts'],
  },
});
