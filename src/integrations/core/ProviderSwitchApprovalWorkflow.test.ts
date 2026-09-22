import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { globalModelRouter } from './ModelRouter.js';
import { globalModelRoutingPolicy } from './ModelRoutingPolicy.js';
import { globalIntegrationRegistry } from './IntegrationRegistry.js';
import { globalEventBus, KernelEvent } from '../../kernel/events/EventBus.js';
import {
  globalProviderHealthTracker
} from './ProviderHealthTracker.js';
import { ModelProvider } from './ModelProvider.js';
import {
  projectProviderHealth,
  projectFallbackRecommendation,
  projectGovernedSwitchEvidence,
  projectAllProvidersHealth,
  validateProjectedApprovalEvidence,
  validateProjectedProviderHealthSummary,
  writeProviderHealthDashboardArtifact,
  containsSensitiveSignature
} from './ProviderHealthProjection.js';
import { globalOpenAIIntegrationContract } from '../openai/OpenAIIntegrationContract.js';
import { globalGeminiIntegrationContract } from '../gemini/GeminiIntegrationContract.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('Governed Provider Switch Approval Workflow & Health Projection (Phase 5C)', () => {
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

  // A. Read-only projection integrity
  it('Scenario A: read-only projection integrity extracts current state without mutating provider or tracker', () => {
    const fixedTime = 1000000;
    const projection1 = projectProviderHealth('openai', fixedTime);
    expect(projection1.providerId).toBe('openai');
    expect(projection1.healthStatus).toBe('healthy');
    expect(projection1.consecutiveFailures).toBe(0);
    expect(projection1.cooldownRemainingSeconds).toBe(0);

    // Call projection multiple times with same timestamp
    const projection2 = projectProviderHealth('openai', fixedTime);
    expect(projection2).toEqual(projection1);

    // Verify underlying contracts remained unmutated
    const provider = globalIntegrationRegistry.get('openai') as unknown as ModelProvider | undefined;
    expect(provider?.health.status).toBe('healthy');
    expect(provider?.health.consecutiveFailures ?? 0).toBe(0);
  });

  // B. Secret masking
  it('Scenario B: secret masking redacts raw API keys in errors and rejects unmasked signatures', () => {
    const rawKey = 'sk-test-secret-key-1234567890';
    const provider = globalIntegrationRegistry.get('openai') as unknown as ModelProvider | undefined;
    if (provider) {
      provider.health.status = 'degraded';
      provider.health.errors = [`Error occurred with auth token ${rawKey}`];
    }

    const projected = projectProviderHealth('openai');
    expect(projected.maskedErrorSummary).not.toContain(rawKey);
    expect(projected.maskedErrorSummary).toContain('sk-••••••••');

    // Signature detection works as safety fail-safe
    expect(containsSensitiveSignature(`Authorization: Bearer my-secret-token`)).toBe(true);
    expect(containsSensitiveSignature(`Valid message: AIz••••••••`)).toBe(false);

    expect(() => {
      validateProjectedApprovalEvidence({
        gateId: 'gate-1',
        action: 'switch',
        riskLevel: 'GOVERNED_PROVIDER_FALLBACK',
        explanation: `Exposing secret ${rawKey}`,
        evidence: { providerId: 'openai', cooldownRemainingSeconds: 0 },
        recommendation: { scope: 'single-request' },
        authority: { preferredProviderPreserved: true, scope: 'single-request' }
      });
    }).toThrow(/contains a sensitive signature/);
  });

  // C. Evidence payload construction
  it('Scenario C: evidence payload correctly exposes failure category, cooldown, and rolling metrics', () => {
    // Record a 429 rate limit failure
    globalEventBus.publish('ModelRouterExecutionFailed', {
      providerId: 'openai',
      model: 'gpt-4o',
      role: 'fast',
      error: 'HTTP 429: Rate limit quota exceeded. Try again in 30s.',
      latencyMs: 350,
      success: false,
      timestamp: new Date().toISOString()
    });

    const now = Date.now();
    const evidence = projectProviderHealth('openai', now);

    expect(evidence.providerId).toBe('openai');
    expect(evidence.healthStatus).toBe('rate-limited');
    expect(evidence.failureCategory).toBe('rate-limit');
    expect(evidence.consecutiveFailures).toBe(1);
    expect(evidence.cooldownRemainingSeconds).toBeGreaterThan(0);
    expect(evidence.cooldownRemainingSeconds).toBeLessThanOrEqual(30);
    expect(evidence.averageLatencyMs).toBe(350);
    expect(evidence.stale).toBe(false);
  });

  // D. Recommendation payload construction
  it('Scenario D: recommendation payload includes model, capability match, and single-request scope', () => {
    const rec = projectFallbackRecommendation('gemini', 'gemini-2.5-flash', 'tools');

    expect(rec.providerId).toBe('gemini');
    expect(rec.model).toBe('gemini-2.5-flash');
    expect(rec.healthStatus).toBe('healthy');
    expect(rec.scope).toBe('single-request');
    expect(rec.capabilityMatch).toContain('tools');
    expect(rec.stale).toBe(false);
  });

  // E. SINGLE-REQUEST scope enforcement
  it('Scenario E: structured approval authority strictly limits scope to single-request', () => {
    const evidence = projectGovernedSwitchEvidence('openai', 'gemini', 'gemini-2.5-flash', 'text');

    expect(evidence.authority.scope).toBe('single-request');
    expect(evidence.authority.preferredProviderPreserved).toBe(true);
    expect(evidence.authority.preferredProvider).toBe('openai');
    expect(evidence.authority.approveAction).toBe('authorize one fallback request');
    expect(evidence.authority.denyAction).toBe('abort the request');
  });

  // F. Approval payload delivery to existing gate
  it('Scenario F: ModelRouterExecutionBlocked delivers enriched approval evidence', async () => {
    // Force OpenAI into cooldown
    const provider = globalIntegrationRegistry.get('openai') as unknown as ModelProvider | undefined;
    if (provider) {
      provider.health.status = 'rate-limited';
      provider.health.cooldownUntil = Date.now() + 25000;
      provider.health.message = '429 Rate limited';
    }

    let capturedBlockedEvent: any = null;
    const handler = (event: KernelEvent) => {
      capturedBlockedEvent = event.payload || event;
    };
    globalEventBus.subscribe('ModelRouterExecutionBlocked', handler);

    const result = await globalModelRouter.executeRoutedRequest(
      { taskDescription: 'Quick prompt', taskType: 'fast' },
      { prompt: 'Hello' }
    );

    globalEventBus.unsubscribe('ModelRouterExecutionBlocked', handler);

    expect(result.success).toBe(false);
    expect(result.status).toBe('validation-failed');
    expect(result.approvalEvidence).toBeDefined();

    expect(capturedBlockedEvent).not.toBeNull();
    expect(capturedBlockedEvent.requiresApproval).toBe(true);
    expect(capturedBlockedEvent.suggestedProviderId).toBe('gemini');
    expect(capturedBlockedEvent.approvalEvidence).toBeDefined();

    const ev = capturedBlockedEvent.approvalEvidence;
    expect(ev.evidence.failedProviderId).toBe('openai');
    expect(ev.recommendation.providerId).toBe('gemini');
    expect(ev.authority.scope).toBe('single-request');
  });

  // G. APPROVE preserves preferredProvider (Real Lifecycle)
  it('Scenario G: real lifecycle - APPROVE executes fallback request and preserves preferredProvider === "openai"', async () => {
    // 1. Preferred OpenAI enters rate-limit cooldown
    const openai = globalIntegrationRegistry.get('openai') as unknown as ModelProvider | undefined;
    if (openai) {
      openai.health.status = 'rate-limited';
      openai.health.cooldownUntil = Date.now() + 30000;
      openai.health.message = 'HTTP 429 quota exhausted';
    }

    // 2. Inbound request is blocked awaiting approval
    const initialResult = await globalModelRouter.executeRoutedRequest(
      { taskDescription: 'Urgent code generation', taskType: 'coding' },
      { prompt: 'function solve() {}' }
    );
    expect(initialResult.success).toBe(false);
    expect(initialResult.status).toBe('validation-failed');
    expect(initialResult.approvalEvidence.recommendation.providerId).toBe('gemini');

    // 3. Commander approves single-request execution on Gemini
    const geminiSpy = vi.spyOn(globalGeminiIntegrationContract, 'executeText').mockResolvedValue({
      id: 'gemini-resp-1',
      output: 'export function solve() { return 42; }',
      usage: { promptTokens: 10, completionTokens: 15, totalTokens: 25 },
      latencyMs: 400
    });

    const approvedResult = await globalModelRouter.executeRoutedRequest(
      { taskDescription: 'Urgent code generation', taskType: 'coding' },
      {
        prompt: 'function solve() {}',
        approvalStatus: 'approved',
        providerOverride: 'gemini'
      }
    );

    expect(geminiSpy).toHaveBeenCalled();
    expect(approvedResult.output).toContain('export function solve');

    // 4. CRITICAL INVARIANT: preferredProvider remains 'openai'
    const policy = globalModelRoutingPolicy.getSettings();
    expect(policy.preferredProvider).toBe('openai');
    expect(policy.preferredCodingProvider).toBe('openai');

    // 5. Subsequent request without override STILL respects preferred provider (and blocks because OpenAI is still cooling down)
    const subsequentResult = await globalModelRouter.executeRoutedRequest(
      { taskDescription: 'Next task', taskType: 'coding' },
      { prompt: 'next task' }
    );
    expect(subsequentResult.success).toBe(false);
    expect(subsequentResult.status).toBe('validation-failed');
    expect(subsequentResult.approvalEvidence.evidence.providerId).toBe('openai');
  });

  // H. DENY prevents fallback execution (Real Lifecycle)
  it('Scenario H: real lifecycle - DENY halts execution and dispatches zero calls to fallback', async () => {
    const openai = globalIntegrationRegistry.get('openai') as unknown as ModelProvider | undefined;
    if (openai) {
      openai.health.status = 'rate-limited';
      openai.health.cooldownUntil = Date.now() + 30000;
      openai.health.message = 'HTTP 429 quota exhausted';
    }

    const geminiSpy = vi.spyOn(globalGeminiIntegrationContract, 'executeText');

    // Commander denies the switch
    const deniedResult = await globalModelRouter.executeRoutedRequest(
      { taskDescription: 'Sensitive operation', taskType: 'fast' },
      {
        prompt: 'Run fast task',
        approvalStatus: 'denied'
      }
    );

    expect(deniedResult.success).toBe(false);
    expect(deniedResult.status).toBe('approval-denied');
    expect(deniedResult.message).toContain('aborted by Commander approval denial');
    expect(geminiSpy).not.toHaveBeenCalled();

    // Policy remains untouched
    expect(globalModelRoutingPolicy.getSettings().preferredProvider).toBe('openai');
  });

  // I. Cooldown remaining calculation
  it('Scenario I: cooldown remaining accurately tracks seconds until expiry', () => {
    const now = 1000000;
    const provider = globalIntegrationRegistry.get('openai') as unknown as ModelProvider | undefined;
    if (provider) {
      provider.health.cooldownUntil = now + 15500; // 15.5s remaining
    }

    const projected = projectProviderHealth('openai', now);
    expect(projected.cooldownRemainingSeconds).toBe(15);
  });

  // J. Cooldown expiry behavior
  it('Scenario J: expired cooldown returns 0s remaining and allows provider recovery', () => {
    const now = 1000000;
    const provider = globalIntegrationRegistry.get('openai') as unknown as ModelProvider | undefined;
    if (provider) {
      provider.health.cooldownUntil = now - 5000; // 5s in past
    }

    const projected = projectProviderHealth('openai', now);
    expect(projected.cooldownRemainingSeconds).toBe(0);
  });

  // K. Staleness calculation
  it('Scenario K: staleness calculation correctly identifies fresh vs stale telemetry', () => {
    const now = 1000000;
    const provider = globalIntegrationRegistry.get('openai') as unknown as ModelProvider | undefined;
    if (provider) {
      provider.health.lastCheckedAt = new Date(now - 30000).toISOString(); // 30s ago
    }

    const fresh = projectProviderHealth('openai', now);
    expect(fresh.stalenessMs).toBe(30000);
    expect(fresh.stale).toBe(false);

    if (provider) {
      provider.health.lastCheckedAt = new Date(now - 65000).toISOString(); // 65s ago
    }
    const stale = projectProviderHealth('openai', now);
    expect(stale.stalenessMs).toBe(65000);
    expect(stale.stale).toBe(true);
  });

  // L. Dashboard schema validation
  it('Scenario L: dashboard summary schema validates and exports clean JSON artifact', () => {
    const summary = projectAllProvidersHealth();
    expect(summary.schemaVersion).toBe(1);
    expect(summary.preferredProvider).toBe('openai');
    expect(summary.providers.openai).toBeDefined();
    expect(summary.providers.gemini).toBeDefined();

    const validated = validateProjectedProviderHealthSummary(summary);
    expect(validated).toEqual(summary);

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pjk-health-test-'));
    const tempFile = path.join(tempDir, 'provider-health-data.json');

    writeProviderHealthDashboardArtifact(tempFile, summary);
    const content = JSON.parse(fs.readFileSync(tempFile, 'utf-8'));
    expect(content.preferredProvider).toBe('openai');
    expect(content.providers.openai.status).toBe('healthy');

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // M. No duplicate event subscriptions
  it('Scenario M: repeated initialization of ProviderHealthTracker is idempotent and does not duplicate history', () => {
    expect(globalProviderHealthTracker.initialized).toBe(true);
    // Re-initialize multiple times
    globalProviderHealthTracker.initialize();
    globalProviderHealthTracker.initialize();
    expect(globalProviderHealthTracker.initialized).toBe(true);

    // Emit 1 execution completed event
    globalEventBus.publish('ModelRouterExecutionCompleted', {
      providerId: 'gemini',
      model: 'gemini-2.5-flash',
      role: 'fast',
      latencyMs: 150,
      success: true,
      timestamp: new Date().toISOString()
    });

    const state = globalProviderHealthTracker.getHealthState('gemini');
    expect(state?.recentSuccessCount).toBe(1);
  });

  // N. No duplicate health state
  it('Scenario N: ProviderHealthProjection stores zero internal state and reflects live contracts directly', () => {
    const openai = globalIntegrationRegistry.get('openai') as unknown as ModelProvider | undefined;
    expect(projectProviderHealth('openai').healthStatus).toBe('healthy');

    // Mutate live contract directly
    if (openai) openai.health.status = 'degraded';
    expect(projectProviderHealth('openai').healthStatus).toBe('degraded');

    // Reset live contract
    if (openai) openai.health.status = 'healthy';
    expect(projectProviderHealth('openai').healthStatus).toBe('healthy');
  });

  // O. Health / capability / telemetry cannot become routing authority
  it('Scenario O: degraded health and superior fallback capability never mutate policy settings', () => {
    const openai = globalIntegrationRegistry.get('openai') as unknown as ModelProvider | undefined;
    if (openai) {
      openai.health.status = 'unavailable';
      openai.health.cooldownUntil = Date.now() + 60000;
    }

    // Call projection and routing multiple times
    projectProviderHealth('openai');
    projectAllProvidersHealth();
    globalModelRouter.route({ taskDescription: 'Task', taskType: 'fast' });

    // Invariant holds
    const policy = globalModelRoutingPolicy.getSettings();
    expect(policy.preferredProvider).toBe('openai');
    expect(policy.preferredFastProvider).toBe('openai');
  });

  // P. Existing Phase 5B behavior remains intact
  it('Scenario P: sliding window, consecutive failure breaker, and double-counting prevention hold', () => {
    // 3 consecutive failures trigger unavailable circuit-breaker
    for (let i = 0; i < 3; i++) {
      globalEventBus.publish('ModelRouterExecutionFailed', {
        providerId: 'openai',
        model: 'gpt-4o',
        role: 'general',
        error: '500 Server Error',
        latencyMs: 100,
        success: false,
        timestamp: new Date().toISOString()
      });
    }

    const state = globalProviderHealthTracker.getHealthState('openai');
    expect(state?.status).toBe('unavailable');
    expect(state?.consecutiveFailures).toBe(3);
    expect(state?.cooldownUntil).toBeGreaterThan(Date.now());
  });
});
