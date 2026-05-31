import { NextResponse } from "next/server";
import { getOptimalInferenceNode } from "@/lib/solar-scheduler";

export async function GET() {
  try {
    const result = await getOptimalInferenceNode();
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
