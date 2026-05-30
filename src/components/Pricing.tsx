import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Check } from 'lucide-react';

const PRICING_PLANS = [
  {
    name: 'Scout',
    price: '$0',
    frequency: 'forever',
    description: 'Autonomous skill scouting and directory workspace auditing.',
    features: [
      'Read-Only Obsidian Ingestion',
      '1,000 Voice Command Queue items/mo',
      'Basic Safe Command Routing',
      '1 Local Active Vault Sync',
      'Community Council Support'
    ],
    cta: 'Start Scouting',
    popular: false
  },
  {
    name: 'Brilliantier',
    price: '$49',
    frequency: 'month',
    description: 'Production automation loops, multi-agent council controls, and write-gateway access.',
    features: [
      'Approved Obsidian Write Gateway',
      'Unlimited Voice Command Dispatch',
      'Full Multi-Agent Council (7 roles)',
      'Simulate & Verify Mesh Telemetry',
      'Background Task Automation',
      'Priority Workspace Sandbox Support'
    ],
    cta: 'Upgrade to Brilliantier',
    popular: true
  },
  {
    name: 'Supernova',
    price: '$199',
    frequency: 'month',
    description: 'Enterprise mesh orchestration, sovereign intelligence vaults, and high-frequency checks.',
    features: [
      'Custom Multi-Agent Definitions',
      'Cross-Vault Bi-Directional Auto-Sync',
      'Real-time Stream Capturing Daemon',
      'Vite React Static Telemetry Dashboards',
      'Dedicated Sovereign Support Agent',
      'Custom CIP Path Allocations'
    ],
    cta: 'Deploy Supernova',
    popular: false
  }
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-background/50 border-t border-b border-border">
      {/* Background Gradient Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Simple, Sovereign Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No lock-in. No cloud API tracking. Local binaries operating on your own board.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {PRICING_PLANS.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative flex flex-col justify-between transition-all duration-300 ${
                plan.popular 
                  ? 'border-primary shadow-xl shadow-primary/5 bg-card/60 scale-[1.02]' 
                  : 'border-border bg-card/30 hover:border-muted-foreground/30'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-primary">
                  MOST POPULAR
                </div>
              )}

              <div>
                <CardHeader className="p-6 border-b border-border/30">
                  <CardTitle className="text-2xl font-bold tracking-tight text-foreground">{plan.name}</CardTitle>
                  <CardDescription className="mt-2 text-sm text-muted-foreground">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 text-foreground">
                    <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className="text-sm font-medium text-muted-foreground">/{plan.frequency}</span>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-4" aria-label={`Features of ${plan.name} plan`}>
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-sm text-muted-foreground leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </div>

              <CardFooter className="p-6 bg-transparent border-t border-border/30 mt-auto">
                <Button 
                  className="w-full h-11 text-sm font-semibold" 
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </CardFooter>

            </Card>
          ))}
        </div>

      </div>
    </section>
  );
}
