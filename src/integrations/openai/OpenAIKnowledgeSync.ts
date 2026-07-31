import { globalNodeRegistry } from '../../knowledge/NodeRegistry.js';
import { globalEdgeRegistry } from '../../knowledge/EdgeRegistry.js';

export class OpenAIKnowledgeSync {
  public static syncRequestToGraph(
    requestId: string,
    model: string,
    projectId: string,
    workspaceId: string
  ): void {
    // Register request node
    globalNodeRegistry.registerNode(requestId, 'Research', {
      requestId,
      provider: 'openai',
      timestamp: new Date().toISOString()
    });

    // 1. OPENAI_REQUEST_USED_MODEL
    globalNodeRegistry.registerNode(`model-${model}`, 'Plugin', { modelName: model });
    globalEdgeRegistry.registerEdge(requestId, `model-${model}`, 'OPENAI_REQUEST_USED_MODEL');

    // 2. OPENAI_REQUEST_RELATED_TO_PROJECT
    globalEdgeRegistry.registerEdge(requestId, projectId, 'OPENAI_REQUEST_RELATED_TO_PROJECT');

    // 3. OPENAI_SESSION_BELONGS_TO_WORKSPACE
    globalEdgeRegistry.registerEdge(requestId, workspaceId, 'OPENAI_SESSION_BELONGS_TO_WORKSPACE');
  }

  public static syncRecommendationToGraph(requestId: string, recommendationId: string): void {
    globalNodeRegistry.registerNode(recommendationId, 'Memory', {
      recommendationId,
      source: 'openai_response'
    });
    // 4. OPENAI_RESPONSE_GENERATED_RECOMMENDATION
    globalEdgeRegistry.registerEdge(requestId, recommendationId, 'OPENAI_RESPONSE_GENERATED_RECOMMENDATION');
  }

  public static syncToolAccessToGraph(requestId: string, toolName: string, resourceId: string): void {
    globalNodeRegistry.registerNode(`tool-${toolName}`, 'Command', { toolName });
    // 5. OPENAI_TOOL_ACCESSED_RESOURCE
    globalEdgeRegistry.registerEdge(`tool-${toolName}`, resourceId, 'OPENAI_TOOL_ACCESSED_RESOURCE');
  }

  public static syncVerificationToGraph(requestId: string, verifierId: string): void {
    globalNodeRegistry.registerNode(verifierId, 'Agent', { verifierId });
    // 6. OPENAI_RESPONSE_VERIFIED_BY
    globalEdgeRegistry.registerEdge(requestId, verifierId, 'OPENAI_RESPONSE_VERIFIED_BY');
  }
}
