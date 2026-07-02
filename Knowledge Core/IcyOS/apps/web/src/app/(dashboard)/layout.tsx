'use client';

import { Sidebar } from '../../components/layout/sidebar';
import { TopNav } from '../../components/layout/top-nav';
import { BottomNav } from '../../components/layout/bottom-nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <TopNav />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
