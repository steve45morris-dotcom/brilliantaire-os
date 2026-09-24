import { describe, it, expect, vi, beforeEach } from "vitest";

const runExecute = vi.fn();
const runQuery = vi.fn();
vi.mock("./db", () => ({ runExecute, runQuery }));
vi.mock("./zk-ledger", () => ({ signEvent: vi.fn(async () => "signed-hash") }));

const { processMicroAgentSettlement } = await import("./settlement-bridge");

const INJECTION = "x'); DROP TABLE sales_ledger; --";

describe("processMicroAgentSettlement", () => {
  beforeEach(() => {
    runExecute.mockReset();
    runQuery.mockReset();
    runQuery.mockResolvedValue([{ id: 7 }]);
  });

  it("binds request values as parameters instead of interpolating them into SQL", async () => {
    await processMicroAgentSettlement(INJECTION, INJECTION, 49, INJECTION);

    expect(runExecute).toHaveBeenCalledTimes(2);
    for (const [sql, params] of runExecute.mock.calls) {
      expect(sql).not.toContain("DROP TABLE");
      expect(params.length).toBeGreaterThan(0);
    }
    expect(runExecute.mock.calls[0][1]).toContain(INJECTION);
  });

  it("returns the license id and signature", async () => {
    await expect(processMicroAgentSettlement("Acme", "Web", 49, "KEY-1")).resolves.toEqual({
      success: true,
      licenseId: 7,
      signedHash: "signed-hash",
    });
  });

  it.each([NaN, Infinity, 0, -5])("rejects amountPaid %s before writing", async (amount) => {
    await expect(processMicroAgentSettlement("Acme", "Web", amount, "KEY-1")).rejects.toThrow("positive number");
    expect(runExecute).not.toHaveBeenCalled();
  });
});
