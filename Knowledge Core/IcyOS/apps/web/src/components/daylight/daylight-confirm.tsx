'use client';

import { useEffect, useId, useState } from 'react';
import type { PendingDelete } from '../dashboard/confirm-delete';
import s from './daylight.module.css';

/**
 * ConfirmDelete in the Daylight style: same contract (closes on success, stays
 * open on failure so the page can show the error), plus Escape to cancel and
 * focus starting on Cancel so Enter never deletes by accident.
 */
export function DaylightConfirm({ pending, onClose }: { pending: PendingDelete | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pending, busy, onClose]);

  if (!pending) return null;

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    const ok = await pending.run();
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <div className={s.scrim} onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={bodyId} className={`${s.card} ${s.dialog}`}>
        <h2 id={titleId} className={s.dialogTitle}>
          {pending.title}
        </h2>
        <p id={bodyId} className={s.dialogBody}>
          {pending.message}
        </p>
        <div className={s.btnRow} style={{ justifyContent: 'flex-end' }}>
          <button type="button" autoFocus className={s.btn} disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={`${s.btn} ${s.btnOx}`} data-snd="low" disabled={busy} onClick={() => void confirm()}>
            {busy ? 'Working…' : pending.confirmLabel ?? 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
