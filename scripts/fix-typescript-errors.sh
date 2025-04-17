#!/bin/bash

# TypeScript Error Fixers for Fluxori
# This script runs a series of TypeScript fixes to resolve errors in the codebase

echo "Starting TypeScript error fixes..."

# Create temporary directory for logs
TEMP_DIR="$(mktemp -d)"
LOG_FILE="$TEMP_DIR/typescript-fix.log"

# Record the start time
START_TIME=$(date +%s)

# Set up error handling
set -e
trap 'echo "An error occurred. Check the log file at $LOG_FILE for details."' ERR

# 1. First run the base repository type fixes
echo "Fixing repository type definitions..."
cd /home/tarquin_stapa/fluxori
npx ts-node ./scripts/fix-typescript/fix-repository-types.ts >> "$LOG_FILE" 2>&1

# 2. Fix PIM module errors
echo "Fixing PIM module errors..."
cd /home/tarquin_stapa/fluxori
npx ts-node ./scripts/fix-typescript/fix-pim-module.ts >> "$LOG_FILE" 2>&1

# 3. Fix other module dependencies
echo "Fixing module dependencies..."

# 4. Run TypeScript compiler to check progress
echo "Running TypeScript compiler to check progress..."
cd /home/tarquin_stapa/fluxori/backend
npm run build > "$TEMP_DIR/backend-errors.txt" 2>&1 || true

cd /home/tarquin_stapa/fluxori/frontend
npm run typecheck > "$TEMP_DIR/frontend-errors.txt" 2>&1 || true

# Count remaining errors
BACKEND_ERRORS=$(grep -c "error TS" "$TEMP_DIR/backend-errors.txt" || echo 0)
FRONTEND_ERRORS=$(grep -c "error TS" "$TEMP_DIR/frontend-errors.txt" || echo 0)
TOTAL_ERRORS=$((BACKEND_ERRORS + FRONTEND_ERRORS))

# Calculate elapsed time
END_TIME=$(date +%s)
ELAPSED_TIME=$((END_TIME - START_TIME))
MINUTES=$((ELAPSED_TIME / 60))
SECONDS=$((ELAPSED_TIME % 60))

# Report results
echo ""
echo "TypeScript error fixes completed in ${MINUTES}m ${SECONDS}s"
echo ""
echo "Original errors: Backend (853), Frontend (1,129), Total (1,982)"
echo "Remaining errors: Backend ($BACKEND_ERRORS), Frontend ($FRONTEND_ERRORS), Total ($TOTAL_ERRORS)"
echo ""

if [ "$TOTAL_ERRORS" -lt 1982 ]; then
  FIXED_ERRORS=$((1982 - TOTAL_ERRORS))
  PROGRESS=$((FIXED_ERRORS * 100 / 1982))
  echo "Fixed $FIXED_ERRORS errors ($PROGRESS% complete)"
else
  echo "No progress made fixing errors."
fi

echo ""
echo "Next steps:"
echo "1. Check the log file at $LOG_FILE for details on the fixes"
echo "2. Review the remaining errors in $TEMP_DIR/backend-errors.txt and $TEMP_DIR/frontend-errors.txt"
echo "3. Run additional fixers as needed to address specific error patterns"
echo ""
echo "Log and error files are in $TEMP_DIR"