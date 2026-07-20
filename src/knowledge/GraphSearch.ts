import { globalGraphStore, GraphNode } from './GraphStore.js';

export class GraphSearch {
  public searchByKeyword(keyword: string): GraphNode[] {
    const term = keyword.toLowerCase();
    return globalGraphStore.getNodes().filter(node => {
      const matchId = node.id.toLowerCase().includes(term);
      const matchProps = Object.values(node.properties).some(val => 
        String(val).toLowerCase().includes(term)
      );
      return matchId || matchProps;
    });
  }
}

export const globalGraphSearch = new GraphSearch();
