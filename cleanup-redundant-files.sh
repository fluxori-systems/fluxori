#!/bin/bash

# Script to clean up redundant files in the Fluxori project
echo "Cleaning up redundant files..."

# Remove .bak and .bak2 files
echo "Removing backup (.bak/.bak2) files..."
find /home/tarquin_stapa/fluxori -name "*.ts.bak" -o -name "*.ts.bak2" | xargs rm -f

# Remove redundant bidorbuy connector (replaced by bob-shop-connector)
echo "Removing deprecated bidorbuy-connector..."
if [ -f "/home/tarquin_stapa/fluxori/backend/src/modules/connectors/adapters/bidorbuy-connector.ts" ]; then
  rm -f /home/tarquin_stapa/fluxori/backend/src/modules/connectors/adapters/bidorbuy-connector.ts
  echo "Removed bidorbuy-connector.ts"
fi

# Create a temp directory for backups if it doesn't exist
mkdir -p /home/tarquin_stapa/fluxori/temp/backup

# Move large TypeScript error files to backup location
echo "Moving large TypeScript error files to backup location..."
if [ -f "/home/tarquin_stapa/fluxori/backend/typescript-errors.txt" ]; then
  mv /home/tarquin_stapa/fluxori/backend/typescript-errors.txt /home/tarquin_stapa/fluxori/temp/backup/
  echo "Moved backend typescript-errors.txt to temp/backup/"
fi

if [ -f "/home/tarquin_stapa/fluxori/frontend/typescript-errors.txt" ]; then
  mv /home/tarquin_stapa/fluxori/frontend/typescript-errors.txt /home/tarquin_stapa/fluxori/temp/backup/
  echo "Moved frontend typescript-errors.txt to temp/backup/"
fi

# Clean up redundant backup directories (keep scripts/backup as it's part of the repo structure)
echo "Cleaning up redundant backup directories..."
if [ -d "/home/tarquin_stapa/fluxori/backup" ]; then
  rm -rf /home/tarquin_stapa/fluxori/backup
  echo "Removed /backup directory"
fi

if [ -d "/home/tarquin_stapa/fluxori/backend/backup" ]; then
  rm -rf /home/tarquin_stapa/fluxori/backend/backup
  echo "Removed /backend/backup directory"
fi

# Remove deprecated connector interfaces documentation (now incorporated into main docs)
if [ -f "/home/tarquin_stapa/fluxori/backend/CONNECTOR_INTERFACES_FIXED.md" ]; then
  rm -f /home/tarquin_stapa/fluxori/backend/CONNECTOR_INTERFACES_FIXED.md
  echo "Removed CONNECTOR_INTERFACES_FIXED.md (now in main docs)"
fi

echo "Running git status to verify changes..."
cd /home/tarquin_stapa/fluxori && git status

echo "Cleanup completed successfully!"
