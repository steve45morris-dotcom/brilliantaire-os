'use client';

import { useCallback, useEffect, useState } from 'react';
import { Shield, FileText, ScrollText, Scale, AlertCircle, RefreshCw, Mail } from 'lucide-react';
import { Backdrop, CornerBrackets, PageHeader, SectionLabel, TacButton } from '../../../components/dashboard/hud';
import { apiFetch } from '../../../lib/api/client';

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

interface LegalDocument {
  id: string;
  title: string;
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  sections: { heading: string; content: string }[];
}

interface LegalSnapshot {
  documents: LegalDocument[];
  companyName: string;
  jurisdiction: string;
  contactEmail: string;
}

const docIcons: Record<string, typeof Shield> = {
  tos: Shield,
  privacy: FileText,
  aup: ScrollText,
};

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(180deg, #11121a 0%, #0b0c12 100%)',
        border: '1px solid #1e2030',
        boxShadow: '0 0 0 1px rgba(201,168,76,0.05), 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,168,76,0.08)',
      }}
    >
      <CornerBrackets color="rgba(201,168,76,0.55)" size={18} />
      <span aria-hidden className="absolute top-0 left-10 right-10 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)' }} />
      {children}
    </div>
  );
}

export default function LegalPage() {
  const [snapshot, setSnapshot] = useState<LegalSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDocId, setActiveDocId] = useState<string>('tos');

  const load = useCallback(async () => {
    const res = await apiFetch<LegalSnapshot>('/api/legal');
    if (res.success && res.data) {
      setSnapshot(res.data);
      setError(null);
    } else {
      setError(res.error?.message ?? 'Could not load legal documents');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeDoc = snapshot ? snapshot.documents.find((d) => d.id === activeDocId) ?? snapshot.documents[0] : null;
  const DocIcon = activeDoc ? docIcons[activeDoc.id] ?? Scale : Scale;

  return (
    <div className="relative flex flex-col gap-5 max-w-4xl">
      <Backdrop />

      <PageHeader
        eyebrow="GOVERNANCE"
        title="Legal & Compliance"
        aside={snapshot && <span className="font-tactical text-[10px] tracking-[0.2em] text-[#2f3240] hidden sm:block">{pad(snapshot.documents.length)} DOCUMENTS · {snapshot.jurisdiction.toUpperCase()}</span>}
      />
      <p className="text-sm text-[#8a8d9a] -mt-2">Review our terms, policies, and compliance documentation.</p>

      {loading && <span className="font-tactical text-[10px] tracking-[0.3em] text-[#4a4d5a]">// RETRIEVING</span>}

      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-lg">
          <span className="flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </span>
          <TacButton variant="ghost" onClick={() => { setLoading(true); void load(); }}>
            <RefreshCw size={12} /> RETRY
          </TacButton>
        </div>
      )}

      {snapshot && activeDoc && (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-md border border-[#1e2030] bg-[#08090e] w-fit max-w-full overflow-x-auto">
            {snapshot.documents.map((doc, i) => {
              const Icon = docIcons[doc.id] ?? Scale;
              const on = doc.id === activeDoc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setActiveDocId(doc.id)}
                  className="font-tactical shrink-0 px-3 py-2 rounded-[4px] text-[10px] tracking-[0.14em] font-semibold flex items-center gap-2 transition-all min-h-[36px]"
                  style={{ color: on ? '#c9a84c' : '#6b6e7a', background: on ? 'rgba(201,168,76,0.10)' : 'transparent', boxShadow: on ? 'inset 0 0 0 1px rgba(201,168,76,0.3)' : 'none' }}
                >
                  <Icon size={12} />
                  <span className="text-[#4a4d5a]">D-{pad(i + 1)}</span>
                  {doc.title.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Document */}
          <Panel>
            <div className="flex items-start gap-4 px-6 pt-5 pb-4 border-b border-[#1e2030]">
              <span className="w-11 h-11 shrink-0 rounded-md flex items-center justify-center text-[#c9a84c]" style={{ background: 'rgba(201,168,76,0.08)', boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.25)' }}>
                <DocIcon size={20} />
              </span>
              <div className="flex flex-col gap-1.5 min-w-0">
                <h2 className="text-[22px] font-semibold text-[#ece8de] leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{activeDoc.title}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-tactical text-[9px] tracking-[0.14em] text-[#4a4d5a]">
                  <span className="px-1.5 py-[2px] rounded-[3px] text-[#c9a84c]" style={{ background: 'rgba(201,168,76,0.1)', boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.3)' }}>V{activeDoc.version}</span>
                  <span>EFFECTIVE <span className="text-[#8a8d9a]">{fmt(activeDoc.effectiveDate)}</span></span>
                  <span>UPDATED <span className="text-[#8a8d9a]">{fmt(activeDoc.lastUpdated)}</span></span>
                  <span>{pad(activeDoc.sections.length)} SECTIONS</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col px-6 py-2">
              {activeDoc.sections.map((section, index) => (
                <section key={index} className={`flex gap-5 py-5 ${index > 0 ? 'border-t border-[#1e2030]/60' : ''}`}>
                  <span className="font-tactical text-[10px] tracking-[0.16em] text-[#4a4d5a] w-8 shrink-0 pt-1">§{pad(index + 1)}</span>
                  <div className="flex flex-col gap-2 min-w-0">
                    <h3 className="font-tactical text-[10px] tracking-[0.2em] text-[#c9a84c]">{section.heading.toUpperCase()}</h3>
                    <p className="text-[14px] text-[#b8b4ac] leading-relaxed">{section.content}</p>
                  </div>
                </section>
              ))}
            </div>
          </Panel>

          {/* Footer */}
          <SectionLabel>ENTITY</SectionLabel>
          <div className="relative flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-lg overflow-hidden" style={{ background: 'linear-gradient(160deg, #0f1017 0%, #0a0b10 100%)', border: '1px solid #1e2030' }}>
            <CornerBrackets color="rgba(201,168,76,0.3)" size={12} />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-tactical text-[10px] tracking-[0.14em] text-[#4a4d5a]">
              <span className="text-[#e0dcd2]">{snapshot.companyName.toUpperCase()}</span>
              <span>JURISDICTION <span className="text-[#8a8d9a]">{snapshot.jurisdiction.toUpperCase()}</span></span>
            </div>
            <a href={`mailto:${snapshot.contactEmail}`} className="font-tactical inline-flex items-center gap-1.5 text-[10px] tracking-[0.14em] text-[#c9a84c] hover:underline">
              <Mail size={11} /> {snapshot.contactEmail.toUpperCase()}
            </a>
          </div>
        </>
      )}
    </div>
  );
}
