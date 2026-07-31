import { globalGraphStore, GraphNode } from './GraphStore.js';

export class GraphTraversal {
  public findNeighbors(nodeId: string): GraphNode[] {
    const edges = globalGraphStore.getEdges();
    const neighbors: GraphNode[] = [];

    edges.forEach(edge => {
      if (edge.fromNodeId === nodeId) {
        const node = globalGraphStore.getNodeById(edge.toNodeId);
        if (node) neighbors.push(node);
      } else if (edge.toNodeId === nodeId) {
        const node = globalGraphStore.getNodeById(edge.fromNodeId);
        if (node) neighbors.push(node);
      }
    });

    return neighbors;
  }
}

export const globalGraphTraversal = new GraphTraversal();
