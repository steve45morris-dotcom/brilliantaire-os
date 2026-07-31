export interface TargetItem {
  id: string;
  name: string;
  revenuePotential: number;
  daysStale: number;
  failureRate: number;
}

export type PriorityLevel = 'P1' | 'P2' | 'P3';

export interface PrioritizedItem extends TargetItem {
  score: number;
  priority: PriorityLevel;
}

export class PriorityEngine {
  public rankItems(items: TargetItem[]): PrioritizedItem[] {
    return items.map(item => {
      // Calculate priority score (0 - 100)
      const score = Math.min(
        100,
        item.revenuePotential * 10 + item.daysStale * 5 + item.failureRate * 20
      );

      let priority: PriorityLevel = 'P3';
      if (score >= 70) priority = 'P1';
      else if (score >= 40) priority = 'P2';

      return {
        ...item,
        score,
        priority
      };
    }).sort((a, b) => b.score - a.score);
  }
}

export const globalPriorityEngine = new PriorityEngine();
