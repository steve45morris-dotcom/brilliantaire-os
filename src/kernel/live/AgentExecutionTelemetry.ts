import { OperationEvent } from './LiveOperationsTypes.js';
import { randomUUID } from 'node:crypto';

export const EXECUTION_TELEMETRY_UNAVAILABLE = 'Unavailable' as const;

export type AgentExecutionStatus =
  | 'queued'
  | 'running'
  | 'waiting'
  | 'blocked'
  | 'failed'
  | 'verifying'
  | 'completed';

export type AgentExecutionEventType =
  | 'agent.started' | 'agent.completed' | 'agent.failed'
  | 'mission.started' | 'mission.completed'
  | 'task.started' | 'task.progress' | 'task.blocked' | 'task.completed'
  | 'skill.discovered' | 'skill.selected' | 'skill.matched' | 'skill.activated'
  | 'skill.instructions.loaded' | 'skill.resources.loaded' | 'skill.released' | 'skill.failed'
  | 'skill.completed' | 'skill.unloaded'
  | 'tool.started' | 'tool.completed'
  | 'approval.requested' | 'approval.resolved'
  | 'capability.verification.started' | 'capability.verification.completed'
  | 'handoff.created' | 'handoff.completed'
  | 'composition.planned' | 'composition.validated' | 'composition.started'
  | 'composition.step.ready' | 'composition.step.started' | 'composition.step.completed'
  | 'composition.step.failed' | 'composition.handoff.created' | 'composition.handoff.completed'
  | 'composition.blocked' | 'composition.completed';

export interface AgentExecutionState {
  agentId: string;
  agentName: string;
  missionId?: string;
  missionName?: string;
  taskId?: string;
  taskName?: string;
  skill?: string;
  tool?: string;
  status: AgentExecutionStatus;
  startedAt?: string;
  updatedAt: string;
  completedAt?: string;
  elapsedMs?: number;
  progress?: number;
  contextUsage?: { used?: number; limit?: number; percentage?: number };
  blockedReason?: string;
  waitingForApproval?: boolean;
  error?: string;
  completionGuard?: { status: string; verified: boolean };
  handoff?: { target?: string; status?: string };
  skillLifecycle?: { matched?: string; resourcesLoaded?: string[]; status?: string };
  composition?: {
    contractId?: string;
    status?: string;
    activeStep?: string;
    queuedSteps?: string[];
    blockedDependency?: string;
    failedStep?: string;
  };
}

export interface AgentExecutionEventData extends Record<string, unknown> {
  agentId: string;
  agentName?: string;
  missionId?: string;
  missionName?: string;
  taskId?: string;
  taskName?: string;
  skill?: string;
  tool?: string;
  progress?: number;
  contextUsed?: number;
  contextLimit?: number;
  blockedReason?: string;
  error?: string;
  completionGuardStatus?: string;
  verified?: boolean;
  handoffTarget?: string;
  handoffStatus?: string;
  resourcesLoaded?: string[];
  compositionId?: string;
  compositionStep?: string;
  queuedSteps?: string[];
  blockedDependency?: string;
}

const SENSITIVE_KEY = /(api[-_]?key|password|passwd|secret|token|authorization|cookie|private[-_]?key|prompt|reasoning|environment|env)/i;
const CREDENTIAL_TEXT = /\b(api[-_]?key|password|passwd|secret|token|authorization)\s*[:=]\s*(?:bearer\s+)?[^\s,;]+/gi;
const JWT_TEXT = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const PEM_TEXT = /-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g;
const STANDALONE_BEARER = /\bbearer\s+[A-Za-z0-9._~+\/-]{8,}/gi;
const EXECUTION_EVENT_TYPES = new Set<AgentExecutionEventType>([
  'agent.started', 'agent.completed', 'agent.failed', 'mission.started', 'mission.completed',
  'task.started', 'task.progress', 'task.blocked', 'task.completed', 'skill.discovered',
  'skill.selected', 'skill.matched', 'skill.activated', 'skill.instructions.loaded',
  'skill.resources.loaded', 'skill.released', 'skill.failed', 'skill.completed', 'skill.unloaded',
  'tool.started', 'tool.completed', 'approval.requested', 'approval.resolved',
  'capability.verification.started', 'capability.verification.completed', 'handoff.created', 'handoff.completed',
  'composition.planned', 'composition.validated', 'composition.started', 'composition.step.ready',
  'composition.step.started', 'composition.step.completed', 'composition.step.failed',
  'composition.handoff.created', 'composition.handoff.completed', 'composition.blocked', 'composition.completed'
]);

