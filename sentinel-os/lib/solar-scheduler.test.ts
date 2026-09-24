import { describe, it, expect, vi } from "vitest";

const runExecute = vi.fn();
vi.mock("./db", () => ({ runExecute, runQuery: vi.fn() }));

const { getOptimalInferenceNode } = await import("./solar-scheduler");

describe("getOptimalInferenceNode", () => {
  it("picks the highest solar ratio and logs it with bound parameters", async () => {
    const { selectedNode } = await getOptimalInferenceNode();

    expect(selectedNode.region).toBe("EU-CENTRAL");
    const [sql, params] = runExecute.mock.calls[0];
    expect(sql).not.toContain("EU-CENTRAL");
    expect(params[0]).toBe("Routed inference model task to solar-aligned cluster: EU-CENTRAL (Renewable ratio: 85.0%)");
  });
});
