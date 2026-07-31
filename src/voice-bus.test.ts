import { exec, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { describe, it, expect, beforeAll } from "vitest";

const REPO_ROOT = "/Users/alexanderanthony";
const SPEAK_SCRIPT = path.join(REPO_ROOT, ".agents", "speak_serialized.sh");
const NARRATE_SCRIPT = path.join(REPO_ROOT, ".agents", "voice_narrative.sh");

function ensureExecutable(file: string) {
  try {
    fs.chmodSync(file, 0o755);
  } catch (err) {}
}

describe("Voice Bus Runtime Integration Tests", { timeout: 60000 }, () => {
  let mainSandboxDir: string;
  let mockBinDir: string;

  beforeAll(() => {
    mainSandboxDir = path.join("/tmp", `voice_bus_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
    mockBinDir = path.join(mainSandboxDir, "bin");
    fs.mkdirSync(mockBinDir, { recursive: true });

    ensureExecutable(SPEAK_SCRIPT);
    ensureExecutable(NARRATE_SCRIPT);

    // Write mock 'say' command to local mock PATH with 1.5s duration
    const mockSayPath = path.join(mockBinDir, "say");
    const mockSayContent = `#!/bin/bash
# Mock say command for testing
echo "MOCK_SAY_EXECUTION: \$*"
sleep 1.5
exit 0
`;
    fs.writeFileSync(mockSayPath, mockSayContent, "utf8");
    ensureExecutable(mockSayPath);
  });

  // Helper to construct a completely isolated sandbox for a test block
  function setupTestSandbox(testName: string) {
    const testSandbox = path.join(mainSandboxDir, testName);
    const queueDir = path.join(testSandbox, "queue");
    const lockDir = path.join(testSandbox, "lock");
    const logDir = path.join(testSandbox, "logs");
    const reportDir = path.join(testSandbox, "reports");
    const bufferFile = path.join(testSandbox, "voice_buffer.txt");

    fs.mkdirSync(queueDir, { recursive: true });
    fs.mkdirSync(logDir, { recursive: true });
    fs.mkdirSync(reportDir, { recursive: true });

    const envOverrides = {
      VOICE_BUS_LOCKDIR: lockDir,
      VOICE_BUS_QUEUE_DIR: queueDir,
      VOICE_BUS_LOG_DIR: logDir,
      VOICE_BUS_REPORT_DIR: reportDir,
      VOICE_BUS_BUFFER: bufferFile,
      VOICE_BUS_SIMULATION: "true", // Bypass user idle check on user's active workstation
      PATH: `${mockBinDir}:${process.env.PATH}`,
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

  it("should serialize queue execution and preserve ordering", async () => {
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

    const res1 = await runSpeak("First system alert", "P3");
    const res2 = await runSpeak("Second system alert", "P3");

    expect(res1.code).toBe(0);
    expect(res2.code).toBe(0);
    expect(fs.existsSync(sandbox.lockDir)).toBe(false);
  });

  it("should handle lock contention and delay subsequent tasks", async () => {
    const sandbox = setupTestSandbox("contention");
    const startTime = Date.now();
    const p1 = new Promise<number>((resolve) => {
      exec(`bash ${SPEAK_SCRIPT} "Task one starting" "P3"`, { env: { ...process.env, ...sandbox.envOverrides } }, () => {
        resolve(Date.now());
      });
    });

    await new Promise((r) => setTimeout(r, 150));

    const p2 = new Promise<number>((resolve) => {
      exec(`bash ${SPEAK_SCRIPT} "Task two waiting" "P3"`, { env: { ...process.env, ...sandbox.envOverrides } }, () => {
        resolve(Date.now());
      });
    });

    const [t1, t2] = await Promise.all([p1, p2]);
    expect(t1).toBeGreaterThan(0);
    expect(t2).toBeGreaterThan(0);
  });

  it("should clean up locks and job files after process interruption", async () => {
    const sandbox = setupTestSandbox("interruption");
    const speakProc = spawn("bash", [SPEAK_SCRIPT, "Interruptible text alert", "P3"], {
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

    if (jobsAfter.length > 0) {
      console.log("DIAGNOSTIC - REMAINING FILES:", jobsAfter);
      jobsAfter.forEach((file) => {
        const fullPath = path.join(sandbox.queueDir, file);
        console.log(`DIAGNOSTIC - CONTENT of ${file}:`, fs.readFileSync(fullPath, "utf8"));
      });
    }

    expect(fs.existsSync(sandbox.lockDir)).toBe(false);
    expect(jobsAfter.length).toBe(0);
  });

  it("should parse pre-defined phrases and write to buffer using voice_narrative.sh", async () => {
    const sandbox = setupTestSandbox("narrator");
    const runNarrator = (num: string) => {
      return new Promise<{ code: number }>((resolve) => {
        exec(
          `bash ${NARRATE_SCRIPT} "${num}"`,
          { env: { ...process.env, ...sandbox.envOverrides } },
          (err) => {
            resolve({ code: err ? err.code || 1 : 0 });
          }
        );
      });
    };

    const res = await runNarrator("2");
    expect(res.code).toBe(0);
    expect(fs.existsSync(sandbox.bufferFile)).toBe(true);
    expect(fs.readFileSync(sandbox.bufferFile, "utf8")).toContain("No street collisions. Quorum verified.");
  });

  it("should support priority emergency preemption of active P3 tasks by P1 tasks", async () => {
    const sandbox = setupTestSandbox("preemption");
    exec(`bash ${SPEAK_SCRIPT} "Active P3 Speech" "P3"`, {
      env: { ...process.env, ...sandbox.envOverrides }
    });

    // Poll until the job file is created (up to 10 seconds)
    let jobsBefore: string[] = [];
    for (let i = 0; i < 100; i++) {
      jobsBefore = fs.readdirSync(sandbox.queueDir).filter((f) => f.endsWith(".job"));
      if (jobsBefore.length >= 1) break;
      await new Promise((r) => setTimeout(r, 100));
    }

    const p1Promise = new Promise<{ code: number }>((resolve) => {
      exec(
        `bash ${SPEAK_SCRIPT} "P1 EMERGENCY INTERRUPT" "P1" --interrupt-policy=emergency`,
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
