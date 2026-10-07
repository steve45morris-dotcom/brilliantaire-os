import { globalEventBus, KernelEvent } from '../../kernel/events/EventBus.js';
import { globalIntegrationRegistry } from './IntegrationRegistry.js';
import { ModelProvider, ProviderHealth, ErrorCategory } from './ModelProvider.js';
import { maskSensitiveText } from './SecretMasker.js';

/**
 * Rationale for Health Constants:
 * - HEALTH_WINDOW_SIZE (20): Provides a responsive moving window of recent requests without unbounded memory growth.
 * - DEGRADED_FAILURE_RATE (0.25): 1 in 4 requests failing indicates noticeable instability, triggering degraded state.
 * - UNAVAILABLE_CONSECUTIVE_FAILURES (3): Circuit breaker standard; 3 consecutive hard failures indicate a provider outage.
 * - RATE_LIMIT_COOLDOWN_MS (30000): Standard 30-second backoff for HTTP 429 quota exhaustion.
 * - PROVIDER_OUTAGE_COOLDOWN_MS (60000): 60-second hold time before attempting recovery after consecutive hard failures.
 * - LATENCY_DEGRADED_THRESHOLD_MS (5000): Average response latency >= 5s indicates acute backend congestion.
 */
export const HEALTH_WINDOW_SIZE = 20;
export const DEGRADED_FAILURE_RATE = 0.25;
export const UNAVAILABLE_CONSECUTIVE_FAILURES = 3;
export const RATE_LIMIT_COOLDOWN_MS = 30000;
export const PROVIDER_OUTAGE_COOLDOWN_MS = 60000;
export const LATENCY_DEGRADED_THRESHOLD_MS = 5000;

export interface HealthWindowEntry {
  success: boolean;
  latencyMs: number;
  timestamp: number;
  errorCategory?: ErrorCategory;
}

export interface RuntimeProviderHealthState {
  providerId: string;
  status: ProviderHealth['status'];
  windowSize: number;
  recentSuccessCount: number;
  recentFailureCount: number;
  consecutiveFailures: number;
  averageLatencyMs: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastErrorCategory?: ErrorCategory;
  cooldownUntil?: number;
}

export function categorizeError(errorText?: string): ErrorCategory {
  if (!errorText) return 'unknown';
  const lower = errorText.toLowerCase();

  if (lower.includes('abort') || lower.includes('cancel')) {
    return 'cancellation';
  }
  if (lower.includes('timeout') || lower.includes('deadline') || lower.includes('408')) {
    return 'timeout';
  }
  if (lower.includes('429') || lower.includes('rate limit') || lower.includes('quota') || lower.includes('resource exhausted')) {
    return 'rate-limit';
  }
  if (lower.includes('401') || lower.includes('403') || lower.includes('unauthorized') || lower.includes('authentication')) {
    return 'authentication';
  }
  if (lower.includes('400') || lower.includes('invalid argument') || lower.includes('budget') || lower.includes('not found')) {
    return 'configuration';
  }
  if (lower.includes('enotfound') || lower.includes('econnrefused') || lower.includes('fetch failed')) {
    return 'network';
  }
  if (lower.includes('503') || lower.includes('500') || lower.includes('502') || lower.includes('server error') || lower.includes('unavailable')) {
    return 'provider-unavailable';
  }
  if (/\bstream(ing)?\b/i.test(lower) || /\bchunk(s)?\b/i.test(lower)) {
    return 'streaming';
  }
  return 'execution';
}

export class ProviderHealthTracker {
  private isInitialized = false;
  private states = new Map<string, RuntimeProviderHealthState>();
  private history = new Map<string, HealthWindowEntry[]>();

  public get initialized(): boolean {
    return this.isInitialized;
  }

  // Bound event handlers for clean subscribe/unsubscribe
  private handleExecutionCompleted = (event: KernelEvent): void => {
    const payload = event.payload;
    if (!payload?.providerId) return;
    const providerId: string = payload.providerId;
    const latencyMs: number = typeof payload.latencyMs === 'number' ? payload.latencyMs : 0;
    const success: boolean = payload.success !== false;

    if (success) {
      this.recordSuccess(providerId, latencyMs);
    }
  };

