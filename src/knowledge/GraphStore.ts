export type NodeType =
  | 'Project'
  | 'Agent'
  | 'Skill'
  | 'Workflow'
  | 'Memory'
  | 'Decision'
  | 'Report'
  | 'Research'
  | 'Study'
  | 'Pilot'
  | 'Practice'
  | 'Source'
  | 'Evidence'
  | 'SkillCandidate'
  | 'Standard'
  | 'Person'
  | 'Goal'
  | 'Revenue'
  | 'Content'
  | 'Document'
  | 'Plugin'
  | 'Command';
export type EdgeType =
  | 'USES'
  | 'CREATED_BY'
  | 'DEPENDS_ON'
  | 'RELATED_TO'
  | 'STUDIES'
  | 'JUSTIFIED_BY'
  | 'APPLIES_WHEN'
  | 'IMPLEMENTED_BY'
  | 'SOURCED_FROM'
  | 'PACKAGED_AS'
  | 'DUPLICATES'
  | 'IMPROVES'
  | 'REJECTED_FOR'
  | 'GENERATED'
  | 'IMPROVED_BY'
  | 'OWNED_BY'
  | 'REFERENCES'
  | 'BLOCKED_BY'
  | 'PRODUCED_REVENUE'
  | 'VERIFIED_BY'
  | 'TRIGGERED'
  | 'UPDATED'
  | 'OPENAI_REQUEST_USED_MODEL'
  | 'OPENAI_REQUEST_RELATED_TO_PROJECT'
  | 'OPENAI_RESPONSE_GENERATED_RECOMMENDATION'
  | 'OPENAI_TOOL_ACCESSED_RESOURCE'
  | 'OPENAI_RESPONSE_VERIFIED_BY'
  | 'OPENAI_SESSION_BELONGS_TO_WORKSPACE'
  | 'SKILL_TESTED_BY'
  | 'PILOT_APPLIED_TO'
  | 'PILOT_PRODUCED'
  | 'PILOT_EXPOSED_RISK'
  | 'PILOT_VERIFIED_BY'
  | 'PILOT_IMPROVED'
  | 'PILOT_REJECTED'
  | 'PILOT_PROMOTED';

export interface GraphNode {
  id: string;
  type: NodeType;
  properties: Record<string, any>;
}

export interface GraphEdge {
  fromNodeId: string;
  toNodeId: string;
  type: EdgeType;
  properties: Record<string, any>;
}

export class GraphStore {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];

  public addNode(id: string, type: NodeType, properties: Record<string, any> = {}): void {
    this.nodes.set(id, { id, type, properties });
  }

  public addEdge(fromNodeId: string, toNodeId: string, type: EdgeType, properties: Record<string, any> = {}): void {
    this.edges.push({ fromNodeId, toNodeId, type, properties });
  }

  public getNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  public getEdges(): GraphEdge[] {
    return [...this.edges];
  }

  public getNodeById(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public clear(): void {
    this.nodes.clear();
    this.edges = [];
  }
}

export const globalGraphStore = new GraphStore();
