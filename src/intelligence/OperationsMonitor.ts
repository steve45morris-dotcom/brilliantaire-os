import { globalTelemetryCollector } from './TelemetryCollector.js';
import { globalIntelligenceRegistry } from './IntelligenceRegistry.js';

export class OperationsMonitor {
  public checkSystemHealth(): { status: 'optimal' | 'degraded'; telemetry: any } {
    const telemetry = globalTelemetryCollector.getTelemetry();
    const alerts = globalIntelligenceRegistry.getAlerts();
    const activeAlertsCount = alerts.filter(a => a.status === 'active' && (a.severity === 'high' || a.severity === 'critical')).length;

    // Degrade status if we have more than 2 high/critical active alerts
    return {
      status: activeAlertsCount >= 2 ? 'degraded' : 'optimal',
      telemetry
    };
  }
}

export const globalOperationsMonitor = new OperationsMonitor();
export default globalOperationsMonitor;
