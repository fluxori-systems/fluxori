# ADR 0001: Strong TypeScript & Dependency Compliance

**Date:** 2025-04-23

**Status:** Proposed

## Context

Fluxori is in early development. Currently:

- Frontend has ~16 TS errors; backend has ~1,230.
- dependency-cruiser flags multiple module boundary violations.
  We need robust compile-time safety and clean module boundaries before launch.

## Decision

1.  Enforce all TypeScript errors as build blockers; remove any suppressions.
2.  Keep dependency-cruiser rules at `error` severity:
    - No circular dependencies
    - No orphan files
    - Components only import allowed modules
    - UI/Motion isolation
    - Firebase imports via `src/lib/firebase` only
3.  Plan incremental refactoring sprints to resolve violations.
4.  Add CI steps for type-check (`npm run typecheck`) and dependency validation (`npm run dep:validate`).

## Consequences

- Stronger safety and clarity, at the cost of initial refactoring effort.

## Next Steps

- Sprint 1: Fix all frontend TS errors and dependency violations.
- Sprint 2: Apply same to backend.
- Configure CI to run checks on every PR.
