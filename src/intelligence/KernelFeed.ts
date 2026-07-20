import { globalOperationsMonitor } from './OperationsMonitor.js';
import { globalHealthMonitor } from '../kernel/monitoring/HealthMonitor.js';

export class KernelFeed {
  public checkKernelTelemetry(): any {
    const oilHealth = globalOperationsMonitor.checkSystemHealth();
    const kernelReport = globalHealthMonitor.collectReport();
    return {
      status: oilHealth.status,
      oilTelemetry: oilHealth.telemetry,
      kernelDiagnostics: kernelReport,
      timestamp: new Date().toISOString()
    };
  }
}

export const globalKernelFeed = new KernelFeed();
export default globalKernelFeed;
