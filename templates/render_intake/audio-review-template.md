# Render Intake - Audio Review Checklist

- **Checklist ID:** {{CHECKLIST_ID}}
- **Date:** {{DATE}}
- **Audio Assets Scanned:** {{AUDIO_ASSET_COUNT}}
- **Status:** staged

---

## Audio Review

Check each audio asset against Episode 1 production specifications and narrator sync requirements.

| Asset | Format | Levels OK | Quality OK | Sync Aligned | Duration OK |
|---|---|---|---|---|---|
{{CHECKLIST_ROWS}}

---

## Review Criteria

### Audio Levels
- [ ] All audio tracks normalized to target loudness (-14 LUFS recommended)
- [ ] No clipping or distortion detected during playback
- [ ] Dynamic range appropriate for target delivery format

### Quality Checks
- [ ] Sample rate meets minimum requirements (44.1 kHz or higher)
- [ ] Bit depth appropriate for production use (16-bit minimum)
- [ ] No audible artifacts, pops, clicks, or background noise issues

### Sync Alignment
- [ ] Audio timing aligns with corresponding video/visual assets
- [ ] Narrator voice-over matches storyboard timing map
- [ ] Music cues land on correct beat markers

### Duration Validation
- [ ] Audio duration matches expected segment lengths
- [ ] No unexpected silence or dead air sections
- [ ] Fade-in and fade-out transitions are smooth

## Next Steps

- [ ] Complete all checklist items above
- [ ] Flag any assets requiring re-recording or re-processing
- [ ] Move approved assets to `inputs/render_intake/reviewed/`
- [ ] Run `readiness` to assess overall assembly readiness

## Safety Notes

- This checklist is read-only. No files were moved or modified.
- Audio review is human-only. No automated audio analysis is performed.
