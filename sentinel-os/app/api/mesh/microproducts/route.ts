import { NextResponse } from "next/server";
import { appendActionLog } from "@/lib/audit-log";
import { getMicroProducts, deployMicroProduct } from "@/lib/mesh_layer";

export async function GET() {
  const route = "/api/mesh/microproducts";
  try {
    const products = await getMicroProducts();
    return NextResponse.json({ ok: true, products });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load micro-products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const route = "/api/mesh/microproducts";
  try {
    const body = await request.json();
    const { name, template } = body;

    if (!name || !template) {
      return NextResponse.json({ ok: false, error: "name and template are required" }, { status: 400 });
    }

    const product = await deployMicroProduct(name, template);

    await appendActionLog({
      route,
      action: `trigger dynamic compile and deploy of micro-product: ${name} using ${template}`,
      allowed: true,
      risk_level: "L1",
      command_key: "mesh.factory.deploy",
      exit_code: 0,
      error: null
    });

    return NextResponse.json({ ok: true, product });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Micro-product deployment failed" },
      { status: 500 }
    );
  }
}
