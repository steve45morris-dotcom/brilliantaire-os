# 🎙️ Offline TTS Queue Validator

## 🌌 Purpose
The **Offline TTS Queue Validator** checks generated text-to-speech scripts, queue packets, and voice directions before any audio synthesis is allowed. It acts as an offline safety filter, measuring word count compliance, identifying missing source references, detecting empty sections, and checking for unsafe characters or URLs.

---

## 🛠️ Safety Boundaries & System Constraints
The validator runs under the following strict boundaries:
1. **Validation-Only Mode:** Inspects files and logs metrics. It does not execute TTS models (e.g. Piper, Whisper) or construct audio files.
2. **No Audio Generation:** No audio compilation or synthesis is triggered.
3. **No External APIs:** Direct network connections, cloud synthesis calls, or remote voice databases are completely bypassed.
4. **No Obsidian Writes:** Reports remain under `outputs/tts_validation/` for operator sign-off.
5. **Safe Command Router:** CLI access is gated under exact name matching to prevent unverified runs.

---

## 📂 Folders Mapping

### Input Files
- TTS scripts: `outputs/tts_briefs/scripts/`
- Queue Packets: `outputs/tts_briefs/queue_packets/`
- Voice Directions: `outputs/tts_briefs/voice_directions/`

### Output Files
- Reports: `outputs/tts_validation/reports/`
- Checklists: `outputs/tts_validation/checklists/`
- Audit Logs: `outputs/tts_validation/logs/`

---

## 📊 Validation Parameters
- **Short script limit:** Max 150 words.
- **Medium script limit:** Max 450 words.
- **Long script limit:** Max 900 words.
- **Empty section checks:** Empty paragraphs or template brackets (`{{...}}`) flag errors.
- **Unsafe character check:** Detects command-line injections like `;`, `&`, `|`, `` ` ``, `$()`.
- **External URL check:** Scans for web links `http://` or `https://` which must be flagged for review.

---

## ⌨️ Command Reference

Execute commands through the Safe Command Router:

### Help Menu
```bash
npm run command -- "tts-queue-validator-help"
```

### Validate TTS Files
```bash
npm run command -- "tts-queue-validator validate"
```

### Compile Eligibility Checklist
```bash
npm run command -- "tts-queue-validator checklist"
```

### Compile Security & Risk Report
```bash
npm run command -- "tts-queue-validator risk-report"
```

### Check Validator Status
```bash
npm run command -- "tts-queue-validator status"
```

---

## 🔮 Future Audio Synthesis Boundary
Only when the validator issues a readiness score of 100% and zero blockers are identified can the queue packet be forwarded to the speech synthesis execution engine.
