#!/bin/bash

# Fix connector interfaces script
# This script runs the TypeScript fixer to fix connector interface issues

echo "Running connector interfaces TypeScript fixer..."

# Change to the project root directory
cd "$(dirname "$0")/.."

# Create a backup of the current state
BACKUP_DIR="./backup/connector-interfaces-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR/src/modules/interfaces"
mkdir -p "$BACKUP_DIR/src/modules/connectors/interfaces"
mkdir -p "$BACKUP_DIR/src/modules/connectors/adapters"

# Backup the original files
cp ./src/modules/interfaces/connector.interface.ts "$BACKUP_DIR/src/modules/interfaces/" 2>/dev/null || true
cp ./src/modules/interfaces/connector.types.ts "$BACKUP_DIR/src/modules/interfaces/" 2>/dev/null || true
cp ./src/modules/connectors/interfaces/connector.interface.ts "$BACKUP_DIR/src/modules/connectors/interfaces/" 2>/dev/null || true
cp ./src/modules/connectors/interfaces/connector.types.ts "$BACKUP_DIR/src/modules/connectors/interfaces/" 2>/dev/null || true
cp ./src/modules/connectors/interfaces/types.ts "$BACKUP_DIR/src/modules/connectors/interfaces/" 2>/dev/null || true
cp ./src/modules/connectors/adapters/base-connector.ts "$BACKUP_DIR/src/modules/connectors/adapters/" 2>/dev/null || true
cp ./src/modules/connectors/adapters/base-marketplace-connector.ts "$BACKUP_DIR/src/modules/connectors/adapters/" 2>/dev/null || true

echo "Backup created at $BACKUP_DIR"

# Compile and run the TypeScript fixer
echo "Compiling and running the TypeScript fixer..."
npx ts-node ./scripts/typescript-fixers/fix-connector-interfaces.ts

# Check if the script ran successfully
if [ $? -eq 0 ]; then
  echo "Connector interfaces fixed successfully!"
  echo "Running TypeScript compiler to check for remaining errors..."
  npx tsc --noEmit
  
  if [ $? -eq 0 ]; then
    echo "TypeScript compilation completed without errors!"
  else
    echo "TypeScript compilation had errors. Please check the output above."
    echo "You may restore from backup if needed: $BACKUP_DIR"
  fi
else
  echo "Error occurred while running the fixer script."
  echo "You may restore from backup if needed: $BACKUP_DIR"
  exit 1
fi

# Done
echo "All done!"