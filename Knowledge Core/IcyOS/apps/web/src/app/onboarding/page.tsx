'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Rocket, AlertCircle } from 'lucide-react';
import { CornerBrackets, TacButton } from '../../components/dashboard/hud';
import { apiFetch } from '../../lib/api/client';
import { SAMPLE_MISSION, type OnboardingResult } from '../../lib/onboarding/first-run';

type Priority = 'P1' | 'P2' | 'P3';

const pad = (n: number) => String(n).padStart(2, '0');
const STEPS = ['WORKSPACE', 'FIRST PROJECT', 'SAMPLE MISSION'] as const;

const PRIORITIES: { value: Priority; label: string; tag: string; color: string }[] = [
  { value: 'P1', label: 'P1', tag: 'URGENT', color: '#ef4444' },
  { value: 'P2', label: 'P2', tag: 'IMPORTANT', color: '#c9a84c' },
  { value: 'P3', label: 'P3', tag: 'SOMEDAY', color: '#6b6e7a' },
];

const FIELD =
  'w-full px-4 min-h-[46px] bg-[#08090e] border border-[#1e2030] rounded-md text-[15px] text-[#e0dcd2] placeholder:text-[#4a4d5a] focus:outline-none focus:border-[#c9a84c]/50 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.08)] transition-colors';

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
      <Shell eyebrow="INITIALIZATION COMPLETE">
        <div className="flex flex-col items-center gap-5 py-2 text-center">
          <span className="w-16 h-16 rounded-full flex items-center justify-center text-emerald-300 hud-pulse-green" style={{ background: 'rgba(52,211,153,0.1)', boxShadow: 'inset 0 0 0 1px rgba(52,211,153,0.4), 0 0 30px rgba(52,211,153,0.15)' }}>
            <Check size={26} />
          </span>
          <h1 className="text-2xl font-semibold text-[#ece8de]" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.9rem' }}>
            {result.created ? 'You’re set up' : 'Workspace already online'}
          </h1>
          {result.created && (
            <ul className="w-full flex flex-col rounded-md overflow-hidden border border-[#1e2030] text-left">
              <Row label="WORKSPACE" value={workspaceName.trim()} />
              <Row label="PROJECT" value={`${projectName.trim()} · ${projectPriority} · Sprint 1`} />
              {result.mission_id && <Row label="MISSION" value={SAMPLE_MISSION.name} />}
            </ul>
          )}
          <TacButton onClick={() => { window.location.href = '/dashboard'; }} className="w-full">
            <Rocket size={13} /> ENTER OPERATIONS CENTER
          </TacButton>
        </div>
      </Shell>
    );
  }

  return (
    <Shell eyebrow={`SETUP · STEP ${pad(step + 1)} OF ${pad(STEPS.length)}`}>
      <ol className="flex gap-2" aria-label="Setup progress">
        {STEPS.map((label, i) => {
          const done = i < step;
          const on = i === step;
          return (
            <li key={label} aria-current={on ? 'step' : undefined} className="flex-1 flex flex-col gap-2">
              <span className="h-[3px] rounded-sm transition-all" style={{ background: done || on ? '#c9a84c' : '#1e2030', boxShadow: on ? '0 0 8px rgba(201,168,76,0.6)' : 'none', opacity: done ? 0.6 : 1 }} />
              <span className="font-tactical text-[9px] tracking-[0.16em]" style={{ color: on ? '#c9a84c' : done ? '#8a8d9a' : '#4a4d5a' }}>
                {pad(i + 1)} {label}
              </span>
            </li>
          );
        })}
      </ol>

      <form onSubmit={next} className="flex flex-col gap-5">
        {step === 0 && (
          <>
            <Heading title="Name your workspace" hint="Your projects, plans and reviews live here. You can rename it later." />
            <input
              autoFocus
              aria-label="Workspace name"
              placeholder="e.g. Brilliantaire HQ"
              maxLength={255}
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className={FIELD}
            />
          </>
        )}

        {step === 1 && (
          <>
            <Heading title="What are you working on first?" hint="One project to start. Add more anytime." />
            <input
              autoFocus
              aria-label="Project name"
              placeholder="e.g. Launch the new website"
              maxLength={255}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className={FIELD}
            />
            <div className="flex flex-col gap-1.5">
              <span className="font-tactical text-[8px] tracking-[0.2em] text-[#4a4d5a]">PRIORITY</span>
              <div className="flex gap-2" role="radiogroup" aria-label="Priority">
                {PRIORITIES.map((p) => {
                  const on = projectPriority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setProjectPriority(p.value)}
                      className="font-tactical flex-1 flex items-center justify-center gap-2 min-h-[42px] rounded-md text-[11px] tracking-[0.12em] font-semibold transition-all"
                      style={{ color: on ? p.color : '#6b6e7a', background: on ? `${p.color}14` : 'transparent', boxShadow: on ? `inset 0 0 0 1px ${p.color}88` : 'inset 0 0 0 1px #1e2030' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: on ? p.color : '#2a2d3a', boxShadow: on ? `0 0 6px ${p.color}` : 'none' }} />
                      {p.label} <span className="text-[9px] opacity-70">{p.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Heading title="Start with a sample mission" hint="A short guided mission that walks you through IcyOS. Delete it whenever you like." />
            <div
              className="relative rounded-md overflow-hidden px-4 py-3.5 transition-all"
              style={{
                background: 'linear-gradient(160deg, #0f1017 0%, #0a0b10 100%)',
                border: `1px solid ${includeSampleMission ? 'rgba(201,168,76,0.3)' : '#1e2030'}`,
                opacity: includeSampleMission ? 1 : 0.5,
              }}
            >
              {includeSampleMission && <CornerBrackets color="rgba(201,168,76,0.5)" size={10} />}
              <div className="flex items-center gap-2 font-tactical text-[9px] tracking-[0.16em] text-[#4a4d5a] mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" style={{ boxShadow: '0 0 6px rgba(201,168,76,0.6)' }} />
                M-01 · {pad(SAMPLE_MISSION.actions.length)} STEPS
              </div>
              <span className="text-[15px] font-semibold text-[#e0dcd2]">{SAMPLE_MISSION.name}</span>
              <ol className="mt-2.5 flex flex-col">
                {SAMPLE_MISSION.actions.map((action, i) => (
                  <li key={action} className={`flex items-center gap-3 py-1.5 text-[13px] text-[#b8b4ac] ${i > 0 ? 'border-t border-[#1e2030]/50' : ''}`}>
                    <span className="w-4 h-4 rounded-full border border-[#2a2d3a] shrink-0" />
                    {action}
                  </li>
                ))}
              </ol>
            </div>
            <label className="flex items-center gap-3 text-[13.5px] text-[#b8b4ac] cursor-pointer">
              <input type="checkbox" className="tac-check" checked={includeSampleMission} onChange={(e) => setIncludeSampleMission(e.target.checked)} />
              Add this mission to <span className="text-[#e0dcd2] font-semibold">{projectName.trim() || 'my project'}</span>
            </label>
          </>
        )}

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/5 border border-red-500/20 rounded-md">
            <AlertCircle size={13} className="text-red-400 shrink-0" />
            <p className="text-[13px] text-red-300">{error}</p>
          </div>
        )}

        <div className="flex justify-between gap-2 pt-3 border-t border-[#1e2030]">
          <TacButton type="button" variant="ghost" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}>
            <ArrowLeft size={12} /> BACK
          </TacButton>
          <TacButton type="submit" disabled={!canContinue || busy}>
            {step < STEPS.length - 1 ? <>CONTINUE <ArrowRight size={12} /></> : busy ? 'INITIALIZING…' : <><Rocket size={12} /> FINISH SETUP</>}
          </TacButton>
        </div>
      </form>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1e2030]/60 last:border-b-0 bg-[#0a0b10]">
      <span className="font-tactical text-[8px] tracking-[0.2em] text-[#4a4d5a] w-20 shrink-0">{label}</span>
      <span className="text-[13.5px] text-[#e0dcd2] truncate">{value}</span>
    </li>
  );
}

function Shell({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08090e] p-4 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(201,168,76,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.045) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 10%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 10%, transparent 75%)',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 40% 40% at 50% 45%, rgba(201,168,76,0.08), transparent 70%)' }} />
      <div
        className="relative w-full max-w-md flex flex-col gap-6 rounded-lg overflow-hidden px-7 py-7"
        style={{
          background: 'linear-gradient(180deg, #11121a 0%, #0b0c12 100%)',
          border: '1px solid #1e2030',
          boxShadow: '0 0 0 1px rgba(201,168,76,0.05), 0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,168,76,0.08)',
        }}
      >
        <CornerBrackets color="rgba(201,168,76,0.55)" size={18} />
        <span aria-hidden className="absolute top-0 left-10 right-10 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)' }} />
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-[#c9a84c] uppercase tracking-widest" style={{ fontFamily: "'Cormorant Garamond', serif" }}>IcyOS</span>
          <span className="font-tactical text-[9px] tracking-[0.2em] text-[#4a4d5a]">{eyebrow}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function Heading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-[1.6rem] font-semibold text-[#ece8de] leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{title}</h1>
      <p className="text-[13px] text-[#8a8d9a]">{hint}</p>
    </div>
  );
}
