import { KernelEvent } from './EventBus.js';

export interface EventSchema<T = any> {
  type: string;
  validate(payload: T): boolean;
}

export const TypedEventRegistry = {
  MissionCreated: {
    type: 'MissionCreated',
    validate: (p: any) => typeof p.missionId === 'string' && typeof p.title === 'string'
  },
  MissionCompleted: {
    type: 'MissionCompleted',
    validate: (p: any) => typeof p.missionId === 'string' && typeof p.actualDurationMinutes === 'number'
  },
  TimelineGenerated: {
    type: 'TimelineGenerated',
    validate: (p: any) => typeof p.timelineId === 'string' && typeof p.itemCount === 'number'
  },
  TimelineApproved: {
    type: 'TimelineApproved',
    validate: (p: any) => typeof p.timelineId === 'string'
  },
  SessionStarted: {
    type: 'SessionStarted',
    validate: (p: any) => typeof p.sessionId === 'string' && typeof p.activityType === 'string'
  },
  SessionCompleted: {
    type: 'SessionCompleted',
    validate: (p: any) => typeof p.sessionId === 'string' && typeof p.focusDurationMinutes === 'number'
  },
  ReflectionSubmitted: {
    type: 'ReflectionSubmitted',
    validate: (p: any) => typeof p.reviewPeriod === 'string' && typeof p.satisfactionScore === 'number'
  },
  AIRequestCompleted: {
    type: 'AIRequestCompleted',
    validate: (p: any) => typeof p.requestId === 'string' && typeof p.model === 'string' && typeof p.latencyMs === 'number'
  },
  PluginLoaded: {
    type: 'PluginLoaded',
    validate: (p: any) => typeof p.pluginName === 'string'
  },
  WorkspaceOpened: {
    type: 'WorkspaceOpened',
    validate: (p: any) => typeof p.workspacePath === 'string'
  }
} as const;

export type EventType = keyof typeof TypedEventRegistry;
