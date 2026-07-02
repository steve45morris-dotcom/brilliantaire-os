import { describe, it, expect } from 'vitest';
import { ReviewScore } from './review-score';
import { VoiceReflection } from './voice-reflection';
import { TextReflection } from './text-reflection';

describe('Reflection Review Components UI', () => {
  it('should define score, voice, and text reflection modules', () => {
    expect(ReviewScore).toBeDefined();
    expect(VoiceReflection).toBeDefined();
    expect(TextReflection).toBeDefined();
  });
});
