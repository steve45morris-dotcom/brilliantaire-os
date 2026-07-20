import * as fs from 'fs';
import * as path from 'path';
const DECISIONS_PATH = path.join(process.cwd(), 'memory', 'decisions.json');
export class MemoryLogger {
  logCommand(command: any, result: any) {
    try {
      const raw = fs.readFileSync(DECISIONS_PATH, 'utf-8');
      const data = JSON.parse(raw);
      const decisionsList = Array.isArray(data) ? data : (data.governance_decisions || []);
      
      decisionsList.push({
        timestamp: new Date().toISOString(),
        type: 'edge_command',
        source: 'remote_device',
        command: command.target,
        payload: command.payload,
        outcome: result.status,
        id: command.id,
      });

      if (Array.isArray(data)) {
        fs.writeFileSync(DECISIONS_PATH, JSON.stringify(decisionsList, null, 2));
      } else {
        data.governance_decisions = decisionsList;
        fs.writeFileSync(DECISIONS_PATH, JSON.stringify(data, null, 2));
      }
    } catch (e: any) {
      console.warn('Memory logger failed, but command executed:', e.message);
    }
  }
}
