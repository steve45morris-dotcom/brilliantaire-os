'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

interface InboxCaptureBoxProps {
  input: string;
  setInput: (val: string) => void;
  loading: boolean;
  onCapture: (val: string) => void;
  error: string | null;
}

export function InboxCaptureBox({
  input,
  setInput,
  loading,
  onCapture,
  error,
}: InboxCaptureBoxProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCapture(input);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter messy tasks details (e.g. build the API routes today, then write unit tests...)"
        className="w-full h-32 p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition-colors resize-none"
        disabled={loading}
      />
      {error && <span className="text-xs font-semibold text-pink-500">{error}</span>}
      <Button type="submit" disabled={loading} className="w-full sm:w-auto self-end flex items-center justify-center gap-2">
        {loading && <Spinner className="h-4 w-4 text-white" />}
        <span>Ingest Messy Input</span>
      </Button>
    </form>
  );
}
