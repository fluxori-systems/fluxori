#!/bin/bash

# This script removes redundant TypeScript documentation files
# since we've consolidated them into a single comprehensive guide

echo "Cleaning up redundant TypeScript documentation files..."

# List of files to remove
FILES_TO_REMOVE=(
  "/home/tarquin_stapa/fluxori/frontend/TYPESCRIPT_PROGRESS.md"
  "/home/tarquin_stapa/fluxori/TYPESCRIPT_TOOLS.md"
  "/home/tarquin_stapa/fluxori/frontend/docs/typescript-fixes-summary.md"
  "/home/tarquin_stapa/fluxori/docs/typescript/typescript-summary.md"
  "/home/tarquin_stapa/fluxori/docs/typescript/typescript-errors-fixes-guide.md"
  "/home/tarquin_stapa/fluxori/frontend/scripts/fix-typescript-issues.md"
)

# Remove each file if it exists
for file in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    echo "Removing: $file"
    rm "$file"
  else
    echo "File not found: $file"
  fi
done

echo ""
echo "All redundant TypeScript documentation has been removed."
echo "The consolidated guide is available at: /home/tarquin_stapa/fluxori/TYPESCRIPT_GUIDE.md"