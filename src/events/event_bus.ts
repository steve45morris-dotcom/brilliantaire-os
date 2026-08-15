export type EventMap = {
  MissionCreated: { id: string; name: string; priority: 'low' | 'medium' | 'high' };
  MissionStarted: { id: string };
  MissionPaused: { id: string };
  MissionCompleted: { id: string };
  MissionSkipped: { id: string };
  TimelineGenerated: { missionId: string; stepsCount: number; duration: number };
  TimelineAdjusted: { missionId: string; stepsCount: number; duration: number };
  LearningLogged: { missionId: string; logId: string; state: string };
  DayApproved: { date: string; approvedBy: string };
};

export type EventKey = keyof EventMap;
export type EventListener<K extends EventKey> = (data: EventMap[K]) => void | Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private listeners: { [K in EventKey]?: EventListener<K>[] } = {};

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event.
   * Returns an unsubscribe function.
   */
  public subscribe<K extends EventKey>(event: K, listener: EventListener<K>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [] as any;
    }
    this.listeners[event]!.push(listener as any);

    return () => {
      this.listeners[event] = this.listeners[event]?.filter(l => l !== (listener as any)) as any;
    };
  }

  /**
   * Publish an event to all subscribers.
   */
  public async publish<K extends EventKey>(event: K, data: EventMap[K]): Promise<void> {
    const list = this.listeners[event] || [];
    console.log(`📢 [EventBus] Publishing event: "${event}"`, data);
    
    // Run all listeners
    const promises = list.map(async (listener) => {
      try {
        await listener(data);
      } catch (err) {
        console.error(`❌ [EventBus] Error in listener for event "${event}":`, err);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Clears all listeners (mostly for testing).
   */
  public clearAll() {
    this.listeners = {};
  }
}
