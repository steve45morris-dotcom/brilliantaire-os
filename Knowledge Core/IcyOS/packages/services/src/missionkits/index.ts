import { LaunchAction } from '../launchkit';

export interface MissionKit {
  kit_id: string;
  name: string;
  default_timer_seconds: number;
  launch_actions: LaunchAction[];
  resources: string[];
  checklist: string[];
  completion_rules: string[];
}

export class MissionKitRegistry {
  private kits = new Map<string, MissionKit>();

  constructor() {
    this.registerKit({
      kit_id: 'recording-kit',
      name: 'Recording Kit',
      default_timer_seconds: 3600,
      launch_actions: [
        { type: 'application', target: 'DAW' },
        { type: 'file', target: '/recordings/take1.wav' }
      ],
      resources: ['Microphone hardware connection', 'Tree Groove vocal layout sheets'],
      checklist: ['Plug in XLR cable', 'Calibrate preamp levels', 'Track lead vocal'],
      completion_rules: ['Audio file must be saved', 'Vocal reflection logged']
    });

    this.registerKit({
      kit_id: 'coding-kit',
      name: 'Coding Kit',
      default_timer_seconds: 5400,
      launch_actions: [
        { type: 'application', target: 'IDE' },
        { type: 'url', target: 'http://localhost:3000' }
      ],
      resources: ['Mono-repo codebase', 'Zod validation types file'],
      checklist: ['Write unit test cases', 'Implement minimal service rules', 'Verify build compiles'],
      completion_rules: ['All Vitest checks pass', 'Git commit created']
    });

    this.registerKit({
      kit_id: 'writing-kit',
      name: 'Writing Kit',
      default_timer_seconds: 2700,
      launch_actions: [
        { type: 'note', target: 'Obsidian Blog Draft' }
      ],
      resources: ['Topic outline note', 'Lagos cultural lexicon notes'],
      checklist: ['Draft opening intro hook', 'Outline 3 core pillars', 'Polished final edit'],
      completion_rules: ['Markdown file saved in vault']
    });
  }

  registerKit(kit: MissionKit) {
    this.kits.set(kit.kit_id, kit);
  }

  getKit(id: string): MissionKit | undefined {
    return this.kits.get(id);
  }
}
