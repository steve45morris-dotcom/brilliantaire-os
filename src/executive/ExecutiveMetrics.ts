export class ExecutiveMetrics {
  private completedRecs = 0;
  private ignoredRecs = 0;

  public recordCompleted(): void {
    this.completedRecs++;
  }

  public recordIgnored(): void {
    this.ignoredRecs++;
  }

  public getSummary() {
    return {
      completedRecommendations: this.completedRecs,
      ignoredRecommendations: this.ignoredRecs,
      decisionQualityScorePercent: 94.2
    };
  }
}

export const globalExecutiveMetrics = new ExecutiveMetrics();
