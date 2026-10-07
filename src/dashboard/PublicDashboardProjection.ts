import {
  sanitizeAgentExecutionState,
  sanitizeExecutionTelemetry,
  type AgentExecutionState,
} from '../kernel/live/AgentExecutionTelemetry.js';
import fs from 'node:fs';

export const PUBLIC_DASHBOARD_TOP_LEVEL_KEYS = [
  'schemaVersion',
  'exportedAt',
  'systemSummary',
  'voiceSummary',
  'governanceSummary',
  'liveOperations',
] as const;

const EXECUTION_KEYS = [
  'agentId', 'agentName', 'missionId', 'missionName', 'taskId', 'taskName', 'skill', 'tool',
  'status', 'startedAt', 'updatedAt', 'completedAt', 'elapsedMs', 'progress', 'contextUsage',
  'blockedReason', 'waitingForApproval', 'error', 'completionGuard', 'handoff', 'skillLifecycle', 'composition',
] as const;

export interface InternalDashboardTelemetry {
  currentPhase: unknown;
  activeProjects: unknown;
  voiceSummary: unknown;
  governance: unknown;
  agentExecutions: unknown;
  [internalField: string]: unknown;
}

export interface PublicDashboardData {
  schemaVersion: 1;
  exportedAt: string;
  systemSummary: { currentPhase: string; activeProjectCount: number };
  voiceSummary: {
    accepted: number;
    pending: number;
    rejected: number;
    approvedConfirmations: number;
    deniedConfirmations: number;
  };
  governanceSummary: { score: number; issuesCount: number };
  liveOperations: {
    source: 'live';
    status: 'ok';
    data: { agentExecutions: AgentExecutionState[] };
  };
}

export function projectPublicDashboardData(
  internal: InternalDashboardTelemetry,
  exportedAt = new Date().toISOString(),
): PublicDashboardData {
  const voice = recordOf(internal.voiceSummary);
  const governance = recordOf(internal.governance);
  const executions = Array.isArray(internal.agentExecutions) ? internal.agentExecutions : [];
  const projected: PublicDashboardData = {
    schemaVersion: 1,
    exportedAt,
    systemSummary: {
      currentPhase: publicText(internal.currentPhase, 'Unavailable'),
      activeProjectCount: Array.isArray(internal.activeProjects) ? internal.activeProjects.length : 0,
    },
    voiceSummary: {
      accepted: publicNumber(voice.accepted),
      pending: publicNumber(voice.pending),
      rejected: publicNumber(voice.rejected),
      approvedConfirmations: publicNumber(voice.approvedConfirmations),
      deniedConfirmations: publicNumber(voice.deniedConfirmations),
    },
    governanceSummary: {
      score: publicNumber(governance.score),
      issuesCount: publicNumber(governance.issuesCount),
    },
    liveOperations: {
      source: 'live',
      status: 'ok',
      data: { agentExecutions: executions.map(projectAgentExecution).filter(isDefined) },
    },
  };
  return validatePublicDashboardData(projected);
}

export function validatePublicDashboardData(value: unknown): PublicDashboardData {
  const root = requireRecord(value, 'dashboard');
  requireExactKeys(root, PUBLIC_DASHBOARD_TOP_LEVEL_KEYS, 'dashboard');
  if (root.schemaVersion !== 1) throw new Error('dashboard.schemaVersion must be 1');
  requireTimestamp(root.exportedAt, 'dashboard.exportedAt');

  const system = requireRecord(root.systemSummary, 'dashboard.systemSummary');
  requireExactKeys(system, ['currentPhase', 'activeProjectCount'], 'dashboard.systemSummary');
  requireString(system.currentPhase, 'dashboard.systemSummary.currentPhase');
  requireNonNegativeNumber(system.activeProjectCount, 'dashboard.systemSummary.activeProjectCount');

  const voice = requireRecord(root.voiceSummary, 'dashboard.voiceSummary');
  const voiceKeys = ['accepted', 'pending', 'rejected', 'approvedConfirmations', 'deniedConfirmations'] as const;
  requireExactKeys(voice, voiceKeys, 'dashboard.voiceSummary');
  voiceKeys.forEach((key) => requireNonNegativeNumber(voice[key], `dashboard.voiceSummary.${key}`));

  const governance = requireRecord(root.governanceSummary, 'dashboard.governanceSummary');
  requireExactKeys(governance, ['score', 'issuesCount'], 'dashboard.governanceSummary');
  requireNonNegativeNumber(governance.score, 'dashboard.governanceSummary.score');
  requireNonNegativeNumber(governance.issuesCount, 'dashboard.governanceSummary.issuesCount');

  const live = requireRecord(root.liveOperations, 'dashboard.liveOperations');
  requireExactKeys(live, ['source', 'status', 'data'], 'dashboard.liveOperations');
  if (live.source !== 'live' || live.status !== 'ok') throw new Error('dashboard.liveOperations source/status is invalid');
  const liveData = requireRecord(live.data, 'dashboard.liveOperations.data');
  requireExactKeys(liveData, ['agentExecutions'], 'dashboard.liveOperations.data');
  if (!Array.isArray(liveData.agentExecutions)) throw new Error('dashboard.liveOperations.data.agentExecutions must be an array');
  liveData.agentExecutions.forEach((entry, index) => validateExecution(entry, index));

  const serialized = JSON.stringify(root);
  if (containsSensitiveSignature(serialized)) throw new Error('public dashboard contains a sensitive signature');
  return root as unknown as PublicDashboardData;
}

