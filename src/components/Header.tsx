import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Icon } from '@iconify/react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg text-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Brilliantaire<span className="text-primary font-light">.OS</span>
            </span>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
          </nav>

          {/* CTA Button */}
          <div className="flex items-center gap-4">
            <a 
              href="#pricing" 
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Get Started"
            >
              Get Started
            </a>
            
            {/* Mobile Menu Icon */}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-md hover:bg-muted text-foreground flex items-center justify-center"
              aria-expanded={isOpen}
              aria-controls="mobile-nav"
              aria-label="Toggle mobile menu"
            >
              <Icon icon={isOpen ? "lucide:x" : "lucide:menu"} className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div id="mobile-nav" className="md:hidden border-t border-border bg-background/95 backdrop-blur-md px-4 py-4 space-y-3 transition-transform duration-200">
          <nav className="flex flex-col gap-3" aria-label="Mobile Navigation">
            <a 
              href="#features" 
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-muted/50"
            >
              Features
            </a>
            <a 
              href="#pricing" 
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-muted/50"
            >
              Pricing
            </a>
            <a 
              href="#testimonials" 
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-muted/50"
            >
              Testimonials
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
