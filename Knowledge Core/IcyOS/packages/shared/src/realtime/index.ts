import { UUID, Timestamp } from '../primitives';

export interface MissionStartedEvent {
  topic: 'mission.started';
  payload: {
    mission_id: UUID;
    timestamp: Timestamp;
  };
}

export interface MissionCompletedEvent {
  topic: 'mission.completed';
  payload: {
    mission_id: UUID;
    review_id: UUID;
    timestamp: Timestamp;
  };
}
