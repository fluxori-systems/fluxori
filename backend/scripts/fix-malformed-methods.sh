#!/bin/bash

# Fix malformed connector methods script
# This script specifically targets the malformed methods in connector files

echo "Running malformed connector methods fixer..."

# Change to the project root directory
cd "$(dirname "$0")/.."

# Create a backup of the current state
BACKUP_DIR="./backup/connector-methods-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR/src/modules/connectors/adapters/amazon-sp"
mkdir -p "$BACKUP_DIR/src/modules/connectors/adapters/shopify"

# Backup connector files
cp ./src/modules/connectors/adapters/woocommerce-connector.ts "$BACKUP_DIR/src/modules/connectors/adapters/" 2>/dev/null || true
cp ./src/modules/connectors/adapters/takealot-connector.ts "$BACKUP_DIR/src/modules/connectors/adapters/" 2>/dev/null || true
cp ./src/modules/connectors/adapters/amazon-sp/amazon-sp-connector.ts "$BACKUP_DIR/src/modules/connectors/adapters/amazon-sp/" 2>/dev/null || true
cp ./src/modules/connectors/adapters/shopify/shopify-connector.ts "$BACKUP_DIR/src/modules/connectors/adapters/shopify/" 2>/dev/null || true

echo "Backup created at $BACKUP_DIR"

# Compile and run the TypeScript fixer
echo "Compiling and running the TypeScript fixer..."
npx ts-node ./scripts/typescript-fixers/fix-malformed-connector-methods.ts

# Check if the script ran successfully
if [ $? -eq 0 ]; then
  echo "Malformed connector methods fixed successfully!"
  echo "Running TypeScript compiler to check for remaining errors..."
  npx tsc --noEmit
  
  TYPESCRIPT_EXIT_CODE=$?
  
  if [ $TYPESCRIPT_EXIT_CODE -eq 0 ]; then
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