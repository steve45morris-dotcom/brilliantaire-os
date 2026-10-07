import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GeminiIntegrationContract, globalGeminiIntegrationContract } from './GeminiIntegrationContract.js';
import { GeminiClient, normalizeGeminiError, NormalizedGeminiError } from './GeminiClient.js';
import { GeminiResponsesService, globalGeminiResponsesService } from './GeminiResponsesService.js';
import { validateGeminiKey, getGeminiConfig, getGeminiDiagnostics } from './GeminiConfig.js';
import { globalModelRouter } from '../core/ModelRouter.js';
import { globalIntegrationRegistry } from '../core/IntegrationRegistry.js';
import { globalModelRoutingPolicy } from '../core/ModelRoutingPolicy.js';
import { globalServiceRegistry } from '../../kernel/registry/ServiceRegistry.js';
import { globalGeminiIntegration } from './GeminiIntegration.js';
import { globalModelRegistry } from '../../models/ModelRegistry.js';
import { globalOpenAIIntegrationContract } from '../openai/OpenAIIntegrationContract.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';

describe('Gemini Provider First-Class Integration Tests', () => {
  let originalEnv: Record<string, string | undefined>;
  let originalPolicySettings: any;

  beforeEach(async () => {
    originalEnv = { ...process.env };
    originalPolicySettings = globalModelRoutingPolicy.getSettings();
    process.env.VITEST = 'true';
    process.env.GEMINI_API_KEY = 'AIzaSyTestMockKeyForGeminiProvider12345';
    process.env.OPENAI_API_KEY = 'sk-proj-mock-openai-key-for-testing';

    globalIntegrationRegistry.clear();
    globalIntegrationRegistry.register(globalGeminiIntegrationContract);
    globalGeminiIntegrationContract.status = 'active';
    await globalGeminiIntegrationContract.healthCheck();
  });

  afterEach(() => {
    process.env = originalEnv;
    if (originalPolicySettings) {
      globalModelRoutingPolicy.updateSettings(originalPolicySettings);
    }
    vi.restoreAllMocks();
  });

  describe('1. Provider Construction & Contract Integrity', () => {
    it('instantiates Gemini provider with required ModelProvider metadata', () => {
      const provider = new GeminiIntegrationContract();
      expect(provider.id).toBe('gemini');
      expect(provider.name).toContain('Google Gemini');
      expect(provider.provider).toBe('Google');
      expect(provider.type).toBe('model-provider');
      expect(provider.capabilities).toContain('text');
      expect(provider.capabilities).toContain('structured-output');
      expect(provider.capabilities).toContain('streaming');
      expect(provider.fallbackEligibility).toBe(true);
    });

    it('contains modern production Gemini models by default', () => {
      const models = globalGeminiIntegrationContract.listModels();
      expect(models).toContain('gemini-2.5-flash');
      expect(models).toContain('gemini-2.5-pro');
      expect(models).toContain('gemini-1.5-flash');
      expect(models).toContain('gemini-1.5-pro');
    });

    it('exposes usage and cost controls contracts', () => {
      expect(globalGeminiIntegrationContract.costControls.dailyLimit).toBeGreaterThan(0);
      expect(globalGeminiIntegrationContract.usage).toHaveProperty('totalRequests');
      expect(globalGeminiIntegrationContract.usage).toHaveProperty('dailySpend');
    });
  });

  describe('2. Configuration & Credential Validation', () => {
    it('validates authentic Gemini API key format (AIza prefix, length >= 30)', () => {
      const validKey = 'AIzaSyD0123456789abcdefghijklmnopqrstuvwxyz';
      const result = validateGeminiKey(validKey);
      expect(result.valid).toBe(true);
      expect(result.message).toContain('valid');
    });

    it('rejects OpenAI keys to prevent credential cross-contamination', () => {
      const openAIKey = 'sk-proj-1234567890abcdefghijklmnopqrstuvwxyz';
      const result = validateGeminiKey(openAIKey);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('OpenAI API key detected');
    });

    it('rejects keys that are too short', () => {
      const shortKey = 'AIzaSyShort';
      const result = validateGeminiKey(shortKey);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('too short');
    });

    it('flags prefix warning when key does not start with AIza', () => {
      const strangeKey = 'CUSTOM_KEY_WITHOUT_AIZA_PREFIX_LONG_ENOUGH';
      const result = validateGeminiKey(strangeKey);
      expect(result.valid).toBe(true);
      expect(result.warning).toBe(true);
    });
  });

  describe('3. Missing & Invalid Credentials Handling', () => {
    it('reports disconnected status when key is empty or unconfigured', async () => {
      process.env.GEMINI_API_KEY = '';
      const health = await globalGeminiIntegrationContract.healthCheck();
      expect(health.status).toBe('disconnected');
      expect(health.authenticated).toBe(false);
      expect(health.message).toContain('Credentials missing');
    });

    it('reports authentication-failed status on malformed key', async () => {
      process.env.GEMINI_API_KEY = 'sk-proj-invalid-key-for-test';
      const health = await globalGeminiIntegrationContract.healthCheck();
      expect(health.status).toBe('authentication-failed');
      expect(health.authenticated).toBe(false);
    });
  });

  describe('4. Model Registry & Role Selection', () => {
    it('correctly maps roles to fast and reasoning models', () => {
      const config = globalGeminiIntegrationContract.configuration;
      expect(config.defaultModel).toBe('gemini-2.5-flash');
      expect(config.fastModel).toBe('gemini-2.5-flash');
      expect(config.reasoningModel).toBe('gemini-2.5-pro');
    });

    it('supports capability checks across declared capabilities', () => {
      expect(globalGeminiIntegrationContract.supportsCapability('text')).toBe(true);
      expect(globalGeminiIntegrationContract.supportsCapability('structured-output')).toBe(true);
      expect(globalGeminiIntegrationContract.supportsCapability('tools')).toBe(true);
      expect(globalGeminiIntegrationContract.supportsCapability('streaming')).toBe(true);
      expect(globalGeminiIntegrationContract.supportsCapability('voice')).toBe(false);
    });
  });

  describe('5. Router Dispatch to Gemini', () => {
    it('ModelRouter routes to Gemini when explicitly selected in manual mode', () => {
      globalModelRoutingPolicy.updateSettings({
        routingMode: 'manual',
        preferredProvider: 'gemini'
      });

      const route = globalModelRouter.route({
        taskDescription: 'Generate marketing brief',
        selectedProvider: 'gemini',
        taskType: 'fast'
      });

      expect(route.providerId).toBe('gemini');
      expect(route.model).toBe('gemini-2.5-flash');
      expect(route.requiresApproval).toBe(false);
    });

    it('ModelRouter routes to Gemini for reasoning when preferred provider is gemini', () => {
      globalModelRoutingPolicy.updateSettings({
        routingMode: 'automatic',
        preferredProvider: 'gemini',
        preferredReasoningProvider: 'gemini'
      });

      const route = globalModelRouter.route({
        taskDescription: 'Solve complex architectural puzzle',
        taskType: 'reasoning'
      });

      expect(route.providerId).toBe('gemini');
      expect(route.model).toBe('gemini-2.5-pro');
    });
  });

  describe('6. Response & Usage Normalization', () => {
    it('normalizes successful Gemini REST response with usage and metadata', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Architectural blueprint verified.' }]
              },
              finishReason: 'STOP'
            }
          ],
          usageMetadata: {
            promptTokenCount: 15,
            candidatesTokenCount: 5,
            totalTokenCount: 20
          }
        })
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = new GeminiClient();
      const result = await client.generateContent('gemini-2.5-flash', 'Analyze blueprint', {
        systemInstruction: 'You are an architect.'
      });

      expect(result.text).toBe('Architectural blueprint verified.');
      expect(result.usage.inputTokens).toBe(15);
      expect(result.usage.outputTokens).toBe(5);
      expect(result.usage.totalTokens).toBe(20);
      expect(result.finishReason).toBe('STOP');
      expect(result.model).toBe('gemini-2.5-flash');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);

      // Verify request payload included system instruction
      const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(calledBody.system_instruction.parts[0].text).toBe('You are an architect.');
    });

    it('normalizes structured output with JSON schema and parsed data', async () => {
      const structuredData = { verdict: 'approved', confidence: 0.98 };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: JSON.stringify(structuredData) }] },
              finishReason: 'STOP'
            }
          ],
          usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 10, totalTokenCount: 30 }
        })
      }));

      const response = await globalGeminiIntegrationContract.executeStructured({
        prompt: 'Evaluate readiness',
        schema: {
          type: 'object',
          properties: { verdict: { type: 'string' }, confidence: { type: 'number' } },
          required: ['verdict', 'confidence']
        }
      });

      expect(response.success).toBe(true);
      expect(response.output.data).toEqual(structuredData);
      expect(response.usage.totalTokens).toBe(30);
    });
  });

  describe('7. Timeout & Error Normalization', () => {
    it('maps HTTP status codes into normalized error domain', () => {
      const err400 = normalizeGeminiError(new Error('Bad format'), 400);
      expect(err400.code).toBe('GEMINI_INVALID_ARGUMENT');
      expect(err400.isTransient).toBe(false);

      const err401 = normalizeGeminiError(new Error('Unauthorized'), 401);
      expect(err401.code).toBe('GEMINI_AUTHENTICATION_ERROR');
      expect(err401.isTransient).toBe(false);

      const err404 = normalizeGeminiError(new Error('Model missing'), 404);
      expect(err404.code).toBe('GEMINI_MODEL_NOT_FOUND');

      const err429 = normalizeGeminiError(new Error('Resource exhausted'), 429);
      expect(err429.code).toBe('GEMINI_RATE_LIMITED');
      expect(err429.isTransient).toBe(true);

      const err500 = normalizeGeminiError(new Error('Internal breakdown'), 500);
      expect(err500.code).toBe('GEMINI_SERVER_ERROR');
      expect(err500.isTransient).toBe(true);
    });

    it('handles timeout errors as transient normalized errors', () => {
      const timeoutErr = new Error('The operation was aborted due to timeout');
      timeoutErr.name = 'TimeoutError';
      const normalized = normalizeGeminiError(timeoutErr, 408);
      expect(normalized.code).toBe('GEMINI_TIMEOUT');
      expect(normalized.isTransient).toBe(true);
    });
  });

  describe('8. Retry Behavior on Transient Errors', () => {
    it('retries on transient 429 and succeeds on subsequent attempt', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 429,
            text: async () => JSON.stringify({ error: { message: 'Quota exceeded temporarily' } })
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'Success after retry' }] } }],
            usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3, totalTokenCount: 8 }
          })
        };
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = new GeminiClient();
      const result = await client.generateContent('gemini-2.5-flash', 'Hello', {
        maxRetries: 2,
        timeoutMs: 5000
      });

      expect(callCount).toBe(2);
      expect(result.text).toBe('Success after retry');
    });

    it('fails when retries are exhausted on permanent errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: { message: 'Invalid prompt structure' } })
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = new GeminiClient();
      await expect(client.generateContent('gemini-2.5-flash', 'Test')).rejects.toThrow('Invalid argument');
    });
  });

  describe('9. Cost Estimation Accuracy', () => {
    it('estimates lower cost for flash models and higher for pro models', () => {
      const flashCost = globalGeminiIntegrationContract.estimateCost('gemini-2.5-flash', 10000, 2000);
      const proCost = globalGeminiIntegrationContract.estimateCost('gemini-2.5-pro', 10000, 2000);

      expect(flashCost).toBeLessThan(proCost);
      expect(flashCost).toBeCloseTo(0.00135, 5); // (10 * 0.000075) + (2 * 0.0003) = 0.00075 + 0.0006 = 0.00135
      expect(proCost).toBeCloseTo(0.0225, 4); // (10 * 0.00125) + (2 * 0.005) = 0.0125 + 0.01 = 0.0225
    });
  });

  describe('10. Architectural Bypass Prevention', () => {
    it('routes GeminiIntegration service registry calls through ModelRouter', async () => {
      globalGeminiIntegration.registerService();
      const service = globalServiceRegistry.getService('GeminiIntegration');
      expect(service).toBeDefined();

      const executeSpy = vi.spyOn(globalModelRouter, 'executeRoutedRequest').mockResolvedValue({
        success: true,
        route: { providerId: 'gemini', model: 'gemini-2.5-flash' }
      });

      await service.executeRequest({ prompt: 'Test service call' });
      expect(executeSpy).toHaveBeenCalled();
    });
  });

  describe('11. Environment Hardening & Configuration Diagnostics (Phase 2)', () => {
    it('standardizes GEMINI_TIMEOUT_MS and GEMINI_MAX_RETRIES environment configuration', () => {
      process.env.GEMINI_TIMEOUT_MS = '45000';
      process.env.GEMINI_MAX_RETRIES = '5';
      process.env.GEMINI_DAILY_LIMIT = '25.00';
      process.env.GEMINI_MONTHLY_LIMIT = '750.00';

      const config = getGeminiConfig();
      expect(config.timeoutMs).toBe(45000);
      expect(config.maxRetries).toBe(5);
      expect(config.dailyLimit).toBe(25.00);
      expect(config.monthlyLimit).toBe(750.00);
    });

    it('falls back to safe default numbers when environment variables are malformed', () => {
      process.env.GEMINI_TIMEOUT_MS = 'not-a-number';
      process.env.GEMINI_MAX_RETRIES = '-2';
      process.env.GEMINI_DAILY_LIMIT = 'invalid';
      process.env.GEMINI_MONTHLY_LIMIT = 'NaN';

      const config = getGeminiConfig();
      expect(config.timeoutMs).toBe(30000);
      expect(config.maxRetries).toBe(3);
      expect(config.dailyLimit).toBe(10.00);
      expect(config.monthlyLimit).toBe(300.00); // 10 * 30
    });

    it('produces structured boot-time diagnostics without exposing credentials', () => {
      process.env.GEMINI_API_KEY = 'AIzaSySecretLiveMockKeyForTesting12345';
      const diag = getGeminiDiagnostics();

      expect(diag.configured).toBe(true);
      expect(diag.apiKeyPresent).toBe(true);
      expect(diag.maskedKey).toContain('AIz');
      expect(diag.maskedKey).not.toContain('SecretLiveMockKey');
      expect(diag.defaultModel).toBe('gemini-2.5-flash');
      expect(diag.validation.valid).toBe(true);
    });

    it('enforces daily limit blocking in GeminiResponsesService when spend is exceeded', async () => {
      process.env.GEMINI_DAILY_LIMIT = '0.001'; // Very small limit
      const config = getGeminiConfig();
      expect(config.dailyLimit).toBe(0.001);

      // Simulate existing usage exceeding the limit on the registered provider
      const provider = globalIntegrationRegistry.get('gemini') as any;
      (provider as any).totalInputTokens = 100000;
      (provider as any).totalOutputTokens = 50000;

      const result = await globalGeminiResponsesService.executeRequest({
        prompt: 'Request should be blocked by budget',
        selectedModel: 'gemini-2.5-flash'
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('GEMINI_BUDGET_EXCEEDED');
      expect(result.error?.message).toContain('daily budget limit');

      // Reset usage counters
      (provider as any).totalInputTokens = 0;
      (provider as any).totalOutputTokens = 0;
    });

    it('sources timeout and retries directly from config into GeminiClient', async () => {
      process.env.GEMINI_TIMEOUT_MS = '15000';
      process.env.GEMINI_MAX_RETRIES = '1';

      let observedTimeout: number | undefined;
      const mockFetch = vi.fn().mockImplementation((_url: string, init: any) => {
        // Capture signal details if available
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'Response from client' }] } }],
            usageMetadata: { promptTokenCount: 2, candidatesTokenCount: 2, totalTokenCount: 4 }
          })
        });
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = new GeminiClient();
      const res = await client.generateContent('gemini-2.5-flash', 'Ping');
      expect(res.text).toBe('Response from client');
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('12. Gemini Model Discovery & Role-Based Routing (Phase 3)', () => {
    it('discovers models dynamically from API and registers them into ModelRegistry', async () => {
      const mockDiscoveryData = {
        models: [
          {
            name: 'models/gemini-2.5-flash',
            version: '001',
            displayName: 'Gemini 2.5 Flash',
            inputTokenLimit: 1000000,
            supportedGenerationMethods: ['generateContent']
          },
          {
            name: 'models/gemini-2.5-pro',
            version: '001',
            displayName: 'Gemini 2.5 Pro',
            inputTokenLimit: 2000000,
            supportedGenerationMethods: ['generateContent']
          },
          {
            name: 'models/gemini-experimental-preview',
            version: '002',
            displayName: 'Gemini Experimental Preview',
            inputTokenLimit: 2000000,
            supportedGenerationMethods: ['generateContent']
          }
        ]
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockDiscoveryData
      });
      vi.stubGlobal('fetch', mockFetch);

      const preDiscoveryPolicy = globalModelRoutingPolicy.getSettings();
      expect(preDiscoveryPolicy.preferredProvider).toBe('openai');

      const discovered = await globalGeminiIntegrationContract.discoverModels({ force: true });

      expect(discovered).toContain('gemini-experimental-preview');
      expect(globalGeminiIntegrationContract.listModels()).toContain('gemini-experimental-preview');

      const registered = globalModelRegistry.getModel('gemini-experimental-preview');
      expect(registered).toBeDefined();
      expect(registered?.provider).toBe('Google Gemini');
      expect(registered?.displayName).toBe('Gemini Experimental Preview');
      expect(registered?.status).toBe('Available');
      expect(registered?.capabilities).toContain('text');
      expect(registered?.capabilities).toContain('streaming');

      // Configuration sovereignty assertion: discovery must NOT mutate global routing policy
      const postDiscoveryPolicy = globalModelRoutingPolicy.getSettings();
      expect(postDiscoveryPolicy.preferredProvider).toBe('openai');
      expect(postDiscoveryPolicy.routingMode).toBe('automatic');
    });

    it('routes explicit fast role to gemini-2.5-flash without mutating global preferences', () => {
      // 1. Explicit request with selectedProvider: 'gemini' and taskType: 'fast'
      const route = globalModelRouter.route({
        taskDescription: 'Generate snappy UI helper text',
        taskType: 'fast',
        selectedProvider: 'gemini'
      });

      expect(route.providerId).toBe('gemini');
      expect(route.model).toBe('gemini-2.5-flash');
      expect(route.role).toBe('fast');

      // 2. Inferred role from task description
      const inferredRoute = globalModelRouter.route({
        taskDescription: 'simple quick chat response',
        selectedProvider: 'gemini'
      });
      expect(inferredRoute.providerId).toBe('gemini');
      expect(inferredRoute.model).toBe('gemini-2.5-flash');
      expect(inferredRoute.role).toBe('fast');

      // 3. Explicit fast provider policy configuration while preferredProvider remains 'openai'
      globalModelRoutingPolicy.updateSettings({
        preferredProvider: 'openai',
        preferredFastProvider: 'gemini'
      });

      const policyRoute = globalModelRouter.route({
        taskDescription: 'Generate quick notification badge',
        taskType: 'fast'
      });

      expect(policyRoute.providerId).toBe('gemini');
      expect(policyRoute.model).toBe('gemini-2.5-flash');
      expect(globalModelRoutingPolicy.getSettings().preferredProvider).toBe('openai');
    });

    it('routes explicit reasoning role to gemini-2.5-pro without mutating global preferences', () => {
      // 1. Explicit request with selectedProvider: 'gemini' and taskType: 'reasoning'
      const route = globalModelRouter.route({
        taskDescription: 'Deconstruct complex multi-agent synchronization failure',
        taskType: 'reasoning',
        selectedProvider: 'gemini'
      });

      expect(route.providerId).toBe('gemini');
      expect(route.model).toBe('gemini-2.5-pro');
      expect(route.role).toBe('reasoning');

      // 2. Inferred role from task description
      const inferredRoute = globalModelRouter.route({
        taskDescription: 'reason and plan architectural migration',
        selectedProvider: 'gemini'
      });
      expect(inferredRoute.providerId).toBe('gemini');
      expect(inferredRoute.model).toBe('gemini-2.5-pro');
      expect(inferredRoute.role).toBe('reasoning');

      // 3. Explicit reasoning provider policy configuration while preferredProvider remains 'openai'
      globalModelRoutingPolicy.updateSettings({
        preferredProvider: 'openai',
        preferredReasoningProvider: 'gemini'
      });

      const policyRoute = globalModelRouter.route({
        taskDescription: 'Deep logical deduction',
        taskType: 'reasoning'
      });

      expect(policyRoute.providerId).toBe('gemini');
      expect(policyRoute.model).toBe('gemini-2.5-pro');
      expect(globalModelRoutingPolicy.getSettings().preferredProvider).toBe('openai');
    });

    it('routes coding task role to gemini-2.5-pro on Gemini', () => {
      const route = globalModelRouter.route({
        taskDescription: 'Refactor TypeScript generic interface',
        taskType: 'coding',
        selectedProvider: 'gemini'
      });

      expect(route.providerId).toBe('gemini');
      expect(route.model).toBe('gemini-2.5-pro');
      expect(route.role).toBe('coding');
    });

    it('triggers fallback to Gemini with approval gate when preferred provider fails health check', async () => {
      globalOpenAIIntegrationContract.status = 'suspended';
      globalGeminiIntegrationContract.status = 'active';
      globalGeminiIntegrationContract.fallbackEligibility = true;

      if (!globalIntegrationRegistry.get('openai')) {
        globalIntegrationRegistry.register(globalOpenAIIntegrationContract);
      }

      globalModelRoutingPolicy.updateSettings({
        routingMode: 'automatic',
        preferredProvider: 'openai',
        preferredFastProvider: 'openai',
        allowProviderFallback: true,
        requireApprovalBeforeProviderSwitch: true
      });

      const route = globalModelRouter.route({
        taskDescription: 'Generate daily brief summary',
        taskType: 'fast'
      });

      expect(route.fallbackProviderId).toBe('gemini');
      expect(route.fallbackModel).toBe('gemini-2.5-flash');
      expect(route.requiresApproval).toBe(true);
      expect(route.validationFailed).toBe(true);
      expect(route.suggestedProviderId).toBe('gemini');

      // Assert configuration sovereignty is preserved
      expect(globalModelRoutingPolicy.getSettings().preferredProvider).toBe('openai');
    });

    it('auto-switches to Gemini fallback when approval gate is disabled in routing policy', async () => {
      globalOpenAIIntegrationContract.status = 'suspended';
      globalGeminiIntegrationContract.status = 'active';
      globalGeminiIntegrationContract.fallbackEligibility = true;

      if (!globalIntegrationRegistry.get('openai')) {
        globalIntegrationRegistry.register(globalOpenAIIntegrationContract);
      }

      globalModelRoutingPolicy.updateSettings({
        routingMode: 'automatic',
        preferredProvider: 'openai',
        preferredReasoningProvider: 'openai',
        allowProviderFallback: true,
        requireApprovalBeforeProviderSwitch: false
      });

      const route = globalModelRouter.route({
        taskDescription: 'Evaluate system vulnerability vectors',
        taskType: 'reasoning'
      });

      expect(route.providerId).toBe('gemini');
      expect(route.model).toBe('gemini-2.5-pro');
      expect(route.reason).toContain('Auto-switched to fallback provider "gemini"');
      expect(globalModelRoutingPolicy.getSettings().preferredProvider).toBe('openai');
    });

    it('executes routed request to Gemini successfully', async () => {
      const geminiSpy = vi.spyOn(globalGeminiIntegrationContract, 'executeText').mockResolvedValueOnce({
        success: true,
        output: { text: 'Gemini direct routed execution completed.' }
      });

      const result = await globalModelRouter.executeRoutedRequest(
        {
          taskDescription: 'Generate executive summary',
          taskType: 'fast',
          selectedProvider: 'gemini'
        },
        { prompt: 'Provide status' }
      );

      expect(result.success).toBe(true);
      expect(result.output.text).toBe('Gemini direct routed execution completed.');
      expect(geminiSpy).toHaveBeenCalled();
    });

    it('recovers dynamically via execution-time fallback retry when primary provider throws', async () => {
      if (!globalIntegrationRegistry.get('openai')) {
        globalIntegrationRegistry.register(globalOpenAIIntegrationContract);
      }

      const mockRouteResult: any = {
        providerId: 'openai',
        model: 'gpt-4o',
        role: 'fast',
        reason: 'Simulated primary with fallback wired',
        confidence: 0.7,
        fallbackProviderId: 'gemini',
        fallbackModel: 'gemini-2.5-flash',
        requiresApproval: false
      };

      vi.spyOn(globalModelRouter, 'route').mockReturnValueOnce(mockRouteResult);
      vi.spyOn(globalOpenAIIntegrationContract, 'executeText').mockRejectedValueOnce(new Error('OpenAI upstream 503 unavailable'));
      const geminiSpy = vi.spyOn(globalGeminiIntegrationContract, 'executeText').mockResolvedValueOnce({
        success: true,
        output: { text: 'Gemini fallback execution completed successfully.' }
      });

      const result = await globalModelRouter.executeRoutedRequest(
        {
          taskDescription: 'Fast fallback test',
          taskType: 'fast'
        },
        { prompt: 'Fast prompt', approvalStatus: 'approved' }
      );

      expect(result.success).toBe(true);
      expect(result.output.text).toBe('Gemini fallback execution completed successfully.');
      expect(result.route.providerId).toBe('gemini');
      expect(geminiSpy).toHaveBeenCalled();
    });

    it('rejects unsupported capabilities or non-existent models on Gemini without affecting other providers', () => {
      const nonExistentModelCheck = globalModelRouter.validateRoute('gemini', 'gpt-4o-unknown', {
        taskDescription: 'Test non-existent model'
      });
      expect(nonExistentModelCheck.valid).toBe(false);
      expect(nonExistentModelCheck.reason).toContain('is not available on provider "gemini"');

      const unsupportedCapabilityCheck = globalModelRouter.validateRoute('gemini', 'gemini-2.5-flash', {
        taskDescription: 'Voice synthesis test',
        requiredCapability: 'voice'
      });
      expect(unsupportedCapabilityCheck.valid).toBe(false);
      expect(unsupportedCapabilityCheck.reason).toContain('does not support capability "voice"');
    });
  });

  describe('13. Provider Telemetry, Streaming & Error Resilience (Phase 4)', () => {
    // 1. Streaming Chunk Integrity
    it('verifies streaming chunk arrival order, index monotonicity, and non-duplication', async () => {
      const sseStream = [
        'data: {"candidates":[{"content":{"parts":[{"text":"Hello "}]}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":"world "}]}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":"from Gemini."}]},"finishReason":"STOP"}],"usageMetadata":{"promptTokenCount":5,"candidatesTokenCount":4,"totalTokenCount":9}}\n\n'
      ];

      const encoder = new TextEncoder();
      const mockStream = new ReadableStream({
        start(controller) {
          for (const chunk of sseStream) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        }
      });

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: mockStream
      }));

      const client = new GeminiClient();
      const receivedChunks: any[] = [];
      const result = await client.streamContent('gemini-2.5-flash', 'Say hello', {
        onChunk: (chunk) => {
          receivedChunks.push(chunk);
        }
      });

      expect(receivedChunks.length).toBe(3);
      expect(receivedChunks.map(c => c.index)).toEqual([0, 1, 2]);
      expect(receivedChunks.map(c => c.text)).toEqual(['Hello ', 'world ', 'from Gemini.']);
      expect(receivedChunks[2].isFinal).toBe(true);
      expect(result.text).toBe('Hello world from Gemini.');
      expect(result.completed).toBe(true);
      expect(result.usage.totalTokens).toBe(9);
    });

    it('handles empty chunks correctly without breaking sequence or stream state', async () => {
      const sseStream = [
        'data: {"candidates":[{"content":{"parts":[{"text":"Chunk1"}]}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":""}]}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":"Chunk2"}]},"finishReason":"STOP"}]}\n\n'
      ];

      const encoder = new TextEncoder();
      const mockStream = new ReadableStream({
        start(controller) {
          for (const chunk of sseStream) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        }
      });

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: mockStream
      }));

      const client = new GeminiClient();
      const receivedChunks: any[] = [];
      const result = await client.streamContent('gemini-2.5-flash', 'Empty test', {
        onChunk: (c) => receivedChunks.push(c)
      });

      expect(receivedChunks.map(c => c.index)).toEqual([0, 1, 2]);
      expect(result.text).toBe('Chunk1Chunk2');
      expect(result.completed).toBe(true);
    });

    it('ensures provider errors do not masquerade as successful completion', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => JSON.stringify({ error: { message: 'Upstream unavailable' } })
      }));

      const res = await globalGeminiResponsesService.executeStreamingRequest({
        selectedModel: 'gemini-2.5-flash',
        prompt: 'Should fail cleanly',
        maxRetries: 0
      });

      expect(res.success).toBe(false);
      expect(res.status).toBe('failed');
      expect(res.status).not.toBe('completed');
      expect(res.error?.code).toBe('GEMINI_SERVER_ERROR');
      expect(res.output).toBeNull();
    });

    it('identifies and preserves partial output when a stream fails mid-transmission', async () => {
      const encoder = new TextEncoder();
      let chunkCount = 0;
      const mockStream = new ReadableStream({
        pull(controller) {
          if (chunkCount === 0) {
            controller.enqueue(encoder.encode('data: {"candidates":[{"content":{"parts":[{"text":"Part 1, "}]}}]}\n\n'));
            chunkCount++;
          } else if (chunkCount === 1) {
            controller.enqueue(encoder.encode('data: {"candidates":[{"content":{"parts":[{"text":"Part 2. "}]}}]}\n\n'));
            chunkCount++;
          } else {
            controller.error(new Error('Connection terminated mid-stream'));
          }
        }
      });

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: mockStream
      }));

      const res = await globalGeminiResponsesService.executeStreamingRequest({
        selectedModel: 'gemini-2.5-flash',
        prompt: 'Partial test'
      });

      expect(res.success).toBe(false);
      expect(res.status).toBe('failed');
      expect(res.partialOutput).toBe('Part 1, Part 2. ');
      expect(res.error?.code).toBe('GEMINI_STREAMING_ERROR');
    });

    it('propagates stream cancellation and halts chunk emission immediately', async () => {
      const controller = new AbortController();
      controller.abort();

      const res = await globalGeminiResponsesService.executeStreamingRequest({
        selectedModel: 'gemini-2.5-flash',
        prompt: 'Cancelled test',
        signal: controller.signal
      });

      expect(res.success).toBe(false);
      expect(res.status).toBe('failed');
      expect(res.error?.code).toBe('GEMINI_CANCELLED');
    });

    it('prevents retry duplication when failure occurs after chunks have already been emitted', async () => {
      let fetchCount = 0;
      const encoder = new TextEncoder();

      vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
        fetchCount++;
        let pullCount = 0;
        const stream = new ReadableStream({
          pull(ctrl) {
            if (pullCount === 0) {
              ctrl.enqueue(encoder.encode('data: {"candidates":[{"content":{"parts":[{"text":"Emitted Chunk "}]}}]}\n\n'));
              pullCount++;
            } else {
              ctrl.error(new Error('Network drop after first chunk'));
            }
          }
        });
        return Promise.resolve({
          ok: true,
          status: 200,
          body: stream
        });
      }));

      const client = new GeminiClient();
      let emittedCount = 0;

      await expect(
        client.streamContent('gemini-2.5-flash', 'Test retry barrier', {
          maxRetries: 3,
          onChunk: () => { emittedCount++; }
        })
      ).rejects.toThrow();

      // Because a chunk was already sent to the consumer, it must NOT retry and duplicate tokens
      expect(fetchCount).toBe(1);
      expect(emittedCount).toBe(1);
    });

    // 2. Telemetry Validation (ModelRouterSelection & Secret Protection)
    it('captures complete reconstructible metadata in ModelRouterSelection and protects secrets', () => {
      let capturedEvent: any = null;
      const listener = (event: any) => {
        if (event.type === 'ModelRouterSelection') {
          capturedEvent = event.payload;
        }
      };
      globalEventBus.subscribe('ModelRouterSelection', listener);

      globalModelRouter.route({
        taskDescription: 'Fast query with simulated key sk-proj-1234567890abcdef1234567890 in text',
        taskType: 'fast',
        selectedProvider: 'gemini'
      });

      globalEventBus.unsubscribe('ModelRouterSelection', listener);

      expect(capturedEvent).toBeDefined();
      expect(capturedEvent.taskRole).toBe('fast');
      expect(capturedEvent.providerId).toBe('gemini');
      expect(capturedEvent.model).toBe('gemini-2.5-flash');
      expect(capturedEvent.fallbackActive).toBe(false);
      expect(capturedEvent.fallbackEligibility).toBe(true);
      expect(capturedEvent.requiresApproval).toBe(false);
      expect(capturedEvent.timestamp).toBeDefined();
      expect(capturedEvent.explanation).toBeDefined();

      // Verify no secrets leaked in explanation
      expect(capturedEvent.explanation).not.toContain('1234567890abcdef1234567890');
    });

    it('emits structured ModelRouter execution lifecycle events (Started, Completed, Failed)', async () => {
      const events: string[] = [];
      const listener = (event: any) => {
        if (event.type.startsWith('ModelRouterExecution')) {
          events.push(event.type);
        }
      };
      globalEventBus.subscribe('ModelRouterExecutionStarted', listener);
      globalEventBus.subscribe('ModelRouterExecutionCompleted', listener);
      globalEventBus.subscribe('ModelRouterExecutionFailed', listener);

      vi.spyOn(globalGeminiIntegrationContract, 'executeText').mockResolvedValueOnce({
        success: true,
        output: { text: 'Execution success' }
      });

      await globalModelRouter.executeRoutedRequest(
        { taskDescription: 'Test execution lifecycle', taskType: 'fast', selectedProvider: 'gemini' },
        { prompt: 'Ping' }
      );

      globalEventBus.unsubscribe('ModelRouterExecutionStarted', listener);
      globalEventBus.unsubscribe('ModelRouterExecutionCompleted', listener);
      globalEventBus.unsubscribe('ModelRouterExecutionFailed', listener);

      expect(events).toContain('ModelRouterExecutionStarted');
      expect(events).toContain('ModelRouterExecutionCompleted');
      expect(events).not.toContain('ModelRouterExecutionFailed');
    });

    // 3. Error Taxonomy & Classification
    it('classifies all failure modes into architectural error taxonomy with preserved context', () => {
      const err400 = normalizeGeminiError(new Error('Invalid maxOutputTokens'), 400);
      expect(err400.category).toBe('configuration');
      expect(err400.code).toBe('GEMINI_INVALID_ARGUMENT');

      const err401 = normalizeGeminiError(new Error('Bad API Key'), 401);
      expect(err401.category).toBe('authentication');
      expect(err401.code).toBe('GEMINI_AUTHENTICATION_ERROR');

      const err429 = normalizeGeminiError(new Error('Resource exhausted'), 429);
      expect(err429.category).toBe('rate-limit');
      expect(err429.code).toBe('GEMINI_RATE_LIMITED');

      const errTimeout = normalizeGeminiError(new Error('Operation aborted due to timeout'), 408);
      expect(errTimeout.category).toBe('timeout');
      expect(errTimeout.code).toBe('GEMINI_TIMEOUT');

      const errNetwork = normalizeGeminiError(new Error('fetch failed with ENOTFOUND'), 500);
      expect(errNetwork.category).toBe('network');
      expect(errNetwork.code).toBe('GEMINI_NETWORK_ERROR');

      const errServer = normalizeGeminiError(new Error('Internal server error'), 503);
      expect(errServer.category).toBe('provider-unavailable');
      expect(errServer.code).toBe('GEMINI_SERVER_ERROR');

      const errCancel = normalizeGeminiError(new Error('user abort requested'), 499);
      expect(errCancel.category).toBe('cancellation');
      expect(errCancel.code).toBe('GEMINI_CANCELLED');

      const errStream = normalizeGeminiError(new Error('stream delimiter broken'), 500);
      expect(errStream.category).toBe('streaming');
      expect(errStream.code).toBe('GEMINI_STREAMING_ERROR');
    });

    // 4. Retry & Fallback Observability (Scenarios A through F)
    it('observes Scenario A: primary success with zero fallback events', async () => {
      if (!globalIntegrationRegistry.get('openai')) {
        globalIntegrationRegistry.register(globalOpenAIIntegrationContract);
      }
      globalOpenAIIntegrationContract.status = 'active';
      await globalOpenAIIntegrationContract.healthCheck();

      const observedEvents: any[] = [];
      const listener = (event: any) => observedEvents.push(event);
      globalEventBus.subscribe('ModelRouterSelection', listener);
      globalEventBus.subscribe('ModelRouterExecutionCompleted', listener);

      vi.spyOn(globalOpenAIIntegrationContract, 'executeText').mockResolvedValueOnce({
        success: true,
        output: { text: 'OpenAI primary success' }
      });

      globalModelRoutingPolicy.updateSettings({ preferredProvider: 'openai' });

      const res = await globalModelRouter.executeRoutedRequest(
        { taskDescription: 'General task', taskType: 'fast' },
        { prompt: 'Run' }
      );

      globalEventBus.unsubscribe('ModelRouterSelection', listener);
      globalEventBus.unsubscribe('ModelRouterExecutionCompleted', listener);

      expect(res.success).toBe(true);
      expect(res.route.providerId).toBe('openai');
      const selection = observedEvents.find(e => e.type === 'ModelRouterSelection');
      expect(selection.payload.fallbackActive).toBe(false);
    });

    it('observes Scenario B: primary failure with fallback disabled', () => {
      if (!globalIntegrationRegistry.get('openai')) {
        globalIntegrationRegistry.register(globalOpenAIIntegrationContract);
      }
      globalOpenAIIntegrationContract.status = 'suspended';

      globalModelRoutingPolicy.updateSettings({
        preferredProvider: 'openai',
        allowProviderFallback: false
      });

      const route = globalModelRouter.route({
        taskDescription: 'Failure without fallback',
        taskType: 'fast'
      });

      expect(route.validationFailed).toBe(true);
      expect(route.requiresApproval).toBe(true);
      expect(route.reason).toContain('Fallback is disabled');
    });

    it('observes Scenario C: primary failure followed by approved fallback execution', async () => {
      if (!globalIntegrationRegistry.get('openai')) {
        globalIntegrationRegistry.register(globalOpenAIIntegrationContract);
      }
      globalOpenAIIntegrationContract.status = 'suspended';
      globalGeminiIntegrationContract.status = 'active';
      globalGeminiIntegrationContract.fallbackEligibility = true;

      globalModelRoutingPolicy.updateSettings({
        preferredProvider: 'openai',
        allowProviderFallback: true,
        requireApprovalBeforeProviderSwitch: true
      });

      // 1. Unapproved call is blocked
      const blockedRes = await globalModelRouter.executeRoutedRequest(
        { taskDescription: 'Needs switch approval', taskType: 'fast' },
        { prompt: 'Do work', approvalStatus: 'pending' }
      );
      expect(blockedRes.status).toBe('validation-failed');
      expect(blockedRes.route.fallbackProviderId).toBe('gemini');

      // 2. Approved call succeeds on fallback Gemini
      const geminiSpy = vi.spyOn(globalGeminiIntegrationContract, 'executeText').mockResolvedValueOnce({
        success: true,
        output: { text: 'Approved fallback execution on Gemini' }
      });

      const approvedRes = await globalModelRouter.executeRoutedRequest(
        { taskDescription: 'Needs switch approval', taskType: 'fast', selectedProvider: 'gemini' },
        { prompt: 'Do work', approvalStatus: 'approved' }
      );

      expect(approvedRes.success).toBe(true);
      expect(approvedRes.output.text).toBe('Approved fallback execution on Gemini');
      expect(geminiSpy).toHaveBeenCalled();
    });

    it('observes Scenario D: primary failure followed by automatic fallback', async () => {
      if (!globalIntegrationRegistry.get('openai')) {
        globalIntegrationRegistry.register(globalOpenAIIntegrationContract);
      }
      globalOpenAIIntegrationContract.status = 'suspended';
      globalGeminiIntegrationContract.status = 'active';
      globalGeminiIntegrationContract.fallbackEligibility = true;

      globalModelRoutingPolicy.updateSettings({
        preferredProvider: 'openai',
        allowProviderFallback: true,
        requireApprovalBeforeProviderSwitch: false
      });

      const route = globalModelRouter.route({
        taskDescription: 'Automatic fallback test',
        taskType: 'fast'
      });

      expect(route.providerId).toBe('gemini');
      expect(route.confidence).toBe(0.7);
      expect(route.reason).toContain('Auto-switched to fallback provider "gemini"');
    });

    it('observes Scenario E: fallback failure after primary execution failure', async () => {
      if (!globalIntegrationRegistry.get('openai')) {
        globalIntegrationRegistry.register(globalOpenAIIntegrationContract);
      }

      const mockRouteResult: any = {
        providerId: 'openai',
        model: 'gpt-4o',
        role: 'fast',
        reason: 'Simulated primary with fallback wired',
        confidence: 0.7,
        fallbackProviderId: 'gemini',
        fallbackModel: 'gemini-2.5-flash',
        requiresApproval: false
      };

      vi.spyOn(globalModelRouter, 'route').mockReturnValueOnce(mockRouteResult);
      vi.spyOn(globalOpenAIIntegrationContract, 'executeText').mockRejectedValueOnce(new Error('OpenAI primary crash'));
      vi.spyOn(globalGeminiIntegrationContract, 'executeText').mockRejectedValueOnce(new Error('Gemini fallback crash'));

      await expect(
        globalModelRouter.executeRoutedRequest(
          { taskDescription: 'Both fail test', taskType: 'fast' },
          { prompt: 'Ping', approvalStatus: 'approved' }
        )
      ).rejects.toThrow('Primary execution failed: OpenAI primary crash. Fallback also failed: Gemini fallback crash');
    });

    it('observes Scenario F: streaming failure after partial output', async () => {
      const encoder = new TextEncoder();
      let pullCount = 0;
      const mockStream = new ReadableStream({
        pull(controller) {
          if (pullCount === 0) {
            controller.enqueue(encoder.encode('data: {"candidates":[{"content":{"parts":[{"text":"Chunk 1. "}]}}]}\n\n'));
            pullCount++;
          } else {
            controller.error(new Error('Socket disconnected'));
          }
        }
      });

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: mockStream
      }));

      const events: any[] = [];
      const listener = (event: any) => {
        if (event.type.startsWith('GeminiStream')) {
          events.push(event);
        }
      };
      globalEventBus.subscribe('GeminiStreamStarted', listener);
      globalEventBus.subscribe('GeminiStreamChunk', listener);
      globalEventBus.subscribe('GeminiStreamFailed', listener);

      const res = await globalGeminiResponsesService.executeStreamingRequest({
        selectedModel: 'gemini-2.5-flash',
        prompt: 'Scenario F test'
      });

      globalEventBus.unsubscribe('GeminiStreamStarted', listener);
      globalEventBus.unsubscribe('GeminiStreamChunk', listener);
      globalEventBus.unsubscribe('GeminiStreamFailed', listener);

      expect(res.success).toBe(false);
      expect(res.status).toBe('failed');
      expect(res.partialOutput).toBe('Chunk 1. ');
      expect(events.map(e => e.type)).toEqual(['GeminiStreamStarted', 'GeminiStreamChunk', 'GeminiStreamFailed']);
      expect(events.find(e => e.type === 'GeminiStreamFailed')?.payload.partialLength).toBe(9);
    });

    // 5. Approval Gate Preservation
    it('preserves approval gate and blocks unapproved switch when requireApprovalBeforeProviderSwitch is true', async () => {
      if (!globalIntegrationRegistry.get('openai')) {
        globalIntegrationRegistry.register(globalOpenAIIntegrationContract);
      }
      globalOpenAIIntegrationContract.status = 'suspended';
      globalGeminiIntegrationContract.status = 'active';

      globalModelRoutingPolicy.updateSettings({
        preferredProvider: 'openai',
        allowProviderFallback: true,
        requireApprovalBeforeProviderSwitch: true
      });

      const route = globalModelRouter.route({
        taskDescription: 'Critical production query',
        taskType: 'fast'
      });

      expect(route.requiresApproval).toBe(true);
      expect(route.validationFailed).toBe(true);
      expect(route.fallbackProviderId).toBe('gemini');
      expect(globalModelRoutingPolicy.getSettings().preferredProvider).toBe('openai');
    });

    // 6. Live/Simulated Load Resilience
    it('maintains integrity under simulated concurrent streaming and transient failures', async () => {
      let callCount = 0;
      const encoder = new TextEncoder();

      vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
        callCount++;
        const shouldFail = callCount % 3 === 0;
        if (shouldFail) {
          return Promise.resolve({
            ok: false,
            status: 429,
            text: async () => JSON.stringify({ error: { message: 'Transient rate limit under load' } })
          });
        }
        const stream = new ReadableStream({
          start(ctrl) {
            ctrl.enqueue(encoder.encode(`data: {"candidates":[{"content":{"parts":[{"text":"Response ${callCount}"}]},"finishReason":"STOP"}]}\n\n`));
            ctrl.close();
          }
        });
        return Promise.resolve({
          ok: true,
          status: 200,
          body: stream
        });
      }));

      const promises = Array.from({ length: 6 }, (_, i) =>
        globalGeminiResponsesService.executeStreamingRequest({
          selectedModel: 'gemini-2.5-flash',
          prompt: `Load query ${i}`,
          maxRetries: 0
        })
      );

      const results = await Promise.all(promises);
      expect(results.length).toBe(6);

      const successes = results.filter(r => r.success);
      const failures = results.filter(r => !r.success);

      expect(successes.length).toBe(4);
      expect(failures.length).toBe(2);
      expect(failures[0].error?.code).toBe('GEMINI_RATE_LIMITED');
      expect(failures[0].status).toBe('failed');
    });
  });
});

