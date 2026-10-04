import { defineConfig } from "vitest/config";

// This repository is rooted at $HOME on the Commander's Mac, so sibling
// checkouts live inside it. Keep their tests out of this suite: sentinel-os has
// its own runner (scripts/run-tests.ts) and its files are not Vitest tests;
// IcyOS has its own Vitest config under Knowledge Core/IcyOS. Without this,
// `npm test` ran a different set of files on the Mac than in CI.
export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "sentinel-os/**", "Knowledge Core/**"]
  }
});
