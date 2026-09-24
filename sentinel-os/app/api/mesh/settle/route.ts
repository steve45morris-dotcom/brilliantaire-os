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
    
    const amount = Number(amountPaid);
    if (
      typeof clientName !== "string" ||
      typeof platformName !== "string" ||
      typeof licenseKey !== "string" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        { success: false, error: "clientName, platformName and licenseKey must be strings; amountPaid must be a positive number" },
        { status: 400 }
      );
    }

    const result = await processMicroAgentSettlement(clientName, platformName, amount, licenseKey);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
