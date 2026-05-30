import React from 'react';
import { Sparkles } from 'lucide-react';
import { Icon } from '@iconify/react';

export default function Footer() {
  return (
    <footer className="bg-card/30 border-t border-border py-16" role="contentinfo" aria-label="Site Footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Footer Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg text-primary flex items-center justify-center">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Brilliantaire<span className="text-primary font-light">.OS</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              Sovereign developer tooling under the One System mesh protocol. We build before burning. Local control, zero cloud lock-in.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub Profile">
                <Icon icon="mdi:github" className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter Profile">
                <Icon icon="mdi:twitter" className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Discord Server">
                <Icon icon="mdi:discord" className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Group 1 */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wider text-foreground uppercase">Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security Gates</a></li>
            </ul>
          </div>

          {/* Links Group 2 */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wider text-foreground uppercase">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About Us</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sovereignty Stack</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Lagos Studio</a></li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wider text-foreground uppercase">Join the Movement</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sign up for the latest release logs and telemetry brief snapshots.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input 
                id="footer-email" 
                type="email" 
                placeholder="Enter your email" 
                required 
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-ring"
              />
              <button 
                type="submit" 
                className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold shadow hover:bg-primary/95 transition-colors"
                aria-label="Subscribe to newsletter"
              >
                Join
              </button>
            </form>
          </div>

        </div>

        {/* Footer Bottom Banner */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Brilliantaire.OS. All rights reserved. Created in Lagos, Nigeria.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Sovereignty Rules</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
