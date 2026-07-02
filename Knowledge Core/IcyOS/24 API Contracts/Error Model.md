# 🚫 API Error Model Specification
`Version: 1.0.0` | `Status: Active` | `Scope: API Contracts`

Defines type codes and parameter errors shapes.

---

## 🗂️ Error Type Catalog
- **`validation_error`**: Input fields validation failure.
- **`authorization_error`**: Invalid auth JWT headers.
- **`not_found`**: Entity ID search mismatch.
- **`conflict`**: Resource unique index collision.
- **`rate_limited`**: Pushed operations threshold overflow.
- **`ai_confidence_low`**: Planning suggestions score below threshold.
- **`invariant_violation`**: Business constraint checks fail.
- **`dependency_missing`**: Pre-requisite task not marked completed.
- **`internal_error`**: PostgreSQL database or runtime handler crash.

---

## 📋 Document Metadata
- **Purpose**: Map system error types.
- **Version**: 1.0.0

*I build before burning.*
