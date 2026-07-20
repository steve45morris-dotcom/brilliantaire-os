import { globalEventBus } from '../../kernel/events/EventBus.js';

export class OpenAIEventMapper {
  public static publishRequestCompleted(requestId: string, model: string, tokens: number, cost: number): void {
    globalEventBus.publish('OpenAIRequestCompleted', {
      requestId,
      model,
      tokens,
      cost,
      timestamp: new Date().toISOString()
    });
  }

  public static publishRequestFailed(requestId: string, model: string, error: string): void {
    globalEventBus.publish('OpenAIRequestFailed', {
      requestId,
      model,
      error,
      timestamp: new Date().toISOString()
    });
  }

  public static publishRealtimeSessionStarted(sessionId: string): void {
    globalEventBus.publish('OpenAIRealtimeConnected', {
      sessionId,
      timestamp: new Date().toISOString()
    });
  }

  public static publishRealtimeSessionEnded(sessionId: string): void {
    globalEventBus.publish('OpenAIRealtimeDisconnected', {
      sessionId,
      timestamp: new Date().toISOString()
    });
  }
}
