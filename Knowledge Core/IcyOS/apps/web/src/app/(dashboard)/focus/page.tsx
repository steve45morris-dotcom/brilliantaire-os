'use client';

import { FocusSessionCard } from '../../../components/focus/focus-session-card';

export default function FocusPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Focus Session</h1>
          <p className="text-zinc-500 text-sm">Real-time task execution countdown and protected buffer logs.</p>
        </div>
      </div>
      <FocusSessionCard
        missionId="active-mission-id"
        missionTitle="Build API Controllers and Route Boundary"
      />
    </div>
  );
}
