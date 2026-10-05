import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { parseSchema, approveTimelineSchema } from "../sentinel-os/lib/validation/schemas.js";
import { globalModelRouter } from "../src/integrations/core/ModelRouter.js";
import { globalIntegrationRegistry } from "../src/integrations/core/IntegrationRegistry.js";
import { globalOpenAIIntegrationContract } from "../src/integrations/openai/OpenAIIntegrationContract.js";
import { runQuery, runExecute, initTables } from "../sentinel-os/lib/db.js";
import { saveMissionsBatch, saveMissionsWithSimulatedFailure, Mission } from "../sentinel-os/lib/icyos.js";
import { globalIcyosEventBus } from "../sentinel-os/lib/event-bus.js";

beforeAll(async () => {
  await initTables();
  try {
    await runExecute("DELETE FROM missions WHERE id LIKE '%test%';");
  } catch (e) {}
});

describe("IcyOS Hardening: API validation schemas", () => {
  it("should successfully validate correct parse payloads", () => {
    const valid = parseSchema.safeParse({ input: "Do coding task" });
    expect(valid.success).toBe(true);
  });

  it("should reject parse payloads with empty strings", () => {
    const invalid = parseSchema.safeParse({ input: "" });
    expect(invalid.success).toBe(false);
  });

  it("should validate correct approve timeline schemas", () => {
    const payload = {
      date: "2026-07-14",
      timeline: [
        {
          type: "mission",
          title: "Aura Fixes",
          startTime: "09:00",
          endTime: "11:00",
          duration: 120
        }
      ],
      executionScore: 95
    };
    const valid = approveTimelineSchema.safeParse(payload);
    expect(valid.success).toBe(true);
  });

  it("should reject invalid dates in approve timeline schemas", () => {
    const payload = {
      date: "14-07-2026", // invalid format
      timeline: [],
      executionScore: 95
    };
    const invalid = approveTimelineSchema.safeParse(payload);
    expect(invalid.success).toBe(false);
  });
});

describe("IcyOS Hardening: ModelRouter integration", () => {
  beforeEach(() => {
    if (!globalIntegrationRegistry.get("openai")) {
      globalIntegrationRegistry.register(globalOpenAIIntegrationContract);
    }
  });

  it("should successfully route structured-output capabilities to openai", () => {
    const req = {
      taskDescription: "Parse day plans",
      requiredCapability: "structured-output",
      selectedProvider: "openai",
      selectedModel: "gpt-4o-mini"
    };
    const route = globalModelRouter.route(req);
    expect(route.providerId).toBe("openai");
    expect(route.model).toBe("gpt-4o-mini");
  });
});

describe("IcyOS Hardening: SQLite Transactional rollbacks", () => {
  it("should rollback database batch inserts if syntax fails", async () => {
    const mockMissions: Mission[] = [
      {
        id: "m-tx-test-1",
        intentId: 99,
        title: "Atomic Tx Test 1",
        description: "Verify atomic execution",
        duration: 30,
        mode: "focus",
        energyRequirement: "low",
        priority: "low",
        status: "pending",
        dependencies: []
      }
    ];

    try {
      await saveMissionsWithSimulatedFailure(mockMissions);
    } catch (err) {
      // Intentionally caught to verify database rollback state
    }

    const postCountRows = await runQuery("SELECT COUNT(*) as count FROM missions WHERE id = 'm-tx-test-1'");
    const postCount = Array.isArray(postCountRows[0]) ? parseInt(postCountRows[0][0]) : parseInt(postCountRows[0]?.count || "0");
    expect(postCount).toBe(0); // Should be 0 because it rolled back!
  });

  it("should successfully insert all batch records when no failure happens", async () => {
    const mockMissions: Mission[] = [
      {
        id: "m-tx-test-ok",
        intentId: 99,
        title: "Atomic Tx Test OK",
        description: "Verify atomic execution",
        duration: 30,
        mode: "focus",
        energyRequirement: "low",
        priority: "low",
        status: "pending",
        dependencies: []
      }
    ];

    await saveMissionsBatch(mockMissions);

    const postCountRows = await runQuery("SELECT COUNT(*) as count FROM missions WHERE id = 'm-tx-test-ok'");
    const postCount = Array.isArray(postCountRows[0]) ? parseInt(postCountRows[0][0]) : parseInt(postCountRows[0]?.count || "0");
    expect(postCount).toBe(1);

    // Cleanup
    await runExecute("DELETE FROM missions WHERE id = 'm-tx-test-ok'");
  });
});

describe("IcyOS Hardening: Event Bus Integration", () => {
  it("should publish and subscribe to custom timeline and mission events", () => {
    let fired = false;
    let payloadReceived: any = null;

    const cb = (event: any) => {
      fired = true;
      payloadReceived = event.payload;
    };

    globalIcyosEventBus.subscribe("TimelineGenerated", cb);
    globalIcyosEventBus.publish("TimelineGenerated", { score: 98 });

    expect(fired).toBe(true);
    expect(payloadReceived.score).toBe(98);

    globalIcyosEventBus.unsubscribe("TimelineGenerated", cb);
  });
});
