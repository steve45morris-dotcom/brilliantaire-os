import { globalGraphStore } from '../../knowledge/GraphStore.js';
import type { PilotRecord } from './PilotTypes.js';

export class PilotKnowledgeSync {
  public sync(pilot: PilotRecord): { pilotNodeId: string } {
    const pilotNodeId = `pilot:${pilot.id}`;
    const skillNodeId = `skill:${pilot.skillId}`;
    const workspaceNodeId = `workspace:${pilot.workspace}`;
    const reviewerNodeId = `person:${pilot.reviewer.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const riskNodeId = `risk:${pilot.id}`;
    globalGraphStore.addNode(skillNodeId, 'Skill', { skillId: pilot.skillId });
    globalGraphStore.addNode(workspaceNodeId, 'Project', { workspace: pilot.workspace });
    globalGraphStore.addNode(reviewerNodeId, 'Person', { name: pilot.reviewer });
    globalGraphStore.addNode(riskNodeId, 'Evidence', { failureConditions: pilot.failureConditions });
    globalGraphStore.addNode(pilotNodeId, 'Pilot', {
      title: pilot.title,
      status: pilot.status,
      workspace: pilot.workspace,
      maturityDecision: pilot.maturityDecision
    });
    globalGraphStore.addEdge(skillNodeId, pilotNodeId, 'SKILL_TESTED_BY');
    globalGraphStore.addEdge(pilotNodeId, workspaceNodeId, 'PILOT_APPLIED_TO');
    globalGraphStore.addEdge(pilotNodeId, reviewerNodeId, 'PILOT_VERIFIED_BY');
    globalGraphStore.addEdge(pilotNodeId, riskNodeId, 'PILOT_EXPOSED_RISK');
    globalGraphStore.addEdge(pilotNodeId, skillNodeId, 'PILOT_IMPROVED');

    const produced = pilot.evidence.length > 0
      ? pilot.evidence.map((evidence) => ({ id: `evidence:${evidence.id}`, properties: evidence }))
      : pilot.relatedReports.map((report, index) => ({ id: `report:${pilot.id}:${index}`, properties: { path: report } }));
    for (const item of produced) {
      globalGraphStore.addNode(item.id, 'Evidence', item.properties);
      globalGraphStore.addEdge(pilotNodeId, item.id, 'PILOT_PRODUCED');
    }

    pilot.lessons.forEach((lesson, index) => {
      const memoryNodeId = `memory:${pilot.id}:${index}`;
      globalGraphStore.addNode(memoryNodeId, 'Memory', { lesson, pilotId: pilot.id });
      globalGraphStore.addEdge(pilotNodeId, memoryNodeId, 'PILOT_PRODUCED', { kind: 'lesson' });
    });

    if (pilot.maturityDecision === 'Reject') globalGraphStore.addEdge(pilotNodeId, skillNodeId, 'PILOT_REJECTED');
    if (pilot.maturityDecision === 'Promote') globalGraphStore.addEdge(pilotNodeId, skillNodeId, 'PILOT_PROMOTED');
    return { pilotNodeId };
  }
}

export const globalPilotKnowledgeSync = new PilotKnowledgeSync();
