import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Terminal, Shield, Cpu, RefreshCw, HardDrive, Radio } from 'lucide-react';

const FEATURES_DATA = [
  {
    icon: Terminal,
    title: 'Safe Command Router',
    description: 'Spawn child processes directly with strict confirmation gates and exact-name validation matching.'
  },
  {
    icon: Shield,
    title: 'Obsidian Staging Gate',
    description: 'Scan and sync local markdown vault snapshots in secure read-only mode, staging approvals prior to vault write operations.'
  },
  {
    icon: Cpu,
    title: 'Multi-Agent Council',
    description: 'Deploy 7 conceptual agents to enforce compliance, manage technical debt, and rank operational next actions.'
  },
  {
    icon: RefreshCw,
    title: 'Background Automation',
    description: 'Sequentially coordinate daily sanity checks, queue ingestion updates, and log sweeps via launchd wrappers.'
  },
  {
    icon: HardDrive,
    title: 'Decoupled Verification',
    description: 'Validate platform checklist items, whitelisted CTA structures, and grading metrics entirely local and offline.'
  },
  {
    icon: Radio,
    title: 'VibeVoice Transcripts',
    description: 'Ingest plain text speech commands, run length checks, and stage triggers into local confirmation holding logs.'
  }
];

export default function Features() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Register ScrollTrigger inside browser context
    gsap.registerPlugin(ScrollTrigger);

    if (containerRef.current) {
      // Fade in the section header
      gsap.fromTo(
        containerRef.current.querySelector('.section-header'),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          scrollTrigger: {
            trigger: containerRef.current.querySelector('.section-header'),
            start: 'top 85%',
            toggleActions: 'play none none none',
          }
        }
      );

      // Slide and fade in cards stagger-wise
      const activeCards = cardsRef.current.filter((c): c is HTMLDivElement => c !== null);
      gsap.fromTo(
        activeCards,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          scrollTrigger: {
            trigger: containerRef.current.querySelector('.features-grid'),
            start: 'top 80%',
            toggleActions: 'play none none none',
          }
        }
      );
    }
  }, []);

  return (
    <section id="features" ref={containerRef} className="py-24 relative overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="section-header text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Cybernetic Operational Leverage
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A sandboxed, offline control plane mapping automated code-building workflows to physical directory structures.
          </p>
        </div>

        {/* Features Grid */}
        <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES_DATA.map((feat, index) => {
            const IconComponent = feat.icon;
            return (
              <div
                key={index}
                ref={(el) => { cardsRef.current[index] = el; }}
                className="group relative flex flex-col p-8 rounded-2xl border border-border bg-card/40 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card/75 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Decorative border glow */}
                <div className="absolute inset-0 rounded-2xl border border-primary/0 group-hover:border-primary/20 transition-colors duration-300 pointer-events-none" />

                {/* Icon */}
                <div className="bg-primary/5 text-primary p-3 rounded-lg w-fit group-hover:bg-primary/10 transition-colors">
                  <IconComponent className="h-6 w-6" aria-hidden="true" />
                </div>

                {/* Content */}
                <h3 className="mt-6 text-xl font-bold tracking-tight text-foreground">
                  {feat.title}
                </h3>
                <p className="mt-3 text-muted-foreground text-sm leading-relaxed flex-grow">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
