#!/bin/bash

# Extract Subgraph Script
# Extracts a focused subgraph from the full dependency graph for ADR visualization

set -e

# Function to display help
show_help() {
    echo "Extract Subgraph - Create a focused dependency graph for ADRs"
    echo ""
    echo "Usage:"
    echo "  ./extract-subgraph.sh --adr=<number> --modules=<module1,module2> [options]"
    echo ""
    echo "Required Parameters:"
    echo "  --adr=<number>               ADR number (e.g., 1, 2, 3)"
    echo "  --modules=<module1,module2>  Comma-separated list of modules to include"
    echo ""
    echo "Optional Parameters:"
    echo "  --title=\"<title>\"            Title for the visualization (default: \"Module Dependencies\")"
    echo "  --include-common=<true|false> Include common utilities in the graph (default: true)"
    echo "  --collapse-internals=<true|false> Collapse module internals (default: false)"
    echo "  --highlight-violations=<true|false> Highlight dependency violations (default: true)"
    echo ""
    echo "Example:"
    echo "  ./extract-subgraph.sh --adr=1 --modules=feature-flags,auth --title=\"Feature Flags Dependencies\""
    echo ""
}

# Check if arguments were provided
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

# Default values
ADR_NUMBER=""
MODULES=""
TITLE="Module Dependencies"
INCLUDE_COMMON="true"
COLLAPSE_INTERNALS="false"
HIGHLIGHT_VIOLATIONS="true"

# Parse arguments
for arg in "$@"; do
    case $arg in
        --adr=*)
            ADR_NUMBER="${arg#*=}"
            ;;
        --modules=*)
            MODULES="${arg#*=}"
            ;;
        --title=*)
            TITLE="${arg#*=}"
            ;;
        --include-common=*)
            INCLUDE_COMMON="${arg#*=}"
            ;;
        --collapse-internals=*)
            COLLAPSE_INTERNALS="${arg#*=}"
            ;;
        --highlight-violations=*)
            HIGHLIGHT_VIOLATIONS="${arg#*=}"
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown parameter: $arg"
            show_help
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$ADR_NUMBER" ] || [ -z "$MODULES" ]; then
    echo "Error: Missing required parameters. ADR number and modules list are required."
    show_help
    exit 1
fi

# Prepare output directory
OUTPUT_DIR="../../docs/adr/visualizations"
mkdir -p "$OUTPUT_DIR"

# Format ADR number with padding
ADR_NUM_PADDED=$(printf "%03d" "$ADR_NUMBER")

# Create sanitized title and filename
SANITIZED_TITLE=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')
OUTPUT_FILENAME="adr-${ADR_NUM_PADDED}-${SANITIZED_TITLE}"

# Build the command based on parameters
MODULE_LIST=$(echo "$MODULES" | tr ',' '|')
COMMAND="cd ../../backend && npx depcruise"
COMMAND="$COMMAND --include-only \"^src/modules/(${MODULE_LIST})"

# Add common utilities if requested
if [ "$INCLUDE_COMMON" = "true" ]; then
    COMMAND="$COMMAND|^src/common/"
fi

COMMAND="$COMMAND\" --config .dependency-cruiser.js"

# Add collapse option if requested
if [ "$COLLAPSE_INTERNALS" = "true" ]; then
    COMMAND="$COMMAND --collapse \"^src/modules/[^/]+/(?!index\\.ts)\""
fi

# Add output options
COMMAND="$COMMAND --output-type dot src | dot -T svg -o \"${OUTPUT_DIR}/${OUTPUT_FILENAME}.svg\""

# Execute the command
echo "Generating visualization..."
echo "$COMMAND"
eval "$COMMAND"

# Generate associated text file with metadata
cat > "${OUTPUT_DIR}/${OUTPUT_FILENAME}.txt" << EOF
ADR: ${ADR_NUMBER}
Title: ${TITLE}
Modules: ${MODULES}
Include Common: ${INCLUDE_COMMON}
Collapse Internals: ${COLLAPSE_INTERNALS}
Generated: $(date -Iseconds)
EOF

echo "Visualization generated: ${OUTPUT_DIR}/${OUTPUT_FILENAME}.svg"
echo "Metadata saved: ${OUTPUT_DIR}/${OUTPUT_FILENAME}.txt"