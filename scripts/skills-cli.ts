import { BootManager } from '../src/kernel/boot/BootManager.js';
import { globalServiceRegistry } from '../src/kernel/registry/ServiceRegistry.js';
import { withLiveSession } from './lib/withLiveSession.js';

const cmd = process.argv[2] || 'discover';

async function main() {
  const bootManager = new BootManager();
  await bootManager.boot();

  const skillAcquisitionService = globalServiceRegistry.getService('SkillAcquisitionService');
  if (!skillAcquisitionService) {
    throw new Error('SkillAcquisitionService is not registered in the Kernel ServiceRegistry');
  }

  await withLiveSession(`skills:${cmd}`, async () => {
    switch (cmd) {
      case 'discover': {
        const repo = process.argv[3] || 'steve45morris-dotcom/brilliantaire-os';
        console.log(`[SKILLS CLI] Scanning source repository: ${repo}...`);
        const discovered = await skillAcquisitionService.scan(repo);
        console.log(`[SKILLS CLI] Discovered ${discovered.length} skill candidates.`);
        discovered.forEach((item: any) => {
          console.log(`- ID: ${item.id} | Name: ${item.name} | Action: ${item.recommendedAction.toUpperCase()}`);
        });
        break;
      }
      case 'candidates': {
        const status = process.argv[3] || 'discovered';
        console.log(`[SKILLS CLI] Listing candidates with status: ${status.toUpperCase()}...`);
        const list = skillAcquisitionService.getCandidates(status as any);
        if (list.length === 0) {
          console.log('No candidates found with this status.');
        } else {
          list.forEach((item: any) => {
            console.log(`- [${item.id}] ${item.name} (${item.category}) - Risk: ${item.riskScore} | Compat: ${item.compatibilityScore}`);
          });
        }
        break;
      }
      case 'approve': {
        const id = process.argv[3];
        if (!id) {
          console.log('Usage: npm run skills:approve -- <candidate-id>');
        } else {
          skillAcquisitionService.approve(id);
          console.log(`[SKILLS CLI] Approved candidate: ${id} (Status updated to approved).`);
        }
        break;
      }
      case 'reject': {
        const id = process.argv[3];
        if (!id) {
          console.log('Usage: npm run skills:reject -- <candidate-id>');
        } else {
          skillAcquisitionService.reject(id);
          console.log(`[SKILLS CLI] Rejected candidate: ${id}.`);
        }
        break;
      }
      case 'verify': {
        const id = process.argv[3];
        if (!id) {
          console.log('Usage: npm run skills:verify -- <candidate-id>');
        } else {
          skillAcquisitionService.verify(id);
          console.log(`[SKILLS CLI] Verified candidate: ${id}.`);
        }
        break;
      }
      case 'activate': {
        const id = process.argv[3];
        if (!id) {
          console.log('Usage: npm run skills:activate -- <candidate-id>');
        } else {
          skillAcquisitionService.activate(id);
          console.log(`[SKILLS CLI] Activated candidate: ${id} (Status: active).`);
        }
        break;
      }
      default: {
        console.log(`Unknown command: ${cmd}`);
      }
    }
  });
}

main().catch(console.error);
