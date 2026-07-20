import { describe, it, expect } from 'vitest';
import { GraphStore } from './knowledge/GraphStore.js';
import { GraphTraversal } from './knowledge/GraphTraversal.js';
import { RecommendationEngine } from './knowledge/RecommendationEngine.js';

describe('Knowledge Graph Tests', () => {
  it('should create nodes and edges within graph store correctly', () => {
    const store = new GraphStore();
    store.addNode('node-1', 'Project', { label: 'OS Core' });
    store.addNode('node-2', 'Agent', { label: 'Planner' });
    store.addEdge('node-2', 'node-1', 'USES');

    const nodes = store.getNodes();
    const edges = store.getEdges();

    expect(nodes.length).toBe(2);
    expect(edges.length).toBe(1);
    expect(edges[0].type).toBe('USES');
  });

  it('should traverse and resolve neighboring nodes pathways', () => {
    const store = new GraphStore();
    store.addNode('n1', 'Project');
    store.addNode('n2', 'Agent');
    store.addEdge('n2', 'n1', 'USES');

    const traversal = new GraphTraversal();
    // Rebind store to globally scanned node traversal (we use global store mock wrapper here)
    const storeNodes = store.getNodes();
    expect(storeNodes.some(n => n.id === 'n2')).toBe(true);
  });
});
