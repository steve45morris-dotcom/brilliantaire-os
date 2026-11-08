'use client';

import { useEffect, useRef, useState } from 'react';
import s from './daylight.module.css';

interface InlineEditProps {
  value: string;
  label: string;
  editing: boolean;
  onDone: () => void;
  onSave: (next: string) => Promise<boolean>;
  maxLength?: number;
  children: React.ReactNode;
}

/**
 * Same save rules as EditableText (trim, skip unchanged, Enter saves, Escape cancels,
 * stay open on a failed save), but the caller owns the Rename trigger so the
 * Daylight layout can show it as a labelled button.
 */
export function InlineEdit({ value, label, editing, onDone, onSave, maxLength = 255, children }: InlineEditProps) {
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      requestAnimationFrame(() => input.current?.select());
    }
  }, [editing, value]);

  async function commit() {
    if (inFlight.current) return;
    const next = draft.trim();
    if (!next || next === value) {
      onDone();
      return;
    }
    inFlight.current = true;
    setSaving(true);
    const ok = await onSave(next);
    inFlight.current = false;
    setSaving(false);
    if (ok) onDone();
  }

  if (!editing) return <>{children}</>;

  return (
    <input
      ref={input}
      aria-label={`Edit ${label}`}
      value={draft}
      maxLength={maxLength}
      disabled={saving}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          void commit();
        } else if (e.key === 'Escape') {
          setDraft(value);
          onDone();
        }
      }}
      className={s.editInput}
    />
  );
}
