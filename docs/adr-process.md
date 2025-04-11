# Architecture Decision Records (ADR) Process

## Overview

This document outlines the Architecture Decision Records (ADR) process for the Fluxori project, including how ADRs are created, updated, and visualized with dependency information.

## What are ADRs?

Architecture Decision Records are documents that capture an important architectural decision made along with its context and consequences. They serve as a way to document and communicate the rationale behind significant design choices in the project.

## ADR Process

The Fluxori ADR process follows these steps:

1. **Identification**: Identify a significant architectural decision that needs to be documented
2. **Analysis**: 
   - Analyze the context, constraints, and forces influencing the decision
   - Explore alternative solutions
   - Use dependency analysis to understand the impact
3. **Visualization**: 
   - Generate visualizations of module dependencies related to the decision
   - Identify potential violations or areas of concern
4. **Documentation**: 
   - Document the decision using the ADR template
   - Include dependency visualizations to illustrate the impact
5. **Review**: Share the ADR with stakeholders for feedback
6. **Decision**: Accept, modify, or reject the proposed architecture
7. **Implementation**: 
   - Implement the decision in code
   - Add boundary rules to enforce architectural compliance
8. **Maintenance**: 
   - Update the ADR as architecture evolves
   - Keep visualizations current with code changes

## ADR Structure

Each ADR includes the following sections:

- **Title**: Descriptive title of the architectural decision
- **Status**: Current status (Proposed, Accepted, Deprecated, or Superseded)
- **Date**: When the decision was made
- **Context**: The forces at play and the problem being addressed
- **Decision**: The decision that was made, including rationale
- **Module Dependencies**: Visualizations of affected module dependencies
- **Boundary Rules**: Rules that enforce the architectural decision
- **Consequences**: The resulting context after applying the decision
- **Compliance Validation**: How compliance will be validated
- **Alternatives Considered**: Other options that were considered
- **Related Decisions**: Links to related ADRs or documentation

## Dependency Visualization in ADRs

A key feature of our ADR process is the integration of module dependency visualizations:

### Visualization Types

- **Module Dependency Graphs**: Show relationships between modules
- **Boundary Violation Checks**: Highlight violations of architectural boundaries
- **Class/Component Diagrams**: Illustrate internal structure of modules
- **Sequence Diagrams**: Show process flows and interactions
- **ER Diagrams**: Illustrate data models and relationships

### Visualization Generation

The dependency visualizations are generated using:

1. **Dependency-cruiser**: For module dependency graphs
2. **Mermaid**: For sequence diagrams, class diagrams, and ER diagrams

All visualizations are stored in the `docs/adr/visualizations` directory.

## Tools and Commands

The following tools are available for working with ADRs:

### Creating and Managing ADRs

```bash
# Create a new ADR
npm run adr:create -- --title="Your Decision Title" --modules=module1,module2

# Update the ADR index
npm run adr:update-index

# Update an ADR's status
npm run adr:update-status -- --adr=1 --status=Accepted

# Regenerate all ADR visualizations
npm run adr:regen-viz

# Generate a specific visualization
npm run adr:gen-viz -- --adr=1 --title="Module Dependencies" --modules=auth,users
```

### Directory Structure

```
docs/
└── adr/
    ├── README.md                 # ADR index
    ├── template.md               # ADR template
    ├── ADR-001-xxxx.md           # Individual ADRs
    ├── ADR-002-xxxx.md
    └── visualizations/           # Generated visualizations
        ├── adr-001-xxxx.svg
        └── adr-002-xxxx.svg
```

### Scripts

The ADR tools are implemented as scripts in `scripts/adr/`:

- `adr.sh`: Main entry point for ADR commands
- `adr-tools.ts`: Core functionality for managing ADRs
- `generate-adr-dependencies.ts`: Generates dependency visualizations
- `extract-subgraph.sh`: Extracts focused subgraphs from the full dependency graph
- `update-adr-visualizations.sh`: Updates all visualizations after code changes
- `generate-mermaid.ts`: Generates Mermaid diagrams for ADRs

## Continuous Integration

ADR visualizations are automatically updated through a GitHub workflow:

- When code in `backend/src` changes, the workflow regenerates all visualizations
- For pull requests, updated visualizations are attached as artifacts
- For merged PRs, the updated visualizations are committed to the repository

## Best Practices

### When to Create an ADR

Create an ADR when:

- Making a significant architectural decision that affects multiple modules
- Introducing a new pattern or approach that others should follow
- Documenting a decision that might be questioned later
- Establishing rules or constraints that must be enforced

### Writing Effective ADRs

- Focus on the problem and reasoning, not just the solution
- Include visualizations that illustrate the impact
- Document alternatives that were considered
- Be clear about the consequences
- Include specific boundary rules that can be enforced

### Maintaining ADRs

- Keep visualizations up to date with code changes
- Mark ADRs as Deprecated or Superseded when they no longer apply
- Update the status as decisions move from Proposed to Accepted
- Reference ADRs in PRs and commit messages when implementing related changes

## Further Reading

- [ADR Organization GitHub](https://adr.github.io/)
- [Dependency-cruiser Documentation](https://github.com/sverweij/dependency-cruiser)
- [Mermaid Diagram Syntax](https://mermaid-js.github.io/mermaid/#/)