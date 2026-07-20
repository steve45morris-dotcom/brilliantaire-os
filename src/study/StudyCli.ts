import { globalStudyRegistry } from './StudyRegistry.js';
import { globalEngineeringSkillCatalog } from './EngineeringSkillCatalog.js';
import { globalSourceTrustRegistry } from './SourceTrustRegistry.js';
import { createStudyRecord } from './StudyRecord.js';

export function maturityLevels() {
  return [
    { level: 0, name: 'Discovered' },
    { level: 1, name: 'Documented' },
    { level: 2, name: 'Studied' },
    { level: 3, name: 'Experimental' },
    { level: 4, name: 'Verified' },
    { level: 5, name: 'Operational' },
    { level: 6, name: 'Measured' },
    { level: 7, name: 'Optimized' }
  ];
}

function createFallbackStudyRecord(params: Record<string, string>) {
  return createStudyRecord({
    id: params.id,
    title: params.title || 'Untitled Study',
    category: params.category || 'governance',
    summary: params.summary || 'Generated study record.',
    what: params.what || `What is ${params.title || 'this practice'}?`,
    why: params.why || 'The objective is to provide governed learning.',
    whenToUse: params.whenToUse || 'When the practice needs formal evaluation.',
    whenNotToUse: params.whenNotToUse || 'When there is no scope or evidence.',
    prerequisites: params.prerequisites ? params.prerequisites.split('|') : ['Source evidence'],
    implementationMethod: params.implementationMethod || 'Document, review, verify, and store.',
    verificationMethod: params.verificationMethod || 'Confirm the study record passes required checks.',
    rollbackMethod: params.rollbackMethod || 'Mark the study as archived and supersede it later.',
    tradeoffs: params.tradeoffs ? params.tradeoffs.split('|') : ['Adds documentation overhead'],
    risks: params.risks ? params.risks.split('|') : ['Insufficient evidence'],
    evidence: params.evidence ? params.evidence.split('|') : ['Generated from study workflow'],
    sources: [
      {
        title: 'GitHub Docs',
        url: 'https://docs.github.com/',
        tier: 'tier1',
        retrievedAt: new Date().toISOString(),
        sourceType: 'official'
      }
    ],
    affectedWorkspaces: params.affectedWorkspaces ? params.affectedWorkspaces.split('|') : ['engineering'],
    affectedServices: params.affectedServices ? params.affectedServices.split('|') : ['governance'],
    expectedOutcome: params.expectedOutcome || 'A reusable study record exists.',
    measurableIndicators: params.measurableIndicators ? params.measurableIndicators.split('|') : ['Review completed'],
    recommendation: (params.recommendation as any) || 'watch',
    confidence: Number(params.confidence || '70'),
    relatedSkillIds: params.relatedSkillIds ? params.relatedSkillIds.split('|') : ['governance'],
    knowledgeNodeIds: params.knowledgeNodeIds ? params.knowledgeNodeIds.split('|') : ['doc:study']
  });
}

export function runStudyCommand(command: string, params: Record<string, string>) {
  switch (command) {
    case 'study:list':
      return { status: 'ok', records: globalStudyRegistry.listRecords() };
    case 'study:create': {
      const record = params.payload ? createStudyRecord(JSON.parse(params.payload)) : createFallbackStudyRecord(params);
      return { status: 'ok', action: 'created', record: globalStudyRegistry.registerRecord(record) };
    }
    case 'study:run': {
      const record = params.id ? globalStudyRegistry.getRecord(params.id) : createFallbackStudyRecord(params);
      if (!record) {
        return { status: 'error', message: 'Study record not found.' };
      }

      const saved = params.id ? record : globalStudyRegistry.registerRecord(record);
      const verification = globalStudyRegistry.verifyRecord(saved.id);
      const score = globalStudyRegistry.scoreRecord(saved.id, { verification });
      const sync = verification.passed ? globalStudyRegistry.syncRecord(saved.id) : null;
      return { status: 'ok', action: 'run', record: saved, verification, score, sync };
    }
    case 'study:review': {
      const id = params.id;
      if (!id) return { status: 'error', message: 'Missing --id.' };
      return { status: 'ok', action: 'reviewed', record: globalStudyRegistry.reviewRecord(id, params.reviewer || 'Commander', (params.status as any) || 'verified') };
    }
    case 'study:verify': {
      const id = params.id;
      if (!id) return { status: 'error', message: 'Missing --id.' };
      const verification = globalStudyRegistry.verifyRecord(id);
      const score = globalStudyRegistry.scoreRecord(id, { verification });
      return { status: 'ok', action: 'verified', verification, score };
    }
    case 'study:approve':
    case 'study:reject':
    case 'study:archive': {
      const id = params.id;
      if (!id) return { status: 'error', message: 'Missing --id.' };
      const statusMap: Record<string, 'approved' | 'rejected' | 'archived'> = {
        'study:approve': 'approved',
        'study:reject': 'rejected',
        'study:archive': 'archived'
      };
      return { status: 'ok', action: command.split(':')[1], record: globalStudyRegistry.reviewRecord(id, params.reviewer || 'Commander', statusMap[command]) };
    }
    case 'skills:discover-engineering':
      return { status: 'ok', catalog: globalEngineeringSkillCatalog.list() };
    case 'skills:study-candidate': {
      const title = params.title;
      const candidate = title ? globalEngineeringSkillCatalog.findByTitle(title) : null;
      return {
        status: 'ok',
        candidate,
        studyQueue: globalStudyRegistry.listRecords().filter((record) => record.status !== 'archived')
      };
    }
    case 'skills:maturity':
      return { status: 'ok', levels: maturityLevels() };
    case 'skills:source-audit': {
      const sources = globalSourceTrustRegistry.listSources();
      return { status: 'ok', sources, adoptionReady: globalSourceTrustRegistry.validateForAdoption(sources.map((source) => source.id)) };
    }
    case 'skills:duplication-audit': {
      const titles = globalEngineeringSkillCatalog.list().map((candidate) => candidate.title.toLowerCase());
      const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);
      return { status: 'ok', duplicates, count: duplicates.length };
    }
    default:
      return {
        status: 'ok',
        commands: [
          'study:list',
          'study:create',
          'study:run',
          'study:review',
          'study:verify',
          'study:approve',
          'study:reject',
          'study:archive',
          'skills:discover-engineering',
          'skills:study-candidate',
          'skills:maturity',
          'skills:source-audit',
          'skills:duplication-audit'
        ]
      };
  }
}
