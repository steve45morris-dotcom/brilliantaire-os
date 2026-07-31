import { globalGraphStore, GraphNode } from './GraphStore.js';

export class RecommendationEngine {
  public getRecommendations(): string[] {
    const nodes = globalGraphStore.getNodes();
    const recommendations: string[] = [];

    // Simple rule-based recommendations on node combinations
    const hasProject = nodes.some(n => n.type === 'Project');
    const hasWorkflow = nodes.some(n => n.type === 'Workflow');

    if (hasProject && !hasWorkflow) {
      recommendations.push('Create corresponding Workflows to automate project execution targets.');
    }

    if (nodes.length > 5) {
      recommendations.push('Schedule system audit sweep to deprecate stale modules.');
    }

    return recommendations;
  }
}

export const globalRecommendationEngine = new RecommendationEngine();
