import { globalNodeRegistry } from '../../knowledge/NodeRegistry.js';
import { globalEdgeRegistry } from '../../knowledge/EdgeRegistry.js';

export interface MediaAsset {
  id: string;
  name: string;
  category: 'Photo' | 'Video' | 'Artwork' | 'Logo' | 'Press Kit' | 'Document' | 'Contract';
  tags: string[];
  filepath: string;
  notes: string;
  knowledgeLink?: string;
}

export class MediaLibrary {
  private assets: MediaAsset[] = [
    { id: 'med-1', name: 'Official Press Photo (Studio)', category: 'Photo', tags: ['press', 'icyflamze', 'promo'], filepath: '/assets/press/icyflamze_studio_main.jpg', notes: 'High-res studio photo for publications.' },
    { id: 'med-2', name: 'Rise of the Street Scholar EP Cover', category: 'Artwork', tags: ['ep', 'artwork', 'gold-neon'], filepath: '/assets/artwork/rise_of_street_scholar.png', notes: 'Final artwork showing the chessboard design.', knowledgeLink: 'rel-street-scholar' },
    { id: 'med-3', name: 'EP Episode 1 Teaser Render Video', category: 'Video', tags: ['trailer', 'episode-1', 'render'], filepath: '/assets/videos/episode_1_teaser.mp4', notes: 'First episode trailer draft video file.' },
    { id: 'med-4', name: 'Tree Groove records distribution agreement', category: 'Contract', tags: ['legal', 'agreement', 'royalties'], filepath: '/assets/docs/distribution_contract_2026.pdf', notes: 'Sovereign distribution rights agreement.' }
  ];

  public getAssets(): MediaAsset[] {
    return [...this.assets];
  }

  public addAsset(assetData: Omit<MediaAsset, 'id'>): MediaAsset {
    const asset: MediaAsset = {
      id: `med-${Date.now()}`,
      ...assetData
    };
    this.assets.push(asset);

    globalNodeRegistry.registerNode(asset.id, 'Document', {
      title: asset.name,
      type: 'MediaAsset',
      category: asset.category,
      filepath: asset.filepath
    });
    globalEdgeRegistry.registerEdge(asset.id, 'system-core', 'RELATED_TO');

    if (asset.knowledgeLink) {
      globalEdgeRegistry.registerEdge(asset.id, asset.knowledgeLink, 'REFERENCES');
    }

    return asset;
  }

  public search(query: string): MediaAsset[] {
    const q = query.toLowerCase();
    return this.assets.filter(
      a =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
    );
  }
}

export const globalMediaLibrary = new MediaLibrary();