export function sanitizeExecutionTelemetry(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (depth > 6) return '[TRUNCATED]';
  if (typeof value === 'string') return value.replace(PEM_TEXT, '[REDACTED PEM]').replace(JWT_TEXT, '[REDACTED JWT]').replace(STANDALONE_BEARER, 'Bearer [REDACTED]').replace(CREDENTIAL_TEXT, '$1=[REDACTED]').slice(0, 500);
  if (Array.isArray(value)) {
    if (seen.has(value)) return '[CIRCULAR]';
    seen.add(value);
    return value.slice(0, 50).map((entry) => sanitizeExecutionTelemetry(entry, depth + 1, seen));
  }
  if (value && typeof value === 'object') {
    if (seen.has(value)) return '[CIRCULAR]';
    seen.add(value);
    return Object.fromEntries(Object.entries(value).slice(0, 100).map(([key, entry]) => [
      key,
      SENSITIVE_KEY.test(key) ? '[REDACTED]' : sanitizeExecutionTelemetry(entry, depth + 1, seen)
    ]));
  }
  return value;
}

export class AgentExecutionTelemetry {
  private readonly states = new Map<string, AgentExecutionState>();
  private readonly events: OperationEvent[] = [];

  constructor(private readonly now: () => string = () => new Date().toISOString()) {}

  public record(type: AgentExecutionEventType, unsafeData: AgentExecutionEventData): OperationEvent {
    const timestamp = this.now();
    const data = sanitizeExecutionTelemetry(unsafeData) as AgentExecutionEventData;
    const event: OperationEvent = {
      id: `execution-${randomUUID()}`,
      type,
      timestamp,
      source: 'agent-execution-telemetry',
      actor: data.agentName || data.agentId,
      session: data.missionId,
      task: data.taskId,
      severity: type.endsWith('.failed') ? 'error' : type === 'task.blocked' ? 'warn' : 'info',
      message: type,
      data,
      attention: type.endsWith('.failed') || type === 'task.blocked' || type === 'approval.requested',
      error: typeof data.error === 'string' ? data.error : undefined
    };
    this.events.push(event);
    if (this.events.length > 200) this.events.shift();
    this.reduce(event);
    return event;
  }

  public ingest(event: OperationEvent): void {
    if (!isAgentExecutionEvent(event.type) || !validTimestamp(event.timestamp)) return;
    const data = sanitizeExecutionTelemetry(event.data) as AgentExecutionEventData;
    if (!validIdentity(data.agentId)) return;
    const sanitized = sanitizeOperationEvent({ ...event, data });
    this.events.push(sanitized);
    if (this.events.length > 200) this.events.shift();
    this.reduce(sanitized);
  }

  public getStates(referenceTime?: string): AgentExecutionState[] {
    const nowMs = referenceTime ? Date.parse(referenceTime) : Date.parse(this.now());
    return [...this.states.values()].map((state) => ({
      ...state,
      elapsedMs: state.startedAt
        ? Math.max(0, Date.parse(state.completedAt || new Date(nowMs).toISOString()) - Date.parse(state.startedAt))
        : undefined
    }));
  }

  public getEvents(): OperationEvent[] { return [...this.events]; }
  public clear(): void { this.states.clear(); this.events.length = 0; }

