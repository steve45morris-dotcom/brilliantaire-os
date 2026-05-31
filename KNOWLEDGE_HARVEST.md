# 🌾 Knowledge Harvest Engine v1

## Purpose
The Knowledge Harvest Engine is a safe local learning intake system for **Brilliantaire OS**. It aggregates video and transcript knowledge from approved creators to formulate local Obsidian notes, NotebookLM-ready source packs, and actionable OS workflow ideas.

## Manual Intake Rule
In Phase 1, the system operates **strictly via manual intake**. No automated video scraping or unauthorized web requests are performed. The engine processes either manually provided YouTube URLs (which create pending metadata records) or locally provided transcript files.

## YouTube Safety Boundary
To maintain compliance and system safety:
- **No Aggressive Scraping:** The system does not scan channels recursively.
- **No Video Downloads:** Video downloads are strictly forbidden.
- **No Terms Violations:** The engine only parses local transcripts or manually registered URLs.
- **No Model Training:** Transcript data is parsed and structured; it is never fed to train or fine-tune models.
- **No Public Republication:** Full copyrighted transcripts are kept in local source directories and never exposed or republished in output summaries.

## Module Roles

### Obsidian Role
- Generates beautiful markdown formatted files under `outputs/knowledge_harvest/video_notes/` that can be synced with active Obsidian vaults.
- Uses frontmatter properties (`creator`, `title`, `url`, `date_processed`, `tags`, `status`) to integrate seamlessly with Obsidian databases.

### NotebookLM Role
- Compiles processed learning notes into aggregated, structured Markdown source packs under `outputs/knowledge_harvest/source_packs/`.
- Highlights key questions and follow-up research questions to direct high-leverage chats in NotebookLM.

### Brilliantaire OS Role
- Synthesizes notes to formulate system execution checklists under `outputs/knowledge_harvest/workflow_ideas/`.
- Maps extracted workflows to concrete OS modules, required agents, difficulties, and next steps.

## Supported Commands

| Command | Usage | Description |
|---|---|---|
| `help` | `npm run knowledge-harvest -- "help"` | Prints CLI command reference guide |
| `intake-url` | `npm run knowledge-harvest -- "intake-url <URL>"` | Creates a pending video note record |
| `intake-transcript` | `npm run knowledge-harvest -- "intake-transcript <FILE>"` | Processes a local transcript file into a note |
| `source-pack` | `npm run knowledge-harvest -- "source-pack"` | Generates a NotebookLM source pack |
| `workflow-ideas` | `npm run knowledge-harvest -- "workflow-ideas"` | Generates a Brilliantaire OS workflow ideas list |
| `status` | `npm run knowledge-harvest -- "status"` | Displays engine metrics and next actions |

## Future API Expansion Boundary
If external APIs (e.g. OpenAI, Anthropic, Gemini, or YouTube Data API) are configured in future phases:
- They must be explicitly opted in via `config/knowledge-harvest.ts`.
- They must abide by strict token budget caps.
- External calls must be logged and auditable in `outputs/knowledge_harvest/logs/`.
