#!/bin/bash

# ADR Tools Runner Script
# This script provides a convenient wrapper around the ADR tools.

set -e

# Change to the script directory
cd "$(dirname "$0")"

# Check if ts-node and dependencies are installed
if ! command -v ts-node &> /dev/null; then
    echo "Installing dependencies..."
    npm install
fi

# Function to display help
show_help() {
    echo "ADR Tools - Manage Architecture Decision Records with dependency visualizations"
    echo ""
    echo "Usage:"
    echo "  ./adr.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  create              Create a new ADR"
    echo "  update-index        Update the ADR index"
    echo "  update-status       Update the status of an ADR"
    echo "  regen-viz           Regenerate visualizations for all ADRs"
    echo "  generate-viz        Generate dependency visualization for specific modules"
    echo "  generate-mermaid    Generate Mermaid diagrams for ADRs"
    echo "  generate-index      Generate enhanced ADR index with thumbnails"
    echo "  render              Render an ADR to HTML with interactive visualizations"
    echo "  render-all          Render all ADRs to HTML"
    echo "  html                Regenerate visualizations, index, and HTML files"
    echo "  help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./adr.sh create --title=\"Add Feature Flags Module\" --modules=feature-flags,auth"
    echo "  ./adr.sh update-status --adr=1 --status=Accepted"
    echo "  ./adr.sh generate-viz --adr=1 --title=\"Feature Flags Dependencies\" --modules=feature-flags,auth"
    echo "  ./adr.sh generate-mermaid flowchart --adr=1 --title=\"Module Flow\" --modules=auth,users,feature-flags"
    echo "  ./adr.sh render --input=../../docs/adr/ADR-001-example.md --output=ADR-001-example.html"
    echo ""
}

# Check for command
if [ $# -eq 0 ] || [ "$1" = "help" ]; then
    show_help
    exit 0
fi

COMMAND=$1
shift

case $COMMAND in
    create)
        npm run create-adr -- "$@"
        ;;
    update-index)
        npm run update-adr-index
        ;;
    update-status)
        npm run update-adr-status -- "$@"
        ;;
    regen-viz)
        npm run regen-adr-viz
        ;;
    generate-viz)
        npm run generate-viz -- "$@"
        ;;
    generate-mermaid)
        npm run generate-mermaid -- "$@"
        ;;
    generate-index)
        npm run generate-index
        ;;
    render)
        npm run render-adr -- "$@"
        ;;
    render-all)
        npm run render-all-adrs
        ;;
    html)
        npm run regen-adr-viz
        npm run generate-index
        npm run render-all-adrs
        ;;
    *)
        echo "Error: Unknown command '$COMMAND'"
        show_help
        exit 1
        ;;
esac