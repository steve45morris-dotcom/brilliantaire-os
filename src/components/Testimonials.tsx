import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const TESTIMONIALS_DATA = [
  {
    name: 'Icyflamze',
    role: 'Founder & Artist',
    company: 'Tree Groove Records',
    quote: 'Brilliantier OS is a beast. The Voice Narrative Bridge tells me what my automated build runner is doing in the studio so I can stay in the creative zone.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'
  },
  {
    name: 'Steve Morris',
    role: 'Principal Engineer',
    company: 'NovaLabs',
    quote: 'Running Obsidian write operations was always risky. The safe command router and approval gateway gives us 100% confidence to sync notes safely.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80'
  },
  {
    name: 'Amara Koko',
    role: 'Lead Architect',
    company: 'Area Boy Studio',
    quote: 'Tailwind CSS v4 + DaisyUI in Astro is blazing fast. The Lighthouse score is a solid 100. Best workflow setup I have ever used.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80'
  }
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  const handleNext = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % TESTIMONIALS_DATA.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + TESTIMONIALS_DATA.length) % TESTIMONIALS_DATA.length);
  };

  const active = TESTIMONIALS_DATA[index];

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Section Header */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Vouched by Creators
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See how lead designers and engineers operate with complete sovereignty.
          </p>
        </div>

        {/* Carousel Card Container */}
        <div className="relative min-h-[350px] flex items-center justify-center">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={index}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full bg-card/40 backdrop-blur-sm border border-border p-8 sm:p-12 rounded-3xl relative flex flex-col items-center justify-center shadow-lg"
            >
              {/* Quote Mark Decoration */}
              <Quote className="absolute top-8 left-8 h-12 w-12 text-primary/10 rotate-180 pointer-events-none" />

              {/* Rating stars */}
              <div className="flex items-center gap-1 text-yellow-500 mb-6" aria-label={`Rating: ${active.rating} out of 5 stars`}>
                {Array.from({ length: active.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>

              {/* Testimonial Quote */}
              <blockquote className="text-lg sm:text-2xl text-foreground font-medium leading-relaxed max-w-2xl">
                "{active.quote}"
              </blockquote>

              {/* Creator details */}
              <div className="flex items-center gap-4 mt-8">
                <img 
                  src={active.avatar} 
                  alt={active.name} 
                  loading="lazy"
                  decoding="async"
                  className="w-12 h-12 rounded-full object-cover border border-border shadow-md"
                />
                <div className="text-left">
                  <div className="text-sm font-bold text-foreground">{active.name}</div>
                  <div className="text-xs text-muted-foreground">{active.role} • {active.company}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex items-center justify-between pointer-events-none px-4 sm:px-0 sm:-mx-12">
            <button 
              onClick={handlePrev} 
              className="pointer-events-auto h-12 w-12 rounded-full border border-border bg-card/60 backdrop-blur-md text-foreground flex items-center justify-center shadow hover:bg-muted transition-colors"
              aria-label="Previous Testimonial"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button 
              onClick={handleNext} 
              className="pointer-events-auto h-12 w-12 rounded-full border border-border bg-card/60 backdrop-blur-md text-foreground flex items-center justify-center shadow hover:bg-muted transition-colors"
              aria-label="Next Testimonial"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Bullet Indicator dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {TESTIMONIALS_DATA.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => { setDirection(idx > index ? 1 : -1); setIndex(idx); }}
              className={`h-2.5 rounded-full transition-all duration-300 ${idx === index ? 'w-8 bg-primary' : 'w-2.5 bg-border hover:bg-muted-foreground'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
