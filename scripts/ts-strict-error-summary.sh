#!/bin/bash
# Runs TypeScript strict type checking and produces a sorted error count by file

cd backend || exit 1
tsc --noEmit --pretty false 2>&1 | \
  grep -E 'error TS[0-9]+:' | \
  sed -E 's/^([^:]+):[0-9]+:[0-9]+ - error TS[0-9]+:.*/\1/' | \
  sort | uniq -c | sort -nr > ../ts-strict-error-summary.txt

echo "Summary written to ts-strict-error-summary.txt"
