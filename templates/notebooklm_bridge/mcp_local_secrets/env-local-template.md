# NotebookLM MCP env.local Configuration Guide

## 🌌 Purpose of .env.local
The `.env.local` file acts as a local override boundary that configures environment variables on your system without leaking them into git history. Real secrets, private keys, or API tokens must reside only in this local boundary.

## 📋 Expected Environment Variables
| Env Name | Placeholder Example | Purpose | Local Setup Location | Never Commit Rule |
|---|---|---|---|---|
{{ENV_LOCAL_ROWS}}

## 🛡️ Critical Safety Policies
1. **Never Commit Secrets:** Do not commit `.env.local` or write real credentials inside tracked files.
2. **Deactivation Toggle:** Keep `NOTEBOOKLM_MCP_ENABLED=false` inside `.env.local` until the readiness gate recheck score successfully reaches **90%** or higher and passes completion reviews.
3. **Local Staging:** If you have keys stored in environment managers, define them in a custom helper script or configure them only in `.env.local` which is locked in `.gitignore`.
