import { UUID } from '@icyos/shared';
import { TimelineRepository } from '@icyos/database';
export class TimelineService {
  constructor(private timelineRepo: TimelineRepository) {}
  async approveTimeline(timelineId: UUID, userId: UUID): Promise<boolean> {
    return this.timelineRepo.approveTimeline(timelineId, userId);
  }
  async regenerateTimeline(timelineId: UUID, reason?: string): Promise<boolean> {
    return true;
  }
}
