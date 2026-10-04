'use client';

import { useCallback, useEffect, useState } from 'react';
import { Shield, FileText, ScrollText, Scale } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/ui/spinner';
import { apiFetch } from '../../../lib/api/client';

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner />
        <p className="text-sm text-zinc-500">Loading legal documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Legal &amp; Compliance</h1>
        <Card>
          <p className="text-sm text-red-400">{error}</p>
          <Button variant="secondary" onClick={() => { setLoading(true); void load(); }} className="mt-4">Retry</Button>
        </Card>
      </div>
    );
  }

  if (!snapshot) return null;

  const activeDoc = snapshot.documents.find((d) => d.id === activeDocId) ?? snapshot.documents[0];
  const DocIcon = docIcons[activeDoc.id] ?? Scale;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Legal &amp; Compliance</h1>
        <p className="text-zinc-500 text-sm">Review our terms, policies, and compliance documentation</p>
      </div>

      {/* Document Selector Tabs */}
      <div className="flex gap-2">
        {snapshot.documents.map((doc) => {
          const Icon = docIcons[doc.id] ?? Scale;
          const isActive = doc.id === activeDocId;
          return (
            <Button
              key={doc.id}
              variant={isActive ? 'primary' : 'secondary'}
              onClick={() => setActiveDocId(doc.id)}
              className={isActive ? 'bg-pink-600 hover:bg-pink-700 text-white' : ''}
            >
              <Icon size={16} />
              <span className="ml-2">{doc.title}</span>
            </Button>
          );
        })}
      </div>

      {/* Document Header */}
      <Card>
        <div className="flex items-center gap-4">
          <DocIcon size={24} className="text-pink-500" />
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">{activeDoc.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-medium bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                v{activeDoc.version}
              </span>
              <span className="text-xs text-zinc-500">
                Effective: {new Date(activeDoc.effectiveDate).toLocaleDateString()}
              </span>
              <span className="text-xs text-zinc-500">
                Updated: {new Date(activeDoc.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Document Sections */}
      <div className="space-y-4">
        {activeDoc.sections.map((section, index) => (
          <Card key={index}>
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-3">
              {section.heading}
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{section.content}</p>
          </Card>
        ))}
      </div>

      {/* Company Info Footer */}
      <Card>
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span>{snapshot.companyName}</span>
            <span className="text-zinc-700">|</span>
            <span>Jurisdiction: {snapshot.jurisdiction}</span>
          </div>
          <a
            href={`mailto:${snapshot.contactEmail}`}
            className="text-cyan-500 hover:text-cyan-400 transition-colors"
          >
            {snapshot.contactEmail}
          </a>
        </div>
      </Card>
    </div>
  );
}
