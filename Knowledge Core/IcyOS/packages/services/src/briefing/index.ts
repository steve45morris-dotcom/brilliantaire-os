import { UUID } from '@icyos/shared';
export class ExecutiveBriefingService {
  async generateExecutiveBriefing(userId: UUID): Promise<any> {
    return { briefing: 'Executive Brief active' };
  }
}
