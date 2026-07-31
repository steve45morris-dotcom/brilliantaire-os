import { globalLiveOperationsStore } from '../../kernel/live/LiveOperationsStore.js';
import { globalPilotKnowledgeSync } from './PilotKnowledgeSync.js';
import type { PilotRegistry } from './PilotRegistry.js';
import type {
  MaturityDecision,
  PilotEvidence,
  PilotMeasuredOutcome,
  PilotRecord,
  PilotVerificationResult
} from './PilotTypes.js';

export class PilotRunner {
  constructor(private readonly registry: PilotRegistry) {}

  public start(id: string): PilotRecord {
    const current = this.registry.get(id);
    if (!current) throw new Error(`Pilot ${id} was not found.`);
    if (current.status === 'planned') this.registry.transition(id, 'ready');
    const running = this.registry.transition(id, 'running');
    const updated = this.registry.update(id, (record) => ({ ...record, startedAt: new Date().toISOString() }));
    this.log('PilotStarted', updated, 'Pilot started.');
    return running.status === updated.status ? updated : running;
  }

  public recordEvidence(id: string, evidence: PilotEvidence): PilotRecord {
    const updated = this.registry.update(id, (record) => ({ ...record, evidence: [...record.evidence, evidence] }));
    this.log('PilotEvidenceRecorded', updated, evidence.summary);
    return updated;
  }

  public beginVerification(id: string): PilotRecord {
    const pilot = this.registry.get(id);
    if (!pilot) throw new Error(`Pilot ${id} was not found.`);
    if (!pilot.evidence.some((item) => item.verified)) throw new Error('Verified pilot evidence is required before verification.');
    return this.registry.transition(id, 'verifying');
  }

  public recordVerification(id: string, result: PilotVerificationResult): PilotRecord {
    if (!result.passed) throw new Error('Pilot verification did not pass.');
    return this.registry.update(id, (record) => ({ ...record, verificationResult: result }));
  }

  public measure(id: string, outcome: PilotMeasuredOutcome): PilotRecord {
    const pilot = this.registry.get(id);
    if (!pilot?.verificationResult?.passed) throw new Error('Passed verification is required before measurement.');
    this.registry.update(id, (record) => ({ ...record, measuredOutcome: outcome }));
    return this.registry.transition(id, 'measured');
  }

  public complete(id: string, decision: MaturityDecision, lessons: string[]): PilotRecord {
    const pilot = this.registry.get(id);
    if (!pilot?.measuredOutcome || !pilot.verificationResult?.passed) {
      throw new Error('Measured and verified pilot evidence is required before completion.');
    }
    const completed = this.registry.update(id, (record) => ({
      ...record,
      maturityDecision: decision,
      lessons,
      completedAt: new Date().toISOString()
    }));
    this.registry.transition(id, 'completed');
    const finalRecord = this.registry.get(id)!;
    globalPilotKnowledgeSync.sync(finalRecord);
    this.log('PilotCompleted', finalRecord, `Pilot completed with decision: ${decision}.`);
    return completed.status === finalRecord.status ? completed : finalRecord;
  }

  private log(type: string, pilot: PilotRecord, message: string): void {
    globalLiveOperationsStore.addEvent({
      id: `${type.toLowerCase()}-${pilot.id}-${Date.now()}`,
      type,
      timestamp: new Date().toISOString(),
      source: 'PilotRunner',
      actor: pilot.reviewer,
      task: pilot.id,
      severity: 'info',
      message,
      data: { pilotId: pilot.id, skillId: pilot.skillId, status: pilot.status },
      attention: false
    });
  }
}
