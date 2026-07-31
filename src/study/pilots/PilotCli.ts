import fs from 'node:fs';
import { globalLiveOperationsStore } from '../../kernel/live/LiveOperationsStore.js';
import { verifyPilot } from './PilotVerification.js';
import { PilotRunner } from './PilotRunner.js';
import { globalPilotRegistry, type PilotRegistry } from './PilotRegistry.js';
import type { MaturityDecision, MaturityLevel, PilotRecord } from './PilotTypes.js';
import { globalPilotKnowledgeSync } from './PilotKnowledgeSync.js';
import { DocumentationSourceMap, DriftDetector } from '../../documentation/drift/index.js';

const TOOL_REPORTS: Record<string, string[]> = {
  'docs:drift': ['docs/reports/DOCUMENTATION_DRIFT_REPORT.md', 'outputs/documentation-drift/latest.json'],
  'readiness:review': ['docs/pilots/PRODUCTION_READINESS_REVIEW_ICYFLAMZE_OS.md'],
  'impact:analyze': ['docs/pilots/CHANGE_IMPACT_ANALYSIS_ICYFLAMZE_SONG_LYRIC.md'],
  'troubleshoot:case': ['docs/pilots/EFFECTIVE_TROUBLESHOOTING_CASE.md'],
  'rollback:verify': ['docs/pilots/AUTOMATED_TESTING_AND_ROLLBACK_PILOT.md']
};

function summary(pilot: PilotRecord) {
  return {
    id: pilot.id,
    skillId: pilot.skillId,
    title: pilot.title,
    workspace: pilot.workspace,
    pilotStatus: pilot.status,
    maturityDecision: pilot.maturityDecision,
    maturityEffect: pilot.maturityDecision === 'Revise'
      ? 'Experimental with revision required'
      : 'Eligible for Verified review; not Operational',
    evidencePaths: pilot.evidence.map((item) => item.path),
    measuredOutcome: pilot.measuredOutcome
  };
}

