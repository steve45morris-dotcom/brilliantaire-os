import { globalIntelligenceRegistry } from './IntelligenceRegistry.js';
import { globalTimelineEngine } from './TimelineEngine.js';
import { globalOperationsMonitor } from './OperationsMonitor.js';
import { globalBriefingEngine } from './BriefingEngine.js';

export class RuntimeFeed {
  public queryIntents(query: string): string {
    const q = query.toLowerCase();

    // 1. Generate Briefing
    if (q.includes('briefing') || q.includes('brief')) {
      return globalBriefingEngine.generateBriefing('morning');
    }

    // 2. What changed today / timeline / project evolution
    if (q.includes('what changed') || q.includes('timeline') || q.includes('evolution') || q.includes('history')) {
      const timeframe = q.includes('week') ? 'week' as const : 'today' as const;
      const timeline = globalTimelineEngine.getChronologicalFeed(timeframe);
      if (timeline.length === 0) {
        return `No operations changes recorded in today's timeline.`;
      }
      return `### Operations Timeline (${timeframe.toUpperCase()})\n` + 
        timeline.map(t => `- [${t.timestamp.split('T')[1].substring(0, 8)}] [${t.source}] ${t.event}`).join('\n');
    }

    // 3. Why is revenue decreasing / correlations
    if (q.includes('revenue') && (q.includes('decrease') || q.includes('drop') || q.includes('why'))) {
      const observations = globalIntelligenceRegistry.getObservations();
      const correlations = observations.filter(o => o.category === 'correlation_detected');
      if (correlations.length > 0) {
        return `### Revenue Ingestion Analysis\nDetected correlations:\n` +
          correlations.map(c => `- **${c.message}**`).join('\n');
      }
      return 'Telemetry indicates revenue vectors are stable. No decline correlations have been triggered in the current window.';
    }

    // 4. What should I work on first / recommendations priority
    if (q.includes('work on first') || q.includes('priority') || q.includes('recommendations')) {
      const recs = globalIntelligenceRegistry.getRecommendations()
        .filter(r => r.status === 'pending')
        .sort((a, b) => {
          const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorities[b.priority] - priorities[a.priority];
        });
      if (recs.length === 0) {
        return 'No pending recommendations found. Your workspace is currently fully optimized.';
      }
      return `### Prioritized Recommendations\nHere is what you should work on first:\n` +
        recs.map((r, i) => `${i + 1}. **[${r.priority.toUpperCase()}]** ${r.title}\n   *Reason:* ${r.reason}\n   *Expected Impact:* ${r.expectedImpact}`).join('\n');
    }

    // 5. Show engineering risks / predictions / alerts
    if (q.includes('risk') || q.includes('failures') || q.includes('predictions') || q.includes('alerts')) {
      const predictions = globalIntelligenceRegistry.getPredictions();
      const alerts = globalIntelligenceRegistry.getAlerts().filter(a => a.status === 'active');
      
      let response = '### System Risks & Alerts\n';
      if (alerts.length > 0) {
        response += `\n**Active Alerts:**\n${alerts.map(a => `- [${a.severity.toUpperCase()}] ${a.reason}`).join('\n')}`;
      }
      if (predictions.length > 0) {
        response += `\n\n**Predictive Risk Forecast:**\n${predictions.map(p => `- **${p.title}** (${p.riskLevel.toUpperCase()} - Confidence: ${p.confidence}%)\n  *Details:* ${p.description}`).join('\n')}`;
      }
      return response;
    }

    // 6. Summarize project health / status
    if (q.includes('status') || q.includes('health') || q.includes('summarize')) {
      const health = globalOperationsMonitor.checkSystemHealth();
      const observations = globalIntelligenceRegistry.getObservations();
      const failuresCount = observations.filter(o => o.category === 'failure').length;

      return `### System Health Summary
* **Operational Status:** ${health.status.toUpperCase()}
* **Uptime:** ${health.telemetry.uptimeSeconds} seconds
* **CPU Usage:** ${health.telemetry.cpuUsagePercent}%
* **Memory Usage:** ${health.telemetry.memoryUsagePercent}%
* **Recent Failures:** ${failuresCount} recorded
* **Acceptance Rate:** ${health.telemetry.recommendationAcceptanceRate.toFixed(1)}%`;
    }

    return `Supernova Intent Parser: Direct query processed. Use phrases like "timeline", "revenue decline", "what should I work on first", or "summarize health".`;
  }
}

export const globalRuntimeFeed = new RuntimeFeed();
export default globalRuntimeFeed;
