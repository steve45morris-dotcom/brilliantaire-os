import { NextResponse } from "next/server";
import { appendActionLog } from "@/lib/audit-log";
import { clearCrossChainSettlement } from "@/lib/mesh_layer";

export async function POST(request: Request) {
  const route = "/api/mesh/settle";
  try {
    const body = await request.json();
    const { clientId, amount, sourceBridge, destBridge } = body;

    if (!clientId || !amount || !sourceBridge || !destBridge) {
      return NextResponse.json({ ok: false, error: "clientId, amount, sourceBridge, and destBridge are required" }, { status: 400 });
    }

    const receipt = await clearCrossChainSettlement(clientId, parseFloat(amount), sourceBridge, destBridge);

    await appendActionLog({
      route,
      action: `clear cross-chain settlement: swap ${amount} from ${sourceBridge} to ${destBridge} for client: ${clientId}`,
      allowed: true,
      risk_level: "L1",
      command_key: "mesh.settle.bridge",
      exit_code: 0,
      error: null
    });

    return NextResponse.json({ ok: true, receipt });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Settlement clearing failed" },
      { status: 500 }
    );
  }
}
