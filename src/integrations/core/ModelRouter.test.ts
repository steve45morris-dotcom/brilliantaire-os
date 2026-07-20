import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { globalIntegrationRegistry } from './IntegrationRegistry.js';
import { globalModelRoutingPolicy } from './ModelRoutingPolicy.js';
import { globalModelRouter } from './ModelRouter.js';
import { globalOpenAIIntegrationContract } from '../openai/OpenAIIntegrationContract.js';
import { globalGeminiIntegrationContract } from '../gemini/GeminiIntegrationContract.js';
import { globalAnthropicIntegrationContract } from '../anthropic/AnthropicIntegrationContract.js';
import { globalLocalIntegrationContract } from './LocalIntegrationContract.js';

describe('Model Router & Provider Neutrality Tests', () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(async () => {
    originalEnv = { ...process.env };
    process.env.VITEST = 'true';
    process.env.OPENAI_API_KEY = 'sk-proj-mock-correct-key-goes-here';
    process.env.GEMINI_API_KEY = 'AIzaSy-mock-correct-key-goes-here';

    // Reset integration statuses
    globalOpenAIIntegrationContract.status = 'active';
    globalGeminiIntegrationContract.status = 'disabled';
    globalAnthropicIntegrationContract.status = 'disabled';
    globalLocalIntegrationContract.status = 'disabled';

    // Clear and register
    globalIntegrationRegistry.clear();
    globalIntegrationRegistry.register(globalOpenAIIntegrationContract);
    globalIntegrationRegistry.register(globalGeminiIntegrationContract);
    globalIntegrationRegistry.register(globalAnthropicIntegrationContract);
    globalIntegrationRegistry.register(globalLocalIntegrationContract);

    // Reset routing policy defaults
    globalModelRoutingPolicy.updateSettings({
      routingMode: 'automatic',
      preferredProvider: 'openai',
      preferredFastProvider: 'openai',
      preferredReasoningProvider: 'openai',
      preferredCodingProvider: 'openai',
      allowProviderFallback: true,
      requireApprovalBeforeProviderSwitch: true,
      maxEstimatedCostPerRequest: 0.50
    });

    // Run healthCheck to cache the healthy state
    await globalOpenAIIntegrationContract.healthCheck();
    await globalGeminiIntegrationContract.healthCheck();
  });

  afterEach(() => {
    process.env = originalEnv;
  });


  it('should route to the preferred provider in automatic mode', () => {
    const route = globalModelRouter.route({
      taskDescription: 'Explain quantum computing simply',
      taskType: 'fast'
    });

    expect(route.providerId).toBe('openai');
    expect(route.requiresApproval).toBe(false);
    expect(route.role).toBe('fast');
  });

  it('should respect manual mode lock and provider selection', () => {
    globalModelRoutingPolicy.updateSettings({
      routingMode: 'manual',
      preferredProvider: 'openai'
    });

    const route = globalModelRouter.route({
      taskDescription: 'Coding help',
      selectedProvider: 'local',
      taskType: 'coding'
    });

    expect(route.providerId).toBe('local');
    expect(route.reason).toContain('Manual Mode locked');
  });

  it('should trigger fallback when preferred provider is unavailable', () => {
    // Disable primary provider
    globalOpenAIIntegrationContract.status = 'suspended';

    // Make Gemini active and eligible for fallback
    globalGeminiIntegrationContract.status = 'active';
    globalGeminiIntegrationContract.fallbackEligibility = true;

    const route = globalModelRouter.route({
      taskDescription: 'Write a python script',
      taskType: 'coding'
    });

    // Since requireApprovalBeforeProviderSwitch is true, it should route to the fallback model
    // but flag requiresApproval as true
    expect(route.fallbackProviderId).toBe('gemini');
    expect(route.requiresApproval).toBe(true);
  });

  it('should flag approval required when request exceeds cost limit', () => {
    globalModelRoutingPolicy.updateSettings({
      maxEstimatedCostPerRequest: 0.001 // tiny cost limit
    });

    const route = globalModelRouter.route({
      taskDescription: 'Heavy reasoning task',
      taskType: 'reasoning'
    });

    expect(route.requiresApproval).toBe(true);
  });

  it('should auto-switch fallback when approval is not required for switches', () => {
    globalOpenAIIntegrationContract.status = 'suspended';
    globalGeminiIntegrationContract.status = 'active';
    globalGeminiIntegrationContract.fallbackEligibility = true;

    globalModelRoutingPolicy.updateSettings({
      requireApprovalBeforeProviderSwitch: false
    });

    const route = globalModelRouter.route({
      taskDescription: 'Write a typescript plugin',
      taskType: 'coding'
    });

    expect(route.providerId).toBe('gemini');
    expect(route.reason).toContain('Auto-switched to fallback provider');
  });
});
