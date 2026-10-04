'use client';

import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';

interface EditableTextProps {
  value: string;
  /** Names the field for screen readers, e.g. "project name". */
  label: string;
  maxLength?: number;
  onSave: (next: string) => Promise<boolean>;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Text with a pencil button that turns it into an input. Enter or leaving the
 * field saves; Escape cancels. Unchanged or blank text is not saved.
 */
export function EditableText({ value, label, maxLength = 255, onSave, className = '', children }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  // Enter saves and disables the input, which can also fire blur; save once.
  const inFlight = useRef(false);

  useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);

  async function commit() {
    if (inFlight.current) return;
    const next = draft.trim();
    if (!next || next === value) {
      setEditing(false);
      setDraft(value);
      return;
    }
    inFlight.current = true;
    setSaving(true);
    const ok = await onSave(next);
    inFlight.current = false;
    setSaving(false);
    if (ok) setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={input}
        aria-label={`Edit ${label}`}
        value={draft}
        maxLength={maxLength}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void commit();
          } else if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="w-full min-w-0 px-2 py-0.5 bg-zinc-950 border border-pink-500 rounded text-zinc-100 focus:outline-none"
      />
    );
  }

  return (
    <span className={`group/edit inline-flex items-start gap-1.5 min-w-0 ${className}`}>
      {children ?? <span className="min-w-0 break-words">{value}</span>}
      <button
        type="button"
        aria-label={`Rename ${label}`}
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className="shrink-0 mt-0.5 text-zinc-500 hover:text-zinc-200 opacity-100 md:opacity-0 md:group-hover/edit:opacity-100 focus:opacity-100 transition-opacity"
      >
        <Pencil size={14} />
      </button>
    </span>
  );
}
