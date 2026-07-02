# 🔐 Row Level Security (RLS) Strategy
`Version: 1.0.0` | `Status: Active` | `Scope: Database Architecture`

Row Level Security (RLS) policies defining data visibility boundaries.

---

## 🔒 Security Policies
- **Single-User Mode**: Tables enforce `auth.uid() = user_id` for all CRUD executions.
- **Future Multi-User workspace Mode**: Enforces tenant mapping checks (`auth.jwt() -> workspace_id`).
- **AI Actor Access**: AI processes can read data but require approved mission status (`is_approved = true`) to write or modify.

---

## 📋 Document Metadata
- **Purpose**: Record RLS boundaries.
- **Version**: 1.0.0

*I build before burning.*
