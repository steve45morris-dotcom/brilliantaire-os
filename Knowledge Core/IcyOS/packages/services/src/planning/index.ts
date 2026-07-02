import { UUID } from '@icyos/shared';
export class PlanningService {
  async captureInboxInput(input: string): Promise<string> {
    return `Captured: ${input}`;
  }
  async generateDailyPlan(userId: UUID): Promise<any> {
    return { plan: 'Daily plan active' };
  }
}
