import fs from 'node:fs';
import { globalIntegrationRegistry } from './IntegrationRegistry.js';
import { globalProviderHealthTracker, RuntimeProviderHealthState } from './ProviderHealthTracker.js';
import { ModelProvider, ProviderHealth, ErrorCategory } from './ModelProvider.js';
import { maskSensitiveText } from './SecretMasker.js';
import { globalModelRoutingPolicy } from './ModelRoutingPolicy.js';

export const STALE_HEALTH_THRESHOLD_MS = 60000;

export interface ProjectedFailedProviderEvidence {
  providerId: string;
  failedProviderId: string;
  healthStatus: ProviderHealth['status'];
  failureCategory: ErrorCategory;
  consecutiveFailures: number;
  cooldownRemainingSeconds: number;
  averageLatencyMs: number;
  maskedErrorSummary: string;
  timestamp: string;
  stalenessMs: number;
  stale: boolean;
}

export interface ProjectedFallbackRecommendation {
  providerId: string;
  fallbackProviderId: string;
  model: string;
  fallbackModel: string;
  healthStatus: ProviderHealth['status'];
  fallbackHealthStatus: ProviderHealth['status'];
  averageLatencyMs: number;
  fallbackLatencyMs: number;
  capabilityMatch: string[];
  timestamp: string;
  stalenessMs: number;
  stale: boolean;
  scope: 'single-request';
}

export interface GovernedApprovalAuthority {
  approveAction: 'authorize one fallback request';
  denyAction: 'abort the request';
  preferredProvider: string;
  preferredProviderPreserved: true;
  scope: 'single-request';
}

export interface GovernedProviderSwitchApprovalEvidence {
  evidence: ProjectedFailedProviderEvidence;
  recommendation: ProjectedFallbackRecommendation;
  authority: GovernedApprovalAuthority;
  gateId: string;
  action: string;
  riskLevel: 'GOVERNED_PROVIDER_FALLBACK';
  explanation: string;
  timestamp: string;
}

export interface ProjectedProviderSummaryEntry {
  id: string;
  status: ProviderHealth['status'];
  authenticated: boolean;
  averageLatencyMs: number;
  cooldownRemainingSeconds: number;
  consecutiveFailures: number;
  lastErrorCategory?: ErrorCategory;
  stale: boolean;
  stalenessMs: number;
  capabilities: string[];
  models: string[];
}

export interface ProjectedProviderHealthSummary {
  schemaVersion: 1;
  exportedAt: string;
  preferredProvider: string;
  providers: Record<string, ProjectedProviderSummaryEntry>;
}

export function containsSensitiveSignature(value: string): boolean {
  return /(?:\bsk-[A-Za-z0-9_-]+|\bBearer\s+|\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|BEGIN (?:RSA )?PRIVATE KEY|(?:file:\/\/)?\/(?:Users|home)\/|\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/|(?:^|[\/\s])\.env(?:\.|\b)|AIzaSy[A-Za-z0-9_-]{10,})/i.test(value);
}

/**
 * Pure read-only projection of a provider's health evidence.
 * Pulls directly from ProviderHealthTracker and provider.health contract.
 * Creates zero secondary state stores.
 */
export function projectProviderHealth(
  providerId: string,
  now = Date.now()
): ProjectedFailedProviderEvidence {
  const provider = globalIntegrationRegistry.get(providerId) as unknown as ModelProvider | undefined;
  const runtimeState: RuntimeProviderHealthState | undefined = globalProviderHealthTracker.getHealthState(providerId);

  const healthStatus: ProviderHealth['status'] = runtimeState?.status ?? provider?.health.status ?? 'unavailable';
  const failureCategory: ErrorCategory = runtimeState?.lastErrorCategory ?? provider?.health.lastErrorCategory ?? 'unknown';
  const consecutiveFailures: number = runtimeState?.consecutiveFailures ?? provider?.health.consecutiveFailures ?? 0;

  const cooldownUntil = runtimeState?.cooldownUntil ?? provider?.health.cooldownUntil ?? 0;
  const cooldownRemainingSeconds = Math.max(0, Math.floor((cooldownUntil - now) / 1000));

  const averageLatencyMs = runtimeState?.averageLatencyMs ?? provider?.health.latencyMs ?? 0;

  const errors = provider?.health.errors;
  const rawSummary = (errors && errors.length > 0)
    ? errors[errors.length - 1]
    : provider?.health.message || `Provider "${providerId}" non-viable (status: ${healthStatus})`;
  const maskedErrorSummary = maskSensitiveText(rawSummary);

  const timestamp = provider?.health.lastCheckedAt || provider?.health.checkedAt || new Date(now).toISOString();
  const parsedMs = Date.parse(timestamp);
  const stalenessMs = Math.max(0, now - (Number.isFinite(parsedMs) ? parsedMs : now));
  const stale = stalenessMs > STALE_HEALTH_THRESHOLD_MS;

  return {
    providerId,
    failedProviderId: providerId,
    healthStatus,
    failureCategory,
    consecutiveFailures,
    cooldownRemainingSeconds,
    averageLatencyMs,
    maskedErrorSummary,
    timestamp,
    stalenessMs,
    stale
  };
}

