import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Structural contract tests for all 13 bridge modules.
 *
 * These tests read source files as text and verify invariants
 * without importing the modules (which pull in config files
 * that resolve paths at import time).
 */

const bridges = [
  { bridge: 'tools/asr_human_approval_selection_bridge.ts', config: 'config/asr-human-approval-selection-packet.ts' },
  { bridge: 'tools/higgsfield_ai_bridge.ts', config: 'config/higgsfield-ai.ts' },
  { bridge: 'tools/live_microphone_audio_streamer_bridge.ts', config: 'config/live-microphone-audio-streamer.ts' },
  { bridge: 'tools/local_inference_bridge.ts', config: 'config/local-inference.ts' },
  { bridge: 'tools/manual_implementation_packet_bridge.ts', config: 'config/manual-implementation-packet.ts' },
  { bridge: 'tools/micro_product_tree_groove_bridge.ts', config: 'config/micro-product-tree-groove-connector.ts' },
  { bridge: 'tools/obsidian_sync_layer_bridge.ts', config: 'config/obsidian-sync-layer.ts' },
  { bridge: 'tools/render_intake_bridge.ts', config: 'config/render-intake.ts' },
  { bridge: 'tools/stripe_webhook_verification_bridge.ts', config: 'config/stripe-webhook-verification.ts' },
  { bridge: 'tools/system_diagnostics_runner_bridge.ts', config: 'config/system-diagnostics-runner.ts' },
  { bridge: 'tools/tree_groove_release_pipeline_bridge.ts', config: 'config/tree-groove-release-pipeline.ts' },
  { bridge: 'tools/verification_rerun_planner_bridge.ts', config: 'config/grinders-keep-verification-rerun-planner.ts' },
  { bridge: 'tools/zk_webhook_verification_bridge.ts', config: 'config/zk-webhook-verification.ts' },
];

