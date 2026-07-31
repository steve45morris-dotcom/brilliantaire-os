import { globalGraphStore } from './GraphStore.js';

export interface VisualNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
}

export interface VisualEdge {
  source: string;
  target: string;
  type: string;
}

export class GraphVisualizer {
  public getVisualLayout() {
    const nodes = globalGraphStore.getNodes();
    const edges = globalGraphStore.getEdges();

    const visualNodes: VisualNode[] = nodes.map((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const radius = 150;
      return {
        id: node.id,
        label: node.id,
        type: node.type,
        x: Math.round(Math.cos(angle) * radius + 200),
        y: Math.round(Math.sin(angle) * radius + 200)
      };
    });

    const visualEdges: VisualEdge[] = edges.map(edge => ({
      source: edge.fromNodeId,
      target: edge.toNodeId,
      type: edge.type
    }));

    return {
      nodes: visualNodes,
      edges: visualEdges
    };
  }
}

export const globalGraphVisualizer = new GraphVisualizer();
