import { globalNodeRegistry } from './NodeRegistry.js';
import { globalEdgeRegistry } from './EdgeRegistry.js';

export class MemorySync {
  public syncMemoryToGraph(memories: Array<{ id: string; content: string }>): void {
    memories.forEach(mem => {
      // Sync memory node
      globalNodeRegistry.registerNode(mem.id, 'Memory', { content: mem.content });

      // Link to main System node
      globalEdgeRegistry.registerEdge(mem.id, 'system-core', 'RELATED_TO');
    });
  }
}

export const globalMemorySync = new MemorySync();