  private handleFallbackTriggered = (event: KernelEvent): void => {
    const payload = event.payload;
    if (!payload?.primaryProviderId) return;
    const primaryId: string = payload.primaryProviderId;
    const error: string = payload.error || 'Primary request failed, fallback triggered';
    const category = categorizeError(error);

    // Cancellation does not poison provider health
    if (category === 'cancellation') {
      return;
    }

    this.recordFailure(primaryId, error, category, 0);
  };

  private handleExecutionFailed = (event: KernelEvent): void => {
    const payload = event.payload;
    if (!payload?.providerId) return;

    // If primaryProviderId is present, the primary was already registered by handleFallbackTriggered!
    // So attribute this failure to the secondary/fallback provider (payload.providerId).
    const targetProviderId: string = payload.providerId;
    const error: string = payload.error || 'Execution failed';
    const category = categorizeError(error);

    // Cancellation does not poison provider health
    if (category === 'cancellation') {
      return;
    }

    const latencyMs = typeof payload.latencyMs === 'number' ? payload.latencyMs : 0;
    this.recordFailure(targetProviderId, error, category, latencyMs);
  };

  private handleStreamFailed = (event: KernelEvent): void => {
    const payload = event.payload;
    if (!payload) return;
    const providerId = 'gemini';
    const error: string = payload.error || 'Streaming failure';
    const category: ErrorCategory = payload.category || categorizeError(error);

    if (category === 'cancellation') {
      return;
    }

    this.recordFailure(providerId, error, category, 0);
  };

  public initialize(): void {
    if (this.isInitialized) {
      return; // Idempotent guard: prevents duplicate subscriptions
    }
    this.isInitialized = true;

    globalEventBus.subscribe('ModelRouterExecutionCompleted', this.handleExecutionCompleted);
    globalEventBus.subscribe('ModelRouterFallbackTriggered', this.handleFallbackTriggered);
    globalEventBus.subscribe('ModelRouterExecutionFailed', this.handleExecutionFailed);
    globalEventBus.subscribe('GeminiStreamFailed', this.handleStreamFailed);
  }

  public dispose(): void {
    if (!this.isInitialized) return;

    globalEventBus.unsubscribe('ModelRouterExecutionCompleted', this.handleExecutionCompleted);
    globalEventBus.unsubscribe('ModelRouterFallbackTriggered', this.handleFallbackTriggered);
    globalEventBus.unsubscribe('ModelRouterExecutionFailed', this.handleExecutionFailed);
    globalEventBus.unsubscribe('GeminiStreamFailed', this.handleStreamFailed);

    this.isInitialized = false;
  }

  public reset(): void {
    this.states.clear();
    this.history.clear();
  }

  public getHealthState(providerId: string): RuntimeProviderHealthState | undefined {
    return this.states.get(providerId);
  }

  public isProviderFit(providerId: string): boolean {
    const state = this.states.get(providerId);
    if (!state) return true; // No failure telemetry: assumed fit

    if (
      state.status === 'unavailable' ||
      state.status === 'disconnected' ||
      state.status === 'authentication-failed' ||
      state.status === 'misconfigured'
    ) {
      return false;
    }

    if (state.cooldownUntil && Date.now() < state.cooldownUntil) {
      return false;
    }

    return true;
  }

  public recordSuccess(providerId: string, latencyMs: number): void {
    const entries = this.history.get(providerId) || [];
    entries.push({
      success: true,
      latencyMs,
      timestamp: Date.now()
    });

    if (entries.length > HEALTH_WINDOW_SIZE) {
      entries.shift();
    }
    this.history.set(providerId, entries);

    const recentSuccessCount = entries.filter((e) => e.success).length;
    const recentFailureCount = entries.filter((e) => !e.success).length;
    const totalCount = entries.length;
    const failureRate = totalCount > 0 ? recentFailureCount / totalCount : 0;
    const averageLatencyMs =
      totalCount > 0
        ? Math.round(entries.reduce((sum, e) => sum + e.latencyMs, 0) / totalCount)
        : latencyMs;

    const previousState = this.states.get(providerId);
    const newStatus: ProviderHealth['status'] =
      failureRate >= DEGRADED_FAILURE_RATE || averageLatencyMs >= LATENCY_DEGRADED_THRESHOLD_MS
        ? 'degraded'
        : 'healthy';

    const newState: RuntimeProviderHealthState = {
      providerId,
      status: newStatus,
      windowSize: totalCount,
      recentSuccessCount,
      recentFailureCount,
      consecutiveFailures: 0,
      averageLatencyMs,
      lastSuccessAt: new Date().toISOString(),
      lastFailureAt: previousState?.lastFailureAt,
      lastErrorCategory: previousState?.lastErrorCategory,
      cooldownUntil: undefined
    };

    this.states.set(providerId, newState);
    this.syncProviderHealth(providerId, newState, 'Runtime operational: normal response.');
  }

