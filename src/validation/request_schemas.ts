import { z } from 'zod';

export const IntentSchema = z.object({
  id: z.string().uuid().optional(),
  rawText: z.string().min(1, 'Raw text cannot be empty'),
  timestamp: z.string().datetime(),
  source: z.enum(['vocal', 'cli']),
  confidence: z.number().min(0).max(1).optional(),
});

export const MissionSchema = z.object({
  id: z.string().min(1, 'Mission ID cannot be empty'),
  name: z.string().min(1, 'Mission name cannot be empty'),
  status: z.enum(['created', 'started', 'paused', 'completed', 'skipped']),
  priority: z.enum(['low', 'medium', 'high']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TimelineStepSchema = z.object({
  stepId: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['pending', 'completed', 'failed']),
});

export const TimelineSchema = z.object({
  missionId: z.string().min(1),
  steps: z.array(TimelineStepSchema),
  generatedAt: z.string().datetime(),
  estimatedDurationMinutes: z.number().nonnegative(),
});

export const LearningLogSchema = z.object({
  id: z.string().uuid().optional(),
  missionId: z.string().min(1),
  timestamp: z.string().datetime(),
  executionState: z.string(),
  durationMs: z.number().nonnegative(),
  errors: z.array(z.string()).optional(),
  provider: z.string().optional(),
  performanceMetrics: z.record(z.string(), z.any()).optional(),
});

export type IntentInput = z.infer<typeof IntentSchema>;
export type MissionInput = z.infer<typeof MissionSchema>;
export type TimelineInput = z.infer<typeof TimelineSchema>;
export type LearningLogInput = z.infer<typeof LearningLogSchema>;
