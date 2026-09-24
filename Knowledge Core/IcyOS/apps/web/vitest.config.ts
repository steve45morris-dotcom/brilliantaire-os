import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // e2e/ holds Playwright specs, run separately via `test:e2e`.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
