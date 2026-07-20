export interface OpportunityNode {
  title: string;
  source: string;
  expectedValue: number;
}

export class OpportunityScanner {
  public scanOpportunities(intelligenceReports: string[]): OpportunityNode[] {
    const list: OpportunityNode[] = [];

    if (intelligenceReports.some(r => r.toLowerCase().includes('agent'))) {
      list.push({
        title: 'Launch Autonomous Marketing Agent campaign',
        source: 'Intelligence analysis',
        expectedValue: 3500
      });
    }

    list.push({
      title: 'Optimize TreeGroove ad targeting configuration',
      source: 'Revenue analytics',
      expectedValue: 1200
    });

    return list;
  }
}

export const globalOpportunityScanner = new OpportunityScanner();
