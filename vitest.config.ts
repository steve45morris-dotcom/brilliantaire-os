import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      'Knowledge Core/IcyOS/**',
      'node_modules/**',
    ],
  },
});
