# Manual Audio Drop Verification and Cleanup Specification

This document defines the safety boundaries, validation rules, and manual curation processes for local audio command file drops within Brilliantaire OS.

## 1. Purpose
The manual audio drop verification layer serves as a safety scanner and inventory builder for audio files dropped by the operator. It maps physical audio files to staged session metadata, checks file formats and sizes, flags anomalies, and isolates unsupported or oversized payloads into a local quarantine folder.

## 2. Security Boundaries

### Verification-Only Constraint
* **No ASR Execution:** The verification script does not invoke transcription tools, local Whisper binaries, or GGML models.
* **No File Uploads:** Audio waveforms and metadata are kept strictly local. No external API queries or cloud storage uploads are performed.
* **No Shell Spawning:** Zero shell subprocesses or terminal builders are invoked.

### Deletion and Mutability Rules
* **No Deletion:** Original files are never deleted or renamed automatically.
* **Quarantine copying:** Unsupported or oversized files are copied to the quarantine directory to stage for operator analysis. The original remains unchanged to prevent loss of telemetry.

## 3. Format and Size Constraints
Only files matching these formats are allowed to proceed to downstream ASR staging:
* **Extensions:** .wav, .mp3, .m4a
* **Max Size:** 100MB (files exceeding this threshold are flagged as oversized)

### Naming Recommendation
It is recommended that dropped files follow this structure:
`voice_session_<session-type>_<YYYY-MM-DD>.<ext>`

## 4. Session Matching Logic
Audio files are matched to JSON metadata files inside `voice_sessions/session_metadata/` using these criteria:
* The session ID or type extracted from the filename pattern.
* The latest created session timestamp inside the metadata folder matching the type.
* Confidence ratings are calculated based on pattern strength (e.g. HIGH if session ID matches exactly, MEDIUM if naming pattern is close, LOW if unmatched).

## 5. CLI Command Suite
The script is executed via the Safe Command Router:
* `inventory`: Scan dropped files and list counts, sizes, extensions, and oversized candidates.
* `match-sessions`: Attempt to pair files with metadata files and list orphan sessions.
* `quarantine-check`: Identify unsafe files and copy them to the quarantine output directory.
* `cleanup-report`: Generate a summary of valid files, staging entries, and ASR readiness impacts.
* `status`: Print a terminal status dashboard showing active blockers and system stats.

---
I build before burning.
