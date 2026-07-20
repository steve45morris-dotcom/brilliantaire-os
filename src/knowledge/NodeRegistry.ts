import { globalGraphStore, NodeType } from './GraphStore.js';

export class NodeRegistry {
  public registerNode(id: string, type: NodeType, properties: Record<string, any> = {}): void {
    globalGraphStore.addNode(id, type, properties);
  }
}

export const globalNodeRegistry = new NodeRegistry();
