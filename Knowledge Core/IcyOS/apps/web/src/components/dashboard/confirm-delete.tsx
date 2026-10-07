'use client';

import { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';

export interface PendingDelete {
  title: string;
  message: string;
  run: () => Promise<boolean>;
  /** Button text; "Delete" by default. */
  confirmLabel?: string;
}

/** Asks before deleting. Closes on success; stays open (the page shows the error) on failure. */
export function ConfirmDelete({ pending, onClose }: { pending: PendingDelete | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    const ok = await pending.run();
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal isOpen={pending !== null} onClose={() => !busy && onClose()} title={pending?.title ?? ''}>
      <p className="text-sm text-[#6b6e7a] mb-6">{pending?.message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" disabled={busy} onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" disabled={busy} onClick={confirm}>
          {busy ? 'Working…' : pending?.confirmLabel ?? 'Delete'}
        </Button>
      </div>
    </Modal>
  );
}
