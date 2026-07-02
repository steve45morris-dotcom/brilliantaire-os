import { describe, it, expect } from 'vitest';
import { MissionService } from './mission';
import { SessionService } from './session';
import { TimelineService } from './timeline';
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
});
