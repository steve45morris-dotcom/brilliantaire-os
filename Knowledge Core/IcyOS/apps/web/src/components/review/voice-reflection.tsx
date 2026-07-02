'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Mic, Square } from 'lucide-react';

interface VoiceReflectionProps {
  isRecording: boolean;
  hasPermission: boolean | null;
  onStart: () => void;
  onStop: () => void;
  onRequestPermission: () => void;
}

export function VoiceReflection({
  isRecording,
  hasPermission,
  onStart,
  onStop,
  onRequestPermission,
}: VoiceReflectionProps) {
  if (hasPermission === null) {
    return (
      <Button onClick={onRequestPermission} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center gap-2">
        <Mic size={16} />
        <span>Enable Voice Reflection</span>
      </Button>
    );
  }

  if (hasPermission === false) {
    return (
      <span className="text-xs text-zinc-500 italic">
        Microphone access unavailable.
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <Button onClick={onStop} className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 animate-pulse">
          <Square size={16} />
          <span>Stop Recording</span>
        </Button>
      ) : (
        <Button onClick={onStart} className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2">
          <Mic size={16} />
          <span>Start Recording Reflection</span>
        </Button>
      )}
    </div>
  );
}
