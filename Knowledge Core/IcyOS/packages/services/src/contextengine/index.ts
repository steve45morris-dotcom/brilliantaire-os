import { UUID } from '@icyos/shared';

export interface MissionContext {
  notes: string[];
  calendar_events: string[];
  files: string[];
  recent_decisions: string[];
  learning_signals: string[];
  retrieved_at: string;
}

export interface CacheEntry {
  context: MissionContext;
  expires_at: number;
}

export class ContextEngine {
  private cache = new Map<string, CacheEntry>();
  private cacheTTLMs = 60000;

  async assembleContext(missionId: UUID): Promise<MissionContext> {
    const cached = this.getCache(missionId);
    if (cached) {
      return cached;
    }

    const context: MissionContext = {
      notes: ['Obsidian: IcyOS Phase 2 Plan', 'Obsidian: Lagos Street Code Lyrical pack'],
      calendar_events: ['Sync with Tree Groove Records at 14:00'],
      files: ['packages/services/src/index.ts', 'apps/web/package.json'],
      recent_decisions: ['DEC-SP15-01: Unified AI provider interface', 'DEC-AR-01: Service DI parameters'],
      learning_signals: ['Win: Passed all compilation checks', 'Blocker: Timezone mismatch solved'],
      retrieved_at: new Date().toISOString()
    };

    this.setCache(missionId, context);
    return context;
  }

  private getCache(missionId: string): MissionContext | undefined {
    const entry = this.cache.get(missionId);
    if (!entry) return undefined;
    if (Date.now() > entry.expires_at) {
      this.cache.delete(missionId);
      return undefined;
    }
    return entry.context;
  }

  private setCache(missionId: string, context: MissionContext) {
    this.cache.set(missionId, {
      context,
      expires_at: Date.now() + this.cacheTTLMs
    });
  }

  invalidateCache(missionId: string) {
    this.cache.delete(missionId);
  }
}
