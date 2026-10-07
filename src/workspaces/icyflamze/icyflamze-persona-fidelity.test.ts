import { beforeEach, describe, expect, it } from 'vitest';
import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalLiveOperationsStore } from '../../kernel/live/LiveOperationsStore.js';
import { globalGraphStore } from '../../knowledge/GraphStore.js';
import { LyricWorkspace } from './Lyrics.js';
import { SongManager, Song } from './Music.js';
import { ArtistPersonaEngine, CanonicalCaseStudyRegistry, PersonaFidelityGate } from './ArtistPersona.js';

describe('Icyflamze Artist Persona & Fidelity Gate Tests', () => {
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

  // Test 1: Seed verification
  it('seeds the August 12, 2026 freestyle as the canonical case study', () => {
    const registry = CanonicalCaseStudyRegistry.getInstance();
    const caseStudy = registry.getCaseStudy();
    expect(caseStudy.freestyleText).toContain('Brilliantier is hes mindset');
    expect(caseStudy.freestyleText).toContain('icyflamze with the smoke');
    expect(caseStudy.calibrationTraits.brilliantier).toBeDefined();
    expect(caseStudy.calibrationTraits.threeStatePersonaModel).toBeDefined();
  });

  // Test 2: Prompt compilation
  it('compiles a generation prompt with the calibration case study and guidelines', () => {
    const prompt = ArtistPersonaEngine.compileLyricPrompt('Write a song about Lagos streets');
    expect(prompt).toContain('Brilliantier is hes mindset');
    expect(prompt).toContain('ogbolor');
    expect(prompt).toContain('egusi');
    expect(prompt).toContain('Write a song about Lagos streets');
  });

  // Test 3: Authentic lyrics evaluation
  it('evaluates authentic lyrics successfully (high personaFidelity)', () => {
    const authenticLyrics = `
      Lagos boy standing tall, we make the bricks and stack them back.
      Mindset of a brilliantier, we got ogbolor oil on the egusi.
      We cook it up under pressure, brain to the heartbeat, no wahala.
      Two lighters lit in the dark, icyflamze with the smoke.
    `;
    const result = ArtistPersonaEngine.evaluateLyrics(authenticLyrics);
    expect(result.personaFidelity).toBeGreaterThanOrEqual(8.0);
    expect(result.isIcyflamzeReady).toBe(true);
    expect(result.culturalSpecificity).toBeGreaterThan(6.0);
  });

  // Test 4: Readiness gate trigger on Approved status
  it('rejects low personaFidelity lyrics on approval status trigger', () => {
    const poorLyrics = "Just another basic rap song about cars and money in Brooklyn.";
    
    // Status Approved must throw an error due to fidelity gate
    expect(() => {
      lyrics.addLyric({
        title: 'Failing Approved Song',
        content: poorLyrics,
        type: 'Verse',
        status: 'Approved',
        theme: 'Street',
        version: 'v1.0.0',
        references: []
      });
    }).toThrow(/NOT ICYFLAMZE READY/);
  });

  // Test 5: Allow low fidelity in Draft status
  it('allows draft status regardless of personaFidelity score', () => {
    const poorLyrics = "Just another basic rap song about cars and money in Brooklyn.";
    
    // Status Draft must not throw an error
    const lyric = lyrics.addLyric({
      title: 'Failing Draft Song',
      content: poorLyrics,
      type: 'Verse',
      status: 'Draft',
      theme: 'Street',
      version: 'v1.0.0',
      references: []
    });

    expect(lyric.id).toBeDefined();
    expect(lyric.personaFidelity).toBeLessThan(8.0);
  });

  // Test 6: Refusal of generic/mimic lines (drift detection)
  it('detects and penalizes generic American rap mimics (J. Cole / Nas style)', () => {
    const driftLyrics = `
      Yeah, sitting in Compton, reading J. Cole,
      Thinking about Brooklyn and Harlem streets, it is heavy on my soul.
      I am like Nas on the mic, writing my destiny.
    `;
    const result = ArtistPersonaEngine.evaluateLyrics(driftLyrics);
    expect(result.personaFidelity).toBeLessThan(8.0);
    expect(result.feedback.some(f => f.includes('Drift warning'))).toBe(true);
  });

  // Test 7: Refusal of slogan overuse
  it('detects and penalizes empty brilliantier slogan overuse', () => {
    const sloganOveruse = `
      brilliantier brilliantier brilliantier brilliantier.
      I am a brilliantier. Look at the brilliantier.
    `;
    const result = ArtistPersonaEngine.evaluateLyrics(sloganOveruse);
    expect(result.personaFidelity).toBeLessThan(8.0);
    expect(result.feedback.some(f => f.includes('slogan'))).toBe(true);
  });

  // Test 8: Language preservation
  it('preserves Nigerian linguistic markers (wahala, egusi, omo)', () => {
    const nativeLyrics = `
      Lagos streets, no wahala here.
      Omo, we make the cashout and build the track.
      Delta boys cooking egusi in the pot.
    `;
    const result = ArtistPersonaEngine.evaluateLyrics(nativeLyrics);
    expect(result.culturalSpecificity).toBeGreaterThan(6.0);
  });

  // Test 9: Persist Song metadata to SQLite
  it('persists all evaluated metadata fields to SQLite on Song update', () => {
    const songData = {
      title: 'Authentic Single',
      status: 'Draft' as const,
      genre: 'Afro-HipHop',
      bpm: 98,
      mood: 'Confident',
      producer: 'Icyflamze',
      version: 'v1.0.0',
      lyrics: 'Lagos boy with the two lighters, mindset is brilliantier.',
      recording: 'pending' as const,
      mix: 'pending' as const,
      master: 'pending' as const,
      artwork: 'pending' as const,
      releaseDate: '2026-10-10',
      publishingStatus: 'Unpublished' as const
    };

    const song = songs.addSong(songData);
    
    // Evaluate lyrics manually to simulate generation pipeline mapping
    const evalResult = ArtistPersonaEngine.evaluateLyrics(songData.lyrics);
    
    const updated = songs.updateSong(song.id, {
      personaFidelity: evalResult.personaFidelity,
      culturalReferences: ['Lagos', 'two lighters'],
      icySignals: ['mindset'],
      flamzeSignals: ['lighters'],
      generationProvenance: 'LLM generated, calibrated by August 12 freestyle'
    });

    expect(updated).not.toBeNull();
    expect(updated?.personaFidelity).toBe(evalResult.personaFidelity);
    expect(updated?.culturalReferences).toEqual(['Lagos', 'two lighters']);
    expect(updated?.generationProvenance).toBe('LLM generated, calibrated by August 12 freestyle');

    // Load from database to verify persistence hydration
    const songFromDb = songs.getSong(song.id);
    expect(songFromDb?.personaFidelity).toBe(evalResult.personaFidelity);
    expect(songFromDb?.culturalReferences).toEqual(['Lagos', 'two lighters']);
    expect(songFromDb?.icySignals).toEqual(['mindset']);
    expect(songFromDb?.flamzeSignals).toEqual(['lighters']);
  });

  // Test 10: Non-drift verification
  it('does not drift or affect other workspace schemas', () => {
    // Unrelated updates work fine
    const songData = {
      title: 'Plain Beat Instrumental',
      status: 'Draft' as const,
      genre: 'Amapiano',
      bpm: 112,
      mood: 'Groovy',
      producer: 'Unknown Beatmaker',
      version: 'v0.1.0',
      lyrics: '',
      recording: 'pending' as const,
      mix: 'pending' as const,
      master: 'pending' as const,
      artwork: 'pending' as const,
      releaseDate: '',
      publishingStatus: 'Unpublished' as const
    };

    const song = songs.addSong(songData);
    const updated = songs.updateSong(song.id, { bpm: 115 });
    
    expect(updated?.bpm).toBe(115);
    expect(updated?.personaFidelity).toBeUndefined(); // no persona fidelity evaluated for instrumental
  });
});