  private reduce(event: OperationEvent): void {
    const data = event.data as AgentExecutionEventData;
    const key = `${data.agentId}:${data.missionId || ''}:${data.taskId || ''}`;
    const current = this.states.get(key);
    const next: AgentExecutionState = {
      agentId: data.agentId,
      agentName: data.agentName || current?.agentName || data.agentId,
      missionId: data.missionId ?? current?.missionId,
      missionName: data.missionName ?? current?.missionName,
      taskId: data.taskId ?? current?.taskId,
      taskName: data.taskName ?? current?.taskName,
      skill: data.skill ?? current?.skill,
      tool: data.tool ?? current?.tool,
      status: current?.status || 'queued',
      startedAt: current?.startedAt,
      updatedAt: event.timestamp,
      completedAt: current?.completedAt,
      progress: current?.progress,
      contextUsage: current?.contextUsage,
      blockedReason: current?.blockedReason,
      waitingForApproval: current?.waitingForApproval,
      error: current?.error,
      completionGuard: current?.completionGuard,
      handoff: current?.handoff,
      skillLifecycle: current?.skillLifecycle,
      composition: current?.composition
    };

    if (event.type.endsWith('.started') || event.type === 'skill.activated' || event.type === 'tool.started') {
      next.status = event.type === 'capability.verification.started' ? 'verifying' : 'running';
      next.startedAt ||= event.timestamp;
    }
    if (event.type === 'task.progress' && validProgress(data.progress)) next.progress = data.progress;
    if (typeof data.contextUsed === 'number' || typeof data.contextLimit === 'number') {
      const used = data.contextUsed;
      const limit = data.contextLimit;
      next.contextUsage = { used, limit, percentage: used !== undefined && limit ? Math.round((used / limit) * 100) : undefined };
    }
    if (event.type === 'task.blocked') { next.status = 'blocked'; next.blockedReason = textOrUndefined(data.blockedReason); }
    if (event.type === 'approval.requested') { next.status = 'waiting'; next.waitingForApproval = true; }
    if (event.type === 'approval.resolved') { next.status = 'running'; next.waitingForApproval = false; }
    if (event.type === 'capability.verification.started') {
      next.status = 'verifying';
      next.completionGuard = { status: textOrUndefined(data.completionGuardStatus) || 'VERIFYING', verified: false };
    }
    if (event.type === 'capability.verification.completed') {
      next.completionGuard = { status: textOrUndefined(data.completionGuardStatus) || 'UNKNOWN', verified: data.verified === true };
      next.status = data.verified === true ? 'completed' : 'blocked';
      next.blockedReason = data.verified === true ? undefined : textOrUndefined(data.blockedReason);
    }
    if (event.type === 'handoff.created' || event.type === 'handoff.completed') {
      next.handoff = { target: textOrUndefined(data.handoffTarget), status: textOrUndefined(data.handoffStatus) || (event.type.endsWith('completed') ? 'completed' : 'created') };
      if (event.type === 'handoff.created') next.status = 'waiting';
    }
    if (event.type.startsWith('skill.')) {
      next.skillLifecycle = {
        matched: data.skill || next.skillLifecycle?.matched,
        resourcesLoaded: data.resourcesLoaded || next.skillLifecycle?.resourcesLoaded,
        status: event.type === 'skill.resources.loaded' ? 'loaded' : event.type.split('.').slice(1).join('_')
      };
    }
    if (event.type.startsWith('composition.')) {
      const lifecycle = event.type.split('.').slice(1).join('_');
      next.composition = {
        contractId: textOrUndefined(data.compositionId) || next.composition?.contractId,
        status: lifecycle,
        activeStep: event.type === 'composition.step.started' ? textOrUndefined(data.compositionStep) : next.composition?.activeStep,
        queuedSteps: stringArrayOrUndefined(data.queuedSteps) || next.composition?.queuedSteps,
        blockedDependency: textOrUndefined(data.blockedDependency) || next.composition?.blockedDependency,
        failedStep: event.type === 'composition.step.failed' ? textOrUndefined(data.compositionStep) : next.composition?.failedStep,
      };
      if (event.type === 'composition.blocked') {
        next.status = 'blocked';
        next.blockedReason = textOrUndefined(data.error) || textOrUndefined(data.blockedDependency);
      }
      if (event.type === 'composition.completed') {
        const status = textOrUndefined(data.completionGuardStatus) || 'UNKNOWN';
        next.completionGuard = { status, verified: data.verified === true };
        next.status = data.verified === true ? 'completed' : 'blocked';
        next.completedAt = event.timestamp;
      }
    }
    if (event.type.endsWith('.failed')) { next.status = 'failed'; next.error = textOrUndefined(data.error); next.completedAt = event.timestamp; }
    if (event.type === 'agent.completed' || event.type === 'task.completed' || event.type === 'mission.completed') {
      next.status = 'completed'; next.progress = 100; next.completedAt = event.timestamp;
    }
    this.states.set(key, next);
    if (this.states.size > 200) this.states.delete(this.states.keys().next().value as string);
  }
}

