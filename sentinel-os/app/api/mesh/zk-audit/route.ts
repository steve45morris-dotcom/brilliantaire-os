import { NextResponse } from "next/server";
import { appendActionLog } from "@/lib/audit-log";
import { runZKAuditSweep } from "@/lib/mesh_layer";

export async function POST() {
  const route = "/api/mesh/zk-audit";
  try {
    const result = await runZKAuditSweep();

    await appendActionLog({
      route,
      action: `execute zero-knowledge validation sweep over ${result.blockCount} blocks`,
      allowed: true,
      risk_level: "L1",
      command_key: "mesh.audit.zk",
      exit_code: 0,
      error: null
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "ZK validation sweep failed" },
      { status: 500 }
    );
  }
}