function logCommand(command: string, resultStatus: string): void {
  globalLiveOperationsStore.addEvent({
    id: `pilot-command-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'PilotCommandExecuted',
    timestamp: new Date().toISOString(),
    source: 'PilotCli',
    actor: 'Engineering Effectiveness Lead',
    severity: resultStatus === 'ok' ? 'info' : 'warn',
    message: `Pilot command ${command} completed with status ${resultStatus}.`,
    data: { command, resultStatus },
    attention: resultStatus !== 'ok'
  });
}

export function runPilotCommand(
  command: string,
  args: string[] = [],
  registry: PilotRegistry = globalPilotRegistry
): Record<string, unknown> {
  let result: Record<string, unknown>;
  try {
    if (command === 'pilots:list') {
      const pilots = registry.list().map(summary);
      result = { status: 'ok', command, count: pilots.length, pilots };
    } else if (command === 'pilots:status') {
      const pilot = args[0] ? registry.get(args[0]) : null;
      result = pilot
        ? { status: 'ok', command, ...summary(pilot) }
        : { status: 'ok', command, count: registry.list().length, pilots: registry.list().map(summary) };
    } else if (command === 'pilots:start') {
      result = { status: 'ok', command, pilot: summary(new PilotRunner(registry).start(args[0])) };
    } else if (command === 'pilots:verify') {
      const pilot = registry.get(args[0]);
      if (!pilot) throw new Error(`Pilot ${args[0]} was not found.`);
      const target = (args[1] ?? 'Verified') as MaturityLevel;
      result = { status: 'ok', command, pilotId: pilot.id, target, verification: verifyPilot(pilot, target), evidencePaths: pilot.evidence.map((item) => item.path), maturityEffect: `Verification gate for ${target}` };
    } else if (command === 'pilots:measure') {
      const pilot = registry.get(args[0]);
      if (!pilot) throw new Error(`Pilot ${args[0]} was not found.`);
      result = { status: 'ok', command, pilotId: pilot.id, measuredOutcome: pilot.measuredOutcome, evidencePaths: pilot.evidence.map((item) => item.path), maturityEffect: 'Measurement recorded; reviewer decision still required' };
    } else if (command === 'pilots:complete') {
      const decision = (args[1] ?? 'Continue Pilot') as MaturityDecision;
      result = { status: 'ok', command, pilot: summary(new PilotRunner(registry).complete(args[0], decision, args.slice(2))) };
    } else if (command === 'pilots:decision') {
      let pilot = registry.get(args[0]);
      if (!pilot) throw new Error(`Pilot ${args[0]} was not found.`);
      if (args[1]) {
        const allowed: MaturityDecision[] = ['Promote', 'Continue Pilot', 'Revise', 'Suspend', 'Reject', 'Archive'];
        const decision = args[1] as MaturityDecision;
        if (!allowed.includes(decision)) throw new Error(`Unsupported maturity decision: ${args[1]}.`);
        if (!pilot.verificationResult?.passed || !pilot.measuredOutcome) throw new Error('Verified measured evidence is required before a maturity decision.');
        pilot = registry.update(pilot.id, (record) => ({ ...record, maturityDecision: decision }));
      }
      result = { status: 'ok', command, pilotId: pilot.id, decision: pilot.maturityDecision, maturityEffect: summary(pilot).maturityEffect, evidencePaths: pilot.evidence.map((item) => item.path) };
    } else if (command === 'pilots:report') {
      const pilots = registry.list();
      pilots.forEach((pilot) => globalPilotKnowledgeSync.sync(pilot));
      result = {
        status: 'ok', command, count: pilots.length,
        decisions: Object.fromEntries(pilots.map((pilot) => [pilot.skillId, pilot.maturityDecision])),
        evidencePaths: pilots.flatMap((pilot) => pilot.evidence.map((item) => item.path)),
        maturityEffect: 'First-cycle maximum is Verified; Operational promotion remains blocked'
      };
    } else if (command === 'docs:drift') {
      const evidencePaths = TOOL_REPORTS[command];
      const documentationFiles = [
        'docs/DOCUMENTATION_INDEX.md',
        'docs/specifications/WORKSPACE_REGISTRY.md',
        'docs/specifications/PROJECT_LAUNCHER_SPEC.md',
        'docs/specifications/SKILL_MATURITY_MODEL.md',
        'docs/reports/ENGINEERING_SKILL_PILOT_REPORT.md',
        'docs/reports/DOCUMENTATION_DRIFT_REPORT.md',
        'COMMANDS.md'
      ];
      const drift = new DriftDetector(new DocumentationSourceMap({
        root: process.cwd(),
        documentationFiles,
        routeFiles: ['src/workspaces/WorkspaceRoutes.ts', 'src/workspaces/WorkspaceSlug.ts', 'dashboard/src/App.tsx'],
        packageFile: 'package.json'
      })).detect();
      fs.mkdirSync('outputs/documentation-drift', { recursive: true });
      fs.writeFileSync('outputs/documentation-drift/latest.json', JSON.stringify(drift, null, 2));
      result = { status: 'ok', command, evidencePaths, evidenceAvailable: evidencePaths.map((file) => ({ path: file, exists: fs.existsSync(file) })), summary: drift.summary, coverage: drift.coverage, maturityEffect: 'Evidence regenerated; no automatic promotion' };
    } else if (TOOL_REPORTS[command]) {
      const evidencePaths = TOOL_REPORTS[command];
      result = { status: 'ok', command, evidencePaths, evidenceAvailable: evidencePaths.map((file) => ({ path: file, exists: fs.existsSync(file) })), maturityEffect: 'Evidence only; no automatic promotion' };
    } else {
      result = { status: 'error', command, error: `Unknown pilot command: ${command}` };
    }
  } catch (error) {
    result = { status: 'error', command, error: error instanceof Error ? error.message : String(error) };
  }
  logCommand(command, String(result.status));
  return result;
}
