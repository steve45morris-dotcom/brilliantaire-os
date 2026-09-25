import Link from 'next/link';
import { LEGAL, placeholdersIn } from '../../lib/legal/config';
import { documentText, type LegalDocument } from '../../lib/legal/content';

export function LegalDocumentPage({ doc }: { doc: LegalDocument }) {
  const missing = placeholdersIn(documentText(doc));

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-300 px-4 py-12">
      <article className="max-w-3xl mx-auto flex flex-col gap-6">
        {missing.length > 0 && (
          <div role="alert" className="rounded border border-amber-600/50 bg-amber-950/40 p-4 text-sm text-amber-200">
            Draft pending legal review. Unfilled: {missing.join(', ')}.
          </div>
        )}

        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{doc.title}</h1>
          <p className="text-sm text-zinc-500">Last updated {LEGAL.lastUpdated}</p>
        </header>

        <p className="leading-relaxed">{doc.intro}</p>

        {doc.sections.map((section) => (
          <section key={section.id} id={section.id} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-zinc-100">{section.heading}</h2>
            {section.blocks.map((block, i) =>
              typeof block === 'string' ? (
                <p key={i} className="leading-relaxed">{block}</p>
              ) : (
                <ul key={i} className="list-disc pl-6 flex flex-col gap-1.5 leading-relaxed">
                  {block.list.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )
            )}
          </section>
        ))}

        <footer className="border-t border-zinc-800 pt-6 text-sm text-zinc-500 flex gap-4">
          <Link href="/terms" className="hover:text-zinc-300">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-zinc-300">Privacy Policy</Link>
        </footer>
      </article>
    </main>
  );
}
