import { globalEventBus } from '../../kernel/events/EventBus.js';

export const INTEGRATION_EVENTS = {
  REGISTERED: 'integration.registered',
  ACTIVATED: 'integration.activated',
  SUSPENDED: 'integration.suspended',
  DISABLED: 'integration.disabled',
  REMOVED: 'integration.removed',
  UPGRADED: 'integration.upgraded',
  HEALTH_CHECKED: 'integration.health_checked',
  SYNCED: 'integration.synced',
  BRIDGE_CALLED: 'integration.bridge_called',
  AUTH_FAILED: 'integration.auth_failed',
  PERMISSION_DENIED: 'integration.permission_denied'
} as const;

export interface IntegrationEvent {
  type: string;
  integrationId: string;
  timestamp: string;
  data?: any;
}

export class IntegrationEventPublisher {
  public publish(type: string, integrationId: string, data?: any): void {
    const event: IntegrationEvent = {
      type,
      integrationId,
      timestamp: new Date().toISOString(),
      data
    };
    globalEventBus.publish(type, event);
  }
}

export const globalIntegrationEventPublisher = new IntegrationEventPublisher();
