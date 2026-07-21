import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalNodeRegistry } from '../../knowledge/NodeRegistry.js';
import { globalEdgeRegistry } from '../../knowledge/EdgeRegistry.js';
import { globalTaskTracker } from '../../kernel/live/TaskTracker.js';
import type { SongManager } from './Music.js';
import { getDB } from '../../db.js';

export interface LyricItem {
  id: string;
  title: string;
  content: string;
  type: 'Notebook' | 'Freestyle' | 'Hook' | 'Verse' | 'Punchline';
  status: 'Draft' | 'Review' | 'Approved' | 'Recorded' | 'Released';
  theme: string;
  version: string;
  references: string[];
  history: { timestamp: string; content: string; version: string }[];
  songId?: string;
}

export interface SongLyricLinkResult {
  lyricId: string;
  songId: string;
  previousSongId?: string;
  reassigned: boolean;
}

const DEFAULT_LYRICS: LyricItem[] = [
  {
    id: 'lyric-1',
    title: 'Street Scholar Theme',
    content: 'I strike Mr. 2 Lighter in the midnight rain / Formulas and algorithms running through my veins / Chessboard alignment, matching strategy with pain / I build before burning, concrete under system reign.',
    type: 'Notebook',
    status: 'Approved',
    theme: 'Street Scholar Futurism',
    version: 'v1.0.0',
    references: ['chess', 'lighters', 'formulas'],
    history: [
      { timestamp: '2026-07-20T00:00:00.000Z', content: 'Initial draft with basic rhyme mapping...', version: 'v0.1.0' },
      { timestamp: '2026-07-21T00:00:00.000Z', content: 'Refined rhythm cadence and Street Scholar imagery.', version: 'v1.0.0' }
    ]
  },
  {
    id: 'lyric-2',
    title: 'Lagos Pressure Hook',
    content: 'Lagos pressure cook a diamond out of clay / Under golden sun we find a better way / Mr. 2 Lighter spark the flame, ignite the play / Strategic moves, we never run away.',
    type: 'Hook',
    status: 'Draft',
    theme: 'Lagos Roots',
    version: 'v0.2.0',
    references: ['lighters', 'golden sun'],
    history: [
      { timestamp: '2026-07-21T00:00:00.000Z', content: 'First hook draft for Lagos pressure theme.', version: 'v0.1.0' }
    ]
  },
  {
    id: 'lyric-3',
    title: 'Double Lighter Bars',
    content: 'Survival protocol is chess, not luck / Under pressure we adapt, never getting stuck / Mr. 2 Lighter ready, double flame ignite / From the Lagos delta to the digital height.',
    type: 'Verse',
    status: 'Recorded',
    theme: 'Ignition / Tech',
    version: 'v1.1.0',
    references: ['lighters', 'chess'],
    history: [
      { timestamp: '2026-07-21T00:00:00.000Z', content: 'Recorded version locked.', version: 'v1.1.0' }
    ]
  }
];

export class LyricWorkspace {
  private lyrics: LyricItem[] = [];

  constructor() {
    this.initPersistence();
  }

