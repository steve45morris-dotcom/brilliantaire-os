import Link from 'next/link';
import { LEGAL, placeholdersIn } from '../../lib/legal/config';
import { documentText, type LegalDocument } from '../../lib/legal/content';

const pad = (n: number) => String(n).padStart(2, '0');

export function LegalDocumentPage({ doc }: { doc: LegalDocument }) {
  const missing = placeholdersIn(documentText(doc));

  return (
    <main className="min-h-screen bg-[#08090e] text-[#b8b4ac] px-4 py-12 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 60% 40% at 50% 0%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 40% at 50% 0%, black 20%, transparent 80%)',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 30% at 50% 0%, rgba(201,168,76,0.08), transparent 70%)' }} />

      <article className="relative max-w-3xl mx-auto flex flex-col gap-6">
        {missing.length > 0 && (
          <div role="alert" className="relative rounded-lg px-4 py-3 font-tactical text-[10px] tracking-[0.14em] text-amber-200 overflow-hidden" style={{ background: 'linear-gradient(160deg, rgba(245,158,11,0.07), transparent)', border: '1px solid rgba(245,158,11,0.35)' }}>
            DRAFT · PENDING LEGAL REVIEW · UNFILLED: {missing.join(', ').toUpperCase()}
          </div>
        )}

        <header className="flex flex-col gap-2">
          <span className="font-tactical text-[10px] tracking-[0.3em] text-[#6b6e7a]">
            <span className="text-[#c9a84c]">//</span> LEGAL
          </span>
          <h1
            className="text-4xl font-bold tracking-tight leading-none"
            style={{ fontFamily: "'Cormorant Garamond', serif", background: 'linear-gradient(135deg, #e8e4da 0%, #c9a84c 70%, #a8872e 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            {doc.title}
          </h1>
          <p className="font-tactical text-[10px] tracking-[0.16em] text-[#4a4d5a]">LAST UPDATED <span className="text-[#8a8d9a]">{LEGAL.lastUpdated}</span></p>
        </header>

        <p className="text-[15px] leading-relaxed text-[#d0ccc4]">{doc.intro}</p>

        <div className="flex flex-col rounded-lg overflow-hidden" style={{ background: 'linear-gradient(180deg, #11121a 0%, #0b0c12 100%)', border: '1px solid #1e2030', boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,168,76,0.08)' }}>
          {doc.sections.map((section, idx) => (
            <section key={section.id} id={section.id} className={`flex gap-5 px-6 py-5 scroll-mt-6 ${idx > 0 ? 'border-t border-[#1e2030]/60' : ''}`}>
              <span className="font-tactical text-[10px] tracking-[0.16em] text-[#4a4d5a] w-8 shrink-0 pt-1">§{pad(idx + 1)}</span>
              <div className="flex flex-col gap-3 min-w-0">
                <h2 className="font-tactical text-[10px] tracking-[0.2em] text-[#c9a84c]">{section.heading.toUpperCase()}</h2>
                {section.blocks.map((block, i) =>
                  typeof block === 'string' ? (
                    <p key={i} className="text-[14px] leading-relaxed text-[#b8b4ac]">{block}</p>
                  ) : (
                    <ul key={i} className="flex flex-col gap-1.5 text-[14px] leading-relaxed text-[#b8b4ac]">
                      {block.list.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]/60 shrink-0 mt-2" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        <footer className="border-t border-[#1e2030] pt-5 font-tactical text-[10px] tracking-[0.16em] text-[#4a4d5a] flex gap-5">
          <Link href="/terms" className="hover:text-[#c9a84c] transition-colors">TERMS OF SERVICE</Link>
          <Link href="/privacy" className="hover:text-[#c9a84c] transition-colors">PRIVACY POLICY</Link>
        </footer>
      </article>
    </main>
  );
}
