'use client';

import React from 'react';
import { SessionEvent } from '../../hooks/use-focus-session';

export function SessionEventLog({ events }: { events: SessionEvent[] }) {
  return (
    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto border border-zinc-900 bg-zinc-950/40 rounded-lg p-4">
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
        Session Event Log
      </span>
      {events.length === 0 ? (
        <span className="text-xs text-zinc-700">No events generated yet.</span>
      ) : (
        <div className="flex flex-col gap-1.5 font-mono text-xs">
          {events.map((evt, idx) => (
            <div key={idx} className="flex justify-between items-start text-zinc-500">
              <span className="text-zinc-400">{evt.message}</span>
              <span className="text-zinc-600 text-[10px]">
                {new Date(evt.timestamp).toLocaleTimeString([], { hour12: false })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
