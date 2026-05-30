import React from 'react';
import { ShieldCheck, HardDrive, Terminal, FileText, ArrowRight, Eye, Radio, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

export default function Capabilities() {
  return (
    <section id="capabilities" className="py-24 relative overflow-hidden bg-background">
      {/* Visual background divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-secondary/5 blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Core Value Prop & Headline Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
            <Sparkles className="h-3 w-3" /> Core Capabilities
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            What Brilliantaire OS Does
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            An offline-first, local command console designed to synthesize creative ideas into structured files, securely staged and manually verified before execution.
          </p>
        </div>

        {/* 2-Column Capability Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start mb-20">
          
          {/* Left Column: Capabilities List */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Capability 1: Safe Command Router */}
            <div className="flex gap-4 p-6 rounded-2xl border border-border bg-card/25 hover:bg-card/40 transition-colors">
              <div className="bg-primary/10 text-primary p-3 rounded-xl h-fit">
                <Terminal className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-foreground">Safe Command Router</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Bypasses arbitrary shell runs. Spawns child processes using strict exact-name validation lists and strict CLI parameter structures, ensuring zero rogue processes can run.
                </p>
              </div>
            </div>

            {/* Capability 2: Campaign Engine */}
            <div className="flex gap-4 p-6 rounded-2xl border border-border bg-card/25 hover:bg-card/40 transition-colors">
              <div className="bg-secondary/10 text-secondary p-3 rounded-xl h-fit">
                <HardDrive className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-foreground">Campaign Engine</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Drafts local templates, schedules validation passes, and generates campaign files. Translates layout assets and copy specifications locally without cloud latency or third-party storage.
                </p>
              </div>
            </div>

            {/* Capability 3: Voice Queue Safety */}
            <div className="flex gap-4 p-6 rounded-2xl border border-border bg-card/25 hover:bg-card/40 transition-colors">
              <div className="bg-primary/10 text-primary p-3 rounded-xl h-fit">
                <Radio className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-foreground">Voice Queue Safety</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Stages vocal transcript inputs into a physical, local queue log. Actions are held in check until explicitly confirmed via voice approval gates before being dispatched to the router.
                </p>
              </div>
            </div>

            {/* Capability 4: Read-Only Dashboard & Manual Release */}
            <div className="flex gap-4 p-6 rounded-2xl border border-border bg-card/25 hover:bg-card/40 transition-colors">
              <div className="bg-secondary/10 text-secondary p-3 rounded-xl h-fit">
                <Eye className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-foreground">Read-Only Dashboard & Manual Release</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Displays live system status and process queues under strict read-only bounds. Releases are governed by a manual checklist flow requiring developer approval prior to file writes.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Trust/Safety Block + Call to Actions */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            
            {/* Trust and Safety Block */}
            <div className="border border-border bg-card/50 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
              {/* Light accent */}
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="text-lg font-bold tracking-tight text-foreground">Trust & Security Policy</h3>
              </div>
              
              <ul className="space-y-4 text-sm text-muted-foreground" aria-label="Security and Trust Features">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong>Local-First Architecture:</strong> Keeps your credentials, API keys, and workspace codes contained safely on your local device.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong>No Direct Social Posting:</strong> Zero auto-publishing APIs. You review and push all compiled visual assets manually.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong>Staging Boundaries:</strong> The system acts as a read-only portal for directory changes until write-gate clearance is granted.</span>
                </li>
              </ul>
              
              <div className="pt-4 border-t border-border/40">
                <a 
                  href="#blueprint" 
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group"
                >
                  <FileText className="h-3.5 w-3.5" /> Read the Blueprint (Tertiary CTA)
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>

            {/* Dynamic CTAs Box */}
            <div className="flex flex-col gap-4">
              <Button size="lg" className="h-12 w-full justify-between group bg-primary text-primary-foreground hover:bg-primary/95" asChild>
                <a href="#pricing">
                  <span>Enter the Command Center (Primary CTA)</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="h-12 w-full justify-between border-border hover:bg-muted/70 backdrop-blur-sm" asChild>
                <a href="#features">
                  <span>View Campaign System (Secondary CTA)</span>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </a>
              </Button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
