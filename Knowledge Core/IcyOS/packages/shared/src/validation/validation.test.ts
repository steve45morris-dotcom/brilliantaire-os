import { describe, it, expect } from 'vitest';
import { uuidSchema, prioritySchema, createProjectSchema } from './index';

describe('Zod Validation Schemas', () => {
  it('should validate correct UUIDs', () => {
    const validUuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    expect(uuidSchema.safeParse(validUuid).success).toBe(true);
  });

  it('should fail invalid UUIDs', () => {
    const invalidUuid = 'not-a-uuid';
    expect(uuidSchema.safeParse(invalidUuid).success).toBe(false);
  });

  it('should validate priority levels', () => {
    expect(prioritySchema.safeParse('P1').success).toBe(true);
    expect(prioritySchema.safeParse('P4').success).toBe(false);
  });

  it('should validate project payload requirements', () => {
    const validPayload = {
      workspace_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'Test Project',
      priority: 'P1',
    };
    expect(createProjectSchema.safeParse(validPayload).success).toBe(true);
  });
});
