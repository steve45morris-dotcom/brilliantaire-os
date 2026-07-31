import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import { globalModelRegistry } from './ModelRegistry.js';
import { globalModelConfigManager, recommendedDefaults, defaultProviderStatuses, ModelConfigurationManager } from './ModelConfiguration.js';
import { globalModelSelector } from './ModelSelection.js';
import { globalModelHealthService } from './ModelHealth.js';
import { getModelCapabilities, generateCapabilityMatrix, verifyModelCapability } from './ModelCapabilities.js';
import { globalPresenceStateManager } from '../ui/supernova/PresenceStateManager.js';
import { globalRecommendationEngine } from '../intelligence/RecommendationEngine.js';
import { globalIntelligenceRegistry } from '../intelligence/IntelligenceRegistry.js';
import { globalEventBus } from '../kernel/events/EventBus.js';

describe('AI Model Orchestration Configuration (AMOC) Tests', () => {
  beforeEach(() => {
    // Reset configuration and registry to defaults
    globalModelConfigManager.updateAssignments(recommendedDefaults);
    for (const [provider, status] of Object.entries(defaultProviderStatuses)) {
      globalModelConfigManager.updateProviderStatus(provider as any, status);
    }
    globalModelRegistry.resetToDefaults();
    globalIntelligenceRegistry.clear();
  });

  describe('Phase 1: Model Registry & Capabilities', () => {
    it('should register default model profiles correctly', () => {
      const models = globalModelRegistry.getAllModels();
      expect(models.length).toBeGreaterThan(0);

      const gemini = globalModelRegistry.getModel('gemini-1.5-pro');
      expect(gemini).toBeDefined();
      expect(gemini?.displayName).toBe('Gemini 1.5 Pro');
      expect(gemini?.provider).toBe('Google Gemini');
      expect(gemini?.contextWindow).toBe(2000000);
    });

    it('should extract correct capabilities for models', () => {
      const gemini = globalModelRegistry.getModel('gemini-1.5-pro')!;
      const caps = getModelCapabilities(gemini);
      expect(caps).toContain('Coding');
      expect(caps).toContain('Reasoning');
      expect(caps).toContain('Vision');
      expect(caps).toContain('Large Context');

      expect(verifyModelCapability(gemini, 'Coding')).toBe(true);
      expect(verifyModelCapability(gemini, 'Voice')).toBe(true);
    });

    it('should generate a comparison capabilities matrix', () => {
      const models = globalModelRegistry.getAllModels();
      const matrix = generateCapabilityMatrix(models);
      expect(matrix.length).toBe(models.length);
      
      const geminiMatrix = matrix.find(m => m.modelId === 'gemini-1.5-pro')!;
      expect(geminiMatrix.capabilities).toContain('Coding');
      expect(geminiMatrix.speed).toBe('medium');
      expect(geminiMatrix.cost).toBe('medium');
    });
  });

  describe('Phase 2 & 5: Default Model Roles & Assignments', () => {
    it('should retrieve default assignments correctly', () => {
      const builderModel = globalModelConfigManager.getPreferredModel('Builder');
      expect(builderModel).toBe('gemini-1.5-pro');

      const reviewerModel = globalModelConfigManager.getPreferredModel('Architecture Reviewer');
      expect(reviewerModel).toBe('claude-3-5-sonnet');
    });

    it('should allow modifying assignments', () => {
      globalModelConfigManager.updateAssignments({ Builder: 'claude-3-5-sonnet' });
      expect(globalModelConfigManager.getPreferredModel('Builder')).toBe('claude-3-5-sonnet');
    });
  });

  describe('Phase 3 & 11: Provider Availability & Health Checks', () => {
    it('should check provider credential status and health', () => {
      const geminiHealth = globalModelHealthService.getProviderHealth('Google Gemini');
      expect(geminiHealth.status).toBe('Available');
      expect(geminiHealth.details).toContain('operational');

      const openSourceHealth = globalModelHealthService.getProviderHealth('Open Source');
      expect(openSourceHealth.status).toBe('Unavailable');
    });

    it('should simulate connection testing correctly', async () => {
      const geminiTest = await globalModelHealthService.testConnection('Google Gemini');
      expect(geminiTest.success).toBe(true);
      expect(geminiTest.latencyMs).toBe(90);

      const openSourceTest = await globalModelHealthService.testConnection('Open Source');
      expect(openSourceTest.success).toBe(false);
      expect(openSourceTest.message).toContain('unreachable');
    });
  });

  describe('Phase 5 & 11: Settings Persistence', () => {
    it('should save settings to disk and load them back', () => {
      // Modify and save
      globalModelConfigManager.updateAssignments({ Builder: 'local-llama3' });
      
      // Instantiate new configuration manager to trigger file load
      const newManager = new ModelConfigurationManager();
      
      expect(newManager.getPreferredModel('Builder')).toBe('local-llama3');
      
      // Clean up file by restoring defaults
      globalModelConfigManager.updateAssignments(recommendedDefaults);
    });
  });

  describe('Phase 7: Supernova Presence display & selector fallbacks', () => {
    it('should automatically resolve and update active model in presence context', () => {
      // Setup presence state
      globalPresenceStateManager.setState('executing'); // mapped to Builder
      
      const ctx = globalPresenceStateManager.getContext();
      expect(ctx.activeModelRole).toBe('Builder');
      expect(ctx.activeModelId).toBe('gemini-1.5-pro');
      expect(ctx.activeModelProvider).toBe('Google Gemini');
      expect(ctx.activeModelReason).toContain('Optimized for large TypeScript implementation');
    });

    it('should fall back to available model if preferred model is unavailable', () => {
      // Make Gemini unavailable
      globalModelConfigManager.updateProviderStatus('Google Gemini', 'Unavailable');
      
      // Query builder selection (which normally selects gemini-1.5-pro)
      const selection = globalModelSelector.selectModel('Builder');
      expect(selection.model.id).not.toBe('gemini-1.5-pro');
      expect(selection.model.status).toBe('Available'); // Falls back to available e.g. claude-3-5-sonnet
      expect(selection.reason).toContain('is unavailable. Re-routed to available fallback');
      
      // Restore Gemini status
      globalModelConfigManager.updateProviderStatus('Google Gemini', 'Available');
    });
  });

  describe('Phase 8 & 9: Model Recommendations & Approval Loops', () => {
    it('should generate recommendations when assignments differ from recommended', () => {
      // Set builder to local-llama3
      globalModelConfigManager.updateAssignments({ Builder: 'local-llama3' });
      
      globalRecommendationEngine.generateRecommendations();
      const recs = globalIntelligenceRegistry.getRecommendations();
      
      const builderRec = recs.find(r => r.id.startsWith('rec-model-builder-'));
      expect(builderRec).toBeDefined();
      expect(builderRec?.title).toBe('Optimize Builder Assignment');
      expect(builderRec?.metadata?.modelId).toBe('gemini-1.5-pro');
    });

    it('should apply model assignment when recommendation is approved', async () => {
      globalModelConfigManager.updateAssignments({ Builder: 'local-llama3' });
      
      // Generate recommendations
      globalRecommendationEngine.generateRecommendations();
      const recs = globalIntelligenceRegistry.getRecommendations();
      const builderRec = recs.find(r => r.id.startsWith('rec-model-builder-'))!;
      
      // Accept recommendation
      globalIntelligenceRegistry.logFeedback(builderRec.id, 'accepted');
      
      // Allow async dynamic import and update assignments to trigger
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(globalModelConfigManager.getPreferredModel('Builder')).toBe('gemini-1.5-pro');
    });
  });

  describe('Phase 9: Voice changes event emission', () => {
    it('should emit assignment changed event which is handled by VoiceManager', () => {
      const publishSpy = vi.spyOn(globalEventBus, 'publish');
      
      globalModelConfigManager.updateAssignments({ Builder: 'claude-3-5-sonnet' });
      
      expect(publishSpy).toHaveBeenCalledWith('ModelAssignmentChanged', expect.objectContaining({
        role: 'Builder',
        newModelId: 'claude-3-5-sonnet'
      }));
    });
  });

  describe('Explainability & Selection History Logs', () => {
    it('should return selection details including confidence, expectedBenefit, tradeoffs, and alternative', () => {
      const selection = globalModelSelector.selectModel('Builder');
      expect(selection.confidence).toBeDefined();
      expect(selection.expectedBenefit).toBeDefined();
      expect(selection.tradeoffs).toBeDefined();
      expect(selection.suggestedAlternative).toBeDefined();
      expect(selection.suggestedAlternativeReason).toBeDefined();
    });

    it('should log model selection to history and allow clearing history', () => {
      globalModelSelector.clearHistory();
      expect(globalModelSelector.getHistory().length).toBe(0);

      globalModelSelector.selectModel('Builder', 'custom-task');
      const history = globalModelSelector.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].role).toBe('Builder');
      expect(history[0].taskType).toBe('custom-task');
      expect(history[0].override).toBeDefined();
    });
  });
});

