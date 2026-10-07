// IcyOS's packages run their tests from here with Vitest's defaults. This file
// stops Vitest from walking up to the brilliantaire-os root config, which is
// for the root's own tests and can't load in IcyOS's CI (only IcyOS's
// packages are installed there). apps/web keeps its own vitest.config.ts.
// No imports, so it loads without vitest installed at this level.
export default {};
