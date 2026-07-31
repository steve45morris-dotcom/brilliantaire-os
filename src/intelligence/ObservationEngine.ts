import { globalIntelligenceRegistry } from './IntelligenceRegistry.js';
import { globalEventBus } from '../kernel/events/EventBus.js';

export class ObservationEngine {
  public startObserving(): void {
    globalEventBus.subscribe('SystemBooting', (event) => {
      this.record('Kernel', 'boot', 'System boot sequence initialized', event.payload);
    });

    globalEventBus.subscribe('SystemOnline', (event) => {
      this.record('Kernel', 'online', 'System is fully online and responsive', event.payload);
    });

    globalEventBus.subscribe('LiveOperationsStarted', (event) => {
      this.record('Runtime', 'live_operations', 'Live operations diagnostics started', event.payload);
    });

    globalEventBus.subscribe('LiveOperationsTaskFailed', (event) => {
      this.record('Runtime', 'failure', `Task execution failed: ${event.payload?.taskId || 'unknown'}`, event.payload);
    });

    globalEventBus.subscribe('GitHubLiveOperationsSynced', (event) => {
      this.record('GitHub', 'sync', `GitHub repository sync completed for ${event.payload?.repoName || 'unknown'}`, event.payload);
    });

    globalEventBus.subscribe('WorkflowCompleted', (event) => {
      const wfName = event.payload?.workflowName || event.payload?.name || 'unknown';
      const wfId = event.payload?.workflowId || event.payload?.id || 'unknown';
      this.record('Workflows', 'workflow_completed', `Workflow completed: ${wfName} (${wfId})`, event.payload);
    });

    globalEventBus.subscribe('MetricRecorded', (event) => {
      const metricName = event.payload?.name || event.payload?.key || 'unknown';
      const value = event.payload?.value !== undefined ? event.payload.value : 'N/A';
      this.record('Metrics', 'metric_recorded', `Metric recorded: ${metricName} = ${value}`, event.payload);
    });

    globalEventBus.subscribe('IntegrationRegistered', (event) => {
      const intName = event.payload?.name || event.payload?.id || 'unknown';
      this.record('Integrations', 'integration_registered', `Integration registered: ${intName}`, event.payload);
    });

    globalEventBus.subscribe('IntegrationLifecycleUpdated', (event) => {
      const intName = event.payload?.name || event.payload?.id || 'unknown';
      const status = event.payload?.status || 'unknown';
      this.record('Integrations', 'integration_updated', `Integration ${intName} lifecycle status updated to ${status}`, event.payload);
    });

    globalEventBus.subscribe('IntelligenceAlertTriggered', (event) => {
      const reason = event.payload?.reason || event.payload?.message || 'unknown';
      const severity = event.payload?.severity || 'info';
      this.record('Alerts', 'alert_triggered', `Intelligence Alert [${severity.toUpperCase()}]: ${reason}`, event.payload);
    });
  }

  public record(source: string, category: string, message: string, data: Record<string, any> = {}): void {
    globalIntelligenceRegistry.addObservation({
      id: `obs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      source,
      category,
      timestamp: new Date().toISOString(),
      message,
      data
    });
  }
}

export const globalObservationEngine = new ObservationEngine();
export default globalObservationEngine;
