import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventBus } from '../events/event_bus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

export const TELEMETRY_FILE = path.join(REPO_ROOT, 'outputs', 'telemetry_analytics.json');

export interface TelemetryEvent {
  timestamp: string;
  durationMs: number;
  userAction: string;
  missionId: string | null;
  executionState: string;
  errors: string[] | null;
  provider: string | null;
  performanceMetrics: Record<string, any>;
}

export class TelemetryService {
  private static instance: TelemetryService;
  private telemetryFile: string;

  private constructor() {
    this.telemetryFile = TELEMETRY_FILE;
    this.ensureFileExists();
    this.setupEventBusSubscribers();
  }

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  private ensureFileExists() {
    const parentDir = path.dirname(this.telemetryFile);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    if (!fs.existsSync(this.telemetryFile)) {
      fs.writeFileSync(this.telemetryFile, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  /**
   * Logs a structured telemetry event.
   */
  public logEvent(event: TelemetryEvent) {
    this.ensureFileExists();
    try {
      const data: TelemetryEvent[] = JSON.parse(fs.readFileSync(this.telemetryFile, 'utf-8'));
      data.push(event);
      fs.writeFileSync(this.telemetryFile, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`📊 [Telemetry] Logged action: "${event.userAction}"`);
    } catch (err) {
      console.error('⚠️ [Telemetry] Failed to write telemetry log:', err);
    }
  }

  /**
   * Auto-subscribes telemetry collection to all Event Bus events.
   */
  private setupEventBusSubscribers() {
    const bus = EventBus.getInstance();

    bus.subscribe('MissionCreated', (data) => {
      this.logEvent({
        timestamp: new Date().toISOString(),
        durationMs: 0,
        userAction: 'MissionCreated',
        missionId: data.id,
        executionState: 'created',
        errors: null,
        provider: null,
        performanceMetrics: { priority: data.priority },
      });
    });

    bus.subscribe('MissionStarted', (data) => {
      this.logEvent({
        timestamp: new Date().toISOString(),
        durationMs: 0,
        userAction: 'MissionStarted',
        missionId: data.id,
        executionState: 'started',
        errors: null,
        provider: null,
        performanceMetrics: {},
      });
    });

    bus.subscribe('MissionPaused', (data) => {
      this.logEvent({
        timestamp: new Date().toISOString(),
        durationMs: 0,
        userAction: 'MissionPaused',
        missionId: data.id,
        executionState: 'paused',
        errors: null,
        provider: null,
        performanceMetrics: {},
      });
    });

    bus.subscribe('MissionCompleted', (data) => {
      this.logEvent({
        timestamp: new Date().toISOString(),
        durationMs: 0,
        userAction: 'MissionCompleted',
        missionId: data.id,
        executionState: 'completed',
        errors: null,
        provider: null,
        performanceMetrics: {},
      });
    });

    bus.subscribe('MissionSkipped', (data) => {
      this.logEvent({
        timestamp: new Date().toISOString(),
        durationMs: 0,
        userAction: 'MissionSkipped',
        missionId: data.id,
        executionState: 'skipped',
        errors: null,
        provider: null,
        performanceMetrics: {},
      });
    });

    bus.subscribe('TimelineGenerated', (data) => {
      this.logEvent({
        timestamp: new Date().toISOString(),
        durationMs: data.duration,
        userAction: 'TimelineGenerated',
        missionId: data.missionId,
        executionState: 'timeline_generated',
        errors: null,
        provider: null,
        performanceMetrics: { stepsCount: data.stepsCount },
      });
    });

    bus.subscribe('TimelineAdjusted', (data) => {
      this.logEvent({
        timestamp: new Date().toISOString(),
        durationMs: data.duration,
        userAction: 'TimelineAdjusted',
        missionId: data.missionId,
        executionState: 'timeline_adjusted',
        errors: null,
        provider: null,
        performanceMetrics: { stepsCount: data.stepsCount },
      });
    });

    bus.subscribe('LearningLogged', (data) => {
      this.logEvent({
        timestamp: new Date().toISOString(),
        durationMs: 0,
        userAction: 'LearningLogged',
        missionId: data.missionId,
        executionState: data.state,
        errors: null,
        provider: null,
        performanceMetrics: { logId: data.logId },
      });
    });

    bus.subscribe('DayApproved', (data) => {
      this.logEvent({
        timestamp: new Date().toISOString(),
        durationMs: 0,
        userAction: 'DayApproved',
        missionId: null,
        executionState: 'approved',
        errors: null,
        provider: null,
        performanceMetrics: { date: data.date, approvedBy: data.approvedBy },
      });
    });
  }

  public getEvents(): TelemetryEvent[] {
    this.ensureFileExists();
    try {
      return JSON.parse(fs.readFileSync(this.telemetryFile, 'utf-8'));
    } catch {
      return [];
    }
  }
}
