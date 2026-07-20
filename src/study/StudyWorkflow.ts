import type { WorkflowTemplate } from '../agent-upgrade/types.js';

export const SYSTEMATIC_STUDY_WORKFLOW_SLUG = 'systematic-study-workflow';

export function createSystematicStudyWorkflowTemplate(): WorkflowTemplate {
  return {
    name: 'Systematic Study Workflow',
    objective: 'Convert a candidate practice, framework, or skill into a verified study record.',
    inputs: ['subject', 'sources', 'relatedSkillIds'],
    requiredSkills: ['task-runner', 'completion-verifier', 'market-explorer'],
    expectedOutput: 'A study record, verification result, score breakdown, and knowledge sync summary.',
    verificationCriteria: [
      'The study record contains What, Why, When, and How sections',
      'Source validation passes with at least one Tier 1 or Tier 2 source',
      'Duplication and compatibility checks are recorded',
      'Verification, outcome measurement, and rollback paths are documented',
      'Knowledge graph sync payload is produced before adoption'
    ],
    retryLogic: { maxRetries: 2, retryDelaySec: 5 },
    humanApprovalPoints: ['Study adoption gate'],
    steps: [
      {
        id: 'ss1',
        name: 'Question Intake',
        description: 'Collect the subject, study question, and initial scope.',
        requiredSkills: ['task-runner'],
        expectedOutput: 'Structured study question',
        humanApprovalRequired: false
      },
      {
        id: 'ss2',
        name: 'Define What',
        description: 'Write the subject definition and problem statement.',
        requiredSkills: ['copy-writer'],
        expectedOutput: 'What section',
        humanApprovalRequired: false
      },
      {
        id: 'ss3',
        name: 'Investigate Why and When',
        description: 'Evaluate usefulness, rejection conditions, and lifecycle fit.',
        requiredSkills: ['completion-verifier'],
        expectedOutput: 'Why and When sections',
        humanApprovalRequired: false
      },
      {
        id: 'ss4',
        name: 'Document How',
        description: 'Record implementation, verification, maintenance, and rollback.',
        requiredSkills: ['completion-verifier'],
        expectedOutput: 'How section',
        humanApprovalRequired: false
      },
      {
        id: 'ss5',
        name: 'Evaluate Tradeoffs and Sources',
        description: 'Score the study, validate sources, and check for duplication and compatibility.',
        requiredSkills: ['completion-verifier'],
        expectedOutput: 'Tradeoff, source, duplication, and compatibility review',
        humanApprovalRequired: false
      },
      {
        id: 'ss6',
        name: 'Human Approval and Sync',
        description: 'Approve adoption when ready, then sync the study to the knowledge graph and memory layer.',
        requiredSkills: ['task-runner'],
        expectedOutput: 'Knowledge sync payload and record hash',
        humanApprovalRequired: true
      }
    ]
  };
}
