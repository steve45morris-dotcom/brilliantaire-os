import { describe, it, expect, vi } from 'vitest';
import { globalEventBus } from './EventBus.js';
import { EventPublisher } from './Publisher.js';
import { EventSubscriber } from './Subscriber.js';
import { TypedEventRegistry } from './TypedEventRegistry.js';

describe('Events Runtime System', () => {
  it('should validate and publish events correctly', () => {
    const callback = vi.fn();
    EventSubscriber.subscribe('WorkspaceOpened', callback);

    EventPublisher.publish('WorkspaceOpened', { workspacePath: '/Users/alexanderanthony' });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].payload.workspacePath).toBe('/Users/alexanderanthony');

    EventSubscriber.unsubscribe('WorkspaceOpened', callback);
  });

  it('should throw on validation failure', () => {
    expect(() => {
      EventPublisher.publish('WorkspaceOpened', { invalidKey: 123 });
    }).toThrow();
  });

  it('should execute middleware correctly', () => {
    const middleware = vi.fn((event, next) => {
      event.payload.modifiedByMiddleware = true;
      next();
    });

    globalEventBus.use(middleware);

    const callback = vi.fn();
    EventSubscriber.subscribe('PluginLoaded', callback);

    EventPublisher.publish('PluginLoaded', { pluginName: 'test-plugin' });

    expect(middleware).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].payload.modifiedByMiddleware).toBe(true);
  });
});
