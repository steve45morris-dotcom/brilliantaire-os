import { getDB } from '../db.js';

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

  constructor() {
    this.initPersistence();
  }

  private initPersistence(): void {
    const db = getDB();
    db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_nodes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        properties_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS knowledge_edges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_node_id TEXT NOT NULL,
        to_node_id TEXT NOT NULL,
        type TEXT NOT NULL,
        properties_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const nodeRows = db.prepare(`SELECT * FROM knowledge_nodes`).all() as any[];
    for (const r of nodeRows) {
      this.nodes.set(r.id, {
        id: r.id,
        type: r.type as NodeType,
        properties: JSON.parse(r.properties_json || '{}')
      });
    }

    const edgeRows = db.prepare(`SELECT * FROM knowledge_edges`).all() as any[];
    for (const r of edgeRows) {
      this.edges.push({
        fromNodeId: r.from_node_id,
        toNodeId: r.to_node_id,
        type: r.type as EdgeType,
        properties: JSON.parse(r.properties_json || '{}')
      });
    }
  }

  public addNode(id: string, type: NodeType, properties: Record<string, any> = {}): void {
    this.nodes.set(id, { id, type, properties });

    const db = getDB();
    db.prepare(`
      INSERT INTO knowledge_nodes (id, type, properties_json)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET type = excluded.type, properties_json = excluded.properties_json
    `).run(id, type, JSON.stringify(properties));
  }

  public addEdge(fromNodeId: string, toNodeId: string, type: EdgeType, properties: Record<string, any> = {}): void {
    this.edges.push({ fromNodeId, toNodeId, type, properties });

    const db = getDB();
    db.prepare(`
      INSERT INTO knowledge_edges (from_node_id, to_node_id, type, properties_json)
      VALUES (?, ?, ?, ?)
    `).run(fromNodeId, toNodeId, type, JSON.stringify(properties));
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
    const db = getDB();
    db.exec(`DELETE FROM knowledge_nodes; DELETE FROM knowledge_edges;`);
  }
}

export const globalGraphStore = new GraphStore();
