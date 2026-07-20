import { TelemetryRecord } from './StorageAdapter.js';

export class MetricsCalculators {
  public static calculatePlanningAccuracy(records: TelemetryRecord[]): number {
    const created = records.filter(r => r.type === 'MissionCreated');
    const completed = records.filter(r => r.type === 'MissionCompleted');

    if (created.length === 0 || completed.length === 0) return 100;

    let totalDiff = 0;
    let count = 0;

    completed.forEach(comp => {
      const match = created.find(cre => cre.payload.missionId === comp.payload.missionId);
      if (match) {
        const est = match.payload.estimatedDurationMinutes;
        const act = comp.payload.actualDurationMinutes;
        if (act > 0) {
          // Cap planning accuracy at 100% to penalize underestimation/overestimation
          const accuracy = Math.min(100, (est / act) * 100);
          totalDiff += accuracy;
          count++;
        }
      }
    });

    return count > 0 ? Math.round(totalDiff / count) : 100;
  }

  public static calculateExecutionAccuracy(records: TelemetryRecord[]): number {
    const created = records.filter(r => r.type === 'MissionCreated');
    const completed = records.filter(r => r.type === 'MissionCompleted');

    if (created.length === 0) return 100;
    return Math.round((completed.length / created.length) * 100);
  }

  public static calculateFocusEfficiency(records: TelemetryRecord[]): number {
    const completedSessions = records.filter(r => r.type === 'SessionCompleted');
    if (completedSessions.length === 0) return 100;

    let totalDuration = 0;
    let totalAdjusted = 0;

    completedSessions.forEach(sess => {
      const duration = sess.payload.focusDurationMinutes || 0;
      const interruptions = sess.payload.interruptionsCount || 0;
      const penalty = interruptions * 5; // penalize 5 mins per interruption
      const adjusted = Math.max(0, duration - penalty);
      
      totalDuration += duration;
      totalAdjusted += adjusted;
    });

    if (totalDuration === 0) return 100;
    return Math.round((totalAdjusted / totalDuration) * 100);
  }

  public static calculateAICostAndLatency(records: TelemetryRecord[]): { totalCost: number; avgLatencyMs: number } {
    const aiCompleted = records.filter(r => r.type === 'AIRequestCompleted');
    if (aiCompleted.length === 0) return { totalCost: 0, avgLatencyMs: 0 };

    let totalCost = 0;
    let totalLatency = 0;

    aiCompleted.forEach(req => {
      totalCost += req.payload.estimatedCost || 0;
      totalLatency += req.payload.latencyMs || 0;
    });

    return {
      totalCost: parseFloat(totalCost.toFixed(4)),
      avgLatencyMs: Math.round(totalLatency / aiCompleted.length)
    };
  }

  public static calculateLocalOperationsPercent(records: TelemetryRecord[]): number {
    const remoteTypes = ['AIRequestCompleted', 'GitHubSyncCompleted', 'RemoteSyncRun'];
    const localTypes = [
      'InsightsReflected',
      'RecoveryTriggered',
      'DawNotesParsed',
      'StreamingMetricsIngested',
      'TestOrchestrationCompleted',
      'CheckpointCreated',
      'RollbackExecuted',
      'MissionCompleted',
      'SessionCompleted',
      'MetricRecorded'
    ];

    const remoteCount = records.filter(r => remoteTypes.includes(r.type)).length;
    const localCount = records.filter(r => localTypes.includes(r.type)).length;

    const total = remoteCount + localCount;
    if (total === 0) return 95; // Default safe offline baseline
    return Math.round((localCount / total) * 100);
  }

  public static calculateOfflinePrivacyIndex(records: TelemetryRecord[]): number {
    const localPercent = this.calculateLocalOperationsPercent(records);
    // Security audits count penalty: let's look for security audit warning records
    const securityWarnings = records.filter(r => r.type === 'SecurityAuditWarning').length;
    const penalty = securityWarnings * 10;
    return Math.max(0, Math.min(100, localPercent - penalty));
  }
}

