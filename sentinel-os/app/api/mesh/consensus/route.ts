import { NextResponse } from "next/server";
import { appendActionLog } from "@/lib/audit-log";
import { simulateRaftConsensus } from "@/lib/mesh_layer";

export async function POST(request: Request) {
  const route = "/api/mesh/consensus";
  try {
    const body = await request.json();
    const { proposalId, proposalData } = body;

    if (!proposalId || !proposalData) {
      return NextResponse.json({ ok: false, error: "proposalId and proposalData are required" }, { status: 400 });
    }

    const result = await simulateRaftConsensus(proposalId, proposalData);

    await appendActionLog({
      route,
      action: `execute Raft consensus proposal ${proposalId}: approved=${result.approved} (YES=${result.yesCount}, NO=${result.noCount}, TIMEOUT=${result.timeoutCount})`,
      allowed: true,
      risk_level: "L1",
      command_key: "mesh.consensus.propose",
      exit_code: 0,
      error: null
    });

    return NextResponse.json({
      ok: true,
      result
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Consensus execution failed" },
      { status: 500 }
    );
  }
}
