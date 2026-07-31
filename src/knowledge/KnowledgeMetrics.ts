import { globalGraphStore } from './GraphStore.js';

export class KnowledgeMetrics {
  public getGraphSummary() {
    const nodes = globalGraphStore.getNodes();
    const edges = globalGraphStore.getEdges();

    return {
      totalNodesCount: nodes.length,
      totalEdgesCount: edges.length,
      graphDensityPercent: nodes.length > 1 ? (edges.length / (nodes.length * (nodes.length - 1))) * 100 : 0
    };
  }
}

export const globalKnowledgeMetrics = new KnowledgeMetrics();
