import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Structural contract tests for config module files.
 *
 * These tests read source files as text and verify invariants
 * without importing the modules (which pull in config files
 * that resolve paths at import time).
 *
 * Discovery: scans config/*.ts, excludes utility/non-module files
 * and test files, then identifies module configs by the presence
 * of `export const BRIDGE_MODE`.
 */

// Files explicitly excluded from module config detection
const excludedFiles = new Set([
  'commands.ts',
  'voice-commands.ts',
  'narrator-sources.ts',
  'paths.ts',
  'sentinel_os_root.ts',
  'sentinel_safety.ts',
  'orchestrator-adapters.ts',
  'git-asset-policy.ts',
]);

// Known exceptions to safety flag default rules.
// These configs have ALLOW_* = true or REQUIRE_* = false for valid,
// documented reasons.
const knownSafetyExceptions: Record<string, string[]> = {
  // REQUIRE_ALL_CHECKS_PASS is false because the diagnostics runner
  // reports partial results even when some checks fail.
  'system-diagnostics-runner.ts': ['REQUIRE_ALL_CHECKS_PASS'],
};

// Configs that legitimately lack MODULE_NAME (they use PROJECT_NAME only)
const noModuleNameConfigs = new Set([
  'higgsfield-ai.ts',
  'local-inference.ts',
  'manual-implementation-packet.ts',
  'render-intake.ts',
]);

// Configs that legitimately lack both MODULE_NAME and PROJECT_NAME.
// notebooklm-bridge.ts is a lightweight bridge config with no named identity export.
const noIdentityConfigs = new Set([
  'notebooklm-bridge.ts',
]);

// Configs that legitimately lack an explicit OUTPUT_ROOT export
// (they build output paths inline in outputFolders)
const noOutputRootConfigs = new Set([
  'higgsfield-ai.ts',
  'local-inference.ts',
  'manual-implementation-packet.ts',
  'notebooklm-bridge.ts',
  'render-intake.ts',
]);

// Configs that legitimately lack TEMPLATE_ROOT
// (they have no template directory)
const noTemplateRootConfigs = new Set([
  'higgsfield-ai.ts',
  'local-inference.ts',
  'manual-implementation-packet.ts',
  'notebooklm-bridge.ts',
  'render-intake.ts',
]);

// --- Discovery ---

const configDir = path.join(root, 'config');
const allConfigFiles = fs.readdirSync(configDir)
  .filter(f => f.endsWith('.ts'))
  .filter(f => !f.endsWith('.test.ts') && !f.endsWith('.contract.test.ts'))
  .filter(f => !excludedFiles.has(f));

// Identify module configs: files that export BRIDGE_MODE
const moduleConfigs: Array<{ file: string; src: string }> = [];
for (const file of allConfigFiles) {
  const src = fs.readFileSync(path.join(configDir, file), 'utf-8');
  if (/export const BRIDGE_MODE/.test(src)) {
    moduleConfigs.push({ file, src });
  }
}

