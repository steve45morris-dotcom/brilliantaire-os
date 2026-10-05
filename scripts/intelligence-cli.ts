import { BootManager } from '../src/kernel/boot/BootManager.js';
import { globalServiceRegistry } from '../src/kernel/registry/ServiceRegistry.js';
import { withLiveSession } from './lib/withLiveSession.js';

const cmd = process.argv[2] || 'scan';

async function main() {
  // Boot the OSK to register all services
  const bootManager = new BootManager();
  await bootManager.boot();

  const oilService = globalServiceRegistry.getService('OperationsIntelligenceLayer');
  if (!oilService) {
    throw new Error('OperationsIntelligenceLayer service is not registered in the Kernel ServiceRegistry');
  }

  await withLiveSession(`intelligence:${cmd}`, async () => {
    switch (cmd) {
      case 'scan': {
        console.log('[OIL CLI] Initiating operations intelligence sweep...');
        await oilService.runObservations();
        console.log('[OIL CLI] Sweep complete. Observations, predictions, recommendations, and insights generated and synced.');
        break;
      }
      case 'brief': {
        const type = process.argv[3] || 'morning';
        console.log(`[OIL CLI] Generating Briefing: ${type.toUpperCase()}`);
        const brief = await oilService.getBriefing(type);
        console.log(brief);
        break;
      }
      case 'timeline': {
        const timeframe = (process.argv[3] || 'all') as 'today' | 'week' | 'all';
        console.log(`[OIL CLI] Fetching chronological timeline feed (timeframe: ${timeframe.toUpperCase()})...`);
        const timeline = await oilService.getTimeline(timeframe);
        if (timeline.length === 0) {
          console.log('No timeline events recorded.');
        } else {
          timeline.forEach((item: any) => {
            console.log(`[${item.timestamp}] [${item.source}] ${item.event}`);
          });
        }
        break;
      }
      case 'predict': {
        console.log('[OIL CLI] Querying active risk predictions...');
        const predictions = await oilService.getPredictions();
        if (predictions.length === 0) {
          console.log('No active predictions recorded.');
        } else {
          predictions.forEach((p: any) => {
            console.log(`- **${p.title}** (${p.riskLevel.toUpperCase()})`);
            console.log(`  Confidence: ${p.confidence}% | Target: ${p.expectedDate}`);
            console.log(`  Description: ${p.description}\n`);
          });
        }
        break;
      }
      case 'recommend': {
        console.log('[OIL CLI] Querying prioritized action recommendations...');
        const recommendations = await oilService.getRecommendations();
        const pending = recommendations.filter((r: any) => r.status === 'pending');
        if (pending.length === 0) {
          console.log('No pending recommendations.');
        } else {
          pending.forEach((r: any) => {
            console.log(`- **[${r.priority.toUpperCase()}]** ${r.title}`);
            console.log(`  Reason: ${r.reason}`);
            console.log(`  Impact: ${r.expectedImpact}`);
            console.log(`  Approvals Needed: ${r.requiredApprovals ? 'YES' : 'NO'} | Effort: ${r.estimatedEffort}\n`);
          });
        }
        break;
      }
      case 'alerts': {
        console.log('[OIL CLI] Querying active system alerts...');
        const alerts = await oilService.getAlerts();
        const active = alerts.filter((a: any) => a.status === 'active');
        if (active.length === 0) {
          console.log('No active alerts.');
        } else {
          active.forEach((a: any) => {
            console.log(`- [${a.severity.toUpperCase()}] [${a.timestamp}] ${a.reason}`);
          });
        }
        break;
      }
      default: {
        console.log(`Unknown command: ${cmd}`);
        console.log('Usage: npm run intelligence:scan|brief|timeline|predict|recommend|alerts');
        break;
      }
    }
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
