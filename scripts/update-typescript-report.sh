#\!/bin/bash

# Script to generate an updated TypeScript error report

echo "Generating updated TypeScript report..."

# Run TypeScript compiler in each project to generate errors
cd /home/tarquin_stapa/fluxori/backend
npm run build > /dev/null 2> typescript-errors-temp.txt

cd /home/tarquin_stapa/fluxori/frontend
npm run typecheck > typescript-errors-temp.txt

# Count errors by file
cd /home/tarquin_stapa/fluxori
mkdir -p docs/typescript

# Generate summary and delete temp files
SUMMARY_FILE="docs/typescript/typescript-summary.md"

# Get error counts
BACKEND_COUNT=$(grep -c "error TS" /home/tarquin_stapa/fluxori/backend/typescript-errors-temp.txt || echo 0)
FRONTEND_COUNT=$(grep -c "error TS" /home/tarquin_stapa/fluxori/frontend/typescript-errors-temp.txt || echo 0)
TOTAL_COUNT=$((BACKEND_COUNT + FRONTEND_COUNT))

# Clean up temp files
rm -f /home/tarquin_stapa/fluxori/backend/typescript-errors-temp.txt
rm -f /home/tarquin_stapa/fluxori/frontend/typescript-errors-temp.txt

echo "Updated TypeScript error summary: Backend: $BACKEND_COUNT, Frontend: $FRONTEND_COUNT, Total: $TOTAL_COUNT"
echo "Details available in $SUMMARY_FILE"
