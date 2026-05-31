import { NextResponse } from "next/server";
import { processMicroAgentSettlement } from "@/lib/settlement-bridge";

export async function POST(request: Request) {
  try {
    const { clientName, platformName, amountPaid, licenseKey } = await request.json();
    
    if (!clientName || !platformName || !amountPaid || !licenseKey) {
      return NextResponse.json(
        { success: false, error: "Missing required billing details: clientName, platformName, amountPaid, licenseKey" },
        { status: 400 }
      );
    }
    
    const result = await processMicroAgentSettlement(clientName, platformName, Number(amountPaid), licenseKey);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
