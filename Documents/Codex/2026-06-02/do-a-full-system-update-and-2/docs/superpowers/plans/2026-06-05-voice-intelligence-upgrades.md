# Voice Intelligence Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add priority filtering, 24-hour duplicate suppression, digest batching, quiet hours, and activity telemetry to Voice Vibe.

**Architecture:** A new Python policy engine owns all report decisions and durable JSON state. The existing shell daemon calls the engine for each queue entry and for digest readiness, then invokes speech only when the engine returns a speak action. The desktop panel reads the policy state and presents compact activity metrics.

**Tech Stack:** Python 3.9+, Bash, pytest, Tkinter, JSON state files

---

### Task 1: Core Report Classification

**Files:**
- Create: `work/voice_bridge/voice_intelligence.py`
- Create: `work/voice_bridge/test_voice_intelligence.py`

- [ ] **Step 1: Write failing classification tests**

Add tests for timestamp parsing, priority categories, critical categories, routine
rejection, and timestamp-free rejection:

```python
def test_classifies_error_as_critical():
    report = parse_report("2026-06-05 12:00:00 - ERROR database unavailable", now=NOW)
    assert report.category == "error"
    assert report.critical is True


def test_rejects_routine_status():
    report = parse_report("2026-06-05 12:00:00 - Signal clean", now=NOW)
    assert report.category is None
```

- [ ] **Step 2: Verify tests fail**

Run:

```bash
PYTHONPATH=work/voice_bridge pytest -q work/voice_bridge/test_voice_intelligence.py
```

Expected: collection failure because `voice_intelligence` does not exist.

- [ ] **Step 3: Implement immutable report parsing**

Create `ParsedReport` and `parse_report()` using the existing 24-hour timestamp
rule. Categories are matched with case-insensitive word-boundary expressions.
Critical categories are `blocker`, `error`, and `escalated`.

- [ ] **Step 4: Verify classification tests pass**

Run the Task 1 pytest command. Expected: all Task 1 tests pass.

- [ ] **Step 5: Commit Task 1**

```bash
git add work/voice_bridge/voice_intelligence.py work/voice_bridge/test_voice_intelligence.py
git commit -m "feat(voice): Add report priority classification"
```

### Task 2: Duplicate State and Quiet Hours

**Files:**
- Modify: `work/voice_bridge/voice_intelligence.py`
- Modify: `work/voice_bridge/test_voice_intelligence.py`

- [ ] **Step 1: Write failing duplicate and quiet-hours tests**

Cover timestamp removal during normalization, duplicate detection within 24
hours, expiry after 24 hours, corrupt state recovery, daytime behavior, overnight
quiet hours, and critical bypass.

```python
def test_duplicate_normalization_ignores_timestamp():
    assert normalize_report(FIRST) == normalize_report(SECOND)


def test_quiet_hours_cross_midnight():
    assert is_quiet_hour(time(23, 0), time(22, 0), time(8, 0))
    assert is_quiet_hour(time(7, 59), time(22, 0), time(8, 0))
    assert not is_quiet_hour(time(12, 0), time(22, 0), time(8, 0))
```

- [ ] **Step 2: Verify new tests fail**

Run the Task 1 pytest command. Expected: failures for missing duplicate and quiet
hours APIs.

- [ ] **Step 3: Implement state helpers**

Add:

```python
def normalize_report(line: str) -> str: ...
def report_digest(line: str) -> str: ...
def load_state(path: Path) -> dict[str, object]: ...
def save_state(path: Path, state: dict[str, object]) -> None: ...
def is_duplicate(line: str, state: dict[str, object], now: datetime) -> bool: ...
def is_quiet_hour(current: time, start: time, end: time) -> bool: ...
```

Prune duplicate records older than the configured window before each decision.

- [ ] **Step 4: Verify all tests pass**

Run the Task 1 pytest command. Expected: all tests pass.

- [ ] **Step 5: Commit Task 2**

```bash
git add work/voice_bridge/voice_intelligence.py work/voice_bridge/test_voice_intelligence.py
git commit -m "feat(voice): Add duplicate and quiet-hour policies"
```

### Task 3: Digest Queue and Decision CLI

**Files:**
- Modify: `work/voice_bridge/voice_intelligence.py`
- Modify: `work/voice_bridge/test_voice_intelligence.py`

- [ ] **Step 1: Write failing decision tests**

Cover actions `expired`, `filtered`, `duplicate`, `staged`, `held`, and `speak`.
Verify three eligible reports create one bounded digest and critical reports speak
immediately.

```python
def test_third_eligible_report_returns_digest(tmp_path):
    engine = engine_for(tmp_path, digest_size=3)
    assert engine.evaluate(REPORT_1, now=NOW).action == "staged"
    assert engine.evaluate(REPORT_2, now=NOW).action == "staged"
    decision = engine.evaluate(REPORT_3, now=NOW)
    assert decision.action == "speak"
    assert decision.digest_count == 3
```

- [ ] **Step 2: Verify new tests fail**

Run the Task 1 pytest command. Expected: missing `VoiceIntelligenceEngine`.

- [ ] **Step 3: Implement the engine and CLI**

Add `VoiceIntelligenceEngine.evaluate()` and command-line operations:

