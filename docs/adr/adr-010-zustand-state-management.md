# ADR 010: Zustand State Management in Dashboard

- **Status:** APPROVED
- **Date:** 2026-07-15
- **Author:** Lead Platform Engineer

## Context
Standard React `useState` hooks propagate state locally, leading to prop-drilling, duplicate fetch side-effects, and lack of client-side caching or localStorage persistence.

## Decision
Migrate the React state management in the dashboard application to Zustand. The store manages loading, error, and telemetry states, persists state to local storage, and handles hydration matching.

## Consequences
- Creates a clean, centralized reactive state store.
- Enhances visual response and performance.
- Supports selectors and derived state.
