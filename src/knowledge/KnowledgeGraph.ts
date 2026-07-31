import { globalGraphStore } from './GraphStore.js';
import { globalNodeRegistry } from './NodeRegistry.js';
import { globalEdgeRegistry } from './EdgeRegistry.js';
import { globalGraphVisualizer } from './GraphVisualizer.js';
import { globalRecommendationEngine } from './RecommendationEngine.js';

export class KnowledgeGraphOrchestrator {
  public initializeGraph(): void {
    globalGraphStore.clear();

    // Register Default System Core Root Nodes
    globalNodeRegistry.registerNode('system-core', 'Project', { description: 'The One System Kernel core framework' });
    globalNodeRegistry.registerNode('agent-router', 'Agent', { description: 'Main strategic agent container' });
    globalNodeRegistry.registerNode('memory-vault', 'Memory', { description: 'Connected Obsidian markdown adapter' });
    globalNodeRegistry.registerNode('wf-publishing', 'Workflow', { description: 'Content publishing automation task' });

    // Register default links
    globalEdgeRegistry.registerEdge('agent-router', 'system-core', 'USES');
    globalEdgeRegistry.registerEdge('memory-vault', 'system-core', 'RELATED_TO');
    globalEdgeRegistry.registerEdge('wf-publishing', 'system-core', 'DEPENDS_ON');
  }

  public getGraphState() {
    const layout = globalGraphVisualizer.getVisualLayout();
    const recommendations = globalRecommendationEngine.getRecommendations();

    return {
      nodes: layout.nodes,
      edges: layout.edges,
      recommendations
    };
  }
}

export const globalKnowledgeGraph = new KnowledgeGraphOrchestrator();
