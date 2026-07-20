import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalNodeRegistry } from '../../knowledge/NodeRegistry.js';
import { globalEdgeRegistry } from '../../knowledge/EdgeRegistry.js';
import { globalTaskTracker } from '../../kernel/live/TaskTracker.js';

export interface Song {
  id: string;
  title: string;
  status: 'Draft' | 'Recorded' | 'Mixed' | 'Mastered' | 'Released';
  genre: string;
  bpm: number;
  mood: string;
  producer: string;
  version: string;
  lyrics: string;
  recording: 'pending' | 'completed';
  mix: 'pending' | 'completed';
  master: 'pending' | 'completed';
  artwork: 'pending' | 'completed';
  releaseDate: string;
  publishingStatus: 'Unpublished' | 'Staged' | 'Published';
  linkedLyricIds?: string[];
}

export class SongManager {
  private songs: Song[] = [
    {
      id: 'song-street-scholar',
      title: 'Street Scholar (Intro)',
      status: 'Mastered',
      genre: 'Hip-Hop / Futurist',
      bpm: 92,
      mood: 'Intense / Analytical',
      producer: 'Icyflamze',
      version: 'v1.2.0',
      lyrics: 'Strike Mr. 2 Lighter in the rain, formulas in my brain...',
      recording: 'completed',
      mix: 'completed',
      master: 'completed',
      artwork: 'completed',
      releaseDate: '2026-07-25',
      publishingStatus: 'Staged'
    },
    {
      id: 'song-blue-gold-flame',
      title: 'Blue Gold Flame',
      status: 'Recorded',
      genre: 'Hip-Hop / Synth',
      bpm: 88,
      mood: 'Cinematic / Gritty',
      producer: 'Tree Groove Beats',
      version: 'v0.9.0',
      lyrics: 'Chessboard alignment, moves on the concrete...',
      recording: 'completed',
      mix: 'pending',
      master: 'pending',
      artwork: 'pending',
      releaseDate: '2026-08-15',
      publishingStatus: 'Unpublished'
    },
    {
      id: 'song-pressure-cooker',
      title: 'Pressure Cooker',
      status: 'Draft',
      genre: 'Hip-Hop / Boom Bap',
      bpm: 95,
      mood: 'Aggressive / Cerebral',
      producer: 'Lagos Sound Lab',
      version: 'v0.3.0',
      lyrics: 'Born in Lagos under pressure, street scholar logic measures...',
      recording: 'pending',
      mix: 'pending',
      master: 'pending',
      artwork: 'pending',
      releaseDate: '2026-09-01',
      publishingStatus: 'Unpublished'
    }
  ];

  public getSongs(): Song[] {
    return [...this.songs];
  }

  public getSong(id: string): Song | null {
    return this.songs.find(song => song.id === id) ?? null;
  }

  public getLinkedLyricIds(id: string): string[] {
    return [...(this.getSong(id)?.linkedLyricIds ?? [])];
  }

  public linkLyric(id: string, lyricId: string): Song {
    const song = this.getSong(id);
    if (!song) throw new Error(`Song ${id} was not found.`);
    const linkedLyricIds = new Set(song.linkedLyricIds ?? []);
    linkedLyricIds.add(lyricId);
    song.linkedLyricIds = [...linkedLyricIds];
    return song;
  }

  public unlinkLyric(id: string, lyricId: string): Song {
    const song = this.getSong(id);
    if (!song) throw new Error(`Song ${id} was not found.`);
    song.linkedLyricIds = (song.linkedLyricIds ?? []).filter(linkedId => linkedId !== lyricId);
    return song;
  }

  public addSong(songData: Omit<Song, 'id'>): Song {
    const song: Song = {
      id: `song-${Date.now()}`,
      ...songData
    };
    this.songs.push(song);

    // Register with Knowledge Graph
    globalNodeRegistry.registerNode(song.id, 'Document', {
      title: song.title,
      type: 'Song',
      genre: song.genre,
      bpm: song.bpm,
      status: song.status
    });

    // Link song to Icyflamze project root node
    globalEdgeRegistry.registerEdge(song.id, 'system-core', 'RELATED_TO');

    // Notify EventBus
    globalEventBus.publish('IcyflamzeSongAdded', { songId: song.id, title: song.title });

    // Track live operation task
    globalTaskTracker.startTask(
      `task-song-creation-${song.id}`,
      `session-ui`,
      'workflow_step',
      `Registered Song: ${song.title}`,
      'Icyflamze'
    );
    globalTaskTracker.completeTask(`task-song-creation-${song.id}`);

    return song;
  }

  public updateSong(id: string, updates: Partial<Song>): Song | null {
    const song = this.songs.find(s => s.id === id);
    if (!song) return null;

    Object.assign(song, updates);

    // Notify EventBus
    globalEventBus.publish('IcyflamzeSongUpdated', { songId: id, updates });

    // Update Knowledge Graph node properties
    globalNodeRegistry.registerNode(id, 'Document', {
      title: song.title,
      type: 'Song',
      genre: song.genre,
      bpm: song.bpm,
      status: song.status
    });

    return song;
  }

  public generateTimelineView() {
    return this.songs
      .filter(s => s.releaseDate)
      .map(s => ({
        id: s.id,
        title: s.title,
        releaseDate: s.releaseDate,
        status: s.status,
        publishingStatus: s.publishingStatus
      }))
      .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
  }
}

export const globalSongManager = new SongManager();
