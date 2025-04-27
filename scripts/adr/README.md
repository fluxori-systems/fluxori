# ADR Tools

This directory contains tools for creating and maintaining Architecture Decision Records (ADRs) with dependency visualizations.

## Available Scripts

### adr.sh - Main ADR Command Interface

```bash
# Create a new ADR
./adr.sh create --title="Your Decision Title" --modules=module1,module2

# Update the ADR index
./adr.sh update-index

# Update an ADR's status
./adr.sh update-status --adr=1 --status=Accepted

# Regenerate all ADR visualizations
./adr.sh regen-viz

# Generate a specific visualization
./adr.sh generate-viz --adr=1 --title="Module Dependencies" --modules=auth,users
```

### extract-subgraph.sh - Extract Focused Dependency Graphs

```bash
./extract-subgraph.sh --adr=1 --modules=module1,module2 --title="Your Title" --include-common=true
```

### update-adr-visualizations.sh - Update All Visualizations

```bash
./update-adr-visualizations.sh --verbose
```

## File Overview

- `adr.sh`: Main entry point for ADR commands
- `adr-tools.ts`: Core functionality for managing ADRs
- `generate-adr-dependencies.ts`: Generates dependency visualizations
- `extract-subgraph.sh`: Extracts focused subgraphs from the full dependency graph
- `update-adr-visualizations.sh`: Updates all visualizations after code changes
- `generate-mermaid.ts`: Generates Mermaid diagrams for ADRs
- `package.json`: Dependencies for the ADR tools

## Installation

```bash
npm install
```

## Integration with Main Project

These tools are integrated with the main project through npm scripts in the root `package.json`:

```bash
npm run adr:create -- --title="Your Decision Title" --modules=module1,module2
npm run adr:update-index
npm run adr:update-status -- --adr=1 --status=Accepted
npm run adr:regen-viz
npm run adr:gen-viz -- --adr=1 --title="Module Dependencies" --modules=auth,users
```

## GitHub Workflow Integration

The GitHub workflow in `.github/workflows/adr-visualization-update.yml` automatically updates ADR visualizations when code changes.
