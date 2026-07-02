import { UUID, Timestamp } from '../primitives';

export type Priority = 'P1' | 'P2' | 'P3';
export type EnergyLevel = 'High' | 'Medium' | 'Resting';
export interface TimeEstimate {
  estimatedMin: number;
  maximumMin: number;
}
export type FocusScore = number; // 0 - 100
export type CompletionScore = number; // 0 - 100
export type ConfidenceScore = number; // 0.0 - 1.0
export type MissionStatus = 'Staged' | 'Approved' | 'Running' | 'Completed' | 'Skipped' | 'Failed';
export type SessionStatus = 'Active' | 'Wrapped' | 'Failing';
export type TrustLevel = number; // 0.0 - 1.0
