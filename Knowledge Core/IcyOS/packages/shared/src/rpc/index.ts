import { UUID } from '../primitives';

export interface GenerateDailyPlanInput {
  user_id: UUID;
}
export interface GenerateDailyPlanOutput {
  plan_json: any;
}

export interface ApproveTimelineInput {
  timeline_id: UUID;
  user_id: UUID;
}
export interface ApproveTimelineOutput {
  success: boolean;
}
