# 🛠️ TTS Export JSON Spec

This document describes the structured JSON output template for the export queue.

```json
{
  "exportId": "tts_export_{{DATE}}",
  "compiledAt": "{{TIMESTAMP}}",
  "sourceManifest": "{{SOURCE_MANIFEST}}",
  "counts": {
    "imported": {{IMPORTED_COUNT}},
    "exported": {{EXPORTED_COUNT}},
    "rejected": {{REJECTED_COUNT}}
  },
  "exportedBlocks": [
    {
      "export_id": "{{EXPORT_ID}}",
      "block_id": "{{BLOCK_ID}}",
      "node_id": "{{NODE_ID}}",
      "source_file": "{{SOURCE_FILE}}",
      "narrator_text": "{{SCRIPT_TEXT}}",
      "approved_for_voice": true,
      "citation_status": "{{CITATION_STATUS}}",
      "risk_level": "{{RISK_LEVEL}}",
      "suggested_voice_tone": "{{VOICE_TONE}}",
      "suggested_priority": "{{VOICE_PRIORITY}}",
      "estimated_word_count": {{WORD_COUNT}},
      "estimated_duration_seconds": {{ESTIMATED_DURATION}},
      "export_status": "staged_for_tts",
      "tts_generated": false
    }
  ]
}
```
