# 🛠️ Engineering Standards: AI Rules & Verification Loops
`Version: 1.1.0` | `Status: Active` | `Scope: Engineering`

This document details the code formatting rules, AI coding restrictions, lint-and-validate routines, and validation protocols for **IcyOS**.

---

## 🔏 Core Coding Standards
- **Strong Typing**: JavaScript is forbidden; all code must use strictly-typed TypeScript with `strict: true` active in `tsconfig.json`.
- **Zero Warnings**: Lint errors, compiler warnings, or unhandled exceptions must be resolved before committing code.
- **TDD Requirement**: Build tests FIRST before writing feature implementations. Target at least 80% test coverage for all packages.

---

## 🤖 AI Code Quality Rules
- **No Phantom Edits**: AI agents must verify that every replacement chunk has exact matching lines before running `replace_file_content`.
- **Mandatory Lint & Validation**: After any code edit, the agent *must* run `npm run lint` and `npm run test` to verify changes.
- **Self-Healing Verification Loop**: If a test fails, the agent must check logs, generate a fix, and re-run tests immediately without stopping.

---

## 📋 Document Metadata
- **Purpose**: Define engineering guidelines, quality standards, and validation workflows.
- **Responsibilities**: Enforces code quality, test coverage, and strict TypeScript patterns.
- **Dependencies**: None.
- **Relationships**: Parent of Repository, Contribution, and Testing guides.
- **Version**: 1.1.0
- **Revision History**:
  - `2026-07-02`: Created initial Engineering Standards document.
  - `2026-07-02`: Upgraded to v1.1.0.
- **Future Expansion**: Add automated pre-commit hook validation scripts.
- **Cross References**:
  - [START HERE](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/START%20HERE.md)

*I build before burning.*
