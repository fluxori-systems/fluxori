#!/bin/bash

# Fix marketplace connectors script
# This script runs the TypeScript fixer to add missing method implementations

echo "Running marketplace connectors TypeScript fixer..."

# Change to the project root directory
cd "$(dirname "$0")/.."

# Create a backup of the current state
BACKUP_DIR="./backup/marketplace-connectors-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR/src/modules/connectors/adapters/amazon-sp"
mkdir -p "$BACKUP_DIR/src/modules/connectors/adapters/shopify"

# Backup the original files
cp ./src/modules/connectors/adapters/amazon-sp/amazon-sp-connector.ts "$BACKUP_DIR/src/modules/connectors/adapters/amazon-sp/" 2>/dev/null || true
cp ./src/modules/connectors/adapters/takealot-connector.ts "$BACKUP_DIR/src/modules/connectors/adapters/" 2>/dev/null || true
cp ./src/modules/connectors/adapters/woocommerce-connector.ts "$BACKUP_DIR/src/modules/connectors/adapters/" 2>/dev/null || true
cp ./src/modules/connectors/adapters/shopify/shopify-connector.ts "$BACKUP_DIR/src/modules/connectors/adapters/shopify/" 2>/dev/null || true

echo "Backup created at $BACKUP_DIR"

# Compile and run the TypeScript fixer
echo "Compiling and running the TypeScript fixer..."
npx ts-node ./scripts/typescript-fixers/fix-marketplace-connectors.ts

# Check if the script ran successfully
if [ $? -eq 0 ]; then
  echo "Marketplace connectors fixed successfully!"
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