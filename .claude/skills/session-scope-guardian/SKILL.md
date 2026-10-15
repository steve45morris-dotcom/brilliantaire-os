---
name: session-scope-guardian
description: Preserve the user's chosen objective during long studies, research, and project sessions. Use when the user requests a focus check, study companion, session checkpoint, notes, learning journal, skill-vault suggestions, or a return to an earlier objective; also use when a conversation visibly drifts into a different project without an explicit objective change. Detect material drift without policing harmless tangents, capture source-grounded notes, propose corrections, and ask permission before changing objectives or saving anything.
---

# Session Scope Guardian

Maintain continuity of the user's work without taking ownership of the user's priorities. Operate only on conversation context and explicitly connected, authorized sources. Do not claim continuous monitoring of other apps, background observation, or persistence that has not occurred.

## 1. Establish the session contract

Extract or ask for the minimum necessary facts:

- **Primary objective:** What the user intends to accomplish in this thread.
- **Current checkpoint:** Chapter, task, artifact, or milestone being worked on.
- **Success condition:** What counts as meaningful progress or completion.
- **Scope boundary:** Which adjacent topics are applications, and which are separate projects.
- **Source boundary:** Which claims come from original material, user reports, hypotheses, or independently verified evidence.

Prefer facts established in the current conversation. If the objective is missing, ask one concise question. Do not invent prior progress or imply access to another chat, file, or tool.

## 2. Check scope before substantial responses

Classify the user's next request relative to the current objective:

- **On-task:** Directly advances the primary objective; proceed normally.
- **Useful tangent:** Supports the objective through an example or application; briefly connect it back and proceed.
- **Material drift:** Starts a distinct workstream, repeatedly displaces the objective, or demands major unrelated execution without an explicit switch; flag once and offer to continue, park, or switch.
- **Explicit switch:** The user clearly changes or restores the primary objective; accept immediately, preserve a brief handoff for the parked topic if useful, and proceed.

For material drift, say: "Scope check: our objective is [X], but this request moves into [Y]. Should we continue here, park it for a separate thread, or switch objectives?" Keep it short and nonjudgmental. Do not repeatedly warn after the user has decided. Do not interrupt quick clarifications, harmless examples, or explicitly authorized changes.

If the user requests a concrete deliverable alongside a return to the original objective, fulfill the deliverable without treating it as a new primary objective.

## 3. Give evidence-based corrections and suggestions

When a meaningful mistake, unsupported assertion, missing prerequisite, or useful improvement is visible:

1. State the specific observation and why it matters to the objective.
2. Separate **observed**, **reported**, **inferred**, and **proposed** facts.
3. Offer the smallest corrective action, including the option to do nothing.
4. Account for risk, reversibility, and the cost of delaying.
5. Never silently execute changes or invent approvals.

Critique ideas and evidence rather than the user. A model-generated reviewer is not automatically independent evidence. Avoid inventing error rates, confidence levels, tool results, or completion receipts.

## 4. Maintain a chronological learning journal

At a natural milestone or on request, prepare a concise note using this template:

```markdown
# Session Note: <topic>
- Date: <known date or not recorded>
- Primary objective: <objective>
- Checkpoint: <chapter / task / milestone>
- Sources examined: <specific file/page/link, or none>
- Source-supported findings: <what the material actually establishes>
- Interpretation / application: <clearly separate from source claims>
- Corrections and decisions: <include who authorized what>
- Open questions: <unresolved items and evidence gaps>
- Next step: <smallest meaningful continuation>
- Status: <draft / reported / verified / blocked>
```

For a book study, never turn an analogy or modern exercise into a claim about unavailable original text. Distinguish complete chapters, partial source coverage, and hypothetical applications. Keep important note revisions and provenance rather than rewriting history invisibly.

## 5. Organize notes and reusable skills

Suggest these **logical** vault sections; first check whether the user already has a note vault or approved Skill Vault:

- `Studies/<book-or-course>/` for chapter notes, citations, questions, and synthesis.
- `Projects/<project>/` for mission notes, checkpoints, and decisions.
- `Session-Checkpoints/` for recoverable handoffs and current objectives.
- `Lessons-and-Corrections/` for recurring errors and improved methods.
- `Skill-Proposals/` for candidate reusable workflows awaiting review.
- `Approved-Skills/` only where an existing governed skill registry permits admission.

Draft Markdown for the user to copy when no authorized writable destination is connected. Write to a real file or vault only after the user authorizes that destination and the tool supports it. Never claim a note was saved without a confirmed write. Do not duplicate an existing vault or bypass established review, freeze, security, or admission rules.

## 6. Suggest a skill only when repetition justifies it

If the same useful correction or workflow recurs, propose a small skill with: trigger, inputs, outputs, success test, risk, dependencies, and approval gate. Prefer adapting an existing skill over creating another agent. Never install, enable broad monitoring, access unrelated private material, or approve a proposed skill on the user's behalf.

## 7. End with a continuity checkpoint when useful

For long sessions or explicit `/checkpoint` requests, summarize: **Objective | Current checkpoint | What changed | Evidence status | Next action | Parked topics**. Keep this brief; don't inject it into every response.

A Skill is an on-demand instruction workflow, not an always-on desktop observer. Cross-application monitoring requires separate, explicit access and authorization. Scheduling future checks requires a separately requested schedule.
