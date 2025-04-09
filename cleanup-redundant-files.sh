#\!/bin/bash

# Script to clean up redundant files in the Fluxori codebase
echo "Cleaning up redundant files..."

# Outdated TypeScript error documentation
rm -v /home/tarquin_stapa/fluxori/typescript-errors.md
rm -v /home/tarquin_stapa/fluxori/frontend/typescript-fixes-remaining.md
rm -v /home/tarquin_stapa/fluxori/frontend/TEST_TYPE_FIXES.md

# Check and remove backup directories if they exist
if [ -d "/home/tarquin_stapa/fluxori/temp_backup" ]; then
  echo "Removing temp_backup directory..."
  rm -rf /home/tarquin_stapa/fluxori/temp_backup
fi

if [ -d "/home/tarquin_stapa/fluxori/frontend/backup-tests" ]; then
  echo "Removing frontend/backup-tests directory..."
  rm -rf /home/tarquin_stapa/fluxori/frontend/backup-tests
fi

# Remove redundant documentation
rm -v /home/tarquin_stapa/fluxori/frontend/VITEST_MIGRATION.md

echo "Cleanup completed successfully\!"
