import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalNodeRegistry } from '../../knowledge/NodeRegistry.js';
import { globalEdgeRegistry } from '../../knowledge/EdgeRegistry.js';

export interface ContentItem {
  id: string;
  title: string;
  platforms: ('YouTube' | 'TikTok' | 'Instagram' | 'Facebook' | 'X' | 'Threads' | 'Shorts' | 'Long-form' | 'Podcast' | 'Interviews')[];
  type: 'Short' | 'Long-form' | 'Post' | 'Audio';
  status: 'Idea' | 'Script' | 'Thumbnail' | 'Recording' | 'Editing' | 'Publishing' | 'Analytics' | 'Completed';
  releaseDate: string;
  description: string;
  script: string;
  analyticsViews?: number;
  analyticsLikes?: number;
}

export class ContentMachine {
  private content: ContentItem[] = [
    {
      id: 'content-1',
      title: 'Rise of the Street Scholar Trailer',
      platforms: ['YouTube', 'TikTok', 'Shorts'],
      type: 'Short',
      status: 'Editing',
      releaseDate: '2026-07-20',
      description: 'Teaser animation for Episode 1 showcasing the blue-gold flame and chessboard visuals.',
      script: 'Scene 1: Dark Lagos night, a single strike of Mr. 2 Lighter. Scene 2: Holographic command line boot sequence.',
      analyticsViews: 0,
      analyticsLikes: 0
    },
    {
      id: 'content-2',
      title: 'How I Built My Own AI OS for Music',
      platforms: ['YouTube', 'Long-form'],
      type: 'Long-form',
      status: 'Script',
      releaseDate: '2026-07-28',
      description: 'Behind-the-scenes breakdown of Brilliantaire OS, coding models configuration, and agentic workflows.',
      script: 'Intro: Introduce the Sovereign Stack. Body: Walkthrough of the Vite telemetry dashboard and sqlite logic.',
      analyticsViews: 0,
      analyticsLikes: 0
    },
    {
      id: 'content-3',
      title: 'Chess Strategy vs Street Wisdom',
      platforms: ['Instagram', 'X', 'Threads'],
      type: 'Post',
      status: 'Completed',
      releaseDate: '2026-07-08',
      description: 'Carousel post comparing tactical positioning in chess to navigating music label contracts.',
      script: 'Text: King on my own board, Knight in the universe\'s game. I build before burning. Read the full post on how strategy wins.',
      analyticsViews: 14200,
      analyticsLikes: 1040
    }
  ];

  public getContent(): ContentItem[] {
    return [...this.content];
  }

  public addContent(itemData: Omit<ContentItem, 'id'>): ContentItem {
    const item: ContentItem = {
      id: `content-${Date.now()}`,
      ...itemData
    };
    this.content.push(item);

    // Register node in Knowledge Graph
    globalNodeRegistry.registerNode(item.id, 'Content', {
      title: item.title,
      type: 'ContentItem',
      contentType: item.type,
      status: item.status
    });

    globalEdgeRegistry.registerEdge(item.id, 'system-core', 'RELATED_TO');

    // Notify EventBus
    globalEventBus.publish('IcyflamzeContentAdded', { contentId: item.id, title: item.title });

    return item;
  }

  public updateContent(id: string, updates: Partial<ContentItem>): ContentItem | null {
    const item = this.content.find(c => c.id === id);
    if (!item) return null;

    Object.assign(item, updates);

    // Update node in Knowledge Graph
    globalNodeRegistry.registerNode(id, 'Content', {
      title: item.title,
      type: 'ContentItem',
      contentType: item.type,
      status: item.status
    });

    // Notify EventBus
    globalEventBus.publish('IcyflamzeContentUpdated', { contentId: id, title: item.title, status: item.status });

    return item;
  }
}

export const globalContentMachine = new ContentMachine();
