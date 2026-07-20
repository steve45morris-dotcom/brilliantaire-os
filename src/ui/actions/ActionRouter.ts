import { globalActionFeedback } from './ActionFeedback.js';
import { globalModalRegistry } from './ModalRegistry.js';

export class ActionRouter {
  public routeAction(actionId: string, context?: Record<string, any>): void {
    console.log(`[ActionRouter] Routing UI action: ${actionId}`);

    // If it is a known fallback button (e.g. settings parameters or stubbed integrations)
    if (actionId.startsWith('stub:') || actionId.includes('unsupported') || actionId.includes('dead')) {
      const label = context?.label || actionId;
      globalModalRegistry.open({
        title: 'Option Under Configuration',
        content: `The requested action "${label}" requires integration of the corresponding Universal Integration Framework (UIF) plugin adapter. Status: mock preview queued.`,
        type: 'fallback'
      });
      globalActionFeedback.triggerFeedback(actionId, 'unavailable', 'Requires plugin configuration');
      return;
    }

    // Interactive approvals simulation
    if (actionId.includes('approve') || actionId.includes('activate')) {
      globalActionFeedback.triggerFeedback(actionId, 'success');
      return;
    }

    // Default to success/queued feedback
    globalActionFeedback.triggerFeedback(actionId, 'success');
  }
}

export const globalActionRouter = new ActionRouter();
export const globalActionRouterRegistryKey = 'ActionRouter';
