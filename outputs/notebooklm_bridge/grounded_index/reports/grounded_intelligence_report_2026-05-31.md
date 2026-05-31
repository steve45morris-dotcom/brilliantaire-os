# 📊 Grounded Intelligence Index Graph Report: 2026-05-31

## Metadata
- **Report Date:** 2026-05-31
- **Status:** Complete & Awaiting Manual Verification

## Files Indexed
- notebooklm_insight_index_2026-05-31_1780248273.md
- notebooklm_citation_map_2026-05-31_1780248297.md
- notebooklm_weak_claims_2026-05-31_1780248320.md
- notebooklm_workflow_cards_2026-05-31_1780248342.md
- notebooklm_os_module_suggestions_2026-05-31_1780248374.md
- notebooklm_staged_obsidian_note_2026-05-31_1780248403.md

## Graph Summary
- **Node Counts by Type:**
  - **source_response:** 1
  - **insight:** 3
  - **citation:** 3
  - **weak_claim:** 2
  - **workflow_card:** 3
  - **os_module_suggestion:** 3
  - **obsidian_staged_note:** 1
  - **agent:** 4
  - **risk:** 5
  - **next_action:** 8
- **Edge Counts by Type:**
  - **supports:** 3
  - **derived_from:** 6
  - **contradicts:** 2
  - **needs_verification:** 5
  - **suggests_module:** 3
  - **owned_by_agent:** 6
  - **becomes_next_action:** 8
  - **stages_to_obsidian:** 1
- **Orphan Nodes:**
  - None detected

## High-Risk Weak Claims
- **Claim:** Recursive transcript scanning without limits
  - **Details:** Weak claim: Risk of hitting YouTube API daily quota limits and blocking future requests.. Missing: No rate-limiting logic or telemetry exists in the default ingest module.
  - **Review Status:** staged_for_manual_review
- **Claim:** Direct publishing to social media APIs
  - **Details:** Weak claim: Possibility of publishing unverified or formatted errors directly to public profiles.. Missing: No manual approval staging UI built into the pipeline.
  - **Review Status:** staged_for_manual_review

## Top Workflow Cards
- **Workflow:** SEO landing page crawling validation
  - **Details:** Workflow utilizing Node.js Crawling Lib for expected benefit: Prevents broken links or invalid metadata publishing.
- **Workflow:** Obsidian Local Note Staging
  - **Details:** Workflow utilizing NotebookLM Processor for expected benefit: Prevents corrupted Obsidian note databases.
- **Workflow:** Raft Consensus Replication
  - **Details:** Workflow utilizing One System Mesh Router for expected benefit: Ensures zero database synchronization conflicts.

## Top OS Module Suggestions
- **OS Module Suggestion:** programmatic-seo-validator
  - **Details:** OS Module suggestion. Input: outputs/platform_adapters/packages/, Output: outputs/security_audits/seo_reports/. Score: 8/10
- **OS Module Suggestion:** notebooklm-response-intelligence
  - **Details:** OS Module suggestion. Input: outputs/notebooklm_bridge/live_adapter/responses/, Output: outputs/notebooklm_bridge/response_intelligence/. Score: 9/10
- **OS Module Suggestion:** raft-consensus-mesh
  - **Details:** OS Module suggestion. Input: outputs/mesh_telemetry/snapshots/, Output: supernova.db state logs. Score: 9/10

## Recommended Review Queue
  - [ ] **weak_claim_8** [WEAK_CLAIM]: Recursive transcript scanning without limits
  - [ ] **weak_claim_11** [WEAK_CLAIM]: Direct publishing to social media APIs
  - [ ] **workflow_card_14** [WORKFLOW_CARD]: SEO landing page crawling validation
  - [ ] **workflow_card_18** [WORKFLOW_CARD]: Obsidian Local Note Staging
  - [ ] **workflow_card_22** [WORKFLOW_CARD]: Raft Consensus Replication
  - [ ] **os_module_suggestion_26** [OS_MODULE_SUGGESTION]: programmatic-seo-validator
  - [ ] **os_module_suggestion_28** [OS_MODULE_SUGGESTION]: notebooklm-response-intelligence
  - [ ] **os_module_suggestion_30** [OS_MODULE_SUGGESTION]: raft-consensus-mesh

## Next Action
Verify weak claims and OS module suggestions manually before promoting next actions.
