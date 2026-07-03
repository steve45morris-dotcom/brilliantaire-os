import { describe, it, expect } from 'vitest';
import { MissionService } from './mission';
import { SessionService } from './session';
import { TimelineService } from './timeline';
import { GoogleCalendarConnector, ObsidianConnector, NotificationEngine, LaunchKit, MissionKitRegistry, ContextEngine } from './index';
import { MissionRepository, SessionRepository, TimelineRepository } from '@icyos/database';

describe('Application Services Validation', () => {
  it('should run mission creation coordinate flow', async () => {
    const missionRepo = new MissionRepository();
    const service = new MissionService(missionRepo);
    const result = await service.createMissionFromInput('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Implement Service layer');

    expect(result).toBeDefined();
    expect(result.name).toBe('Implement Service layer');
    expect(result.status).toBe('Staged');
  });

  it('should execute session start flow', async () => {
    const sessionRepo = new SessionRepository();
    const service = new SessionService(sessionRepo);
    const result = await service.startSession('f47ac10b-58cc-4372-a567-0e02b2c3d479');

    expect(result).toBeDefined();
    expect(result.status).toBe('Active');
  });

  it('should approve timeline flow', async () => {
    const timelineRepo = new TimelineRepository();
    const service = new TimelineService(timelineRepo);
    const success = await service.approveTimeline('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'f47ac10b-58cc-4372-a567-0e02b2c3d479');

    expect(success).toBe(true);
  });

  it('should verify calendar and note connector capabilities', async () => {
    const cal = new GoogleCalendarConnector();
    const obs = new ObsidianConnector();

    await cal.connect();
    await obs.connect();

    const calHealth = await cal.health();
    const obsHealth = await obs.health();
    expect(calHealth.status).toBe('healthy');
    expect(obsHealth.status).toBe('healthy');

    const calEvents = await cal.importData();
    const obsNotes = await obs.importData();
    expect(calEvents.length).toBeGreaterThan(0);
    expect(obsNotes.length).toBeGreaterThan(0);
  });

  it('should schedule and dispatch local notifications respecting status', () => {
    const engine = new NotificationEngine();
    const note = engine.schedule({
      id: 'note-alert-1',
      title: 'Mission Alert',
      body: 'Time to start core task focus',
      category: 'mission_start',
      scheduledTime: new Date().toISOString()
    });

    expect(note.delivered).toBe(false);
    expect(engine.getPending().length).toBe(1);

    engine.triggerDelivery('note-alert-1');
    expect(engine.getPending().length).toBe(0);
  });

  it('should execute launch actions for workspace files/URLs', async () => {
    const kit = new LaunchKit();
    const success = await kit.execute({
      type: 'url',
      target: 'https://icyos.brilliantaire.com'
    });
    expect(success).toBe(true);
  });

  it('should load mission kits and checklists', () => {
    const registry = new MissionKitRegistry();
    const kit = registry.getKit('recording-kit');
    expect(kit).toBeDefined();
    expect(kit?.name).toBe('Recording Kit');
    expect(kit?.checklist.length).toBeGreaterThan(0);
  });

  it('should assemble context and return cached records', async () => {
    const engine = new ContextEngine();
    const ctx = await engine.assembleContext('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    expect(ctx.notes.length).toBeGreaterThan(0);
    expect(ctx.recent_decisions.length).toBeGreaterThan(0);

    const cached = await engine.assembleContext('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    expect(cached.retrieved_at).toBe(ctx.retrieved_at); // cache hit verification
  });
});
