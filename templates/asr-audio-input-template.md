# 🎧 Offline ASR Audio Inputs
### Sentinel OS Command Mesh • Phase 11Z Input Audit

## 📋 Audio Input Metadata
- **Audit Date:** {{DATE}}
- **Total Files Inspected:** {{TOTAL_FILES}}
- **Eligible Audio Inputs:** {{ELIGIBLE_COUNT}}
- **Rejected Inputs:** {{REJECTED_COUNT}}

---

## 📂 Approved Audio Directories Scanned
Only approved local paths are inspected. Scanning outside these parameters is strictly prohibited.
{{AUDIO_DIRS_LIST}}

---

## 📝 Discovered Audio Files & Metadata
The following table shows all files located in the approved audio folders, their compatibility, and eligibility for ASR.

| Filename | Local Path | Size (Bytes) | Extension | Mod Time | Eligibility | Reason for Rejection / Notes |
|---|---|---|---|---|---|---|
{{AUDIO_FILES_TABLE}}

---

## 🚫 Eligibility Rules
- **Approved Formats:** Only `.wav`, `.mp3`, `.m4a`, `.flac`, and `.ogg` are accepted.
- **Size constraint:** Files with a size of 0 bytes are rejected.
- **Safety Rule:** Discovered audio is never uploaded to external clouds or transcribed locally. This phase performs metadata-level inspection only.
