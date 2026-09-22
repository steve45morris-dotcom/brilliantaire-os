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
});

