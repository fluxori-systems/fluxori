# ADR 005: TypeScript Rebuild – Module Boundaries & Import Conventions

**Date:** 2025-04-23
**Status:** Proposed

## Context

- The backend currently reports 1315 TypeScript errors across 173 files.
- The frontend currently compiles with zero TypeScript errors.
- We need a systematic approach to rebuild TypeScript source to eliminate errors and enforce consistency.
- Existing dependency graphs are available:
  - `backend/module-dependencies.dot`
  - `backend/dependency-graph.dot`
  - `frontend/module-dependencies.dot`

## Dependency Analysis

### Backend Summary

```bash
npx madge --summary --ts-config backend/tsconfig.json backend/src
```

Processed 69 files (971ms) (9 warnings)

```
10 modules/credit-system/credit-system.module.js
9 modules/agent-framework/index.js
8 modules/agent-framework/agent-framework.module.js
…
```

No circular dependencies found.

### Frontend Summary

```bash
npx madge --extensions ts,tsx --summary --ts-config frontend/tsconfig.json frontend/src
```

Processed 282 files (2.4s) (28 warnings)

```
20 lib/motion/index.ts
16 lib/ui/components/index.ts
12 lib/shared/index.ts
…
```

No circular dependencies found.

## Decision

1.  Enforce explicit module boundaries: every `src/modules/<name>` folder must export a single public API via `index.ts`.
2.  Adopt consistent path aliases in each `tsconfig.json`:
    - `@modules/*` → `src/modules/*`
    - `@common/*` → `src/common/*`
    - `@shared/*` → `src/shared/*`
3.  Migrate all legacy `.js` interface files (e.g. `storage.interface.js`) to `.ts` with full type annotations.
4.  Enable strict compiler options incrementally (start with noImplicitAny, strictFunctionTypes).
5.  Validate the module graph with `madge --circular` after each refactoring phase to prevent new cycles.

## Consequences

- Initial overhead in refactoring, but improved type safety and maintainability.
- Consistent import paths and reduced risk of hidden dependencies.
- Clear module boundaries documented in code and in the ADR.
