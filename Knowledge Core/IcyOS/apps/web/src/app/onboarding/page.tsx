'use client';

import { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { apiFetch } from '../../lib/api/client';
import { SAMPLE_MISSION, type OnboardingResult } from '../../lib/onboarding/first-run';

type Priority = 'P1' | 'P2' | 'P3';

const STEPS = ['Workspace', 'First project', 'Sample mission'] as const;

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'P1', label: 'P1 · Urgent' },
  { value: 'P2', label: 'P2 · Important' },
  { value: 'P3', label: 'P3 · Someday' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectPriority, setProjectPriority] = useState<Priority>('P2');
  const [includeSampleMission, setIncludeSampleMission] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OnboardingResult | null>(null);

  const canContinue = step === 0 ? workspaceName.trim() !== '' : step === 1 ? projectName.trim() !== '' : true;

  async function finish() {
    setBusy(true);
    setError(null);
    const res = await apiFetch<OnboardingResult>('/api/onboarding', {
      method: 'POST',
      body: JSON.stringify({ workspaceName, projectName, projectPriority, includeSampleMission }),
    });
    if (res.success && res.data) {
      setResult(res.data);
    } else {
      setError(res.error?.message ?? 'Something went wrong');
    }
    setBusy(false);
  }

  function next(e: React.FormEvent) {
    e.preventDefault();
    if (!canContinue || busy) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else void finish();
  }

  if (result) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-zinc-100">
          {result.created ? 'You’re set up' : 'Your workspace is already set up'}
        </h1>
        {result.created && (
          <ul className="text-sm text-zinc-400 flex flex-col gap-1">
            <li>Workspace: <span className="text-zinc-200">{workspaceName.trim()}</span></li>
            <li>Project: <span className="text-zinc-200">{projectName.trim()}</span> ({projectPriority}), with Sprint 1</li>
            {result.mission_id && <li>Mission: <span className="text-zinc-200">{SAMPLE_MISSION.name}</span></li>}
          </ul>
        )}
        <Button onClick={() => { window.location.href = '/dashboard'; }}>Go to dashboard</Button>
      </Shell>
    );
  }

  return (
    <Shell>
      <ol className="flex gap-2 text-xs" aria-label="Setup progress">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? 'step' : undefined}
            className={`flex-1 border-t-2 pt-2 ${i <= step ? 'border-pink-500 text-zinc-200' : 'border-zinc-800 text-zinc-600'}`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <form onSubmit={next} className="flex flex-col gap-4">
        {step === 0 && (
          <>
            <Heading title="Name your workspace" hint="Your projects, plans and reviews live here. You can rename it later." />
            <Input
              autoFocus
              aria-label="Workspace name"
              placeholder="e.g. Acme Studio"
              maxLength={255}
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />
          </>
        )}

        {step === 1 && (
          <>
            <Heading title="What are you working on first?" hint="One project to start. Add more anytime." />
            <Input
              autoFocus
              aria-label="Project name"
              placeholder="e.g. Launch the new website"
              maxLength={255}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <div className="flex gap-2" role="radiogroup" aria-label="Priority">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  role="radio"
                  aria-checked={projectPriority === p.value}
                  onClick={() => setProjectPriority(p.value)}
                  className={`flex-1 px-3 py-2 rounded-md text-xs border transition-colors ${
                    projectPriority === p.value
                      ? 'border-pink-500 text-zinc-100 bg-pink-500/10'
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Heading title="Start with a sample mission" hint="A short guided mission that walks you through IcyOS. Delete it whenever you like." />
            <div className={`rounded-md border p-4 ${includeSampleMission ? 'border-zinc-700' : 'border-zinc-800 opacity-50'}`}>
              <span className="text-sm font-semibold text-zinc-100">{SAMPLE_MISSION.name}</span>
              <ol className="mt-2 flex flex-col gap-1 text-sm text-zinc-400 list-decimal list-inside">
                {SAMPLE_MISSION.actions.map((action) => <li key={action}>{action}</li>)}
              </ol>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input type="checkbox" checked={includeSampleMission} onChange={(e) => setIncludeSampleMission(e.target.checked)} />
              Add this mission to {projectName.trim() || 'my project'}
            </label>
          </>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-between gap-2">
          <Button type="button" variant="secondary" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}>
            Back
          </Button>
          <Button type="submit" disabled={!canContinue || busy}>
            {step < STEPS.length - 1 ? 'Continue' : busy ? 'Setting up…' : 'Finish setup'}
          </Button>
        </div>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md flex flex-col gap-6">{children}</Card>
    </div>
  );
}

function Heading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-bold text-zinc-100">{title}</h1>
      <p className="text-sm text-zinc-500">{hint}</p>
    </div>
  );
}
