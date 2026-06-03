# 📜 Transcript Processing Next Steps - 2026-06-02

This report outlines the manual transcript retrieval tasks and destinations for staged URLs approved for intake.

## 📋 Actionable Intake Queue

| URL | Creator | Transcript Status | Manual Transcript Action | Target Folder | Next Command |
|---|---|---|---|---|---|
| https://www.youtube.com/watch?v=TEST_VIDEO_ID | Julian Goldie | needed | Download manual transcript for video | outputs/knowledge_harvest/transcripts/ | `npm run knowledge-harvest -- "intake-transcript julian_goldie_transcript.txt"` |
| https://www.youtube.com/watch?v=TEST_VIDEO_ID | Julian Goldie | needed | Download manual transcript for video | outputs/knowledge_harvest/transcripts/ | `npm run knowledge-harvest -- "intake-transcript julian_goldie_transcript.txt"` |
| https://www.youtube.com/watch?v=TEST_VIDEO_ID | Julian Goldie | needed | Download manual transcript for video | outputs/knowledge_harvest/transcripts/ | `npm run knowledge-harvest -- "intake-transcript julian_goldie_transcript.txt"` |

## 💡 Processing Instructions
1. For each URL above, fetch or extract the transcript manually.
2. Save the transcript file to the specified Target Folder.
3. Run the Next Command to ingest the transcript into the Knowledge Harvest engine.
