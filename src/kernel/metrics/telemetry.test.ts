import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import { globalEventBus } from '../events/EventBus.js';
import { globalMetricsCollector } from './MetricsCollector.js';
import { globalStorageAdapter } from './StorageAdapter.js';
import { MetricsCalculators } from './MetricsCalculators.js';
import { AggregationEngine } from './AggregationEngine.js';
import { globalRetentionPolicy } from './RetentionPolicy.js';

describe('Telemetry Runtime System', () => {
  const testDbFile = '/Users/alexanderanthony/.gemini/telemetry/telemetry_db_test_1.jsonl';
  let originalContent = '';

  beforeEach(() => {
    globalStorageAdapter.setFilePath(testDbFile);
    if (fs.existsSync(testDbFile)) {
      originalContent = fs.readFileSync(testDbFile, 'utf-8');
    }
    fs.writeFileSync(testDbFile, '', 'utf-8');
  });

  afterEach(() => {
    if (originalContent) {
      fs.writeFileSync(testDbFile, originalContent, 'utf-8');
    } else if (fs.existsSync(testDbFile)) {
      fs.unlinkSync(testDbFile);
    }
  });

  it('should automatically capture event bus events in storage', () => {
    globalEventBus.publish('MissionCreated', { missionId: 'm1', title: 'Test Mission', estimatedDurationMinutes: 30 });
    globalEventBus.publish('MissionCompleted', { missionId: 'm1', actualDurationMinutes: 40 });

    const records = globalStorageAdapter.read();
    expect(records.length).toBeGreaterThanOrEqual(2);

    const types = records.map(r => r.type);
    expect(types).toContain('MissionCreated');
    expect(types).toContain('MissionCompleted');
  });

  it('should compute mathematical metrics correctly', () => {
    globalEventBus.publish('MissionCreated', { missionId: 'm2', title: 'Calculated Mission', estimatedDurationMinutes: 60 });
    globalEventBus.publish('MissionCompleted', { missionId: 'm2', actualDurationMinutes: 80 });

    globalEventBus.publish('SessionCompleted', { sessionId: 's1', focusDurationMinutes: 60, interruptionsCount: 2 });
    globalEventBus.publish('AIRequestCompleted', { requestId: 'a1', model: 'gpt-4', latencyMs: 1200, estimatedCost: 0.05 });

    const summary = globalMetricsCollector.getSummary();
    expect(summary.planningAccuracy).toBe(75); // 60/80 = 75%
    expect(summary.focusEfficiency).toBe(83); // (60 - 10) / 60 = 83%
    expect(summary.totalAICost).toBe(0.05);
    expect(summary.avgAILatencyMs).toBe(1200);
  });

  it('should prune old metrics using retention policy', () => {
    const today = new Date().toISOString();
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 40);

    globalStorageAdapter.writeAll([
      { timestamp: today, type: 'PluginLoaded', payload: { pluginName: 'new' } },
      { timestamp: oldDate.toISOString(), type: 'PluginLoaded', payload: { pluginName: 'old' } }
    ]);

    const deleted = globalRetentionPolicy.enforce();
    expect(deleted).toBe(1);

    const records = globalStorageAdapter.read();
    expect(records.length).toBe(1);
    expect(records[0].payload.pluginName).toBe('new');
  });
});
