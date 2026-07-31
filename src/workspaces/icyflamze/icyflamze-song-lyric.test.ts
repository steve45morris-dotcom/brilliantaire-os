import { beforeEach, describe, expect, it } from 'vitest';
import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalLiveOperationsStore } from '../../kernel/live/LiveOperationsStore.js';
import { globalGraphStore } from '../../knowledge/GraphStore.js';
import { LyricWorkspace } from './Lyrics.js';
import { SongManager } from './Music.js';
import { getRouteForWorkspace } from '../WorkspaceRoutes.js';

describe('Icyflamze song and lyric association', () => {
  let songs: SongManager;
  let lyrics: LyricWorkspace;

  beforeEach(() => {
    songs = new SongManager();
    lyrics = new LyricWorkspace();
    songs.clear();
    lyrics.clear();
    globalEventBus.clearHistory();
    globalLiveOperationsStore.clear();
    globalGraphStore.clear();
  });

  it('links an existing lyric to an existing song and records operational evidence', () => {
    const result = lyrics.linkLyricToSong('lyric-2', 'song-pressure-cooker', songs);

    expect(result).toMatchObject({
      lyricId: 'lyric-2',
      songId: 'song-pressure-cooker',
      reassigned: false
    });
    expect(lyrics.getLyrics().find((lyric) => lyric.id === 'lyric-2')?.songId).toBe('song-pressure-cooker');
    expect(songs.getLinkedLyricIds('song-pressure-cooker')).toEqual(['lyric-2']);
    expect(globalEventBus.getHistory().at(-1)).toMatchObject({
      type: 'IcyflamzeLyricLinkedToSong',
      payload: { lyricId: 'lyric-2', songId: 'song-pressure-cooker', reassigned: false }
    });
    expect(globalLiveOperationsStore.getTasks().at(-1)).toMatchObject({
      type: 'workflow_step',
      status: 'completed',
      projectId: 'Icyflamze'
    });
    expect(globalGraphStore.getEdges()).toContainEqual(expect.objectContaining({
      fromNodeId: 'lyric-2',
      toNodeId: 'song-pressure-cooker',
      type: 'RELATED_TO'
    }));
  });

  it('rejects a missing lyric without mutating the song', () => {
    expect(() => lyrics.linkLyricToSong('lyric-missing', 'song-pressure-cooker', songs)).toThrow(/lyric.*not found/i);
    expect(songs.getLinkedLyricIds('song-pressure-cooker')).toEqual([]);
  });

  it('rejects a missing song without mutating the lyric', () => {
    expect(() => lyrics.linkLyricToSong('lyric-2', 'song-missing', songs)).toThrow(/song.*not found/i);
    expect(lyrics.getLyrics().find((lyric) => lyric.id === 'lyric-2')?.songId).toBeUndefined();
  });

  it('reassigns deterministically and removes the old song association', () => {
    lyrics.linkLyricToSong('lyric-2', 'song-pressure-cooker', songs);
    const result = lyrics.linkLyricToSong('lyric-2', 'song-blue-gold-flame', songs);

    expect(result.reassigned).toBe(true);
    expect(songs.getLinkedLyricIds('song-pressure-cooker')).toEqual([]);
    expect(songs.getLinkedLyricIds('song-blue-gold-flame')).toEqual(['lyric-2']);
    expect(lyrics.getLyrics().find((lyric) => lyric.id === 'lyric-2')?.version).toBe('v0.2.0');
  });

  it('preserves the existing Icyflamze workspace route', () => {
    expect(getRouteForWorkspace('icyflamze')).toBe('projects-icyflamze');
  });
});
