# ❌ TTS Model Manager Error Report
*Timestamp: {{TIMESTAMP}}*

## Error Details
- Attempted Operation: `{{OPERATION}}`
- Error Message: `{{ERROR_MESSAGE}}`

## Safety Recovery Guidance
- Verify the local path exists and is readable.
- Ensure only allowed binary names (`piper`, `piper-tts`) are registered.
- Ensure voice models use the `.onnx` extension and configurations use `.json`.
- Do not attempt to trigger external downloads; all assets must be staged locally.
