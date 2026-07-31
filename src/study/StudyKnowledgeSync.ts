import { globalEdgeRegistry } from '../knowledge/EdgeRegistry.js';
import { globalNodeRegistry } from '../knowledge/NodeRegistry.js';
import { globalSharedMemoryManager } from '../agent-upgrade/memory.js';
import type { StudyRecord } from './StudyTypes.js';

export interface StudyKnowledgeSyncResult {
  studyNodeId: string;
  linkedKnowledgeNodeIds: string[];
  linkedSkillNodeIds: string[];
}

export class StudyKnowledgeSync {
  public syncStudyRecord(record: StudyRecord): StudyKnowledgeSyncResult {
    const studyNodeId = `study:${record.id}`;

    globalNodeRegistry.registerNode(studyNodeId, 'Study', {
      title: record.title,
      category: record.category,
      status: record.status,
      recommendation: record.recommendation,
      confidence: record.confidence,
      summary: record.summary,
      expectedOutcome: record.expectedOutcome,
      createdAt: record.createdAt,
      reviewedAt: record.reviewedAt,
      reviewer: record.reviewer
    });

    const linkedKnowledgeNodeIds: string[] = [];
    const linkedSkillNodeIds: string[] = [];

    for (const knowledgeNodeId of record.knowledgeNodeIds) {
      globalEdgeRegistry.registerEdge(studyNodeId, knowledgeNodeId, 'JUSTIFIED_BY', {
        recordedAt: new Date().toISOString()
      });
      linkedKnowledgeNodeIds.push(knowledgeNodeId);
    }

    for (const skillId of record.relatedSkillIds) {
      const skillNodeId = `skill:${skillId}`;
      globalNodeRegistry.registerNode(skillNodeId, 'Skill', {
        skillId,
        source: 'study-governance',
        studyId: record.id
      });

      globalEdgeRegistry.registerEdge(studyNodeId, skillNodeId, 'PACKAGED_AS', {
        recordedAt: new Date().toISOString()
      });
      linkedSkillNodeIds.push(skillNodeId);
    }

    if (record.status === 'verified' || record.status === 'approved' || record.status === 'adopted') {
      globalSharedMemoryManager.logStudyConclusion({
        id: record.id,
        title: record.title,
        status: record.status,
        recommendation: record.recommendation,
        confidence: record.confidence,
        summary: record.summary,
        knowledgeNodeId: studyNodeId,
        timestamp: new Date().toISOString()
      });
    }

    return {
      studyNodeId,
      linkedKnowledgeNodeIds,
      linkedSkillNodeIds
    };
  }
}

export const globalStudyKnowledgeSync = new StudyKnowledgeSync();
