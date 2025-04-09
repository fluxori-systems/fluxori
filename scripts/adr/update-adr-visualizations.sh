#!/bin/bash

# Update ADR Visualizations Script
# This script updates all dependency visualizations in ADRs after code changes

set -e

# Function to display help
show_help() {
    echo "Update ADR Visualizations - Refresh dependency graphs for all ADRs"
    echo ""
    echo "Usage:"
    echo "  ./update-adr-visualizations.sh [options]"
    echo ""
    echo "Options:"
    echo "  --dry-run         Don't actually update, just show what would be updated"
    echo "  --verbose         Show detailed progress"
    echo "  --help            Show this help message"
    echo ""
}

# Parse arguments
DRY_RUN=false
VERBOSE=false

for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            ;;
        --verbose)
            VERBOSE=true
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

# Set up directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADR_DIR="${SCRIPT_DIR}/../../docs/adr"
VIZ_DIR="${ADR_DIR}/visualizations"

# Create visualization directory if it doesn't exist
mkdir -p "$VIZ_DIR"

# Ensure we're in the script directory
cd "$SCRIPT_DIR"

echo "Scanning ADRs for dependency visualizations..."

# Find all metadata files for ADR visualizations
METADATA_FILES=$(find "$VIZ_DIR" -name "adr-*.txt" | sort)
TOTAL_FILES=$(echo "$METADATA_FILES" | wc -l)

if [ "$TOTAL_FILES" -eq 0 ]; then
    echo "No ADR visualizations found to update."
    exit 0
fi

echo "Found $TOTAL_FILES visualization(s) to update."

# Track stats
UPDATED=0
SKIPPED=0
FAILED=0

# Process each metadata file
for METADATA_FILE in $METADATA_FILES; do
    # Extract visualization details from metadata
    ADR_NUMBER=$(grep -E "^ADR:" "$METADATA_FILE" | cut -d' ' -f2)
    TITLE=$(grep -E "^Title:" "$METADATA_FILE" | cut -d':' -f2- | sed 's/^ //')
    MODULES=$(grep -E "^Modules:" "$METADATA_FILE" | cut -d':' -f2- | sed 's/^ //')
    INCLUDE_COMMON=$(grep -E "^Include Common:" "$METADATA_FILE" | cut -d':' -f2- | sed 's/^ //')
    COLLAPSE_INTERNALS=$(grep -E "^Collapse Internals:" "$METADATA_FILE" | cut -d':' -f2- | sed 's/^ //')
    
    SVG_FILE="${METADATA_FILE%.txt}.svg"
    
    if [ "$VERBOSE" = true ]; then
        echo "Processing ADR-$ADR_NUMBER: $TITLE"
        echo "  Modules: $MODULES"
        echo "  SVG file: $SVG_FILE"
    else
        echo -n "Updating ADR-$ADR_NUMBER: $TITLE... "
    fi
    
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY RUN] Would update visualization for ADR-$ADR_NUMBER"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi
    
    # Build command to regenerate the visualization
    COMMAND="./extract-subgraph.sh --adr=$ADR_NUMBER --modules=$MODULES --title=\"$TITLE\""
    
    if [ "$INCLUDE_COMMON" = "false" ]; then
        COMMAND="$COMMAND --include-common=false"
    fi
    
    if [ "$COLLAPSE_INTERNALS" = "true" ]; then
        COMMAND="$COMMAND --collapse-internals=true"
    fi
    
    # Regenerate the visualization
    if [ "$VERBOSE" = true ]; then
        echo "  Running: $COMMAND"
        if eval "$COMMAND"; then
            echo "  ✓ Updated successfully"
            UPDATED=$((UPDATED + 1))
        else
            echo "  ✗ Update failed"
            FAILED=$((FAILED + 1))
        fi
    else
        if eval "$COMMAND" &> /dev/null; then
            echo "✓ Updated"
            UPDATED=$((UPDATED + 1))
        else
            echo "✗ Failed"
            FAILED=$((FAILED + 1))
        fi
    fi
done

echo ""
echo "Update complete:"
echo "  - Total: $TOTAL_FILES"
echo "  - Updated: $UPDATED"
echo "  - Skipped: $SKIPPED"
echo "  - Failed: $FAILED"

# Update the ADR index
if [ "$UPDATED" -gt 0 ]; then
    echo ""
    echo "Updating ADR index..."
    npm run update-adr-index
fi