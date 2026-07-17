import type { VisualScoreCategories } from './DesignGuardian.js';

export interface PilotVerificationRecord {
  projectId: string;
  reviewer: string;
  reviewedAt: string;
  baselineScore: number;
  acceptanceThreshold: number;
  maturityDecision: {
    previous: 'Experimental';
    current: 'Verified';
    decision: 'Promote to Verified';
  };
  categories: VisualScoreCategories;
  evidence: {
    desktop: string;
    mobile: string;
    interactiveStates: string[];
    report: string;
  };
  runtime: {
    desktop: {
      consoleErrors: number;
      horizontalOverflow: boolean;
      confirmationVisible: boolean;
      undersizedTargets: number;
    };
    mobile: {
      consoleErrors: number;
      horizontalOverflow: boolean;
      confirmationVisible: boolean;
      undersizedTargets: number;
    };
  };
  unresolvedBlockers: string[];
}

export const PILOT_VERIFICATIONS: Record<string, PilotVerificationRecord> = {
  'joy-beauty-studio': {
    projectId: 'joy-beauty-studio',
    reviewer: 'Design Review Agent',
    reviewedAt: '2026-07-16',
    baselineScore: 10,
    acceptanceThreshold: 85,
    maturityDecision: {
      previous: 'Experimental',
      current: 'Verified',
      decision: 'Promote to Verified',
    },
    categories: {
      brandDistinction: 9,
      typography: 9,
      layoutHierarchy: 9,
      spacingConsistency: 9,
      colorDiscipline: 9,
      imageryVisualInterest: 9,
      responsiveBehavior: 9,
      interactionQuality: 9,
      accessibility: 9,
      conversionClarity: 10,
    },
    evidence: {
      desktop: '/private/tmp/frontend-design-guardian-joy-beauty-studio-desktop.png',
      mobile: '/private/tmp/frontend-design-guardian-joy-beauty-studio-mobile.png',
      interactiveStates: [
        '/private/tmp/frontend-design-guardian-joy-beauty-studio-confirmation-desktop.png',
        '/private/tmp/frontend-design-guardian-joy-beauty-studio-confirmation-mobile.png',
      ],
      report: 'docs/reports/FRONTEND_DESIGN_PILOT_REPORT.md',
    },
    runtime: {
      desktop: {
        consoleErrors: 0,
        horizontalOverflow: false,
        confirmationVisible: true,
        undersizedTargets: 0,
      },
      mobile: {
        consoleErrors: 0,
        horizontalOverflow: false,
        confirmationVisible: true,
        undersizedTargets: 0,
      },
    },
    unresolvedBlockers: [],
  },
};
