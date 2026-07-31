import fs from 'fs';
import path from 'path';
import { globalEventBus } from '../events/EventBus.js';

export interface ScreenContext {
  screenshotPath?: string;
  activeWindow?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DawMarker {
  time: string;
  name: string;
  description?: string;
}

export interface DawSessionNotes {
  tempo: number;
  timeSignature: string;
  tracks: string[];
  markers: DawMarker[];
  rawNotes: string;
}

export interface StreamingMetrics {
  platform: string;
  streams: number;
  listeners: number;
  playlistAdds: number;
  revenueEstimate: number;
}

export class MultimodalEngine {
  private static instance: MultimodalEngine;
  private currentScreenContext: ScreenContext | null = null;

  private constructor() {}

  public static getInstance(): MultimodalEngine {
    if (!MultimodalEngine.instance) {
      MultimodalEngine.instance = new MultimodalEngine();
    }
    return MultimodalEngine.instance;
  }

  /**
   * Set the active screen context (e.g. metadata or path to a screenshot)
   */
  public setScreenContext(screenshotPath?: string, activeWindow?: string, metadata?: Record<string, any>): ScreenContext {
    this.currentScreenContext = {
      screenshotPath,
      activeWindow,
      timestamp: new Date().toISOString(),
      metadata
    };
    globalEventBus.publish('ScreenContextUpdated', this.currentScreenContext);
    return this.currentScreenContext;
  }

  public getScreenContext(): ScreenContext | null {
    return this.currentScreenContext;
  }

  /**
   * Parses exported DAW session notes from text files
   */
  public parseDawSessionNotes(notesText: string): DawSessionNotes {
    const lines = notesText.split('\n');
    let tempo = 120;
    let timeSignature = '4/4';
    const tracks: string[] = [];
    const markers: DawMarker[] = [];

    for (const line of lines) {
      const lower = line.toLowerCase().trim();
      
      // Parse Tempo: e.g. "BPM: 140" or "Tempo: 140"
      if (lower.startsWith('bpm:') || lower.startsWith('tempo:')) {
        const value = parseInt(line.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(value)) tempo = value;
      }
      
      // Parse Time Signature: e.g. "Time Signature: 4/4"
      if (lower.startsWith('time signature:') || lower.startsWith('signature:')) {
        const sig = line.split(':')[1]?.trim();
        if (sig) timeSignature = sig;
      }

      // Parse Tracks: lines starting with "[TRACK]"
      if (lower.startsWith('[track]')) {
        const trackName = line.substring(7).trim();
        if (trackName) tracks.push(trackName);
      }

      // Parse Markers: lines starting with "[MARKER] 00:00:00 - Intro"
      if (lower.startsWith('[marker]')) {
        const rest = line.substring(8).trim();
        const splitIndex = rest.indexOf('-');
        if (splitIndex !== -1) {
          const time = rest.substring(0, splitIndex).trim();
          const name = rest.substring(splitIndex + 1).trim();
          markers.push({ time, name });
        }
      }
    }

    const session: DawSessionNotes = {
      tempo,
      timeSignature,
      tracks,
      markers,
      rawNotes: notesText
    };

    globalEventBus.publish('DawNotesParsed', { tracksCount: tracks.length, markersCount: markers.length });
    return session;
  }

  /**
   * Ingests streaming analytics CSV data and turns them into streaming metrics objects
   */
  public ingestStreamingCsv(csvContent: string): StreamingMetrics[] {
    const lines = csvContent.split('\n');
    const results: StreamingMetrics[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Expect format: Platform,Streams,Listeners,PlaylistAdds,RevenueEstimate
      const parts = line.split(',');
      if (parts.length >= 5) {
        const platform = parts[0].trim();
        const streams = parseInt(parts[1], 10) || 0;
        const listeners = parseInt(parts[2], 10) || 0;
        const playlistAdds = parseInt(parts[3], 10) || 0;
        const revenueEstimate = parseFloat(parts[4]) || 0;

        results.push({
          platform,
          streams,
          listeners,
          playlistAdds,
          revenueEstimate
        });
      }
    }

    globalEventBus.publish('StreamingMetricsIngested', { platformsIngested: results.length });
    return results;
  }
}
