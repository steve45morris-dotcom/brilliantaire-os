import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { StudyRegistry } from './StudyRegistry.js';
import { globalSourceTrustRegistry } from './SourceTrustRegistry.js';
import { globalEngineeringSkillCatalog } from './EngineeringSkillCatalog.js';
import { createStudyRecord } from './StudyRecord.js';
import { globalStudyKnowledgeSync } from './StudyKnowledgeSync.js';
import { globalGraphStore } from '../knowledge/GraphStore.js';
import { runStudyCommand } from './StudyCli.js';
import { PILOT_SKILL_STUDY_PACK } from './EngineeringPilotStudyPack.js';

describe('study governance layer', () => {
  it('seeds a study registry with the initial study pack', () => {
    const storagePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'study-registry-')), 'registry.json');
    const registry = new StudyRegistry(storagePath);
    expect(registry.listRecords().length).toBeGreaterThanOrEqual(10);
  });

  it('exposes the source trust registry by tier', () => {
    expect(globalSourceTrustRegistry.byTier('tier1').length).toBeGreaterThan(0);
    expect(globalSourceTrustRegistry.validateForAdoption(['source-github-docs']).passed).toBe(true);
    expect(globalSourceTrustRegistry.validateForAdoption(['source-community-postmortem']).passed).toBe(false);
  });

  it('contains the full engineering skill catalog', () => {
    expect(globalEngineeringSkillCatalog.list()).toHaveLength(40);
    expect(globalEngineeringSkillCatalog.byStatus('experimental').length).toBeGreaterThan(0);
  });

  it('syncs study records into the knowledge graph', () => {
    globalGraphStore.clear();
    const record = createStudyRecord({
      id: 'study-sync-test',
      title: 'Sync Test',
      category: 'governance',
      summary: 'Test record.',
      what: 'What',
      why: 'Why',
      whenToUse: 'When',
      whenNotToUse: 'Never',
      prerequisites: ['One source'],
      implementationMethod: 'How',
      verificationMethod: 'Verify',
      rollbackMethod: 'Rollback',
      tradeoffs: ['Tradeoff'],
      risks: ['Risk'],
      evidence: ['Evidence'],
      sources: [
        { title: 'GitHub Docs', url: 'https://docs.github.com/', tier: 'tier1', retrievedAt: '2026-07-11T00:00:00.000Z', sourceType: 'official' }
      ],
      affectedWorkspaces: ['engineering'],
      affectedServices: ['governance'],
      expectedOutcome: 'Synced record',
      measurableIndicators: ['Indicator'],
      recommendation: 'watch',
      confidence: 80,
      relatedSkillIds: ['governance-skill'],
      knowledgeNodeIds: ['doc:test']
    });

    const sync = globalStudyKnowledgeSync.syncStudyRecord(record);
    expect(sync.studyNodeId).toBe('study:study-sync-test');
    expect(globalGraphStore.getNodeById('study:study-sync-test')?.type).toBe('Study');
  });

  it('prints structured CLI output for maturity levels', () => {
    const parsed = runStudyCommand('skills:maturity', {});
    expect(parsed.status).toBe('ok');
    expect(Array.isArray((parsed as any).levels)).toBe(true);
    expect((parsed as any).levels[0]).toMatchObject({ level: 0, name: 'Discovered' });
  });

  it('contains studied records for exactly the five selected engineering pilots', () => {
    expect(PILOT_SKILL_STUDY_PACK).toHaveLength(5);
    expect(new Set(PILOT_SKILL_STUDY_PACK.flatMap((record) => record.relatedSkillIds)).size).toBe(5);
    expect(PILOT_SKILL_STUDY_PACK.every((record) => record.status === 'verified')).toBe(true);
    expect(PILOT_SKILL_STUDY_PACK.every((record) => record.recommendation === 'pilot')).toBe(true);
  });
});
