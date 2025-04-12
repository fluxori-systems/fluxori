#!/bin/bash

# Script to clean up redundant files in the Fluxori codebase
echo "Cleaning up redundant files..."

# Remove .bak and .bak2 files
echo "Removing backup (.bak/.bak2) files..."
find /home/tarquin_stapa/fluxori -name "*.ts.bak" -o -name "*.ts.bak2" | xargs rm -v

# Clean up redundant documentation
echo "Removing redundant documentation..."
if [ -f "/home/tarquin_stapa/fluxori/TYPESCRIPT_FIXES_SUMMARY.md" ]; then
  rm -v /home/tarquin_stapa/fluxori/TYPESCRIPT_FIXES_SUMMARY.md
fi

# Clean up redundant backup directories
echo "Cleaning up redundant backup directories..."
if [ -d "/home/tarquin_stapa/fluxori/backup" ]; then
  rm -rf /home/tarquin_stapa/fluxori/backup
  echo "Removed /backup directory"
fi

if [ -d "/home/tarquin_stapa/fluxori/backend/backup" ]; then
  rm -rf /home/tarquin_stapa/fluxori/backend/backup
  echo "Removed /backend/backup directory"
fi

# Remove typescript errors file
if [ -f "/home/tarquin_stapa/fluxori/backend/typescript-errors.txt" ]; then
  rm -v /home/tarquin_stapa/fluxori/backend/typescript-errors.txt
fi

# Remove connector interfaces fixed documentation (now incorporated into main docs)
if [ -f "/home/tarquin_stapa/fluxori/backend/CONNECTOR_INTERFACES_FIXED.md" ]; then
  rm -v /home/tarquin_stapa/fluxori/backend/CONNECTOR_INTERFACES_FIXED.md
fi

echo "Cleanup completed successfully!"