  public recordFailure(
    providerId: string,
    error: string,
    category: ErrorCategory,
    latencyMs: number = 0
  ): void {
    const safeError = maskSensitiveText(error);

    const entries = this.history.get(providerId) || [];
    entries.push({
      success: false,
      latencyMs,
      timestamp: Date.now(),
      errorCategory: category
    });

    if (entries.length > HEALTH_WINDOW_SIZE) {
      entries.shift();
    }
    this.history.set(providerId, entries);

    const recentSuccessCount = entries.filter((e) => e.success).length;
    const recentFailureCount = entries.filter((e) => !e.success).length;
    const totalCount = entries.length;
    const failureRate = totalCount > 0 ? recentFailureCount / totalCount : 1;
    const averageLatencyMs =
      totalCount > 0
        ? Math.round(entries.reduce((sum, e) => sum + e.latencyMs, 0) / totalCount)
        : latencyMs;

    const previousState = this.states.get(providerId);
    const consecutiveFailures = (previousState?.consecutiveFailures || 0) + 1;

    let newStatus: ProviderHealth['status'] = 'degraded';
    let cooldownUntil: number | undefined = previousState?.cooldownUntil;

    if (category === 'authentication') {
      newStatus = 'authentication-failed';
    } else if (category === 'configuration') {
      newStatus = 'misconfigured';
    } else if (category === 'rate-limit') {
      newStatus = 'rate-limited';
      cooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
    } else if (
      category === 'provider-unavailable' ||
      consecutiveFailures >= UNAVAILABLE_CONSECUTIVE_FAILURES
    ) {
      newStatus = 'unavailable';
      cooldownUntil = Date.now() + PROVIDER_OUTAGE_COOLDOWN_MS;
    } else if (consecutiveFailures > 0 || failureRate >= DEGRADED_FAILURE_RATE) {
      newStatus = 'degraded';
    }

    const newState: RuntimeProviderHealthState = {
      providerId,
      status: newStatus,
      windowSize: totalCount,
      recentSuccessCount,
      recentFailureCount,
      consecutiveFailures,
      averageLatencyMs,
      lastSuccessAt: previousState?.lastSuccessAt,
      lastFailureAt: new Date().toISOString(),
      lastErrorCategory: category,
      cooldownUntil
    };

    this.states.set(providerId, newState);
    this.syncProviderHealth(providerId, newState, safeError);
  }

  private syncProviderHealth(
    providerId: string,
    state: RuntimeProviderHealthState,
    message: string
  ): void {
    const provider = globalIntegrationRegistry.get(providerId) as unknown as ModelProvider | undefined;
    if (!provider || !provider.health) return;

    provider.health.status = state.status;
    provider.health.latencyMs = state.averageLatencyMs;
    provider.health.consecutiveFailures = state.consecutiveFailures;
    provider.health.cooldownUntil = state.cooldownUntil;
    provider.health.lastErrorCategory = state.lastErrorCategory;
    provider.health.lastCheckedAt = new Date().toISOString();
    provider.health.message = maskSensitiveText(message);

    if (state.status !== 'healthy') {
      if (!provider.health.errors) {
        provider.health.errors = [];
      }
      provider.health.errors.push(maskSensitiveText(message));
      if (provider.health.errors.length > 5) {
        provider.health.errors.shift();
      }
    }
  }
}

export const globalProviderHealthTracker = new ProviderHealthTracker();
export default globalProviderHealthTracker;