describe('Bridge module structural contracts', () => {
  // Pre-read all source files once
  const sources = bridges.map(({ bridge, config }) => ({
    bridge,
    config,
    bridgeSrc: fs.readFileSync(path.join(root, bridge), 'utf-8'),
    configSrc: fs.readFileSync(path.join(root, config), 'utf-8'),
  }));

  describe('File existence', () => {
    for (const { bridge, config } of bridges) {
      it(`${path.basename(bridge)} and its config both exist`, () => {
        expect(fs.existsSync(path.join(root, bridge))).toBe(true);
        expect(fs.existsSync(path.join(root, config))).toBe(true);
      });
    }
  });

  describe('Safety flag imports', () => {
    for (const { bridge, bridgeSrc } of sources) {
      it(`${path.basename(bridge)} imports ALLOW_* or REQUIRE_* flags from its config`, () => {
        const hasAllowImport = /ALLOW_\w+/.test(bridgeSrc);
        const hasRequireImport = /REQUIRE_\w+/.test(bridgeSrc);
        expect(
          hasAllowImport || hasRequireImport,
        ).toBe(true);
      });
    }
  });

  describe('BRIDGE_MODE import', () => {
    for (const { bridge, bridgeSrc } of sources) {
      it(`${path.basename(bridge)} imports BRIDGE_MODE`, () => {
        expect(bridgeSrc).toMatch(/BRIDGE_MODE/);
      });
    }
  });

  describe('Interface exports', () => {
    for (const { bridge, bridgeSrc } of sources) {
      it(`${path.basename(bridge)} exports an interface ending in BridgeStatus or Status`, () => {
        expect(bridgeSrc).toMatch(/export interface \w+(BridgeStatus|Status)\b/);
      });
    }
  });

  describe('Status function exports', () => {
    for (const { bridge, bridgeSrc } of sources) {
      it(`${path.basename(bridge)} exports a get*Status() or get*BridgeStatus() function`, () => {
        expect(bridgeSrc).toMatch(/export function get\w+(Status|BridgeStatus)\s*\(/);
      });
    }
  });

  describe('Report generator exports', () => {
    for (const { bridge, bridgeSrc } of sources) {
      it(`${path.basename(bridge)} exports generateBridgeReport()`, () => {
        expect(bridgeSrc).toMatch(/export function generateBridgeReport\s*\(/);
      });
    }
  });

  describe('Safety flag values in config (ALLOW_* must default to false)', () => {
    for (const { config, configSrc } of sources) {
      it(`${path.basename(config)} has all ALLOW_* flags set to false`, () => {
        const allowDeclarations = configSrc.match(/export const ALLOW_\w+\s*=\s*\w+/g) || [];
        expect(allowDeclarations.length).toBeGreaterThan(0);
        for (const decl of allowDeclarations) {
          expect(decl).toMatch(/=\s*false$/);
        }
      });
    }
  });

  describe('BRIDGE_MODE in config', () => {
    for (const { config, configSrc } of sources) {
      it(`${path.basename(config)} exports BRIDGE_MODE = "manual-first"`, () => {
        expect(configSrc).toMatch(/export const BRIDGE_MODE\s*=\s*["']manual-first["']/);
      });
    }
  });

  describe('Output folder structure in config', () => {
    for (const { config, configSrc } of sources) {
      it(`${path.basename(config)} exports outputFolders`, () => {
        expect(configSrc).toMatch(/export const outputFolders\b/);
      });
    }
  });

  describe('No shell execution in bridges', () => {
    const dangerousPatterns = [
      /\bexecSync\b/,
      /\bexec\s*\(/,
      /\bspawn\s*\(/,
      /\bspawnSync\b/,
      /child_process/,
    ];

    for (const { bridge, bridgeSrc } of sources) {
      it(`${path.basename(bridge)} does not use shell execution APIs`, () => {
        for (const pattern of dangerousPatterns) {
          expect(bridgeSrc).not.toMatch(pattern);
        }
      });
    }
  });

  describe('CLI entry guard', () => {
    for (const { bridge, bridgeSrc } of sources) {
      it(`${path.basename(bridge)} has an import.meta.url CLI guard`, () => {
        expect(bridgeSrc).toMatch(/import\.meta\.url/);
      });
    }
  });

  describe('Bridge imports its own config file', () => {
    for (const { bridge, config, bridgeSrc } of sources) {
      it(`${path.basename(bridge)} imports from the correct config`, () => {
        // Config path as referenced in the import: ../config/<name>.js
        const configBasename = path.basename(config, '.ts');
        const expectedImportPattern = new RegExp(
          `from\\s+['"]\\.\\.\/config\\/${configBasename}\\.js['"]`,
        );
        expect(bridgeSrc).toMatch(expectedImportPattern);
      });
    }
  });

  describe('Bridge status function returns bridgeMode field', () => {
    for (const { bridge, bridgeSrc } of sources) {
      it(`${path.basename(bridge)} status function includes bridgeMode in return`, () => {
        expect(bridgeSrc).toMatch(/bridgeMode:\s*BRIDGE_MODE/);
      });
    }
  });

  describe('Bridge status function returns safetyFlags object', () => {
    for (const { bridge, bridgeSrc } of sources) {
      it(`${path.basename(bridge)} status function includes safetyFlags`, () => {
        expect(bridgeSrc).toMatch(/safetyFlags:\s*\{/);
      });
    }
  });

  describe('Config exports PROJECT_NAME and TOOL_TYPE', () => {
    for (const { config, configSrc } of sources) {
      it(`${path.basename(config)} exports PROJECT_NAME`, () => {
        expect(configSrc).toMatch(/export const PROJECT_NAME\s*=/);
      });

      it(`${path.basename(config)} exports TOOL_TYPE`, () => {
        expect(configSrc).toMatch(/export const TOOL_TYPE\s*=/);
      });
    }
  });
});
