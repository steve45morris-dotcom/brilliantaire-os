import { z } from 'zod';

// 1. Primitive Schemas
export const uuidSchema = z.string().uuid();
export const timestampSchema = z.string();

// 2. Value Object Schemas
export const prioritySchema = z.enum(['P1', 'P2', 'P3']);
export const energyLevelSchema = z.enum(['High', 'Medium', 'Resting']);
export const timeEstimateSchema = z.object({
  estimatedMin: z.number().int().nonnegative(),
  maximumMin: z.number().int().nonnegative(),
});
export const focusScoreSchema = z.number().int().min(0).max(100);
export const completionScoreSchema = z.number().int().min(0).max(100);
export const confidenceScoreSchema = z.number().min(0.0).max(1.0);
export const missionStatusSchema = z.enum(['Staged', 'Approved', 'Running', 'Completed', 'Skipped', 'Failed']);
export const sessionStatusSchema = z.enum(['Active', 'Wrapped', 'Failing']);
export const trustLevelSchema = z.number().min(0.0).max(1.0);

// 3. API Error & Envelope Schemas
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.array(z.any()).optional(),
});

export const apiResponseEnvelopeSchema = z.object({
  success: z.boolean(),
  data: z.any().nullable(),
  error: apiErrorSchema.nullable(),
  meta: z.object({
    request_id: z.string(),
    timestamp: timestampSchema,
    version: z.string(),
  }),
});

// 4. Create/Update Entity Payload Schemas
export const createWorkspaceSchema = z.object({
  user_id: uuidSchema,
  root_path: z.string().min(1),
});
export const updateWorkspaceSchema = z.object({
  root_path: z.string().min(1).optional(),
});

export const createProjectSchema = z.object({
  workspace_id: uuidSchema,
  name: z.string().min(1),
  priority: prioritySchema,
});
export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  priority: prioritySchema.optional(),
});

export const createMissionSchema = z.object({
  sprint_id: uuidSchema,
  name: z.string().min(1),
});
export const updateMissionSchema = z.object({
  name: z.string().min(1).optional(),
  status: missionStatusSchema.optional(),
});

// 5. Operation Flow Payload Schemas
export const startSessionSchema = z.object({
  workspace_id: uuidSchema,
});

export const completeSessionSchema = z.object({
  session_id: uuidSchema,
  focus_score: focusScoreSchema,
});

export const skipMissionSchema = z.object({
  mission_id: uuidSchema,
  skip_reason: z.string().min(1),
});

// 6. Stored Procedure (RPC) Input Schemas
export const generateDailyPlanInputSchema = z.object({
  user_id: uuidSchema,
});

export const approveTimelineInputSchema = z.object({
  timeline_id: uuidSchema,
  user_id: uuidSchema,
});

export const regenerateTimelineInputSchema = z.object({
  timeline_id: uuidSchema,
  reason: z.string().optional(),
});