// Dangerous patterns that must not appear in config modules
const dangerousPatterns: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /child_process/, label: 'child_process' },
  { pattern: /\bexec\s*\(/, label: 'exec(' },
  { pattern: /\bexecSync\s*\(/, label: 'execSync(' },
  { pattern: /\bspawn\s*\(/, label: 'spawn(' },
  { pattern: /\bspawnSync\s*\(/, label: 'spawnSync(' },
];

describe('Config module structural contracts', () => {
  it(`discovers at least 10 module configs (found ${moduleConfigs.length})`, () => {
    expect(moduleConfigs.length).toBeGreaterThanOrEqual(10);
  });

  describe('File existence', () => {
    for (const { file } of moduleConfigs) {
      it(`${file} exists`, () => {
        expect(fs.existsSync(path.join(configDir, file))).toBe(true);
      });
    }
  });

  describe('BRIDGE_MODE export', () => {
    for (const { file, src } of moduleConfigs) {
      it(`${file} exports BRIDGE_MODE = "manual-first"`, () => {
        expect(src).toMatch(/export const BRIDGE_MODE\s*=\s*["']manual-first["']/);
      });
    }
  });

  describe('Safety flags present', () => {
    for (const { file, src } of moduleConfigs) {
      it(`${file} exports at least one ALLOW_* or REQUIRE_* flag`, () => {
        const hasAllow = /export const ALLOW_\w+/.test(src);
        const hasRequire = /export const REQUIRE_\w+/.test(src);
        expect(hasAllow || hasRequire).toBe(true);
      });
    }
  });

  describe('Safety flag values (ALLOW_* = false, REQUIRE_* = true)', () => {
    for (const { file, src } of moduleConfigs) {
      it(`${file} has all ALLOW_* flags set to false`, () => {
        const allowMatches = [...src.matchAll(/export const (ALLOW_\w+)\s*=\s*(true|false)/g)];
        expect(allowMatches.length).toBeGreaterThan(0);
        for (const m of allowMatches) {
          expect(m[2], `${m[1]} should be false`).toBe('false');
        }
      });

      it(`${file} has all REQUIRE_* flags set to true (with known exceptions)`, () => {
        const requireMatches = [...src.matchAll(/export const (REQUIRE_\w+)\s*=\s*(true|false)/g)];
        const exceptions = knownSafetyExceptions[file] ?? [];
        for (const m of requireMatches) {
          if (exceptions.includes(m[1])) continue;
          expect(m[2], `${m[1]} should be true`).toBe('true');
        }
      });
    }
  });

  describe('Module identity (MODULE_NAME or PROJECT_NAME)', () => {
    for (const { file, src } of moduleConfigs) {
      if (noIdentityConfigs.has(file)) {
        it(`${file} is a known exception (no MODULE_NAME or PROJECT_NAME)`, () => {
          // notebooklm-bridge.ts is a lightweight bridge config without
          // a named identity export — this is intentional.
          expect(true).toBe(true);
        });
      } else {
        it(`${file} exports MODULE_NAME or PROJECT_NAME`, () => {
          const hasModuleName = /export const MODULE_NAME\s*=/.test(src);
          const hasProjectName = /export const PROJECT_NAME\s*=/.test(src);
          expect(
            hasModuleName || hasProjectName,
            `${file} must export MODULE_NAME or PROJECT_NAME`,
          ).toBe(true);
        });
      }
    }
  });

  describe('Output path (OUTPUT_ROOT or inline output paths)', () => {
    for (const { file, src } of moduleConfigs) {
      it(`${file} exports OUTPUT_ROOT or defines output paths in outputFolders`, () => {
        const hasOutputRoot = /export const OUTPUT_ROOT\s*=/.test(src);
        const hasOutputFolders = /export const outputFolders\b/.test(src);
        if (noOutputRootConfigs.has(file)) {
          // These configs build paths inline in outputFolders
          expect(hasOutputFolders, `${file} should have outputFolders`).toBe(true);
        } else {
          expect(hasOutputRoot, `${file} should export OUTPUT_ROOT`).toBe(true);
        }
      });
    }
  });

  describe('Output folder structure', () => {
    for (const { file, src } of moduleConfigs) {
      it(`${file} exports outputFolders`, () => {
        expect(src).toMatch(/export const outputFolders\b/);
      });
    }
  });

  describe('Template path (TEMPLATE_ROOT)', () => {
    for (const { file, src } of moduleConfigs) {
      if (noTemplateRootConfigs.has(file)) {
        it(`${file} does not require TEMPLATE_ROOT (no templates)`, () => {
          // These configs legitimately have no template directory
          expect(true).toBe(true);
        });
      } else {
        it(`${file} exports TEMPLATE_ROOT`, () => {
          expect(src).toMatch(/export const TEMPLATE_ROOT\s*=/);
        });
      }
    }
  });

  describe('No shell execution in configs', () => {
    for (const { file, src } of moduleConfigs) {
      it(`${file} does not use shell execution APIs`, () => {
        for (const { pattern, label } of dangerousPatterns) {
          expect(src, `${file} must not contain ${label}`).not.toMatch(pattern);
        }
      });
    }
  });

  describe('ES module imports use .js extension for local files', () => {
    for (const { file, src } of moduleConfigs) {
      it(`${file} uses .js extension on local imports (if any)`, () => {
        // Match local relative imports: from './foo' or from '../foo'
        const localImports = [...src.matchAll(/from\s+['"](\.[^'"]+)['"]/g)];
        for (const m of localImports) {
          const importPath = m[1];
          // Node built-in bare specifiers (path, url, os, fs, etc.) are fine
          // Only check relative paths that look like local .ts files
          if (importPath.startsWith('./') || importPath.startsWith('../')) {
            // If it has no extension or ends in .ts, it should end in .js
            if (!importPath.endsWith('.js') && !importPath.endsWith('.json')) {
              // Allow bare node built-in imports (path, url, os, etc.)
              expect(
                importPath,
                `Import "${importPath}" in ${file} should use .js extension`,
              ).toMatch(/\.js$/);
            }
          }
        }
      });
    }
  });

  // Summary test
  it(`total module configs discovered: ${moduleConfigs.length}`, () => {
    // Log a summary for visibility
    const names = moduleConfigs.map(c => c.file);
    expect(names.length).toBe(moduleConfigs.length);
  });
});
