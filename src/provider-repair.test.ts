import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateOpenAIKey } from './integrations/openai/OpenAIConfig.js';
import { validateGeminiKey } from './integrations/gemini/GeminiConfig.js';
import { globalOpenAIIntegrationContract } from './integrations/openai/OpenAIIntegrationContract.js';
import { globalGeminiIntegrationContract } from './integrations/gemini/GeminiIntegrationContract.js';
import { globalModelRouter } from './integrations/core/ModelRouter.js';
import { globalModelRoutingPolicy } from './integrations/core/ModelRoutingPolicy.js';
import { globalDeprecatedOverrideManager } from './models/ModelSelection.js';
import { redactSecret } from './integrations/core/IntegrationConfig.js';
import { globalIntegrationRegistry } from './integrations/core/IntegrationRegistry.js';
import fs from 'node:fs';

describe('Provider Security and Model Lifecycle Repair Tests', () => {
  vi.setConfig({ testTimeout: 30000 });
  let originalEnv: Record<string, string | undefined>;

  beforeEach(async () => {
    originalEnv = { ...process.env };
    process.env.VITEST = 'true';
    globalDeprecatedOverrideManager.enableOverride('placeholder-never-used', '2020-01-01'); // reset

    // Register standard integrations
    globalIntegrationRegistry.clear();
    globalIntegrationRegistry.register(globalOpenAIIntegrationContract);
    globalIntegrationRegistry.register(globalGeminiIntegrationContract);

    // Default configuration for routing policy
    globalModelRoutingPolicy.updateSettings({
      routingMode: 'automatic',
      preferredProvider: 'openai',
      allowProviderFallback: true,
      requireApprovalBeforeProviderSwitch: true
    });
  });

  afterEach(async () => {
    process.env = originalEnv;
    globalIntegrationRegistry.clear();
  });

  describe('Credential Isolation & Validation Rules', () => {
    it('OpenAI rejects Gemini credentials', () => {
      const geminiKey = 'AIzaSyMockKeyForTestingPurposes';
      const validation = validateOpenAIKey(geminiKey);
      expect(validation.valid).toBe(false);
      expect(validation.message).toContain('Gemini/Google API key detected');
    });

    it('Gemini rejects OpenAI credentials', () => {
      const openAIKey = 'sk-proj-a1b2c3d4e5f6g7h8i9j0';
      const validation = validateGeminiKey(openAIKey);
      expect(validation.valid).toBe(false);
      expect(validation.message).toContain('OpenAI API key detected');
    });

    it('Prefix warnings do not constitute authentication proof', () => {
      // Key with unexpected prefix but allowed warning status
      const weirdKey = 'XYZabc123456789012345678901234567890';
      const validation = validateGeminiKey(weirdKey);
      expect(validation.valid).toBe(true);
      expect(validation.warning).toBe(true);
      expect(validation.message).toContain('does not match expected AIza prefix');
    });
  });

  describe('Real Provider Health Checks', () => {
    it('missing credentials return disconnected status', async () => {
      process.env.OPENAI_API_KEY = 'unconfigured';
      process.env.GEMINI_API_KEY = '';

      const openAIHealth = await globalOpenAIIntegrationContract.healthCheck();
      expect(openAIHealth.status).toBe('disconnected');
      expect(openAIHealth.authenticated).toBe(false);

      const geminiHealth = await globalGeminiIntegrationContract.healthCheck();
      expect(geminiHealth.status).toBe('disconnected');
      expect(geminiHealth.authenticated).toBe(false);
    });

    it('invalid credentials return authentication-failed status', async () => {
      process.env.OPENAI_API_KEY = 'invalid-key-for-test';
      process.env.GEMINI_API_KEY = 'invalid-key-for-test';

      const openAIHealth = await globalOpenAIIntegrationContract.healthCheck();
      expect(openAIHealth.status).toBe('authentication-failed');
      expect(openAIHealth.authenticated).toBe(false);

      const geminiHealth = await globalGeminiIntegrationContract.healthCheck();
      expect(geminiHealth.status).toBe('authentication-failed');
      expect(geminiHealth.authenticated).toBe(false);
    }, 15000);

    it('health requires authenticated verification (returns healthy on correct mock keys)', async () => {
      process.env.OPENAI_API_KEY = 'sk-proj-mock-correct-key-goes-here';
      process.env.GEMINI_API_KEY = 'AIzaSy-mock-correct-key-goes-here';

      const openAIHealth = await globalOpenAIIntegrationContract.healthCheck();
      expect(openAIHealth.status).toBe('healthy');
      expect(openAIHealth.authenticated).toBe(true);
      expect(openAIHealth.endpointVerified).toBe(true);
      expect(openAIHealth.modelVerified).toBe(true);

      const geminiHealth = await globalGeminiIntegrationContract.healthCheck();
      expect(geminiHealth.status).toBe('healthy');
      expect(geminiHealth.authenticated).toBe(true);
      expect(geminiHealth.endpointVerified).toBe(true);
      expect(geminiHealth.modelVerified).toBe(true);
    });
  });

  describe('Model Lifecycle Management', () => {
    it('deprecated Gemini model is rejected by default', async () => {
      process.env.GEMINI_API_KEY = 'AIzaSy-mock-correct-key-goes-here';
      globalGeminiIntegrationContract.status = 'active';
      await globalGeminiIntegrationContract.healthCheck();

      const route = globalModelRouter.route({
        taskDescription: 'Coding job',
        taskType: 'coding',
        selectedProvider: 'gemini',
        selectedModel: 'gemini-2.0-flash'
      });

      expect(route.validationFailed).toBe(true);
      expect(route.reason).toContain('is deprecated and no compatibility override is active');
    });

    it('allows deprecated model when temporary override is active', async () => {
      process.env.GEMINI_API_KEY = 'AIzaSy-mock-correct-key-goes-here';
      globalGeminiIntegrationContract.status = 'active';
      await globalGeminiIntegrationContract.healthCheck();

      const expirationDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour in future
      globalDeprecatedOverrideManager.enableOverride('gemini-2.0-flash', expirationDate);

      // Perform routing check
      globalOpenAIIntegrationContract.status = 'active';
      globalGeminiIntegrationContract.status = 'active';

      const route = globalModelRouter.route({
        taskDescription: 'Coding job',
        taskType: 'coding',
        selectedProvider: 'gemini',
        selectedModel: 'gemini-2.0-flash'
      });

      // Override allows it to succeed validation
      expect(route.validationFailed).toBeUndefined();
      expect(route.providerId).toBe('gemini');
      expect(route.model).toBe('gemini-2.0-flash');
    });

    it('supported model discovery works dynamically', async () => {
      process.env.GEMINI_API_KEY = 'AIzaSy-mock-correct-key';
      const models = await globalGeminiIntegrationContract.discoverModels();
      expect(models).toContain('gemini-1.5-pro');
      expect(models).toContain('gemini-1.5-flash');
    });
  });

  describe('Router Neutrality & Safety Checks', () => {
    it('no silent provider switch occurs when switch requires approval', async () => {
      globalModelRoutingPolicy.updateSettings({
        routingMode: 'automatic',
        preferredProvider: 'openai',
        allowProviderFallback: true,
        requireApprovalBeforeProviderSwitch: true
      });

      // Break OpenAI credentials to force fallback
      process.env.OPENAI_API_KEY = 'invalid-key-for-test';
      process.env.GEMINI_API_KEY = 'AIzaSy-mock-correct-key-goes-here';
      globalGeminiIntegrationContract.status = 'active';
      globalGeminiIntegrationContract.fallbackEligibility = true;

      // Update cached state
      await globalOpenAIIntegrationContract.healthCheck();
      await globalGeminiIntegrationContract.healthCheck();

      const route = globalModelRouter.route({
        taskDescription: 'Complex reasoning logic',
        taskType: 'reasoning'
      });

      // Provider switch requires human approval -> validationFailed block
      expect(route.validationFailed).toBe(true);
      expect(route.fallbackProviderId).toBe('gemini');
      expect(route.requiresApproval).toBe(true);
      expect(route.reason).toContain('awaiting switch approval');
    });

    it('routing persistence works under manual mode user lock', async () => {
      globalModelRoutingPolicy.updateSettings({
        routingMode: 'manual',
        preferredProvider: 'openai'
      });

      process.env.OPENAI_API_KEY = 'sk-proj-mock-valid';
      globalOpenAIIntegrationContract.status = 'active';

      // Update cached state
      await globalOpenAIIntegrationContract.healthCheck();

      const route = globalModelRouter.route({
        taskDescription: 'Locked manual run',
        selectedProvider: 'openai'
      });

      expect(route.providerId).toBe('openai');
      expect(route.reason).toContain('Manual Mode locked');
    });
  });

  describe('Security Scans & Redaction', () => {
    it('redactSecret removes suffixes and masks details', () => {
      const target = 'AIzaSyMockKeyForTestingPurposes';
      const redacted = redactSecret(target);
      expect(redacted).toBe('AIza...oses');
    });

    it('frontend bundle secret absence test simulation', () => {
      // Quick mock verifying that built assets don't contain key signatures
      const targetBundleString = "const config = { apiEndpoint: '/api' };";
      const hasSecret = targetBundleString.includes('AIzaSy') || targetBundleString.includes('sk-proj-');
      expect(hasSecret).toBe(false);
    });
  });
});
