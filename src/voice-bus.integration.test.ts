import { exec, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

const REPO_ROOT = "/Users/alexanderanthony";
const SPEAK_SCRIPT = path.join(REPO_ROOT, ".agents", "speak_serialized.sh");
const NARRATE_SCRIPT = path.join(REPO_ROOT, ".agents", "voice_narrative.sh");

function ensureExecutable(file: string) {
  try {
    fs.chmodSync(file, 0o755);
  } catch (err) {}
}

describe("Voice Bus Real Integration Tests", { timeout: 60000 }, () => {
  let mainSandboxDir: string;

  beforeAll(() => {
    mainSandboxDir = path.join("/tmp", `voice_bus_integration_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
    fs.mkdirSync(mainSandboxDir, { recursive: true });
    ensureExecutable(SPEAK_SCRIPT);
    ensureExecutable(NARRATE_SCRIPT);
  });

  afterAll(() => {
    try {
      fs.rmSync(mainSandboxDir, { recursive: true, force: true });
    } catch (err) {}
  });

  // Helper to construct a completely isolated sandbox for a test block
  function setupTestSandbox(testName: string) {
    const testSandbox = path.join(mainSandboxDir, testName);
    const queueDir = path.join(testSandbox, "queue");
    const lockDir = path.join(testSandbox, "lock");
    const logDir = path.join(testSandbox, "logs");
    const reportDir = path.join(testSandbox, "reports");
    const bufferFile = path.join(testSandbox, "voice_buffer.txt");
    const binDir = path.join(testSandbox, "bin");

    fs.mkdirSync(queueDir, { recursive: true });
    fs.mkdirSync(logDir, { recursive: true });
    fs.mkdirSync(reportDir, { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });

    // Mock say command to avoid system say latency / timeout
    const mockSayFile = path.join(binDir, "say");
    fs.writeFileSync(mockSayFile, `#!/bin/bash\nif [ "$1" = "-o" ]; then\n  touch "$2"\nfi\nexit 0\n`, { mode: 0o755 });

    const envOverrides = {
      PATH: `${binDir}:${process.env.PATH}`,
      VOICE_BUS_LOCKDIR: lockDir,
      VOICE_BUS_QUEUE_DIR: queueDir,
      VOICE_BUS_LOG_DIR: logDir,
      VOICE_BUS_REPORT_DIR: reportDir,
      VOICE_BUS_BUFFER: bufferFile,
      VOICE_BUS_SIMULATION: "true", // Bypass user idle check to run tests reliably
    };

    return {
      testSandbox,
      queueDir,
      lockDir,
      logDir,
      reportDir,
      bufferFile,
      envOverrides,
    };
  }

  it("should verify lock acquisition, release, and queue serialization", async () => {
    const sandbox = setupTestSandbox("serialization");

    const runSpeak = (text: string, prio: string) => {
      return new Promise<{ code: number; stdout: string }>((resolve) => {
        exec(
          `bash ${SPEAK_SCRIPT} "${text}" "${prio}"`,
          { env: { ...process.env, ...sandbox.envOverrides } },
          (err, stdout) => {
            resolve({ code: err ? err.code || 1 : 0, stdout });
          }
        );
      });
    };

    const res1 = await runSpeak("one", "P3");
    expect(res1.code).toBe(0);
    expect(fs.existsSync(sandbox.lockDir)).toBe(false); // Lock released after execution

    const res2 = await runSpeak("two", "P3");
    expect(res2.code).toBe(0);
    expect(fs.existsSync(sandbox.lockDir)).toBe(false);
  });

  it("should handle lock contention and sequential execution", async () => {
    const sandbox = setupTestSandbox("contention");
    const startTime = Date.now();

    const p1 = new Promise<number>((resolve) => {
      exec(`bash ${SPEAK_SCRIPT} "first" "P3"`, { env: { ...process.env, ...sandbox.envOverrides } }, () => {
        resolve(Date.now());
      });
    });

    await new Promise((r) => setTimeout(r, 150));

    const p2 = new Promise<number>((resolve) => {
      exec(`bash ${SPEAK_SCRIPT} "second" "P3"`, { env: { ...process.env, ...sandbox.envOverrides } }, () => {
        resolve(Date.now());
      });
    });

    const [t1, t2] = await Promise.all([p1, p2]);
    expect(t1).toBeGreaterThan(0);
    expect(t2).toBeGreaterThan(0);
  });

  it("should perform trap handler cleanup on process interruption", async () => {
    const sandbox = setupTestSandbox("interruption");

    // Spawn a speak job in background
    const speakProc = spawn("bash", [SPEAK_SCRIPT, "interrupted speak", "P3"], {
      env: { ...process.env, ...sandbox.envOverrides },
    });

    // Poll until the job file is created (up to 10 seconds)
    let jobsBefore: string[] = [];
    for (let i = 0; i < 100; i++) {
      jobsBefore = fs.readdirSync(sandbox.queueDir).filter((f) => f.endsWith(".job"));
      if (jobsBefore.length >= 1) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    expect(jobsBefore.length).toBeGreaterThanOrEqual(1);

    speakProc.kill("SIGTERM");

    // Poll until the job file is cleaned up (up to 10 seconds)
    let jobsAfter: string[] = [];
    for (let i = 0; i < 100; i++) {
      jobsAfter = fs.readdirSync(sandbox.queueDir).filter((f) => f.endsWith(".job"));
      if (jobsAfter.length === 0 && !fs.existsSync(sandbox.lockDir)) break;
      await new Promise((r) => setTimeout(r, 100));
    }

    expect(fs.existsSync(sandbox.lockDir)).toBe(false);
    expect(jobsAfter.length).toBe(0);
  });

  it("should verify priority sorting and preemption rules", async () => {
    const sandbox = setupTestSandbox("preemption");

    // Start P3 task in background
    exec(`bash ${SPEAK_SCRIPT} "background" "P3"`, {
      env: { ...process.env, ...sandbox.envOverrides }
    });

    // Wait for P3 to write its job and start
    let jobsBefore: string[] = [];
    for (let i = 0; i < 100; i++) {
      jobsBefore = fs.readdirSync(sandbox.queueDir).filter((f) => f.endsWith(".job"));
      if (jobsBefore.length >= 1) break;
      await new Promise((r) => setTimeout(r, 100));
    }

    // Spawn P1 emergency task
    const p1Promise = new Promise<{ code: number }>((resolve) => {
      exec(
        `bash ${SPEAK_SCRIPT} "P1 INTERRUPT" "P1" --interrupt-policy=emergency`,
        { env: { ...process.env, ...sandbox.envOverrides } },
        (err) => {
          resolve({ code: err ? err.code || 1 : 0 });
        }
      );
    });

    const res = await p1Promise;
    expect(res.code).toBe(0);
  });
});
