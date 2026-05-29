## [2026-05-29T16:43:44.553Z] Command: "brief"
- **Matched Command:** `brief`
- **Alias Used:** `false`
- **Owning Agent:** `OS Architect`
- **Risk Level:** `low`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:43:59.192Z] Command: "next"
- **Matched Command:** `next`
- **Alias Used:** `false`
- **Owning Agent:** `Action Router`
- **Risk Level:** `low`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:44:17.050Z] Command: "agents"
- **Matched Command:** `agents`
- **Alias Used:** `false`
- **Owning Agent:** `OS Architect`
- **Risk Level:** `low`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:44:25.551Z] Command: "build"
- **Matched Command:** `build`
- **Alias Used:** `false`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `low`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:44:31.667Z] Command: "unknown-test"
- **Matched Command:** `None (Unknown Command)`
- **Result Status:** `Error: Unknown Command`
- **Exit Code:** `1`

---

## [2026-05-29T16:44:47.329Z] Command: "obsidian"
- **Matched Command:** `ingest`
- **Alias Used:** `true`
- **Owning Agent:** `Knowledge Librarian`
- **Risk Level:** `medium`
- **Result Status:** `Blocked: Alias used on Medium Risk`
- **Exit Code:** `1`

---

## [2026-05-29T16:44:58.618Z] Command: "ingest"
- **Matched Command:** `ingest`
- **Alias Used:** `false`
- **Owning Agent:** `Knowledge Librarian`
- **Risk Level:** `medium`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:51:57.763Z] Command Attempt: "brief"
- **Matched Command:** `brief`
- **Alias Used:** `false`
- **Owning Agent:** `OS Architect`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:52:14.786Z] Command Attempt: "next"
- **Matched Command:** `next`
- **Alias Used:** `false`
- **Owning Agent:** `Action Router`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:52:21.943Z] Command Attempt: "agents"
- **Matched Command:** `agents`
- **Alias Used:** `false`
- **Owning Agent:** `OS Architect`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:52:28.267Z] Command Attempt: "build"
- **Matched Command:** `build`
- **Alias Used:** `false`
- **Owning Agent:** `Build Operator`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T16:52:37.952Z] Command Attempt: "unknown-test"
- **Matched Command:** `None (Unknown Command)`
- **Result Status:** `Error: Unknown Command`
- **Exit Code:** `1`

---

## [2026-05-29T16:52:51.883Z] Command Attempt: "stage"
- **Matched Command:** `stage-write`
- **Alias Used:** `true`
- **Owning Agent:** `Knowledge Librarian`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Blocked: Alias Used for Exact Name`
- **Exit Code:** `1`

---

## [2026-05-29T16:53:03.740Z] Command Attempt: "approve-write"
- **Matched Command:** `approve-write`
- **Alias Used:** `false`
- **Owning Agent:** `Knowledge Librarian`
- **Risk Level:** `high`
- **Confirmed:** `false`
- **Result Status:** `Blocked: Missing Confirmation Flag`
- **Exit Code:** `1`

---

## [2026-05-29T16:53:15.328Z] Command Attempt: "approve-write --confirm"
- **Matched Command:** `approve-write`
- **Alias Used:** `false`
- **Owning Agent:** `Knowledge Librarian`
- **Risk Level:** `high`
- **Confirmed:** `true`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T17:08:21.749Z] Command Attempt: "campaign"
- **Matched Command:** `campaign`
- **Alias Used:** `false`
- **Owning Agent:** `Creative Revenue Strategist`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Failed`
- **Exit Code:** `1`

---

## [2026-05-29T17:08:25.481Z] Command Attempt: "campaigns"
- **Matched Command:** `campaign`
- **Alias Used:** `true`
- **Owning Agent:** `Creative Revenue Strategist`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Blocked: Alias Used for Exact Name`
- **Exit Code:** `1`

---

## [2026-05-29T17:08:39.208Z] Command Attempt: "campaign brief sporty"
- **Matched Command:** `None (Unknown Command)`
- **Result Status:** `Error: Unknown Command`
- **Exit Code:** `1`

---

## [2026-05-29T17:08:55.349Z] Command Attempt: "campaign brief sporty"
- **Matched Command:** `campaign`
- **Alias Used:** `false`
- **Owning Agent:** `Creative Revenue Strategist`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Failed`
- **Exit Code:** `1`

---

## [2026-05-29T17:09:16.460Z] Command Attempt: "campaign brief sporty"
- **Matched Command:** `campaign`
- **Alias Used:** `false`
- **Owning Agent:** `Creative Revenue Strategist`
- **Risk Level:** `medium`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

## [2026-05-29T17:09:22.404Z] Command Attempt: "campaign-help"
- **Matched Command:** `campaign-help`
- **Alias Used:** `false`
- **Owning Agent:** `Creative Revenue Strategist`
- **Risk Level:** `low`
- **Confirmed:** `false`
- **Result Status:** `Success`
- **Exit Code:** `0`

---

