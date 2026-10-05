'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { Priority } from '@icyos/shared';

export const PRIORITY_LABELS: Record<Priority, string> = {
  P1: 'P1 · Urgent',
  P2: 'P2 · Important',
  P3: 'P3 · Someday',
};

export function PrioritySelect({
  value,
  onChange,
  label,
  disabled,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as Priority)}
      className="px-2 py-1 min-h-[44px] bg-[#0e0f16] border border-[#1e2030] rounded-xl text-xs text-[#b8b4ac] focus:outline-none focus:border-[#c9a84c]/40"
    >
      {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
        <option key={p} value={p}>
          {PRIORITY_LABELS[p]}
        </option>
      ))}
    </select>
  );
}

/** One step per non-blank line, trimmed. */
export function parseSteps(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}

export function NewProjectForm({
  onCreate,
  onCancel,
}: {
  onCreate: (name: string, priority: Priority) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<Priority>('P2');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    const ok = await onCreate(name.trim(), priority);
    setBusy(false);
    if (ok) onCancel();
  }

  return (
    <Card>
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          autoFocus
          aria-label="New project name"
          placeholder="Project name"
          maxLength={255}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
        />
        <PrioritySelect value={priority} onChange={setPriority} label="New project priority" disabled={busy} />
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || busy}>
            {busy ? 'Adding…' : 'Add project'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function NewMissionForm({
  projectName,
  onCreate,
  onCancel,
}: {
  projectName: string;
  onCreate: (name: string, steps: string[]) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [steps, setSteps] = useState('');
  const [busy, setBusy] = useState(false);
  const stepList = parseSteps(steps);
  const tooMany = stepList.length > 50;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || tooMany || busy) return;
    setBusy(true);
    const ok = await onCreate(name.trim(), stepList);
    setBusy(false);
    if (ok) onCancel();
  }

  return (
    <Card>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input
          autoFocus
          aria-label={`New mission name in ${projectName}`}
          placeholder="Mission name"
          maxLength={255}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          aria-label="Steps, one per line"
          placeholder={'Steps, one per line (optional)\nWrite the outline\nBook a guest'}
          rows={4}
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          className="px-4 py-2 min-h-[44px] bg-[#0e0f16] border border-[#1e2030] rounded-xl text-base text-[#d0ccc4] focus:outline-none focus:border-[#c9a84c]/40"
        />
        {tooMany && <p className="text-xs text-red-400">A mission can have at most 50 steps.</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || tooMany || busy}>
            {busy ? 'Adding…' : 'Add mission'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function AddStepInput({ onAdd }: { onAdd: (text: string) => Promise<boolean> }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    const ok = await onAdd(text.trim());
    setBusy(false);
    if (ok) setText('');
  }

  return (
    <form onSubmit={submit}>
      <input
        aria-label="Add a step"
        placeholder="+ Add a step"
        maxLength={512}
        value={text}
        disabled={busy}
        onChange={(e) => setText(e.target.value)}
        className="w-full px-2 py-1 min-h-[44px] bg-transparent border border-transparent rounded-xl text-sm text-[#b8b4ac] placeholder:text-[#4a4d5a] hover:border-[#1e2030] focus:outline-none focus:border-[#c9a84c]/40"
      />
    </form>
  );
}
