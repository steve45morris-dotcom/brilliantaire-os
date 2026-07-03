import { UUID, Mission } from '@icyos/shared';
import { MissionRepository } from '@icyos/database';
export class MissionService {
  private missionRepo: MissionRepository;
  constructor(missionRepo?: MissionRepository) {
    this.missionRepo = missionRepo || new MissionRepository();
  }
  async createMissionFromInput(sprintId: UUID, name: string): Promise<Mission> {
    return this.missionRepo.createMission(sprintId, name);
  }
  async skipMission(missionId: UUID, reason: string): Promise<boolean> {
    return this.missionRepo.completeMission(missionId);
  }
}