/**
 * Pure read-only projection of a proposed fallback candidate.
 */
export function projectFallbackRecommendation(
  fallbackProviderId: string,
  model: string,
  requiredCapability?: string,
  now = Date.now()
): ProjectedFallbackRecommendation {
  const provider = globalIntegrationRegistry.get(fallbackProviderId) as unknown as ModelProvider | undefined;
  const runtimeState: RuntimeProviderHealthState | undefined = globalProviderHealthTracker.getHealthState(fallbackProviderId);

  const healthStatus: ProviderHealth['status'] = runtimeState?.status ?? provider?.health.status ?? 'unavailable';
  const averageLatencyMs = runtimeState?.averageLatencyMs ?? provider?.health.latencyMs ?? 0;

  const capabilities = provider?.capabilities ?? [];
  const capabilityMatch = requiredCapability
    ? capabilities.filter(c => c === requiredCapability || c === 'text')
    : capabilities;

  const timestamp = provider?.health.lastCheckedAt || provider?.health.checkedAt || new Date(now).toISOString();
  const parsedMs = Date.parse(timestamp);
  const stalenessMs = Math.max(0, now - (Number.isFinite(parsedMs) ? parsedMs : now));
  const stale = stalenessMs > STALE_HEALTH_THRESHOLD_MS;

  return {
    providerId: fallbackProviderId,
    fallbackProviderId,
    model,
    fallbackModel: model,
    healthStatus,
    fallbackHealthStatus: healthStatus,
    averageLatencyMs,
    fallbackLatencyMs: averageLatencyMs,
    capabilityMatch,
    timestamp,
    stalenessMs,
    stale,
    scope: 'single-request'
  };
}

/**
 * Constructs the complete structured approval payload bundling:
 * - Verified Evidence of the failing preferred provider
 * - Actionable Recommendation for the fallback candidate
 * - Explicit Authority & Policy Preservation Guarantee
 */
export function projectGovernedSwitchEvidence(
  failedProviderId: string,
  fallbackProviderId: string,
  fallbackModel: string,
  requiredCapability?: string,
  gateId?: string,
  now = Date.now()
): GovernedProviderSwitchApprovalEvidence {
  const evidence = projectProviderHealth(failedProviderId, now);
  const recommendation = projectFallbackRecommendation(fallbackProviderId, fallbackModel, requiredCapability, now);
  const preferredProvider = globalModelRoutingPolicy.getSettings().preferredProvider;

  const id = gateId || `gate-${failedProviderId}-to-${fallbackProviderId}-${now}`;
  const action = `provider_fallback_switch:${failedProviderId}->${fallbackProviderId}`;
  const explanation = maskSensitiveText(
    `Preferred provider "${failedProviderId}" is non-viable (${evidence.healthStatus}, ${evidence.failureCategory}, ${evidence.cooldownRemainingSeconds}s cooldown). Governed single-request fallback proposed to "${fallbackProviderId}" (${recommendation.model}). Preferred provider remains "${preferredProvider}".`
  );

  return {
    evidence,
    recommendation,
    authority: {
      approveAction: 'authorize one fallback request',
      denyAction: 'abort the request',
      preferredProvider,
      preferredProviderPreserved: true,
      scope: 'single-request'
    },
    gateId: id,
    action,
    riskLevel: 'GOVERNED_PROVIDER_FALLBACK',
    explanation,
    timestamp: new Date(now).toISOString()
  };
}

/**
 * Read-only projection of all registered providers' health for dashboard telemetry.
 */
