import { NextResponse } from "next/server";
import { appendActionLog } from "@/lib/audit-log";
import { getSalesLedger, simulateStripeInvoicePayment } from "@/lib/mesh_layer";

export async function GET() {
  const route = "/api/mesh/billing";
  try {
    const invoices = await getSalesLedger();
    return NextResponse.json({ ok: true, invoices });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load billing history" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const route = "/api/mesh/billing";
  try {
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ ok: false, error: "clientId is required" }, { status: 400 });
    }

    const result = await simulateStripeInvoicePayment(clientId);

    await appendActionLog({
      route,
      action: `trigger Stripe node invoice payment simulation for client: ${clientId}`,
      allowed: result.ok,
      risk_level: "L1",
      command_key: "mesh.billing.pay",
      exit_code: result.ok ? 0 : 1,
      error: result.error || null
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Billing simulation failed" },
      { status: 500 }
    );
  }
}
