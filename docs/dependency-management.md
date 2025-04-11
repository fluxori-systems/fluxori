# Fluxori Module Dependency Management

This document outlines the tools and processes for managing module dependencies in the Fluxori project, ensuring architectural integrity and maintaining clear boundaries between modules.

## Table of Contents

- [Overview](#overview)
- [Available Tools](#available-tools)
- [Visualizing Dependencies](#visualizing-dependencies)
- [Enforcing Module Boundaries](#enforcing-module-boundaries)
- [API Documentation](#api-documentation)
- [Module Documentation](#module-documentation)
- [Continuous Integration](#continuous-integration)

## Overview

The Fluxori platform uses a modular architecture with clear boundaries between components. To maintain this architecture as the codebase grows, we've implemented dependency management tools that help visualize dependencies, enforce boundaries, and document interfaces.

## Available Tools

The following tools are available for dependency management:

### Backend (NestJS)

```bash
# Validate dependencies against rules
npm run dep:validate

# Generate dependency graphs
npm run dep:graph      # Full dependency graph
npm run dep:modules    # Module-level dependencies
npm run dep:archi      # Architectural view

# Check for circular dependencies
npm run dep:check-circular

# Generate API documentation
npm run doc:generate
```

### Frontend (Next.js)

```bash
# Validate dependencies against rules
npm run dep:validate

# Generate dependency graphs
npm run dep:graph       # Full dependency graph
npm run dep:components  # Component-level dependencies
npm run dep:archi       # Architectural view

# Check for circular dependencies
npm run dep:check-circular

# Generate API documentation
npm run doc:generate
```

## Visualizing Dependencies

Dependency visualization helps understand the relationships between different parts of the codebase. After running one of the dependency graph commands, you'll find SVG files in the root directory:

- `dependency-graph.svg`: Full dependency graph
- `module-dependencies.svg` (Backend) / `component-dependencies.svg` (Frontend): Module/component level dependencies
- `architecture.svg`: High-level architectural view

The visualizations use the following color coding:
- Green: Modules/Pages
- Blue: Components/Common utilities
- Yellow: Configuration/Library code
- Red edges: Errors (e.g., circular dependencies)
- Orange edges: Warnings (e.g., potential issues)

## Enforcing Module Boundaries

Module boundaries are enforced through ESLint rules that restrict imports based on the module structure:

### Backend Rules

1. Modules should only import from other modules through their public APIs (index.ts)
2. Common utilities should be imported through their public APIs
3. Circular dependencies are forbidden
4. Modules have restricted import patterns based on their type (controller, service, repository, etc.)

### Frontend Rules

1. Components should not import from pages
2. UI library components should not depend on app-specific code
3. Hooks should only import from allowed dependencies
4. Firebase should only be imported through the firebase utility layer

## API Documentation

API documentation is generated using TypeDoc and can be found in the `docs/api-docs` directory after running `npm run doc:generate`. This documentation provides:

- Class, interface, and type definitions
- Method signatures and parameters
- Relationships between components
- Generated diagrams for complex types

## Module Documentation

Each module should have its own documentation file in `docs/modules/` using the templates provided in `docs/modules/templates/`:

- `module-documentation.md`: Template for backend modules
- `component-documentation.md`: Template for frontend components

These documentation files should describe:
- Module purpose and functionality
- Public API and interface
- Dependencies on other modules
- Integration examples
- Configuration options

## Continuous Integration

The GitHub workflow in `.github/workflows/dependency-validation.yml` automatically runs dependency validation checks on pull requests and commits to main branches. It:

1. Validates dependencies against defined rules
2. Checks for circular dependencies
3. Generates visualization artifacts
4. Uploads the visualizations as build artifacts

Failed checks will block pull request merges, ensuring architectural integrity is maintained.