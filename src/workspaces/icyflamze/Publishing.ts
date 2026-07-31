import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalNodeRegistry } from '../../knowledge/NodeRegistry.js';
import { globalEdgeRegistry } from '../../knowledge/EdgeRegistry.js';

export interface CampaignRelease {
  id: string;
  title: string;
  type: 'Single' | 'EP' | 'Album';
  status: 'Planning' | 'Campaigning' | 'Released';
  pressKit: 'pending' | 'completed';
  artwork: string;
  distributionStatus: 'staged' | 'submitted' | 'delivered';
  countdownDays: number;
  marketingBudget: number;
  releaseDate: string;
}

export class ReleaseCenter {
  private releases: CampaignRelease[] = [
    {
      id: 'rel-street-scholar',
      title: 'Rise of the Street Scholar',
      type: 'EP',
      status: 'Campaigning',
      pressKit: 'completed',
      artwork: 'artwork_street_scholar.png',
      distributionStatus: 'submitted',
      countdownDays: 15,
      marketingBudget: 1500,
      releaseDate: '2026-07-25'
    },
    {
      id: 'rel-blue-gold-flame',
      title: 'Blue Gold Flame',
      type: 'Single',
      status: 'Planning',
      pressKit: 'pending',
      artwork: 'artwork_blue_gold_flame.png',
      distributionStatus: 'staged',
      countdownDays: 36,
      marketingBudget: 500,
      releaseDate: '2026-08-15'
    }
  ];

  public getReleases(): CampaignRelease[] {
    return [...this.releases];
  }

  public addRelease(releaseData: Omit<CampaignRelease, 'id'>): CampaignRelease {
    const release: CampaignRelease = {
      id: `rel-${Date.now()}`,
      ...releaseData
    };
    this.releases.push(release);

    globalNodeRegistry.registerNode(release.id, 'Workflow', {
      title: release.title,
      type: 'Release',
      releaseType: release.type,
      status: release.status
    });
    globalEdgeRegistry.registerEdge(release.id, 'system-core', 'RELATED_TO');

    globalEventBus.publish('IcyflamzeReleaseAdded', { releaseId: release.id, title: release.title });

    return release;
  }

  public updateRelease(id: string, updates: Partial<CampaignRelease>): CampaignRelease | null {
    const release = this.releases.find(r => r.id === id);
    if (!release) return null;

    Object.assign(release, updates);

    globalNodeRegistry.registerNode(id, 'Workflow', {
      title: release.title,
      type: 'Release',
      releaseType: release.type,
      status: release.status
    });

    globalEventBus.publish('IcyflamzeReleaseUpdated', { releaseId: id, title: release.title, status: release.status });

    return release;
  }
}

export const globalReleaseCenter = new ReleaseCenter();
