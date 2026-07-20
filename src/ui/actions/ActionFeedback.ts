import { ActionFeedbackType } from './UIActionTypes.js';
import { globalToastManager } from './ToastManager.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalLiveOperationsStore } from '../../kernel/live/LiveOperationsStore.js';

export class ActionFeedback {
  public triggerFeedback(actionId: string, type: ActionFeedbackType, details?: string): void {
    // Log the user action to the kernel EventBus
    globalEventBus.publish('UIActionTriggered', { actionId, type, details, timestamp: new Date().toISOString() });

    // Also push to Live Operations store
    globalLiveOperationsStore.addEvent({
      id: `ui-event-${Math.random().toString(36).substr(2, 9)}`,
      type: 'UIAction',
      timestamp: new Date().toISOString(),
      source: 'DashboardUI',
      actor: 'Commander',
      severity: (type === 'failed' ? 'error' : type === 'warning' ? 'warn' : 'info') as any,
      message: `UI action "${actionId}" triggered with status: ${type}`,
      data: { actionId, type, details: details || '' },
      attention: type === 'approval_required'
    });
    globalEventBus.publish('LiveOperationsSnapshotUpdated', { actionId });

    // Show appropriate notifications
    switch (type) {
      case 'success':
        globalToastManager.show(`Action "${actionId}" executed successfully.`, 'success');
        break;
      case 'warning':
        globalToastManager.show(`Execution threshold bounds reached: ${details || ''}`, 'warn');
        break;
      case 'approval_required':
        globalToastManager.show(`Action "${actionId}" requires human admin approval.`, 'warn');
        break;
      case 'unavailable':
        globalToastManager.show(`Option "${actionId}" is currently unavailable.`, 'info');
        break;
      case 'queued':
        globalToastManager.show(`Action "${actionId}" has been queued for execution.`, 'info');
        break;
      case 'failed':
        globalToastManager.show(`Execution failed: ${details || 'unknown error'}`, 'warn');
        break;
    }
  }
}

export const globalActionFeedback = new ActionFeedback();
export const globalActionFeedbackRegistryKey = 'ActionFeedback';
