export const REALTIME_EVENTS = {
  CONNECT: 'realtime:connect',
  DISCONNECT: 'realtime:disconnect',
  MUTE: 'realtime:mute',
  UNMUTE: 'realtime:unmute',
  TRANSCRIPT_UPDATED: 'realtime:transcript_updated',
  VNP_ANNOUNCEMENT: 'realtime:vnp_announcement',
  APPROVAL_PAUSE: 'realtime:approval_pause'
} as const;

export type RealtimeEventType = typeof REALTIME_EVENTS[keyof typeof REALTIME_EVENTS];
