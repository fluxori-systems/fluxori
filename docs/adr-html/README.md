# Architecture Decision Records - HTML Rendering

This directory contains HTML renderings of the Architecture Decision Records (ADRs) with interactive dependency visualizations.

## Features

- Interactive dependency visualizations with zoom and pan capabilities
- Mermaid diagram rendering
- Dark mode support
- Mobile-friendly responsive design
- Syntax highlighting for code blocks

## How to Generate

The HTML renderings are generated using the following command:

```bash
npm run adr:html
```

This will:
1. Regenerate all dependency visualizations
2. Generate an enhanced ADR index
3. Render all ADRs to HTML with interactive visualizations

## Individual Commands

You can also run the individual steps:

```bash
# Regenerate all dependency visualizations
npm run adr:regen-viz

# Generate enhanced ADR index
npm run adr:gen-index

# Render all ADRs to HTML
npm run adr:render-all

# Render a single ADR
npm run adr:render -- --input=/path/to/adr.md --output=/path/to/output.html
```

## Viewing the HTML

Open `index.html` in this directory to view the ADR collection. Each ADR is rendered with interactive visualizations that allow zooming and panning.