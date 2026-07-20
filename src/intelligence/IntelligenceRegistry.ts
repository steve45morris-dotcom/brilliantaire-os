export interface Observation {
  id: string;
  source: string;
  category: string;
  timestamp: string;
  message: string;
  data: Record<string, any>;
}

export interface Prediction {
  id: string;
  title: string;
  description: string;
  confidence: number;
  expectedDate: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface Recommendation {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  reason: string;
  expectedImpact: string;
  estimatedEffort: string;
  requiredApprovals: boolean;
  status: 'pending' | 'accepted' | 'rejected';
  metadata?: Record<string, any>;
}


export interface Insight {
  id: string;
  category: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  timestamp: string;
  status: 'active' | 'resolved';
}

export class IntelligenceRegistry {
  private observations: Observation[] = [];
  private predictions: Prediction[] = [];
  private recommendations: Recommendation[] = [];
  private insights: Insight[] = [];
  private alerts: Alert[] = [];
  private feedbackLogs: Array<{ recId: string; outcome: 'accepted' | 'rejected' }> = [];

  public addObservation(obs: Observation): void {
    this.observations.push(obs);
    if (this.observations.length > 200) {
      this.observations.shift();
    }
  }

  public getObservations(): Observation[] {
    return [...this.observations];
  }

  public addPrediction(pred: Prediction): void {
    this.predictions.push(pred);
    if (this.predictions.length > 50) {
      this.predictions.shift();
    }
  }

  public getPredictions(): Prediction[] {
    return [...this.predictions];
  }

  public addRecommendation(rec: Recommendation): void {
    this.recommendations.push(rec);
    if (this.recommendations.length > 50) {
      this.recommendations.shift();
    }
  }

  public getRecommendations(): Recommendation[] {
    return [...this.recommendations];
  }

  public addInsight(ins: Insight): void {
    this.insights.push(ins);
    if (this.insights.length > 50) {
      this.insights.shift();
    }
  }

  public getInsights(): Insight[] {
    return [...this.insights];
  }

  public addAlert(alert: Alert): void {
    this.alerts.push(alert);
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }
  }

  public getAlerts(): Alert[] {
    return [...this.alerts];
  }

  public resolveAlert(id: string): void {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.status = 'resolved';
    }
  }

  public logFeedback(recId: string, outcome: 'accepted' | 'rejected'): void {
    this.feedbackLogs.push({ recId, outcome });
    const rec = this.recommendations.find(r => r.id === recId);
    if (rec) {
      rec.status = outcome === 'accepted' ? 'accepted' : 'rejected';
      if (outcome === 'accepted' && recId.startsWith('rec-model-') && rec.metadata) {
        import('../models/ModelConfiguration.js').then(({ globalModelConfigManager }) => {
          globalModelConfigManager.updateAssignments({ [rec.metadata!.role]: rec.metadata!.modelId });
        }).catch(err => {
          console.error('[IntelligenceRegistry] Failed to apply model assignment update:', err);
        });
      }
    }
  }

  public getFeedbackLogs(): Array<{ recId: string; outcome: 'accepted' | 'rejected' }> {
    return [...this.feedbackLogs];
  }

  public clear(): void {
    this.observations = [];
    this.predictions = [];
    this.recommendations = [];
    this.insights = [];
    this.alerts = [];
    this.feedbackLogs = [];
  }
}

export const globalIntelligenceRegistry = new IntelligenceRegistry();
export default globalIntelligenceRegistry;
