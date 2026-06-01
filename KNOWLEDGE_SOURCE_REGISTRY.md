# 📖 Knowledge Harvest Source Registry

## 🌌 Purpose
The **Knowledge Harvest Source Registry** is the central, manual-first tracking layer for creators, channels, topics, transcript status, and NotebookLM staging operations. It acts as a controlled boundary to expand source intelligence before staging ingestion, scoring work value, or generating telemetry summaries for the agentic council of Brilliantaire OS.

## 🛡️ Guardrails & Boundaries
1. **Manual-First Source Intake:** Creators and video URLs must be verified and cataloged manually.
2. **No Automated Channel Scraping:** Automated YouTube scraping is strictly disabled (`ALLOW_CHANNEL_SCRAPING = false`).
3. **No Video Downloads:** Downloading video files is prohibited (`ALLOW_VIDEO_DOWNLOAD = false`).
4. **No External API Calls:** Reading live data from YouTube or third-party web scrapers is blocked (`ALLOW_EXTERNAL_API_CALLS = false`).
5. **No Direct Obsidian Writes:** Direct mutations to Obsidian vaults are blocked (`ALLOW_OBSIDIAN_WRITE = false`).
6. **NotebookLM Staging Requirement:** All source packs must be staged and validated before manual upload to NotebookLM.

## 🧑‍💻 Approved Creators & Topic Categories
* **Approved Creators:**
  - Julian Goldie
* **Approved Topic Categories:**
  - AI automation
  - AI agents
  - SEO
  - YouTube growth
  - prompt engineering
  - workflow automation
  - content systems
  - monetization
  - Obsidian workflows
  - NotebookLM workflows
  - Brilliantaire OS architecture
  - Tree Groove Records operations
  - Icyflamze campaign systems

## 💻 Available Commands & Scripts
The registry processor is exposed via NPM scripts and the Safe Command Router:
```bash
# General help menu
npm run knowledge-source-registry-help

# Generate a staged approved creator record
npm run knowledge-source-registry -- "add-source julian"

# Generate source priority report
npm run knowledge-source-registry -- "priority-report"

# Generate transcript status report
npm run knowledge-source-registry -- "transcript-status"

# Generate workflow value scoring report
npm run knowledge-source-registry -- "workflow-value"

# Generate source pack status report
npm run knowledge-source-registry -- "source-pack-status"

# Output current registry dashboard status
npm run knowledge-source-registry -- "status"
```

## 📁 Output Directory Structure
- Staged approved sources: `outputs/knowledge_harvest/source_registry/staged_sources/`
- Compiled reports: `outputs/knowledge_harvest/source_registry/reports/`
- Execution logs: `outputs/knowledge_harvest/source_registry/logs/`
- Templates: `templates/knowledge_harvest/source_registry/`
