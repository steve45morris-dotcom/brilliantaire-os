import { globalEventBus } from '../kernel/events/EventBus.js';

export class WorkspaceActions {
  public launchWorkflow(workspaceId: string, workflowId: string): void {
    console.log(`[WorkspaceActions] Launching workflow ${workflowId} inside workspace ${workspaceId}`);
    globalEventBus.publish('WorkflowStarted', { workspaceId, workflowId, timestamp: new Date().toISOString() });
  }

  public openMemory(workspaceId: string): void {
    console.log(`[WorkspaceActions] Opening Memory Graph context for workspace ${workspaceId}`);
    globalEventBus.publish('WorkspaceMemoryOpened', { workspaceId, timestamp: new Date().toISOString() });
  }

  public generateReport(workspaceId: string, reportName: string): void {
    console.log(`[WorkspaceActions] Generating report ${reportName} inside workspace ${workspaceId}`);
    globalEventBus.publish('WorkspaceReportGenerated', { workspaceId, reportName, timestamp: new Date().toISOString() });
  }
}

export const globalWorkspaceActions = new WorkspaceActions();
export const globalWorkspaceActionsRegistryKey = 'WorkspaceActions';
