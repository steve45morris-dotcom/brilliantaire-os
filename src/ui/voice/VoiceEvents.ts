export const VOICE_EVENTS = {
  bootComplete: "The One System is online.",
  workspaceOpened: "Workspace opened.",
  projectLaunched: "Project launched.",
  launchUnavailable: "Launch target is not configured.",
  approvalRequired: "Approval is required before I continue.",
  requestReadyForReview: "Commander, your request is ready for review.",
  workflowStarted: "Workflow started.",
  workflowCompleted: "The workflow completed successfully.",
  alertRaised: "An alert has been raised.",
  errorDetected: "An execution error requires attention.",
  recommendationReady: "Recommendation is ready."
};

export type VoiceEventType = keyof typeof VOICE_EVENTS;
