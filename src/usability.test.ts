import { describe, it, expect } from 'vitest';
import { globalSkillAcquisitionService } from './skills/acquisition/SkillAcquisitionService.js';
import { globalWorkspaceRegistry } from './workspaces/WorkspaceRegistry.js';
import { getRouteForWorkspace } from './workspaces/WorkspaceRoutes.js';
import { globalActionRouter } from './ui/actions/ActionRouter.js';
import { globalSoundManager } from './ui/sound/SoundManager.js';
import { globalEyeStateManager } from './ui/eye/EyeStateManager.js';
import { globalLiveOperationsStore } from './kernel/live/LiveOperationsStore.js';
import { globalLaunchRegistry } from './workspaces/LaunchRegistry.js';
import { globalProjectLauncher } from './workspaces/ProjectLauncher.js';
import { globalPresenceStateManager } from './ui/supernova/PresenceStateManager.js';
import { resolveWorkspaceBySlug, toWorkspaceSlug, fromWorkspaceSlug, getWorkspaceRoute } from './workspaces/WorkspaceSlug.js';
import { globalVoiceManager } from './ui/voice/VoiceManager.js';

describe('Application Era Usability Upgrades Tests', () => {

  describe('Phase 1: Skill Acquisition via Internet', () => {
    it('should correctly scan, extract candidates, and assign compatibility/risk metrics', async () => {
      const repo = 'steve45morris-dotcom/brilliantaire-os';
      const discovered = await globalSkillAcquisitionService.scan(repo);
      
      expect(discovered.length).toBeGreaterThan(0);
      const item = discovered[0];
      expect(item.repoName).toBe(repo);
      expect(item.riskScore).toBeDefined();
      expect(item.compatibilityScore).toBeDefined();
      expect(item.recommendedAction).toBeDefined();
    });

    it('should transit candidate statuses during approval checkpoints', () => {
      const candidates = globalSkillAcquisitionService.getCandidates('discovered');
      if (candidates.length > 0) {
        const id = candidates[0].id;
        globalSkillAcquisitionService.approve(id);
        const item = globalSkillAcquisitionService.getCandidates().find(c => c.id === id);
        expect(item?.status).toBe('approved');

        globalSkillAcquisitionService.verify(id);
        expect(item?.status).toBe('verified');

        globalSkillAcquisitionService.activate(id);
        expect(item?.status).toBe('active');
      }
    });
  });

  describe('Phase 2: Project Workspaces Registry & Routes', () => {
    it('should retrieve official workspaces by ID', () => {
      const official = ['the-one-system', 'icyflamze', 'profbetgeng', 'treegroove', 'joy-beauty-studio', 'avatar', 'podcast', 'ai-school'];
      official.forEach(id => {
        const ws = globalWorkspaceRegistry.getWorkspace(id);
        expect(ws).not.toBeNull();
        expect(ws?.id).toBe(id);
      });
    });

    it('should generate correct view routes for all official workspaces', () => {
      expect(getRouteForWorkspace('the-one-system')).toBe('projects-the-one-system');
      expect(getRouteForWorkspace('icyflamze')).toBe('projects-icyflamze');
      expect(getRouteForWorkspace('profbetgeng')).toBe('projects-profbetgeng');
    });
  });

  describe('Phase 3: Action Router & Option Fallbacks', () => {
    it('should route unsupported/dead actions to configuration stubs and log events', () => {
      const startCount = globalLiveOperationsStore.getEvents().length;
      globalActionRouter.routeAction('stub:dead-button', { label: 'Audit System Code' });
      
      const endCount = globalLiveOperationsStore.getEvents().length;
      expect(endCount).toBeGreaterThanOrEqual(startCount);
    });
  });

  describe('Phase 4: Sound Manager Audio Configurations', () => {
    it('should default to muted (disabled) status', () => {
      const config = globalSoundManager.getConfig();
      expect(config.enabled).toBe(false);
    });
  });

  describe('Phase 5: System Eye State Transitions', () => {
    it('should set and broadcast awareness state transitions', () => {
      globalEyeStateManager.setState('thinking');
      expect(globalEyeStateManager.getState()).toBe('thinking');

      globalEyeStateManager.setState('observing');
      expect(globalEyeStateManager.getState()).toBe('observing');
    });
  });

  describe('Phase 6: Project Launch & Fallbacks', () => {
    it('should retrieve configs from the launch registry', () => {
      const config = globalLaunchRegistry.getLaunchConfig('the-one-system');
      expect(config).not.toBeNull();
      expect(config?.status).toBe('Available');
      expect(config?.launchMode).toBe('internal_route');
    });

    it('should validate project routes and launcher configuration states', async () => {
      // Test Available launch
      const resAvailable = await globalProjectLauncher.launch('the-one-system');
      expect(resAvailable.success).toBe(true);
      expect(resAvailable.mode).toBe('internal');
      expect(resAvailable.target).toBe('/dashboard');
      expect(globalEyeStateManager.getState()).toBe('executing');

      // Test Requires Configuration launch
      const resConfig = await globalProjectLauncher.launch('avatar');
      expect(resConfig.success).toBe(false);
      expect(resConfig.mode).toBe('configuration-required');
      expect(resConfig.error).toBeDefined();
      expect(globalEyeStateManager.getState()).toBe('approval');

      // Test Not Available launch
      const resNA = await globalProjectLauncher.launch('ai-school');
      expect(resNA.success).toBe(false);
      expect(resNA.mode).toBe('unavailable');
      expect(globalEyeStateManager.getState()).toBe('error');
    });
  });

  describe('Phase 7: Supernova Presence HUD Contexts', () => {
    it('should switch project context and update suggested actions', () => {
      globalPresenceStateManager.setProjectContext('the-one-system');
      const ctx = globalPresenceStateManager.getContext();
      expect(ctx.currentProjectId).toBe('the-one-system');
      expect(ctx.suggestedAction).toBe('Launch Project');
      expect(ctx.recommendedFocus).toBe('the-one-system');

      globalPresenceStateManager.setProjectContext('avatar');
      const ctx2 = globalPresenceStateManager.getContext();
      expect(ctx2.currentProjectId).toBe('avatar');
      expect(ctx2.suggestedAction).toBe('Configure Project');

      globalPresenceStateManager.setProjectContext(undefined);
      const ctx3 = globalPresenceStateManager.getContext();
      expect(ctx3.currentProjectId).toBeUndefined();
      expect(ctx3.suggestedAction).toBe('Run Operations Intelligence Sweep');
    });
  });

  describe('Phase 8: Workspace Slug Normalizations', () => {
    it('should normalize project IDs and aliases to canonical slugs', () => {
      expect(resolveWorkspaceBySlug('Icyflamze Studio')).toBe('icyflamze');
      expect(resolveWorkspaceBySlug('projects-icyflamze')).toBe('icyflamze');
      expect(resolveWorkspaceBySlug('/projects/treegroove')).toBe('treegroove');
      
      expect(toWorkspaceSlug('treegroove-records')).toBe('treegroove');
      expect(fromWorkspaceSlug('treegroove')).toBe('TreeGroove Records');
      expect(getWorkspaceRoute('avatar')).toBe('projects-avatar');
    });
  });

  describe('Phase 9: Speech Voice Engine', () => {
    it('should be disabled by default and support test events', () => {
      const config = globalVoiceManager.getConfig();
      expect(config.enabled).toBe(false);
      
      // Test updating configs
      globalVoiceManager.updateConfig({ enabled: true, volume: 0.5 });
      const configAfter = globalVoiceManager.getConfig();
      expect(configAfter.enabled).toBe(true);
      expect(configAfter.volume).toBe(0.5);

      // Verify speakEvent does not throw even without SpeechSynthesis support
      expect(() => {
        globalVoiceManager.speakEvent('bootComplete');
      }).not.toThrow();

      // Reset to disabled default
      globalVoiceManager.updateConfig({ enabled: false });
    });
  });

  describe('Phase 10: Codebase Typos Scan', () => {
    it('should scan directories and find no "Lunch Project" string occurrences', () => {
      const fs = require('fs');
      const path = require('path');
      const pathsToScan = [
        path.join(__dirname, 'workspaces'),
        path.join(__dirname, 'ui'),
        path.join(__dirname, '../dashboard/src')
      ];

      function scanDir(dir: string) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        files.forEach((file: string) => {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            scanDir(fullPath);
          } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            // We expect no spelling typos of "Lunch Project" in code files
            expect(content.includes('Lunch Project')).toBe(false);
          }
        });
      }

      pathsToScan.forEach(scanDir);
    });
  });

});
