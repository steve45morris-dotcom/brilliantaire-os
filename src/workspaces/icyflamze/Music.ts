import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalNodeRegistry } from '../../knowledge/NodeRegistry.js';
import { globalEdgeRegistry } from '../../knowledge/EdgeRegistry.js';
import { globalTaskTracker } from '../../kernel/live/TaskTracker.js';
import { getDB } from '../../db.js';

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

const DEFAULT_SONGS: Song[] = [
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

export class SongManager {
  private songs: Song[] = [];

  constructor() {
    this.initPersistence();
  }

  private initPersistence(): void {
    const db = getDB();
    db.exec(`
      CREATE TABLE IF NOT EXISTS icyflamze_songs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        genre TEXT NOT NULL,
        bpm INTEGER NOT NULL,
        mood TEXT NOT NULL,
        producer TEXT NOT NULL,
        version TEXT NOT NULL,
        lyrics TEXT NOT NULL,
        recording TEXT NOT NULL,
        mix TEXT NOT NULL,
        master TEXT NOT NULL,
        artwork TEXT NOT NULL,
        release_date TEXT NOT NULL,
        publishing_status TEXT NOT NULL,
        linked_lyric_ids_json TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const initialRows = db.prepare(`SELECT * FROM icyflamze_songs`).all() as any[];

    if (initialRows.length === 0) {
      const insertStmt = db.prepare(`
        INSERT INTO icyflamze_songs (id, title, status, genre, bpm, mood, producer, version, lyrics, recording, mix, master, artwork, release_date, publishing_status, linked_lyric_ids_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO NOTHING
      `);

      for (const song of DEFAULT_SONGS) {
        insertStmt.run(
          song.id,
          song.title,
          song.status,
          song.genre,
          song.bpm,
          song.mood,
          song.producer,
          song.version,
          song.lyrics,
          song.recording,
          song.mix,
          song.master,
          song.artwork,
          song.releaseDate,
          song.publishingStatus,
          JSON.stringify(song.linkedLyricIds || [])
        );
      }
    }

    // Unconditionally load existing records from SQLite database so both winning and losing processes hydrate from DB rows
    const rows = db.prepare(`SELECT * FROM icyflamze_songs`).all() as any[];
    this.songs = rows.map(r => ({
      id: r.id,
      title: r.title,
      status: r.status,
      genre: r.genre,
      bpm: r.bpm,
      mood: r.mood,
      producer: r.producer,
      version: r.version,
      lyrics: r.lyrics,
      recording: r.recording,
      mix: r.mix,
      master: r.master,
      artwork: r.artwork,
      releaseDate: r.release_date,
      publishingStatus: r.publishing_status,
      linkedLyricIds: JSON.parse(r.linked_lyric_ids_json || '[]')
    }));
  }

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

    const db = getDB();
    db.prepare(`UPDATE icyflamze_songs SET linked_lyric_ids_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(
      JSON.stringify(song.linkedLyricIds),
      id
    );

    return song;
  }

  public unlinkLyric(id: string, lyricId: string): Song {
    const song = this.getSong(id);
    if (!song) throw new Error(`Song ${id} was not found.`);
    song.linkedLyricIds = (song.linkedLyricIds ?? []).filter(linkedId => linkedId !== lyricId);

    const db = getDB();
    db.prepare(`UPDATE icyflamze_songs SET linked_lyric_ids_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(
      JSON.stringify(song.linkedLyricIds),
      id
    );

    return song;
  }

  public addSong(songData: Omit<Song, 'id'>): Song {
    const song: Song = {
      id: `song-${Date.now()}`,
      ...songData
    };
    this.songs.push(song);

    const db = getDB();
    db.prepare(`
      INSERT INTO icyflamze_songs (id, title, status, genre, bpm, mood, producer, version, lyrics, recording, mix, master, artwork, release_date, publishing_status, linked_lyric_ids_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      song.id,
      song.title,
      song.status,
      song.genre,
      song.bpm,
      song.mood,
      song.producer,
      song.version,
      song.lyrics,
      song.recording,
      song.mix,
      song.master,
      song.artwork,
      song.releaseDate,
      song.publishingStatus,
      JSON.stringify(song.linkedLyricIds || [])
    );

    globalNodeRegistry.registerNode(song.id, 'Document', {
      title: song.title,
      type: 'Song',
      genre: song.genre,
      bpm: song.bpm,
      status: song.status
    });

    globalEdgeRegistry.registerEdge(song.id, 'system-core', 'RELATED_TO');
    globalEventBus.publish('IcyflamzeSongAdded', { songId: song.id, title: song.title });

    const taskId = `task-song-creation-${song.id}`;
    globalTaskTracker.startTask(taskId, 'session-ui', 'workflow_step', `Registered Song: ${song.title}`, 'Icyflamze');
    globalTaskTracker.completeTask(taskId);

    return song;
  }

  public updateSong(id: string, updates: Partial<Song>): Song | null {
    const song = this.songs.find(s => s.id === id);
    if (!song) return null;

    Object.assign(song, updates);

    const db = getDB();
    db.prepare(`
      UPDATE icyflamze_songs
      SET title = ?, status = ?, genre = ?, bpm = ?, mood = ?, producer = ?, version = ?, lyrics = ?, recording = ?, mix = ?, master = ?, artwork = ?, release_date = ?, publishing_status = ?, linked_lyric_ids_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      song.title,
      song.status,
      song.genre,
      song.bpm,
      song.mood,
      song.producer,
      song.version,
      song.lyrics,
      song.recording,
      song.mix,
      song.master,
      song.artwork,
      song.releaseDate,
      song.publishingStatus,
      JSON.stringify(song.linkedLyricIds || []),
      song.id
    );

    globalEventBus.publish('IcyflamzeSongUpdated', { songId: id, updates });
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

  public clear(): void {
    const db = getDB();
    db.exec(`DELETE FROM icyflamze_songs;`);
    this.songs = [];
    this.initPersistence();
  }
}

export const globalSongManager = new SongManager();
