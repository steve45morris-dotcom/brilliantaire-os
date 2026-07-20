import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import { globalEventBus } from '../events/EventBus.js';
import { EventPublisher } from '../events/Publisher.js';
import { EventSubscriber } from '../events/Subscriber.js';
import { globalMetricsCollector } from '../metrics/MetricsCollector.js';
import { globalStorageAdapter } from '../metrics/StorageAdapter.js';
import { globalAlertEngine } from './AlertEngine.js';
import { globalPredictionEngine } from './PredictionEngine.js';

describe('End-to-End Observability Integration', () => {
  const testDbFile = '/Users/alexanderanthony/.gemini/telemetry/telemetry_db_test_2.jsonl';
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

  it('should flow events through EventBus -> MetricsCollector -> AlertEngine -> PredictionEngine', () => {
    // 1. Set up listeners for alerts
    const alertCallback = vi.fn();
    EventSubscriber.subscribe('PerformanceRegressionAlert', alertCallback);

    // Reference engines to prevent Vitest/Vite tree-shaking their modules
    const _ref1 = globalAlertEngine;
    const _ref2 = globalPredictionEngine;

    // 2. Publish high-latency AI requests to trigger rule alerts
    EventPublisher.publish('AIRequestCompleted', {
      requestId: 'req-1',
      model: 'claude-3-5-sonnet',
      latencyMs: 6500, // exceeds the 5000ms threshold
      promptTokens: 100,
      completionTokens: 200,
      estimatedCost: 0.01,
      status: 'success'
    });
    console.log("DEBUG: Published AIRequestCompleted");

    // 3. Publish mission creation and completion
    EventPublisher.publish('MissionCreated', {
      missionId: 'm-integration',
      title: 'E2E Testing',
      priority: 'high',
      estimatedDurationMinutes: 10
    });

    EventPublisher.publish('MissionCompleted', {
      missionId: 'm-integration',
      actualDurationMinutes: 20, // 50% accuracy
      outcome: 'success'
    });

    // 4. Verify AlertEngine reacted and published alert
    expect(alertCallback).toHaveBeenCalled();
    const alertEvent = alertCallback.mock.calls[0][0];
    expect(alertEvent.payload.ruleName).toBe('Performance Regression');
    expect(alertEvent.payload.currentValue).toBe(6500);

    // 5. Verify PredictionEngine outputs correct calculations
    const projections = globalPredictionEngine.getProjections();
    expect(projections.planningSuccessScore).toBe(50); // 10/20 = 50%
    expect(projections.completionProbability).toBe(100); // 1 created, 1 completed
    expect(projections.burnoutRiskLevel).toBe('low'); // no hours accumulated

    EventSubscriber.unsubscribe('PerformanceRegressionAlert', alertCallback);
  });
});
