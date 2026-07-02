'use client';

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Spinner } from "../components/ui/spinner";
import { useState } from "react";
import { Modal } from "../components/ui/modal";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="min-h-screen p-8 flex flex-col gap-6 max-w-3xl mx-auto justify-center">
      <Card className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-zinc-100">IcyOS Core Foundation</h1>
          <Badge>v1.0.0</Badge>
        </div>
        <p className="text-sm text-zinc-400">
          Tailwind configurations, global CSS, and primitive UI design tokens active.
        </p>
        <div className="flex gap-3 items-center mt-2">
          <Input placeholder="Enter command payload..." />
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
        </div>
        <div className="flex gap-2 items-center text-xs text-zinc-500">
          <Spinner />
          <span>Synchronizing memory buffers...</span>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="System Briefing">
        <p className="text-sm text-zinc-400 mb-4">
          Core UI foundation parameters are compiled successfully. Ready for full dashboard sprint.
        </p>
        <Button variant="secondary" onClick={() => setModalOpen(false)}>Close</Button>
      </Modal>
    </main>
  );
}
