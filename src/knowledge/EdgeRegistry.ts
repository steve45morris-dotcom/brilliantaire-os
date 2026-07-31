import { globalGraphStore, EdgeType } from './GraphStore.js';

export class EdgeRegistry {
  public registerEdge(from: string, to: string, type: EdgeType, properties: Record<string, any> = {}): void {
    const fromNode = globalGraphStore.getNodeById(from);
    const toNode = globalGraphStore.getNodeById(to);

    if (fromNode && toNode) {
      globalGraphStore.addEdge(from, to, type, properties);
    }
  }
}

export const globalEdgeRegistry = new EdgeRegistry();
