export interface ExecutionDayData {
  timelineEvents: any[];
  focusSessionEvents: any[];
  bufferUsageSeconds: number;
  sessionDurationSeconds: number;
  completedCount: number;
  totalCount: number;
  reflectionScore: number;
  mood: string;
  energy: number;
  wins: string[];
  blockers: string[];
  lessons: string[];
}
