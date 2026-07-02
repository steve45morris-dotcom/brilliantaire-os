import { UUID, Timestamp } from '../primitives';
import { Priority, MissionStatus, SessionStatus } from '../value-objects';

export interface User {
  readonly id: UUID;
  name: string;
  timezone?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Workspace {
  readonly id: UUID;
  user_id: UUID;
  root_path: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Project {
  readonly id: UUID;
  workspace_id: UUID;
  name: string;
  priority: Priority;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Mission {
  readonly id: UUID;
  sprint_id: UUID;
  name: string;
  status: MissionStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Action {
  readonly id: UUID;
  mission_id: UUID;
  command: string;
  created_at: Timestamp;
}

export interface Session {
  readonly id: UUID;
  workspace_id: UUID;
  status: SessionStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
}
