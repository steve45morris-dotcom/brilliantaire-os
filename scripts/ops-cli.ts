import { globalLiveOperationsStore } from '../src/kernel/live/LiveOperationsStore.js';
import { globalAttentionEngine } from '../src/kernel/live/AttentionEngine.js';

const cmd = process.argv[2] || 'status';

function main() {
  console.log(`[Live Operations CLI] Querying status for: ${cmd}`);

  switch (cmd) {
    case 'status': {
      const sessions = globalLiveOperationsStore.getSessions();
      const tasks = globalLiveOperationsStore.getTasks();
      console.log(`Active Sessions: ${sessions.length}`);
      console.log(`Tracked Tasks: ${tasks.length}`);
      break;
    }
    case 'sessions': {
      console.log('Sessions ledger snapshot:');
      console.log(JSON.stringify(globalLiveOperationsStore.getSessions(), null, 2));
      break;
    }
    case 'events': {
      console.log('Events ledger snapshot:');
      console.log(JSON.stringify(globalLiveOperationsStore.getEvents(), null, 2));
      break;
    }
    case 'tasks': {
      console.log('Tasks ledger snapshot:');
      console.log(JSON.stringify(globalLiveOperationsStore.getTasks(), null, 2));
      break;
    }
    case 'errors': {
      const errors = globalLiveOperationsStore.getEvents().filter(e => e.severity === 'error');
      console.log('Errors logged:');
      console.log(JSON.stringify(errors, null, 2));
      break;
    }
    case 'blocked': {
      const blocked = globalLiveOperationsStore.getTasks().filter(t => t.status === 'blocked');
      console.log('Blocked Tasks logged:');
      console.log(JSON.stringify(blocked, null, 2));
      break;
    }
    case 'stream': {
      const attention = globalAttentionEngine.generateAttentionItems();
      console.log('Recent attention warnings stream:');
      console.log(JSON.stringify(attention, null, 2));
      break;
    }
    default:
      console.log(`Unknown operations command: ${cmd}`);
  }
}

main();