  private initPersistence(): void {
    const db = getDB();
    db.exec(`
      CREATE TABLE IF NOT EXISTS icyflamze_lyrics (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        theme TEXT NOT NULL,
        version TEXT NOT NULL,
        references_json TEXT NOT NULL,
        history_json TEXT NOT NULL,
        song_id TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const rows = db.prepare(`SELECT * FROM icyflamze_lyrics`).all() as any[];

    if (rows.length === 0) {
      // Seed default lyrics into SQLite database on first initialization
      const insertStmt = db.prepare(`
        INSERT INTO icyflamze_lyrics (id, title, content, type, status, theme, version, references_json, history_json, song_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO NOTHING
      `);

      for (const lyric of DEFAULT_LYRICS) {
        insertStmt.run(
          lyric.id,
          lyric.title,
          lyric.content,
          lyric.type,
          lyric.status,
          lyric.theme,
          lyric.version,
          JSON.stringify(lyric.references),
          JSON.stringify(lyric.history),
          lyric.songId || null
        );
      }
      this.lyrics = JSON.parse(JSON.stringify(DEFAULT_LYRICS));
    } else {
      // Load existing records from SQLite database
      this.lyrics = rows.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content,
        type: r.type,
        status: r.status,
        theme: r.theme,
        version: r.version,
        references: JSON.parse(r.references_json || '[]'),
        history: JSON.parse(r.history_json || '[]'),
        songId: r.song_id || undefined
      }));
    }
  }

  public getLyrics(): LyricItem[] {
    return [...this.lyrics];
  }

  public linkLyricToSong(lyricId: string, songId: string, songs: SongManager): SongLyricLinkResult {
    const lyric = this.lyrics.find(item => item.id === lyricId);
    if (!lyric) throw new Error(`Lyric ${lyricId} was not found.`);
    const song = songs.getSong(songId);
    if (!song) throw new Error(`Song ${songId} was not found.`);

    const previousSongId = lyric.songId;
    if (previousSongId && previousSongId !== songId) songs.unlinkLyric(previousSongId, lyricId);
    songs.linkLyric(songId, lyricId);
    lyric.songId = songId;

    // Persist link update to SQLite using bound parameters
    const db = getDB();
    db.prepare(`UPDATE icyflamze_lyrics SET song_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(songId, lyricId);

    globalNodeRegistry.registerNode(song.id, 'Document', { title: song.title, type: 'Song', status: song.status });
    globalNodeRegistry.registerNode(lyric.id, 'Document', { title: lyric.title, type: lyric.type, status: lyric.status });
    globalEdgeRegistry.registerEdge(lyric.id, song.id, 'RELATED_TO', { relationship: 'LYRIC_FOR_SONG' });

    const reassigned = Boolean(previousSongId && previousSongId !== songId);
    globalEventBus.publish('IcyflamzeLyricLinkedToSong', { lyricId, songId, reassigned, previousSongId });
    const taskId = `task-song-lyric-link-${lyricId}-${Date.now()}`;
    globalTaskTracker.startTask(taskId, 'session-ui', 'workflow_step', `Linked lyric ${lyric.title} to ${song.title}`, 'Icyflamze');
    globalTaskTracker.completeTask(taskId);

    return { lyricId, songId, previousSongId, reassigned };
  }

  public addLyric(lyricData: Omit<LyricItem, 'id' | 'history'>): LyricItem {
    const lyric: LyricItem = {
      id: `lyric-${Date.now()}`,
      history: [{ timestamp: new Date().toISOString(), content: lyricData.content, version: lyricData.version }],
      ...lyricData
    };
    this.lyrics.push(lyric);

    // Persist new lyric to SQLite database using bound parameters
    const db = getDB();
    db.prepare(`
      INSERT INTO icyflamze_lyrics (id, title, content, type, status, theme, version, references_json, history_json, song_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      lyric.id,
      lyric.title,
      lyric.content,
      lyric.type,
      lyric.status,
      lyric.theme,
      lyric.version,
      JSON.stringify(lyric.references),
      JSON.stringify(lyric.history),
      lyric.songId || null
    );

    globalNodeRegistry.registerNode(lyric.id, 'Document', {
      title: lyric.title,
      type: lyric.type,
      theme: lyric.theme,
      status: lyric.status
    });

    globalEdgeRegistry.registerEdge(lyric.id, 'system-core', 'RELATED_TO');
    globalEventBus.publish('IcyflamzeLyricAdded', { lyricId: lyric.id, title: lyric.title, type: lyric.type });

    return lyric;
  }

  public updateLyric(id: string, content: string, updates: Partial<Omit<LyricItem, 'id' | 'history' | 'content'>>): LyricItem | null {
    const lyric = this.lyrics.find(l => l.id === id);
    if (!lyric) return null;

    const oldVersion = lyric.version;
    const majorMinor = oldVersion.startsWith('v') ? oldVersion.slice(1).split('.') : ['1', '0', '0'];
    const newVersion = `v${parseInt(majorMinor[0], 10)}.${parseInt(majorMinor[1], 10) + 1}.0`;

    if (content !== lyric.content) {
      lyric.history.push({
        timestamp: new Date().toISOString(),
        content: lyric.content,
        version: oldVersion
      });
      lyric.content = content;
      lyric.version = newVersion;
    }

    Object.assign(lyric, updates);

    // Persist updated lyric to SQLite database using bound parameters
    const db = getDB();
    db.prepare(`
      UPDATE icyflamze_lyrics
      SET title = ?, content = ?, type = ?, status = ?, theme = ?, version = ?, references_json = ?, history_json = ?, song_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      lyric.title,
      lyric.content,
      lyric.type,
      lyric.status,
      lyric.theme,
      lyric.version,
      JSON.stringify(lyric.references),
      JSON.stringify(lyric.history),
      lyric.songId || null,
      lyric.id
    );

    globalNodeRegistry.registerNode(id, 'Document', {
      title: lyric.title,
      type: lyric.type,
      theme: lyric.theme,
      status: lyric.status
    });

    globalEventBus.publish('IcyflamzeLyricUpdated', { lyricId: id, title: lyric.title, version: lyric.version });

    return lyric;
  }

  public search(query: string): LyricItem[] {
    const q = query.toLowerCase();
    return this.lyrics.filter(
      l =>
        l.title.toLowerCase().includes(q) ||
        l.content.toLowerCase().includes(q) ||
        l.theme.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q)
    );
  }

  public askAssistant(prompt: string, type: 'rhyme' | 'hook' | 'theme'): string {
    const cleanPrompt = prompt.toLowerCase();
    if (type === 'rhyme') {
      if (cleanPrompt.includes('chess') || cleanPrompt.includes('board')) {
        return "Tactical moves across the grid / Street Scholar did what the rules forbid / King on my board, Knight in the game / Striking the lighter to ignite the flame.";
      }
      return "Lagos pressure diamonds under code / Walking down this digital scholar road / Systems booting, engines on the rise / Blue gold flame inside the architect eyes.";
    } else if (type === 'hook') {
      return "Double lighters up, let the system ignite / We write the formula to conquer the night / Street scholar mind, Lagos delta soul / Sovereign status is the ultimate goal.";
    } else {
      return "Suggested Theme: 'Strategic Rebirth' - Focus on the chessboard symbol paired with blue-gold lighters, contrasting Lagos delta struggle with clean terminal room lines.";
    }
  }

  public clear(): void {
    const db = getDB();
    db.exec(`DELETE FROM icyflamze_lyrics;`);
    this.lyrics = [];
    this.initPersistence();
  }
}

export const globalLyricWorkspace = new LyricWorkspace();
