import type { WorkflowTemplate } from '../agent-upgrade/types.js';

export function createFrontendVisualQualityWorkflowTemplate(): WorkflowTemplate {
  const steps = [
    ['objective', 'Business objective and audience', 'Define the business objective, audience, and conversion goal.', 'Approved design brief'],
    ['design', 'DESIGN.md and reference review', 'Create or validate DESIGN.md and review trusted references.', 'Validated design contract'],
    ['plan', 'Wireframe and component plan', 'Define hierarchy, responsive behavior, and approved component sources.', 'Implementation plan'],
    ['build', 'Implementation', 'Implement the focused frontend change while preserving route behavior.', 'Working implementation'],
    ['desktop', 'Desktop screenshot', 'Capture desktop and key interaction evidence.', 'Desktop screenshot evidence'],
    ['mobile', 'Mobile screenshot', 'Capture mobile and navigation evidence.', 'Mobile screenshot evidence'],
    ['review', 'Design Guardian review and score', 'Run an independent evidenced visual review.', 'Score and prioritized defects'],
    ['revision', 'Revision and regression screenshot', 'Fix highest-impact defects and recapture evidence.', 'Regression evidence'],
    ['verify', 'Final verification', 'Verify routes, console, tests, build, threshold, and blockers.', 'Acceptance or rejection'],
  ];
  return {
    name: 'Frontend Visual Quality Workflow',
    objective: 'Produce visually accepted frontend work with governed design evidence.',
    inputs: ['projectId', 'businessObjective', 'audience', 'route'],
    steps: steps.map(([id, name, description, expectedOutput], index) => ({
      id, name, description, requiredSkills: ['frontend-design-guardian'], expectedOutput,
      humanApprovalRequired: index === steps.length - 1,
    })),
    requiredSkills: ['frontend-design-guardian'],
    expectedOutput: 'An evidenced visual acceptance or rejection decision.',
    verificationCriteria: ['DESIGN.md is valid', 'Desktop and mobile evidence exist', 'Independent review is recorded', 'Score meets threshold', 'No unresolved blockers remain'],
    retryLogic: { maxRetries: 3, retryDelaySec: 2 },
    humanApprovalPoints: ['Final independent visual acceptance'],
  };
}
