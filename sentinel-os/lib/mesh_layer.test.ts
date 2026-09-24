import { describe, it, expect, vi, beforeEach } from "vitest";

// Records every statement mesh_layer prepares, with the values bound to it.
const statements: { sql: string; params: unknown[] }[] = [];
let rowsFor: (sql: string) => unknown[] = () => [];

vi.mock("better-sqlite3", () => ({
  default: class {
    prepare(sql: string) {
      const record = (params: unknown[]) => statements.push({ sql, params });
      return {
        all: (...params: unknown[]) => (record(params), rowsFor(sql)),
        get: (...params: unknown[]) => (record(params), rowsFor(sql)[0]),
        run: (...params: unknown[]) => (record(params), { changes: 1 }),
      };
    }
  },
}));

const mesh = await import("./mesh_layer");

const HOSTILE = "x' OR '1'='1'; DROP TABLE fleet_nodes; --";

function expectNoInterpolation() {
  expect(statements.length).toBeGreaterThan(0);
  for (const { sql } of statements) {
    expect(sql).not.toContain("DROP TABLE");
    expect(sql).not.toContain("O'Brien");
  }
}

describe("mesh_layer SQL", () => {
  beforeEach(() => {
    statements.length = 0;
    rowsFor = () => [];
  });

  it("binds lookup values in registerEdgeDevice", async () => {
    await mesh.registerEdgeDevice("dev-1", "sensor", HOSTILE);

    expectNoInterpolation();
    expect(statements[0].params).toEqual([HOSTILE]);
  });

  it("binds lookup values in submitOracleBid", async () => {
    await mesh.submitOracleBid(HOSTILE, 0.2, 8, "BUY");

    expectNoInterpolation();
    expect(statements[0].params).toEqual([HOSTILE]);
  });

  it("stores consensus proposal text verbatim, without double-escaped quotes", async () => {
    await mesh.simulateRaftConsensus(HOSTILE, "O'Brien's plan");

    expectNoInterpolation();
    const insert = statements.find((s) => s.sql.startsWith("INSERT INTO sovereign_ledger"))!;
    expect(insert.params[0]).toBe(`Consensus voting for proposal ${HOSTILE}`);
    expect(JSON.parse(insert.params[2] as string).proposalData).toBe("O'Brien's plan");
  });

  it("binds client id, stripe id and notes when recording a payment", async () => {
    rowsFor = (sql) =>
      sql.includes("FROM enterprise_clients") ? [{ name: "Acme_Corp" }] :
      sql.includes("COUNT(*)") ? [{ count: 3 }] : [];

    await expect(mesh.simulateStripeInvoicePayment("client-0a1b2c3d")).resolves.toEqual({ ok: true });

    expectNoInterpolation();
    const insert = statements.find((s) => s.sql.startsWith("INSERT INTO sales_ledger"))!;
    expect(insert.params[0]).toBe("Acme_Corp");
    expect(insert.params[1]).toBe("Paid computed node MRR of $3750.00 for 3 nodes");
  });

  it("binds settlement and micro-product ledger entries", async () => {
    await mesh.clearCrossChainSettlement(HOSTILE, 12.5, HOSTILE, "B");
    await mesh.deployMicroProduct("Bot", HOSTILE);

    expectNoInterpolation();
    const details = statements.map((s) => JSON.parse(s.params[1] as string));
    expect(details[0].clientId).toBe(HOSTILE);
    expect(details[1].template).toBe(HOSTILE);
  });
});