function validProgress(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100; }
function textOrUndefined(value: unknown): string | undefined { return typeof value === 'string' ? value : undefined; }
function stringArrayOrUndefined(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : undefined;
}
export function isAgentExecutionEvent(type: string): type is AgentExecutionEventType {
  return EXECUTION_EVENT_TYPES.has(type as AgentExecutionEventType);
}

export function sanitizeOperationEvent(event: OperationEvent): OperationEvent {
  const clean = (value: unknown) => typeof value === 'string' ? sanitizeExecutionTelemetry(value) as string : '';
  return {
    id: clean(event.id).slice(0, 160), type: clean(event.type).slice(0, 80), timestamp: clean(event.timestamp),
    source: clean(event.source).slice(0, 120), actor: clean(event.actor).slice(0, 120),
    session: event.session ? clean(event.session).slice(0, 160) : undefined,
    task: event.task ? clean(event.task).slice(0, 160) : undefined,
    timing: typeof event.timing === 'number' && Number.isFinite(event.timing) ? event.timing : undefined,
    severity: ['info', 'warn', 'error'].includes(event.severity) ? event.severity : 'warn',
    message: clean(event.message), data: sanitizeExecutionTelemetry(event.data || {}) as Record<string, unknown>,
    attention: event.attention === true, error: event.error ? clean(event.error) : undefined
  };
}

export function projectAgentExecutionStates(events: OperationEvent[]): AgentExecutionState[] {
  const projection = new AgentExecutionTelemetry();
  events.forEach((event) => projection.ingest(event));
  return projection.getStates();
}

export function sanitizeAgentExecutionState(value: unknown): AgentExecutionState | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const state = sanitizeExecutionTelemetry(value) as Partial<AgentExecutionState>;
  const statuses: AgentExecutionStatus[] = ['queued', 'running', 'waiting', 'blocked', 'failed', 'verifying', 'completed'];
  if (!validIdentity(state.agentId) || !validIdentity(state.agentName) || !state.status || !statuses.includes(state.status)) return undefined;
  if (!state.updatedAt || !validTimestamp(state.updatedAt)) return undefined;
  if (state.startedAt && !validTimestamp(state.startedAt)) return undefined;
  if (state.completedAt && !validTimestamp(state.completedAt)) return undefined;
  if (state.progress !== undefined && !validProgress(state.progress)) return undefined;
  return state as AgentExecutionState;
}

function validIdentity(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0 && value.length <= 160; }
function validTimestamp(value: string): boolean { return Number.isFinite(Date.parse(value)); }

export const globalAgentExecutionTelemetry = new AgentExecutionTelemetry();
