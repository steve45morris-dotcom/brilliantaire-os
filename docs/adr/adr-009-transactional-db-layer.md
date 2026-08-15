# ADR 009: Transactional Database Layer

- **Status:** APPROVED
- **Date:** 2026-07-15
- **Author:** Chief Software Architect

## Context
When performing multi-file operations (e.g. updating a mission status and creating a corresponding timeline or audit entry), a failure midway could leave the files in an inconsistent state (orphaned rows, partial updates).

## Decision
Implement a file-based transactional database wrapper `TransactionalDB` supporting atomicity (BEGIN, COMMIT, ROLLBACK). Modifications are staged in memory and committed to disk only if the entire block completes without errors.

## Consequences
- Protects database consistency and integrity.
- Guarantees rollback on exceptions.
- Requires all write flows to route through the transactional block wrapper.
