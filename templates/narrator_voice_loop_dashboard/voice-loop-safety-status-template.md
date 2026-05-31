# 🛡️ Sentinel OS: Voice Loop Safety Configuration Report
*Audit Timestamp: {{TIMESTAMP}}*

This report verifies the active safety gates guarding the offline local voice command loop.

| Safety Control | Configured State | Enforcement Behavior |
| :--- | :--- | :--- |
| **Live Microphone Listening** | `{{LIVE_MIC_ENABLED}}` | Banned by default to prevent ambient voice leakage. |
| **Auto-Execution Policy** | `{{AUTO_EXECUTE}}` | Banned to prevent unsupervised command execution. |
| **Cloud ASR Synthesis** | `{{CLOUD_ASR_ENABLED}}` | Banned to force complete offline local data sovereignty. |
| **Exact-Name Routing Gate** | `{{EXACT_NAME_ROUTER_ACTIVE}}` | Active. Bans fuzzy command aliases and parameters modifications. |
| **Raw Shell Dispatch** | `{{RAW_SHELL_BLOCKED}}` | Active. Prevents shell parameters concatenation and injection. |
| **Chaining & Injection Filters** | `{{INJECTION_FILTERS_ACTIVE}}` | Active. Filters operators like `&&`, `\|`, `;`, backticks, etc. |

## Verification Outcome
Status: `SECURE / ENFORCED`
- Allowlisted Command Entries Count: `{{ALLOWED_COMMANDS_COUNT}}`
- Danger Action Isolation: `Active`
