export const SOUND_EVENTS = {
  BOOT_COMPLETE: 'boot_complete',
  COMMAND_ACCEPTED: 'command_accepted',
  COMMAND_REJECTED: 'command_rejected',
  APPROVAL_REQUIRED: 'approval_required',
  WORKFLOW_STARTED: 'workflow_started',
  WORKFLOW_COMPLETED: 'workflow_completed',
  ERROR: 'error',
  ALERT: 'alert',
  RECOMMENDATION_ACCEPTED: 'recommendation_accepted',
  RECOMMENDATION_REJECTED: 'recommendation_rejected'
};
export type SoundEventType = keyof typeof SOUND_EVENTS | string;
