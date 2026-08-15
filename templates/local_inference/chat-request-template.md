# Local Inference Chat Request

- **Request ID:** {{REQUEST_ID}}
- **Date:** {{DATE}}
- **Status:** {{RESPONSE_STATUS}}

## Server Target

| Parameter | Value |
|---|---|
| URL | {{SERVER_URL}} |
| Model | {{MODEL}} |
| Use Case | {{USE_CASE}} |

## Messages

### System Prompt

{{SYSTEM_PROMPT}}

### User Message

{{USER_MESSAGE}}

## Parameters

| Parameter | Value |
|---|---|
| Temperature | {{TEMPERATURE}} |
| Max Tokens | {{MAX_TOKENS}} |

## Pre-Execution Checklist

- [ ] Message reviewed for content safety
- [ ] Use case classified and approved
- [ ] System prompt validated (if present)
- [ ] Server confirmed running via health check
- [ ] Response audit plan documented

## Response

*(Paste server response here after manual execution)*

## Post-Execution Audit

- [ ] Response reviewed for accuracy
- [ ] Response reviewed for safety
- [ ] Response logged to audit trail
- [ ] Obsidian export staged (if applicable)

---

*Staged via Local Inference Bridge. Live calls require ALLOW_LIVE_INFERENCE_CALLS = true.*
