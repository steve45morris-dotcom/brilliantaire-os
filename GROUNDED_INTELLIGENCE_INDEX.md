# 🕸️ Grounded Intelligence Index Graph

## 🌌 Purpose
The **Grounded Intelligence Index Graph** compiles and links all response intelligence outputs (insight indexes, citation maps, weak claims, workflow cards, OS module suggestions, and staged Obsidian notes) into a unified, traceable local network graph.

By mapping semantic relationships (e.g., how workflow cards derive from insights, or how weak claims contradict safety policies), the graph provides structured, grounded context for system planning, manual audits, and future autonomous routing.

---

## 🛠️ Safety Boundaries & Local-Only Graph Rule
The compiler operates under strict sandboxed boundaries:
1. **Local-Only Graph:** Node relations are built entirely offline from local Markdown outputs.
2. **No Vector DB Writes:** No external vector database or indexer (like Pinecone or Chroma) is called yet.
3. **No External APIs:** No embedding generation APIs or external network calls are allowed.
4. **No Obsidian Writes:** Staged Markdown graphs are kept under `outputs/` for review first.
5. **Timestamp suffix preservation:** Existing graph files are never overwritten without a timestamp suffix.

---

## 📂 Node and Edge Specifications

### Node Types
- `source_response`: The parent response file.
- `insight`: Core actionable takeaway or idea.
- `citation`: Grounded source mapping or footnote reference.
- `weak_claim`: Unsupported or risky claim.
- `workflow_card`: Standardized task instruction card.
- `os_module_suggestion`: System extension blueprint suggestion.
- `obsidian_staged_note`: Compiled brief prepared for manual vault ingest.
- `agent`: Productivity agent responsible for executing next actions or modules.
- `risk`: Highlighted threat level associated with execution of ideas.
- `next_action`: Actionable manual tasks to mitigate risks or configure settings.

### Edge Types
- `supports`: Connects citation footnotes to source claims.
- `derived_from`: Links workflow cards or insights back to source files.
- `contradicts`: Identifies claims violating safety constraints.
- `needs_verification`: Binds claims to manual risk checklists.
- `suggests_module`: Links insight ideas to OS module suggestions.
- `owned_by_agent`: Links modules or workflows to their responsible council member.
- `becomes_next_action`: Establishes mitigation workflows to verify weak claims.
- `stages_to_obsidian`: Maps staged brief assets to final vault files.

---

## ⌨️ Command Reference

Run these commands via the Safe Command Router:

### Help Menu
```bash
npm run command -- "grounded-index-help"
```

### Compile Graph Files
```bash
npm run command -- "grounded-index build"
```

### Generate Graph Statistics Report
```bash
npm run command -- "grounded-index report"
```

### Check Input Folders & Outputs Status
```bash
npm run command -- "grounded-index status"
```

### Inspect Latest Graph Structure
```bash
npm run command -- "grounded-index inspect latest"
```

---

## 🔮 Future Vector Index Boundary
In future phases, the compiled graph JSON will act as the seed data for a local semantic search vector database. The offline constraints implemented in this phase ensure that when vector database writes are eventually enabled, the index will represent fully validated, collision-monitored graph nodes rather than raw, unverified AI outputs.

## 🤖 Grounded Narrator Support
This local graph serves as the index database for the **Grounded Narrator**. The Narrator reads the graph report, citation maps, and weak claims nodes to construct verified system progress logs and audio briefs, ensuring that narrative summaries remain grounded in specific, source-aware documentation rather than hallucinations.
