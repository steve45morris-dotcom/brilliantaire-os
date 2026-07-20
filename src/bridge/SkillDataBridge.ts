import { LiveDataBridge, BridgeResponse } from './LiveDataBridge.js';

export class SkillDataBridge extends LiveDataBridge {
  public getSkills(): BridgeResponse<any[]> {
    const defaultSkills = [
      { key: 'lint-and-validate', status: 'ACTIVE', category: 'General' },
      { key: 'systematic-debugging', status: 'ACTIVE', category: 'General' },
      { key: 'exa-search', status: 'ACTIVE', category: 'General' }
    ];
    return this.buildResponse(defaultSkills, 'live');
  }
}

export const globalSkillDataBridge = new SkillDataBridge();