export function projectAllProvidersHealth(now = Date.now()): ProjectedProviderHealthSummary {
  const preferredProvider = globalModelRoutingPolicy.getSettings().preferredProvider;
  const providers: Record<string, ProjectedProviderSummaryEntry> = {};

  const list = globalIntegrationRegistry.list().map(i => i as unknown as ModelProvider);
  for (const p of list) {
    const runtimeState = globalProviderHealthTracker.getHealthState(p.id);
    const cooldownUntil = runtimeState?.cooldownUntil ?? p.health.cooldownUntil ?? 0;
    const cooldownRemainingSeconds = Math.max(0, Math.floor((cooldownUntil - now) / 1000));

    const timestamp = p.health.lastCheckedAt || p.health.checkedAt || new Date(now).toISOString();
    const parsedMs = Date.parse(timestamp);
    const stalenessMs = Math.max(0, now - (Number.isFinite(parsedMs) ? parsedMs : now));
    const stale = stalenessMs > STALE_HEALTH_THRESHOLD_MS;

    providers[p.id] = {
      id: p.id,
      status: runtimeState?.status ?? p.health.status,
      authenticated: p.authentication.authenticated,
      averageLatencyMs: runtimeState?.averageLatencyMs ?? p.health.latencyMs ?? 0,
      cooldownRemainingSeconds,
      consecutiveFailures: runtimeState?.consecutiveFailures ?? p.health.consecutiveFailures ?? 0,
      lastErrorCategory: runtimeState?.lastErrorCategory ?? p.health.lastErrorCategory,
      stale,
      stalenessMs,
      capabilities: p.capabilities ?? [],
      models: p.listModels()
    };
  }

  return {
    schemaVersion: 1,
    exportedAt: new Date(now).toISOString(),
    preferredProvider,
    providers
  };
}

/**
 * Validates projected approval evidence and verifies zero secret leakage.
 */
export function validateProjectedApprovalEvidence(value: unknown): GovernedProviderSwitchApprovalEvidence {
  if (!value || typeof value !== 'object') {
    throw new Error('Projected approval evidence must be an object');
  }
  const obj = value as Record<string, unknown>;

  if (typeof obj.gateId !== 'string' || !obj.gateId) throw new Error('gateId must be a non-empty string');
  if (typeof obj.action !== 'string') throw new Error('action must be a string');
  if (obj.riskLevel !== 'GOVERNED_PROVIDER_FALLBACK') throw new Error('riskLevel must be GOVERNED_PROVIDER_FALLBACK');
  if (typeof obj.explanation !== 'string') throw new Error('explanation must be a string');

  const evidence = obj.evidence as Record<string, unknown>;
  if (!evidence || typeof evidence !== 'object') throw new Error('evidence must be an object');
  if (typeof evidence.providerId !== 'string') throw new Error('evidence.providerId must be a string');
  if (typeof evidence.cooldownRemainingSeconds !== 'number' || evidence.cooldownRemainingSeconds < 0) {
    throw new Error('evidence.cooldownRemainingSeconds must be non-negative number');
  }

  const recommendation = obj.recommendation as Record<string, unknown>;
  if (!recommendation || typeof recommendation !== 'object') throw new Error('recommendation must be an object');
  if (recommendation.scope !== 'single-request') throw new Error('recommendation.scope must be "single-request"');

  const authority = obj.authority as Record<string, unknown>;
  if (!authority || typeof authority !== 'object') throw new Error('authority must be an object');
  if (authority.preferredProviderPreserved !== true) throw new Error('authority.preferredProviderPreserved must be true');
  if (authority.scope !== 'single-request') throw new Error('authority.scope must be "single-request"');

  const serialized = JSON.stringify(value);
  if (containsSensitiveSignature(serialized)) {
    throw new Error('Projected approval evidence contains a sensitive signature');
  }

  return value as GovernedProviderSwitchApprovalEvidence;
}

/**
 * Validates projected provider health summary for the dashboard and verifies zero secret leakage.
 */
export function validateProjectedProviderHealthSummary(value: unknown): ProjectedProviderHealthSummary {
  if (!value || typeof value !== 'object') {
    throw new Error('Projected provider health summary must be an object');
  }
  const obj = value as Record<string, unknown>;
  if (obj.schemaVersion !== 1) throw new Error('schemaVersion must be 1');
  if (typeof obj.exportedAt !== 'string') throw new Error('exportedAt must be a valid timestamp string');
  if (typeof obj.preferredProvider !== 'string') throw new Error('preferredProvider must be a string');

  const providers = obj.providers as Record<string, unknown>;
  if (!providers || typeof providers !== 'object') throw new Error('providers must be an object');

  const serialized = JSON.stringify(value);
  if (containsSensitiveSignature(serialized)) {
    throw new Error('Projected provider health summary contains a sensitive signature');
  }

  return value as ProjectedProviderHealthSummary;
}

/**
 * Writes validated provider health telemetry to disk for dashboard consumption.
 */
export function writeProviderHealthDashboardArtifact(
  filePath: string,
  value: unknown
): ProjectedProviderHealthSummary {
  const validated = validateProjectedProviderHealthSummary(value);
  fs.writeFileSync(filePath, JSON.stringify(validated, null, 2), 'utf-8');
  return validated;
}
