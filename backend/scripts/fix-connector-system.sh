#!/bin/bash

# Fix connector system script
# This script runs the TypeScript fixer to fix connector module dependencies and interfaces

echo "Running connector system TypeScript fixer..."

# Change to the project root directory
cd "$(dirname "$0")/.."

# Create a backup of the current state
BACKUP_DIR="./backup/connector-system-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR/src/modules/interfaces"
mkdir -p "$BACKUP_DIR/src/modules/connectors/interfaces"
mkdir -p "$BACKUP_DIR/src/modules/connectors/adapters"
mkdir -p "$BACKUP_DIR/src/modules/connectors/controllers"
mkdir -p "$BACKUP_DIR/src/modules/connectors/services"

# Backup key files
cp ./src/modules/interfaces/connector.interface.ts "$BACKUP_DIR/src/modules/interfaces/" 2>/dev/null || true
cp ./src/modules/connectors/interfaces/connector.interface.ts "$BACKUP_DIR/src/modules/connectors/interfaces/" 2>/dev/null || true
cp ./src/modules/connectors/adapters/base-marketplace-connector.ts "$BACKUP_DIR/src/modules/connectors/adapters/" 2>/dev/null || true
cp ./src/modules/connectors/controllers/connector.controller.ts "$BACKUP_DIR/src/modules/connectors/controllers/" 2>/dev/null || true
cp ./src/modules/connectors/services/connector-factory.service.ts "$BACKUP_DIR/src/modules/connectors/services/" 2>/dev/null || true

# Copy marketplace connectors
cp ./src/modules/connectors/adapters/amazon-sp/amazon-sp-connector.ts "$BACKUP_DIR/src/modules/connectors/adapters/" 2>/dev/null || true
cp ./src/modules/connectors/adapters/takealot-connector.ts "$BACKUP_DIR/src/modules/connectors/adapters/" 2>/dev/null || true
cp ./src/modules/connectors/adapters/woocommerce-connector.ts "$BACKUP_DIR/src/modules/connectors/adapters/" 2>/dev/null || true
if [ -d "./src/modules/connectors/adapters/shopify" ]; then
  mkdir -p "$BACKUP_DIR/src/modules/connectors/adapters/shopify"
  cp ./src/modules/connectors/adapters/shopify/shopify-connector.ts "$BACKUP_DIR/src/modules/connectors/adapters/shopify/" 2>/dev/null || true
fi

echo "Backup created at $BACKUP_DIR"

# Compile and run the TypeScript fixer
echo "Compiling and running the TypeScript fixer..."
npx ts-node ./scripts/typescript-fixers/fix-connector-system.ts

# Check if the script ran successfully
if [ $? -eq 0 ]; then
  echo "Connector system fixed successfully!"
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