```text
voice_intelligence.py evaluate "<report>"
voice_intelligence.py status
voice_intelligence.py spoken "<report>"
```

Each command prints one JSON object. `evaluate` persists archives and telemetry,
but does not invoke audio.

- [ ] **Step 4: Verify all policy tests pass**

Run the Task 1 pytest command. Expected: all tests pass.

- [ ] **Step 5: Commit Task 3**

```bash
git add work/voice_bridge/voice_intelligence.py work/voice_bridge/test_voice_intelligence.py
git commit -m "feat(voice): Add digest decision engine"
```

### Task 4: Daemon Integration

**Files:**
- Modify: `work/voice_bridge/voice_daemon.sh`
- Create: `work/voice_bridge/test_voice_daemon_integration.py`

- [ ] **Step 1: Write failing daemon integration tests**

Run a copied daemon with temporary paths and stub speech commands. Verify expired,
routine, and duplicate reports never call speech; a critical fresh report calls
the stub once; and digest reports call it once after the configured threshold.

- [ ] **Step 2: Verify integration tests fail**

Run:

```bash
PYTHONPATH=work/voice_bridge pytest -q work/voice_bridge/test_voice_daemon_integration.py
```

Expected: failures because the daemon still calls only the age checker.

- [ ] **Step 3: Replace age-only routing with JSON decisions**

Call:

```bash
/usr/bin/python3 "$INTELLIGENCE_ENGINE" evaluate "$LINE"
```

Parse `action` and `speech` from JSON using `/usr/bin/python3`. Remove every
evaluated source line from the live queue. Invoke VibeVoice only for `speak`, then
call `spoken` only after successful playback or fallback speech.

- [ ] **Step 4: Verify daemon and full voice tests**

Run:

```bash
bash -n work/voice_bridge/voice_daemon.sh
PYTHONPATH=work/voice_bridge pytest -q work/voice_bridge/test_voice_daemon_integration.py work/voice_bridge/test_voice_intelligence.py work/voice_bridge/test_voice_report_age.py work/voice_bridge/test_master_voice_gate.py work/voice_bridge/test_voice_vibe_panel_fix.py work/voice_bridge/test_voice_engine.py
```

Expected: all tests pass.

- [ ] **Step 5: Commit Task 4**

```bash
git add work/voice_bridge/voice_daemon.sh work/voice_bridge/test_voice_daemon_integration.py
git commit -m "feat(voice): Route daemon through intelligence policy"
```

### Task 5: Panel Telemetry

**Files:**
- Modify: `work/voice_bridge/voice_vibe.py`
- Modify: `work/voice_bridge/test_voice_vibe_panel_fix.py`

- [ ] **Step 1: Write failing telemetry tests**

Test missing, valid, and corrupt intelligence state. Verify `current_state()`
includes queue, digest, rejection counts, quiet status, last spoken text, and
last rejection reason.

- [ ] **Step 2: Verify telemetry tests fail**

Run:

```bash
PYTHONPATH=work/voice_bridge pytest -q work/voice_bridge/test_voice_vibe_panel_fix.py
```

Expected: missing intelligence telemetry fields.

- [ ] **Step 3: Add panel telemetry reader**

Read `/tmp/.supernova_voice_intelligence.json`, merge safe defaults into public
state, and add one compact label:

```text
QUEUE 0 | DIGEST 2 | QUIET
```

Do not resize the existing window beyond the minimum required height.

- [ ] **Step 4: Verify panel and full suite**

Run the Task 4 full pytest command. Expected: all tests pass.

- [ ] **Step 5: Commit Task 5**

```bash
git add work/voice_bridge/voice_vibe.py work/voice_bridge/test_voice_vibe_panel_fix.py
git commit -m "feat(voice): Display intelligence activity telemetry"
```

### Task 6: Live Installation and Verification

**Files:**
- Install: `work/voice_bridge/voice_intelligence.py` to `/Users/alexanderanthony/scripts/voice_intelligence.py`
- Install: `work/voice_bridge/voice_daemon.sh` to `/Users/alexanderanthony/scripts/voice_daemon.sh`
- Install: `work/voice_bridge/voice_vibe.py` to `/Users/alexanderanthony/.claude/voice/voice_vibe.py`

- [ ] **Step 1: Run final static verification**

Run the Task 4 full pytest command plus Python compilation and Bash syntax checks.

- [ ] **Step 2: Install verified files**

Copy only the three listed files and preserve executable permissions.

- [ ] **Step 3: Restart the desktop panel**

Terminate only the current `voice_vibe.py gui` process and reopen Voice Vibe.

- [ ] **Step 4: Run silent live policy verification**

Keep Voice Vibe OFF while testing expired, routine, duplicate, digest, and
critical decisions directly through the policy CLI. Then briefly enable the
daemon with audio commands intercepted by stubs and verify expected call counts.

- [ ] **Step 5: Return system to OFF and record evidence**

Confirm:

```text
mode=off
master_mute=present
queue_lines=0
say_processes=0
afplay_processes=0
vv_speak_processes=0
```

- [ ] **Step 6: Commit final verified build**

Commit only the staged Voice Intelligence files and tests.
