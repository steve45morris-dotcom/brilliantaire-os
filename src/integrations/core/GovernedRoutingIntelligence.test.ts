import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { globalModelRouter } from './ModelRouter.js';
import { globalModelRoutingPolicy } from './ModelRoutingPolicy.js';
import { globalIntegrationRegistry } from './IntegrationRegistry.js';
import {
  globalProviderHealthTracker,
  categorizeError,
  HEALTH_WINDOW_SIZE,
  DEGRADED_FAILURE_RATE,
  UNAVAILABLE_CONSECUTIVE_FAILURES,
  RATE_LIMIT_COOLDOWN_MS,
  PROVIDER_OUTAGE_COOLDOWN_MS
} from './ProviderHealthTracker.js';
import { globalOpenAIIntegrationContract } from '../openai/OpenAIIntegrationContract.js';
import { globalGeminiIntegrationContract } from '../gemini/GeminiIntegrationContract.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';

describe('Governed Routing Intelligence & Runtime Health Tracker (Phase 5B)', () => {
  let originalEnv: Record<string, string | undefined>;
  let originalPolicySettings: any;

  beforeEach(async () => {
    originalEnv = { ...process.env };
    originalPolicySettings = globalModelRoutingPolicy.getSettings();
    process.env.VITEST = 'true';
    process.env.OPENAI_API_KEY = 'sk-proj-mock-openai-key-governed-1234567890';
    process.env.GEMINI_API_KEY = 'AIzaSyMockGeminiKeyGoverned1234567890';

    globalProviderHealthTracker.initialize();
    globalProviderHealthTracker.reset();

    globalIntegrationRegistry.clear();
    globalIntegrationRegistry.register(globalOpenAIIntegrationContract);
    globalIntegrationRegistry.register(globalGeminiIntegrationContract);

    globalOpenAIIntegrationContract.status = 'active';
    globalGeminiIntegrationContract.status = 'active';

    await globalOpenAIIntegrationContract.healthCheck();
    await globalGeminiIntegrationContract.healthCheck();

    globalModelRoutingPolicy.updateSettings({
      routingMode: 'automatic',
      preferredProvider: 'openai',
      preferredFastProvider: 'openai',
      preferredReasoningProvider: 'openai',
      preferredCodingProvider: 'openai',
      allowProviderFallback: true,
      requireApprovalBeforeProviderSwitch: true,
      maxEstimatedCostPerRequest: 0.5
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    if (originalPolicySettings) {
      globalModelRoutingPolicy.updateSettings(originalPolicySettings);
    }
    globalProviderHealthTracker.reset();
    vi.restoreAllMocks();
  });

  // Scenario A — Healthy Preferred Provider
  it('Scenario A: routes directly to healthy preferred provider with zero fallback', async () => {
    vi.spyOn(globalOpenAIIntegrationContract, 'executeText').mockResolvedValueOnce({
      success: true,
      output: { text: 'OpenAI operational result' }
    });

    const res = await globalModelRouter.executeRoutedRequest(
      { taskDescription: 'General query', taskType: 'fast' },
      { prompt: 'Hello from Scenario A' }
    );

    expect(res.success).toBe(true);
    expect(res.route.providerId).toBe('openai');
    expect(res.route.requiresApproval).toBe(false);
    expect(globalOpenAIIntegrationContract.health.status).toBe('healthy');
    expect(globalModelRoutingPolicy.getSettings().preferredProvider).toBe('openai');
  });

  // Scenario B — Repeated Provider Failures
  it('Scenario B: transitions provider health deterministically upon repeated failures', () => {
    expect(globalProviderHealthTracker.getHealthState('openai')).toBeUndefined();

    // 1st Failure -> degraded
    globalProviderHealthTracker.recordFailure('openai', '500 Server Error', 'provider-unavailable', 100);
    let state = globalProviderHealthTracker.getHealthState('openai');
    expect(state).toBeDefined();
    expect(state?.consecutiveFailures).toBe(1);
    expect(state?.recentFailureCount).toBe(1);
    expect(state?.lastErrorCategory).toBe('provider-unavailable');
    expect(globalOpenAIIntegrationContract.health.consecutiveFailures).toBe(1);

    // 2nd Failure -> degraded
    globalProviderHealthTracker.recordFailure('openai', '503 Outage', 'provider-unavailable', 120);
    state = globalProviderHealthTracker.getHealthState('openai');
    expect(state?.consecutiveFailures).toBe(2);

    // 3rd Failure -> unavailable with cooldown
    globalProviderHealthTracker.recordFailure('openai', '503 Outage', 'provider-unavailable', 110);
    state = globalProviderHealthTracker.getHealthState('openai');
    expect(state?.consecutiveFailures).toBe(UNAVAILABLE_CONSECUTIVE_FAILURES);
    expect(state?.status).toBe('unavailable');
    expect(state?.cooldownUntil).toBeGreaterThan(Date.now());
    expect(globalOpenAIIntegrationContract.health.status).toBe('unavailable');
    expect(globalOpenAIIntegrationContract.health.cooldownUntil).toBe(state?.cooldownUntil);
  });

  // Scenario C — Capability Present, Runtime Unhealthy
  it('Scenario C: rejects capable provider when in temporary cooldown/unhealthy state', async () => {
    // Provider supports text, but enters temporary cooldown
    globalOpenAIIntegrationContract.health.status = 'unavailable';
    globalOpenAIIntegrationContract.health.cooldownUntil = Date.now() + 60000;

    const validation = globalModelRouter.validateRoute('openai', 'gpt-4o', {
      taskDescription: 'Requires text execution',
      taskType: 'fast'
    });

    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain('health check failed: status is "unavailable"');
    expect(validation.suggestedProvider).toBe('gemini');
  });

  // Scenario D — Capability Missing
  it('Scenario D: rejects route when provider lacks requested capability without affecting health', async () => {
    const originalStatus = globalOpenAIIntegrationContract.health.status;

    const validation = globalModelRouter.validateRoute('openai', 'gpt-4o', {
      taskDescription: 'Requires non-existent quantum computing capability',
      requiredCapability: 'quantum-computing'
    });

    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain('does not support capability "quantum-computing"');
    // Provider operational health must NOT be penalized for lack of capability
    expect(globalOpenAIIntegrationContract.health.status).toBe(originalStatus);
  });

  // Scenario E — Healthy Gemini Fallback
  it('Scenario E: identifies healthy Gemini fallback candidate when primary is degraded', () => {
    globalOpenAIIntegrationContract.health.status = 'unavailable';
    globalModelRoutingPolicy.updateSettings({
      preferredProvider: 'openai',
      allowProviderFallback: true,
      requireApprovalBeforeProviderSwitch: false
    });

    const route = globalModelRouter.route({
      taskDescription: 'Task during OpenAI outage',
      taskType: 'fast'
    });

    expect(route.providerId).toBe('gemini');
    expect(route.reason).toContain('Auto-switched to fallback provider "gemini"');
    expect(route.confidence).toBe(0.7);
    // Policy preference remains unmutated
    expect(globalModelRoutingPolicy.getSettings().preferredProvider).toBe('openai');
  });

  // Scenario F — Approval Required
  it('Scenario F: blocks execution and enforces approval gate when requireApprovalBeforeProviderSwitch is true', async () => {
    globalOpenAIIntegrationContract.health.status = 'unavailable';
    globalModelRoutingPolicy.updateSettings({
      preferredProvider: 'openai',
      allowProviderFallback: true,
      requireApprovalBeforeProviderSwitch: true
    });

    const res = await globalModelRouter.executeRoutedRequest(
      { taskDescription: 'Critical task needing human approval', taskType: 'fast' },
      { prompt: 'Execute cautiously', approvalStatus: 'pending' }
    );

    expect(res.success).toBe(false);
    expect(res.status).toBe('validation-failed');
    expect(res.route.requiresApproval).toBe(true);
    expect(res.route.fallbackProviderId).toBe('gemini');
    expect(res.message).toContain('Human approval required');
  });

  // Scenario G — Runtime Health Changes
  it('Scenario G: updates health via telemetry events without mutating preferredProvider policy', async () => {
    expect(globalModelRoutingPolicy.getSettings().preferredProvider).toBe('openai');

    // Emit 3 failure events for OpenAI
    globalEventBus.publish('ModelRouterExecutionFailed', {
      providerId: 'openai',
      role: 'fast',
      error: 'Upstream connection reset',
      latencyMs: 150,
      success: false,
      timestamp: new Date().toISOString()
    });
    globalEventBus.publish('ModelRouterExecutionFailed', {
      providerId: 'openai',
      role: 'fast',
      error: 'Upstream connection reset',
      latencyMs: 150,
      success: false,
      timestamp: new Date().toISOString()
    });
    globalEventBus.publish('ModelRouterExecutionFailed', {
      providerId: 'openai',
      role: 'fast',
      error: '503 Provider Outage',
      latencyMs: 150,
      success: false,
      timestamp: new Date().toISOString()
    });

    expect(globalOpenAIIntegrationContract.health.status).toBe('unavailable');
    expect(globalOpenAIIntegrationContract.health.consecutiveFailures).toBe(3);

    // Policy remains strictly OpenAI
    expect(globalModelRoutingPolicy.getSettings().preferredProvider).toBe('openai');
  });

  // Scenario H — Secret Protection
  it('Scenario H: redacts sensitive API keys and tokens from health messages and state', () => {
    const rawError = 'Request with key sk-proj-1234567890abcdef1234567890 and Bearer eyJhbGciOiJIUzI1Ni failed with AIzaSyTestKey12345';
    globalProviderHealthTracker.recordFailure('gemini', rawError, 'execution', 50);

    const state = globalProviderHealthTracker.getHealthState('gemini');
    expect(state).toBeDefined();

    // Verify raw secrets are never preserved in health message
    expect(globalGeminiIntegrationContract.health.message).not.toContain('1234567890abcdef1234567890');
    expect(globalGeminiIntegrationContract.health.message).not.toContain('AIzaSyTestKey12345');
    expect(globalGeminiIntegrationContract.health.message).not.toContain('eyJhbGciOiJIUzI1Ni');
    expect(globalGeminiIntegrationContract.health.message).toContain('sk-••••••••');
    expect(globalGeminiIntegrationContract.health.message).toContain('AIz••••••••');
    expect(globalGeminiIntegrationContract.health.message).toContain('Bearer ••••••••');
  });

  // Scenario I — Cancellation
  it('Scenario I: does not falsely poison provider health when a request is cancelled by user', () => {
    const initialFailures = globalProviderHealthTracker.getHealthState('openai')?.consecutiveFailures || 0;

    globalEventBus.publish('ModelRouterExecutionFailed', {
      providerId: 'openai',
      role: 'fast',
      error: 'Request aborted by caller',
      latencyMs: 25,
      success: false,
      timestamp: new Date().toISOString()
    });

    const state = globalProviderHealthTracker.getHealthState('openai');
    const failuresAfterCancel = state?.consecutiveFailures || 0;

    expect(failuresAfterCancel).toBe(initialFailures);
    expect(globalOpenAIIntegrationContract.health.status).toBe('healthy');
  });

  // Scenario J — Streaming Failure
  it('Scenario J: correctly attributes streaming failures to the active stream provider', () => {
    globalEventBus.publish('GeminiStreamFailed', {
      requestId: 'req-stream-1',
      model: 'gemini-2.5-flash',
      error: 'Mid-stream socket reset',
      code: 'GEMINI_STREAMING_ERROR',
      category: 'streaming',
      partialLength: 42
    });

    const state = globalProviderHealthTracker.getHealthState('gemini');
    expect(state).toBeDefined();
    expect(state?.consecutiveFailures).toBe(1);
    expect(state?.lastErrorCategory).toBe('streaming');
    expect(globalGeminiIntegrationContract.health.consecutiveFailures).toBe(1);
    // OpenAI must remain unaffected
    expect(globalProviderHealthTracker.getHealthState('openai')?.consecutiveFailures || 0).toBe(0);
  });

  // Scenario K — Retry Accounting
  it('Scenario K: attributes failures accurately during retry without duplicate primary success counting', () => {
    // Primary fails -> fallback triggered
    globalEventBus.publish('ModelRouterFallbackTriggered', {
      primaryProviderId: 'openai',
      fallbackProviderId: 'gemini',
      primaryModel: 'gpt-4o',
      error: 'Primary transient timeout',
      timestamp: new Date().toISOString()
    });

    // Fallback succeeds
    globalEventBus.publish('ModelRouterExecutionCompleted', {
      providerId: 'gemini',
      model: 'gemini-2.5-flash',
      role: 'fast',
      latencyMs: 180,
      success: true,
      fallbackRecovered: true,
      timestamp: new Date().toISOString()
    });

    const openAiState = globalProviderHealthTracker.getHealthState('openai');
    const geminiState = globalProviderHealthTracker.getHealthState('gemini');

    // OpenAI is attributed the failure
    expect(openAiState?.consecutiveFailures).toBe(1);
    expect(openAiState?.recentFailureCount).toBe(1);

    // Gemini is attributed the success
    expect(geminiState?.consecutiveFailures).toBe(0);
    expect(geminiState?.recentSuccessCount).toBe(1);
  });

  // Scenario L — Tracker Initialization
  it('Scenario L: guarantees idempotent initialization and prevents duplicate event subscriptions', () => {
    // Calling initialize() multiple times must not register duplicate listeners
    globalProviderHealthTracker.initialize();
    globalProviderHealthTracker.initialize();
    globalProviderHealthTracker.initialize();

    globalEventBus.publish('ModelRouterExecutionCompleted', {
      providerId: 'gemini',
      model: 'gemini-2.5-flash',
      role: 'fast',
      latencyMs: 150,
      success: true,
      timestamp: new Date().toISOString()
    });

    const state = globalProviderHealthTracker.getHealthState('gemini');
    // Window size must be exactly 1, not 3 or 4
    expect(state?.windowSize).toBe(1);
    expect(state?.recentSuccessCount).toBe(1);
  });
});
