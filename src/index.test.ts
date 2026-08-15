import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { validateRequest } from './validation/validator.js';
import { IntentSchema, MissionSchema, TimelineSchema, LearningLogSchema } from './validation/request_schemas.js';
import { ModelRouter } from './ai/model_router.js';
import { TransactionalDB, DB_DIR } from './db/transactional_db.js';
import { EventBus } from './events/event_bus.js';
import { TelemetryService, TELEMETRY_FILE } from './telemetry/telemetry_service.js';
import { calculateNextRun } from './scheduler_layer.js';

describe('SUPERNOVA Phase 0A - Engineering Hardening Test Suite', () => {
  
  // ==========================================
  // TASK 1: API Boundary Hardening Tests
  // ==========================================
  describe('API Boundary Validation (Zod)', () => {
    it('should successfully parse a valid intent payload', () => {
      const validPayload = {
        rawText: 'Schedule sporty campaign for Monday morning',
        timestamp: new Date().toISOString(),
        source: 'cli',
        confidence: 0.95
      };
      
      const result = validateRequest(IntentSchema, validPayload);
      expect(result.rawText).toBe(validPayload.rawText);
      expect(result.source).toBe('cli');
    });

    it('should reject invalid payload with a detailed error', () => {
      const invalidPayload = {
        rawText: '', // empty rawText is invalid
        timestamp: 'invalid-date',
        source: 'unsupported-source'
      };

      expect(() => validateRequest(IntentSchema, invalidPayload)).toThrow('Validation failed');
    });
  });

  // ==========================================
  // TASK 2: ModelRouter Integration Tests
  // ==========================================
  describe('ModelRouter AI Gateway', () => {
    it('should fallback to mock response when API keys are absent', async () => {
      const router = ModelRouter.getInstance();
      const res = await router.route({
        systemPrompt: 'You are an assistant',
        userPrompt: 'Hello',
        options: { provider: 'openai' }
      });

      expect(res.provider).toBe('openai');
      expect(res.text).toContain('Mock response');
    });

    it('should trigger retry logic and handle timeouts', async () => {
      const router = ModelRouter.getInstance();
      // Configure with low timeout to simulate timeout behavior if needed
      await expect(router.route({
        systemPrompt: 'Timeout simulation',
        userPrompt: 'Test',
        options: { provider: 'gemini', timeoutMs: 1 } // Instantly times out
      })).rejects.toThrow('timed out');
    });
  });

  // ==========================================
  // TASK 3: Transactional Database Layer Tests
  // ==========================================
  describe('Transactional DB (BEGIN, COMMIT, ROLLBACK)', () => {
    beforeEach(() => {
      // Clear database directory or files before each run
      if (fs.existsSync(DB_DIR)) {
        fs.rmSync(DB_DIR, { recursive: true, force: true });
      }
    });

    it('should atomically write mission and timeline on transaction success', async () => {
      const db = TransactionalDB.getInstance();
      
      await db.runInTransaction((tx) => {
        tx.addMission({
          id: 'mission-101',
          name: 'Sporty Launch Campaign',
          status: 'created',
          priority: 'high',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        tx.addTimeline({
          missionId: 'mission-101',
          steps: [
            { stepId: 'step-1', description: 'Deploy Astro Site', status: 'pending' }
          ],
          generatedAt: new Date().toISOString(),
          estimatedDurationMinutes: 15
        });
      });

      const currentFiles = db.readRawFiles();
      expect(currentFiles.missions).toHaveLength(1);
      expect(currentFiles.missions[0].id).toBe('mission-101');
      expect(currentFiles.timelines).toHaveLength(1);
    });

    it('should roll back and keep state clean on transaction failure', async () => {
      const db = TransactionalDB.getInstance();
      
      const task = db.runInTransaction((tx) => {
        tx.addMission({
          id: 'mission-202',
          name: 'Rolled Back Mission',
          status: 'created',
          priority: 'low',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        throw new Error('Simulated failure during transaction execution');
      });

      await expect(task).rejects.toThrow('Simulated failure');

      const currentFiles = db.readRawFiles();
      expect(currentFiles.missions).toHaveLength(0); // Should be empty due to rollback
    });
  });

  // ==========================================
  // TASK 5: Event Bus Tests
  // ==========================================
  describe('Event Bus Pub/Sub Layer', () => {
    beforeEach(() => {
      EventBus.getInstance().clearAll();
    });

    it('should notify subscriber when event is published', async () => {
      const bus = EventBus.getInstance();
      const callback = vi.fn();

      bus.subscribe('MissionCreated', callback);
      
      const payload = {
        id: 'm-303',
        name: 'Event Bus Mission',
        priority: 'medium' as const
      };
      
      await bus.publish('MissionCreated', payload);
      expect(callback).toHaveBeenCalledWith(payload);
    });
  });

  // ==========================================
  // TASK 6: Telemetry Layer Tests
  // ==========================================
  describe('Telemetry System', () => {
    beforeEach(() => {
      if (fs.existsSync(TELEMETRY_FILE)) {
        fs.unlinkSync(TELEMETRY_FILE);
      }
    });

    it('should log structured events through Event Bus integration', async () => {
      const bus = EventBus.getInstance();
      const telemetry = TelemetryService.getInstance();

      // Trigger action via Event Bus publish
      await bus.publish('DayApproved', {
        date: '2026-07-15',
        approvedBy: 'Icyflamze'
      });

      // Verify log has been captured
      const logs = telemetry.getEvents();
      expect(logs).toHaveLength(1);
      expect(logs[0].userAction).toBe('DayApproved');
      expect(logs[0].performanceMetrics).toEqual({ date: '2026-07-15', approvedBy: 'Icyflamze' });
    });
  });

  // ==========================================
  // TASK 7: Scheduler Next Run Calculation Tests
  // ==========================================
  describe('Scheduler Calculations', () => {
    it('should compute correct next tick times', () => {
      const nextRunStr = calculateNextRun('*/5 * * * *');
      const nextRunDate = new Date(nextRunStr);
      expect(nextRunDate.getTime()).toBeGreaterThan(Date.now());
    });
  });

});
