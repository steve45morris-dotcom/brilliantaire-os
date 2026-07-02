# 🔌 Supabase RPC Contracts
`Version: 1.0.0` | `Status: Approved` | `Scope: API Contracts`

PL/pgSQL stored procedures signatures exposed via Supabase RPC APIs.

---

## 🗂️ Stored Functions Mappings

### 1. `generate_daily_plan`
- **Params**: `user_id UUID`
- **Returns**: `jsonb`

### 2. `approve_timeline`
- **Params**: `timeline_id UUID`, `user_id UUID`
- **Returns**: `boolean`

### 3. `regenerate_timeline`
- **Params**: `timeline_id UUID`
- **Returns**: `boolean`

### 4. `start_session`
- **Params**: `workspace_id UUID`
- **Returns**: `UUID`

### 5. `complete_session`
- **Params**: `session_id UUID`
- **Returns**: `boolean`

### 6. `skip_mission`
- **Params**: `mission_id UUID`
- **Returns**: `boolean`

### 7. `consume_protected_buffer`
- **Params**: `buffer_id UUID`
- **Returns**: `boolean`

### 8. `record_ai_decision`
- **Params**: `plan_json jsonb`
- **Returns**: `UUID`

### 9. `generate_executive_briefing`
- **Params**: `sprint_id UUID`
- **Returns**: `jsonb`

### 10. `generate_review_summary`
- **Params**: `mission_id UUID`
- **Returns**: `jsonb`

### 11. `build_context_package`
- **Params**: `mission_id UUID`
- **Returns**: `UUID`

### 12. `update_trust_profile`
- **Params**: `user_id UUID`, `modifier numeric`
- **Returns**: `numeric`

---

## 📋 Document Metadata
- **Purpose**: Record Supabase RPC signatures.
- **Version**: 1.0.0

*I build before burning.*
