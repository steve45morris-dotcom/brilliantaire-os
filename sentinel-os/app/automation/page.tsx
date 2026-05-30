import { LaunchAgentPanel } from "@/components/LaunchAgentPanel";
import { SchedulerPanel } from "@/components/SchedulerPanel";
import { BillingPanel } from "@/components/BillingPanel";
import { BroadcastPanel } from "@/components/BroadcastPanel";
import { OracleBidsPanel } from "@/components/OracleBidsPanel";
import { SystemShell } from "@/components/SystemShell";

export default function AutomationPage() {
  return (
    <SystemShell title="Automation" subtitle="Sovereign scheduler control, Stripe billing, compute auctions, and content broadcasters.">
      <div className="grid gap-6">
        <BillingPanel />
        <OracleBidsPanel />
        <BroadcastPanel />
        <SchedulerPanel />
        <LaunchAgentPanel />
      </div>
    </SystemShell>
  );
}
