import React from 'react';
import { ArrowRight, Sparkles, FileText, LayoutGrid } from 'lucide-react';
import { Button } from './ui/button';

export default function FinalCTA() {
  return (
    <section id="final-cta" className="py-24 relative overflow-hidden bg-background">
      {/* Decorative gradient blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(var(--border)/0.25)_1px,transparent_1px),linear-gradient(to_bottom,oklch(var(--border)/0.25)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Glow panel box */}
        <div className="relative rounded-3xl border border-border/80 bg-card/45 backdrop-blur-md p-10 sm:p-16 overflow-hidden shadow-2xl space-y-8">
          {/* Subtle light strip accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1 bg-primary/15 text-primary text-xs font-bold uppercase tracking-widest px-3.5 py-1 rounded-full border border-primary/25">
              <Sparkles className="h-3.5 w-3.5" /> Initialize Control Plane
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Ready to Command <br className="hidden sm:inline" />
              Your Workspace?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Deploy Brilliantaire OS locally on your machine today. Zero subscriptions, zero user tracking, and full automated leverage over your creative files.
            </p>
          </div>

          {/* Triple Call-to-Action Buttons Container */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto pt-4">
            
            {/* Primary CTA */}
            <Button size="lg" className="w-full sm:w-auto h-12 px-6 gap-2 text-base font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shadow-[0_0_20px_rgba(var(--color-primary),0.35)] transition-all duration-300 group" asChild>
              <a href="#pricing">
                Enter the Command Center
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            
            {/* Secondary CTA */}
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-6 gap-2 text-base font-semibold border-border hover:bg-muted/80 backdrop-blur-sm group" asChild>
              <a href="#capabilities">
                <LayoutGrid className="h-4 w-4 text-primary" />
                View Campaign System
              </a>
            </Button>
            
          </div>

          {/* Tertiary CTA Link */}
          <div className="pt-4 border-t border-border/30 max-w-xs mx-auto text-center">
            <a 
              id="blueprint"
              href="#blueprint-doc" 
              className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              <FileText className="h-4 w-4 text-primary" />
              <span>Read the Blueprint Docs</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}
