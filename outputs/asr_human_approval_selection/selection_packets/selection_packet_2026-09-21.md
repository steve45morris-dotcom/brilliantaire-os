# ASR Selection Packet

- **Selection ID:** HASP-20260921-2312
- **Date:** 2026-09-21
- **Generated:** 2026-09-21T19:50:12.978Z
- **Bridge Mode:** manual-first
- **Status:** staged (awaiting human decision)

---

## ASR Pipeline Source Summary

- **asrOrchestrator:** Found (5 files)
- **asrModelGate:** Found (5 files)
- **liveAsrLogs:** Found (1 files)
- **voiceCommandLogs:** Found (1 files)

## Model Options

| Model | Size | Recommended For | Selection |
|---|---|---|---|
| whisper-tiny | ~39 MB | Quick tests, low-resource environments | [ ] |
| whisper-base | ~74 MB | Basic transcription, moderate accuracy | [ ] |
| whisper-small | ~244 MB | Good accuracy/speed balance | [ ] |
| whisper-medium | ~769 MB | High accuracy, moderate resource use | [ ] |
| whisper-large-v3 | ~1.5 GB | Maximum accuracy, requires significant resources | [ ] |

## Evaluation Checklist

- [ ] **accuracy-benchmark:** (pending human assessment)
- [ ] **latency-profile:** (pending human assessment)
- [ ] **memory-footprint:** (pending human assessment)
- [ ] **language-coverage:** (pending human assessment)
- [ ] **offline-compatibility:** (pending human assessment)

## Prerequisites

- [ ] ASR orchestrator outputs available in `outputs/asr_orchestrator/`
- [ ] Model gate verification complete in `outputs/asr_model_gate/`
- [ ] Local hardware specs confirmed for target model size
- [ ] Audio input samples prepared for evaluation
- [ ] Human operator available for selection decision

---

## Decision Section

**Human Operator Decision:** *(pending)*

- [ ] APPROVE — Proceed with selected model and candidates
- [ ] REJECT — Return to evaluation with updated criteria

**Selected Model:** *(to be filled by human operator)*

**Justification:** *(to be filled by human operator)*

---

## Safety Notes

- This packet is advisory only. No automated actions are triggered.
- Selection decisions must be recorded via `approve` or `reject` commands.
- Model downloads are disabled. Manual acquisition required.
- All ASR execution requires separate human authorization.
