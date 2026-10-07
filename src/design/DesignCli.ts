import { globalLiveOperationsStore } from '../kernel/live/LiveOperationsStore.js';
import { DESIGN_COMMANDS, DesignCommand, evaluateDesignCommand } from './DesignCommandEvaluator.js';
export { DESIGN_COMMANDS } from './DesignCommandEvaluator.js';
export type { DesignCommand } from './DesignCommandEvaluator.js';

export function runDesignCommand(command: DesignCommand, args: string[] = []) {
  const result = evaluateDesignCommand(command, args);
  globalLiveOperationsStore.addEvent({
    id: `design-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'DesignCommandExecuted',
    timestamp: new Date().toISOString(),
    source: 'DesignCli',
    actor: 'Design Review Agent',
    severity: result.decision === 'pass' ? 'info' : 'warn',
    message: `${command} returned ${result.decision} for ${result.projectId}.`,
    data: result,
    attention: result.decision === 'revise',
  });
  return result;
}