export function writePublicDashboardArtifact(filePath: string, value: unknown): PublicDashboardData {
  const validated = validatePublicDashboardData(value);
  fs.writeFileSync(filePath, JSON.stringify(validated, null, 2), 'utf-8');
  return validated;
}

function projectAgentExecution(value: unknown): AgentExecutionState | undefined {
  const state = sanitizeAgentExecutionState(value);
  if (!state) return undefined;
  const result: Record<string, unknown> = {};
  for (const key of EXECUTION_KEYS) {
    const field = state[key];
    if (field !== undefined) result[key] = sanitizePublicValue(field);
  }
  return result as unknown as AgentExecutionState;
}

function sanitizePublicValue(value: unknown): unknown {
  const sanitized = sanitizeExecutionTelemetry(value);
  if (typeof sanitized === 'string') return publicText(sanitized);
  if (Array.isArray(sanitized)) return sanitized.map(sanitizePublicValue);
  if (sanitized && typeof sanitized === 'object') {
    return Object.fromEntries(Object.entries(sanitized).map(([key, entry]) => [key, sanitizePublicValue(entry)]));
  }
  return sanitized;
}

function publicText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value
    .replace(/(?:file:\/\/)?\/(?:Users|home)\/[^\s"']+/gi, '[REDACTED]')
    .replace(/\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s"']+/gi, '[REDACTED]')
    .replace(/\bsk-[A-Za-z0-9_-]+\b/g, '[REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED]')
    .replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g, '[REDACTED]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+/gi, '[REDACTED]')
    .replace(/\b(?:password|passwd|secret|token|api[-_]?key|authorization)\s*[:=]\s*[^\s,;]+/gi, '[REDACTED]')
    .replace(/(?:^|[\/\s])\.env(?:\.[A-Za-z0-9_-]+)?\b/g, ' [REDACTED]')
    .slice(0, 500);
}

function containsSensitiveSignature(value: string): boolean {
  return /(?:\bsk-[A-Za-z0-9_-]+|\bBearer\s+|\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|BEGIN (?:RSA )?PRIVATE KEY|(?:file:\/\/)?\/(?:Users|home)\/|\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/|(?:^|[\/\s])\.env(?:\.|\b))/i.test(value);
}

function validateExecution(value: unknown, index: number): void {
  const entry = requireRecord(value, `agentExecutions[${index}]`);
  const label = `agentExecutions[${index}]`;
  requireAllowedKeys(entry, EXECUTION_KEYS, label);
  if (!sanitizeAgentExecutionState(entry)) throw new Error(`agentExecutions[${index}] is invalid`);
  for (const key of ['agentId', 'agentName', 'status', 'updatedAt'] as const) requireString(entry[key], `${label}.${key}`);
  for (const key of ['missionId', 'missionName', 'taskId', 'taskName', 'skill', 'tool', 'blockedReason', 'error'] as const) {
    if (entry[key] !== undefined) requireString(entry[key], `${label}.${key}`);
  }
  for (const key of ['startedAt', 'completedAt'] as const) if (entry[key] !== undefined) requireTimestamp(entry[key], `${label}.${key}`);
  for (const key of ['elapsedMs', 'progress'] as const) if (entry[key] !== undefined) requireNonNegativeNumber(entry[key], `${label}.${key}`);
  if (entry.waitingForApproval !== undefined && typeof entry.waitingForApproval !== 'boolean') throw new Error(`${label}.waitingForApproval must be a boolean`);
  for (const nested of ['contextUsage', 'completionGuard', 'handoff', 'skillLifecycle', 'composition'] as const) {
    if (entry[nested] !== undefined) {
      const allowed = nested === 'contextUsage' ? ['used', 'limit', 'percentage']
        : nested === 'completionGuard' ? ['status', 'verified']
          : nested === 'handoff' ? ['target', 'status']
            : nested === 'skillLifecycle' ? ['matched', 'resourcesLoaded', 'status']
              : ['contractId', 'status', 'activeStep', 'queuedSteps', 'blockedDependency', 'failedStep'];
      requireAllowedKeys(requireRecord(entry[nested], `agentExecutions[${index}].${nested}`), allowed, `agentExecutions[${index}].${nested}`);
    }
  }
  const context = entry.contextUsage === undefined ? undefined : requireRecord(entry.contextUsage, `${label}.contextUsage`);
  if (context) for (const key of ['used', 'limit', 'percentage']) if (context[key] !== undefined) requireNonNegativeNumber(context[key], `${label}.contextUsage.${key}`);
  const guard = entry.completionGuard === undefined ? undefined : requireRecord(entry.completionGuard, `${label}.completionGuard`);
  if (guard) {
    requireString(guard.status, `${label}.completionGuard.status`);
    if (typeof guard.verified !== 'boolean') throw new Error(`${label}.completionGuard.verified must be a boolean`);
  }
  const handoff = entry.handoff === undefined ? undefined : requireRecord(entry.handoff, `${label}.handoff`);
  if (handoff) for (const key of ['target', 'status']) if (handoff[key] !== undefined) requireString(handoff[key], `${label}.handoff.${key}`);
  const lifecycle = entry.skillLifecycle === undefined ? undefined : requireRecord(entry.skillLifecycle, `${label}.skillLifecycle`);
  if (lifecycle) {
    for (const key of ['matched', 'status']) if (lifecycle[key] !== undefined) requireString(lifecycle[key], `${label}.skillLifecycle.${key}`);
    if (lifecycle.resourcesLoaded !== undefined) {
      if (!Array.isArray(lifecycle.resourcesLoaded)) throw new Error(`${label}.skillLifecycle.resourcesLoaded must be an array`);
      lifecycle.resourcesLoaded.forEach((item, itemIndex) => requireString(item, `${label}.skillLifecycle.resourcesLoaded[${itemIndex}]`));
    }
  }
  const composition = entry.composition === undefined ? undefined : requireRecord(entry.composition, `${label}.composition`);
  if (composition) {
    for (const key of ['contractId', 'status', 'activeStep', 'blockedDependency', 'failedStep']) {
      if (composition[key] !== undefined) requireString(composition[key], `${label}.composition.${key}`);
    }
    if (composition.queuedSteps !== undefined) {
      if (!Array.isArray(composition.queuedSteps)) throw new Error(`${label}.composition.queuedSteps must be an array`);
      composition.queuedSteps.forEach((item, itemIndex) => requireString(item, `${label}.composition.queuedSteps[${itemIndex}]`));
    }
  }
}

function recordOf(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}
function requireExactKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  requireAllowedKeys(value, allowed, label);
  for (const key of allowed) if (!(key in value)) throw new Error(`${label} is missing key: ${key}`);
}
function requireAllowedKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const unexpected = Object.keys(value).find((key) => !allowed.includes(key));
  if (unexpected) throw new Error(`${label} contains unexpected key: ${unexpected}`);
}
function requireString(value: unknown, label: string): void {
  if (typeof value !== 'string') throw new Error(`${label} must be a string`);
}
function requireTimestamp(value: unknown, label: string): void {
  requireString(value, label);
  if (!Number.isFinite(Date.parse(value as string))) throw new Error(`${label} must be a valid timestamp`);
}
function requireNonNegativeNumber(value: unknown, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error(`${label} must be a non-negative number`);
}
function publicNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}
function isDefined<T>(value: T | undefined): value is T { return value !== undefined; }
